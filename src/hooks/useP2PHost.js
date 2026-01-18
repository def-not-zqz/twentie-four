import { useReducer, useEffect, useRef, useCallback } from 'react';
import Peer from 'peerjs';
import { connReducer, INITIAL_CONN_STATE } from '../reducers/connReducer';
import { CONN_ACTYPE, CONN_STATUS } from '../constants';

// In v0.1.0, let's not worry about reconnecting after refresh,
// and assume all players play on a stable browser on PC/laptop.
export const useP2PHost = (hostCapacity, onMessageReceived) => {
  const [state, dispatch] = useReducer(connReducer, INITIAL_CONN_STATE);

  const peerRef = useRef(null);
  const connsRef = useRef(new Map());

  // --- Helper functions ---
  // Handle basic logics of DataConnection.
  const logMessage = useCallback((msg) => {
    // NOTE: only uncomment for dev purpose.
    // dispatch({ type: CONN_ACTYPE.APPEND_LOG, payload: msg });
    console.log(msg);
  }, [dispatch]);

  const setupConnection = useCallback(({
    conn, onConnReady, onConnReceived, onConnClosed
  }) => {
    const remoteId = conn.peer;
    logMessage(`[System] Setting up connection with ${remoteId}...`)

    conn.on("open", () => {
      logMessage(`[System] Connection with ${remoteId} is open.`);
      connsRef.current.set(remoteId, conn);
      dispatch({
        type: CONN_ACTYPE.SETUP_CONN, payload: {
          remoteId: remoteId, hostCapacity: hostCapacity,
        }
      });
      if (onConnReady) onConnReady(conn);
    });

    conn.on("data", (data) => {
      logMessage(`[System] Received data from ${remoteId}: ${data}.`);
      if (onConnReceived) onConnReceived(data);
      if (onMessageReceived) onMessageReceived(data);
    });

    conn.on("close", () => {
      logMessage(`[System] Connection with ${remoteId} is closed.`)
      connsRef.current.delete(remoteId);
      dispatch({ type: CONN_ACTYPE.CLOSE_CONN, payload: remoteId });
      if (onConnClosed) onConnClosed(conn);
    });

    conn.on("error", (err) => {
      logMessage(`[System] Connection error from ${remoteId}: ${err}.`)
      dispatch({ type: CONN_ACTYPE.RAISE_ERROR, payload: err });
    });
  }, [dispatch, logMessage, onMessageReceived]);

  // Start a new peer and add listeners.
  const setupPeer = useCallback((onPeerReady) => {
    if (peerRef.current) return;
    logMessage("[System] Setting up new peer...")

    const peer = new Peer();
    peerRef.current = peer;

    peer.on("open", (id) => {
      logMessage(`[System] Peer ${id} is open.`)
      dispatch({ type: CONN_ACTYPE.SETUP_PEER, payload: id });
      if (onPeerReady) onPeerReady(id);
    });
  }, [dispatch, logMessage]);

  // Destroy current peer and completely reset refs.
  const closePeer = useCallback((onPeerClose) => {
    if (!peerRef.current) return;
    const id = peerRef.current.id;
    logMessage(`[System] Closing peer ${id}...`)

    peerRef.current.destroy();
    peerRef.current = null;
    connsRef.current = new Map();
    dispatch({ type: CONN_ACTYPE.RESET_CONN_STATE });

    if (onPeerClose) onPeerClose(id);  // Additional callback
  }, [dispatch, logMessage]);

  // --- Main useEffect hook ---
  // Initialize PeerJS connection.
  useEffect(() => {
    return () => closePeer();
  }, [closePeer]);

  // --- API Handlers ---
  const hostRoom = useCallback(() => {
    setupPeer((id) => {
      dispatch({ type: CONN_ACTYPE.HOST_ROOM, payload: id });
      peerRef.current.on("connection", (conn) => {
        setupConnection({
          conn: conn,
          onConnReady: (conn) => {
            // Enforce max host capacity.
            if (connsRef.current.size > hostCapacity) {
              logMessage(`[System] Closing connection with ${conn.peer} due to max capacity ${connsRef.current.size} > ${hostCapacity}.`);
              conn.send(`[System] You cannot join due to max capacity.`);
              conn.close();
              return;
            }
            logMessage(`[Game] Guest ${conn.peer} joined your room.`);
          },
          onConnClosed: (conn) => logMessage(`[Game] Guest ${conn.peer} left your room.`),
          onConnReceived: (data) => logMessage(`[Game] Guest ${conn.peer} sent you: ${data}.`),
        });
      });
      logMessage(`[Game] You ${id} hosted a new room.`);
    });
  }, [dispatch, logMessage, setupPeer, setupConnection]);

  const joinRoom = useCallback((hostId) => {
    setupPeer((id) => {
      dispatch({ type: CONN_ACTYPE.JOIN_ROOM, payload: hostId });
      const conn = peerRef.current.connect(hostId);
      setupConnection({
        conn: conn,
        onConnReady: (conn) => logMessage(`[Game] You joined the host room ${conn.peer}.`),
        onConnClosed: (conn) => logMessage(`[Game] Host ${conn.peer} left the room.`),
        onConnReceived: (data) => logMessage(`[Game] Host ${conn.peer} sent you: ${data}.`),
      });
    });
  }, [dispatch, logMessage, setupPeer, setupConnection]);

  const leaveRoom = useCallback(() => {
    closePeer((id) => {
      logMessage(`[Game] You ${id} left the host room.`)
    });
  }, [logMessage, closePeer]);

  const broadcast = useCallback((data) => {
    if (!peerRef.current || !connsRef.current) return;
    const id = peerRef.current.id;
    connsRef.current.forEach((conn) => {
      conn.send(data);
      logMessage(`[Game] You sent ${conn.peer}: ${data}.`)
    });
  }, [logMessage]);

  return {
    connState: state,
    connDispatch: dispatch,
    connInfo: {
      isHost: (
        state.hostId !== null &&
        state.myId === state.hostId
      ),
      isConnected: (
        state.status === CONN_STATUS.HOST_CONNECTED ||
        state.status === CONN_STATUS.GUEST_CONNECTED
      ),
    },
    hostRoom,
    joinRoom,
    leaveRoom,
    broadcast,
  };
};