import { useReducer, useEffect, useRef, useCallback } from 'react';
import Peer from 'peerjs';

export const CONN_ACTYPE = {
  SET_MY_ID: "CONN_ACTYPE/SET_MY_ID",
  SET_HOST_ID: "CONN_ACTYPE/SET_HOST_ID",
  ADD_PEER_ID: "CONN_ACTYPE/ADD_PEER_ID",
  REMOVE_PEER_ID: "CONN_ACTYPE/REMOVE_PEER_ID",
  RESET_PEER_ID: "CONN_ACTYPE/RESET_PEER_ID",
  SET_CONN_STATUS: "CONN_ACTYPE/SET_CONN_STATUS",
  RAISE_ERROR: "CONN_ACTYPE/RAISE_ERROR",
  APPEND_LOG: "CONN_ACTYPE/APPEND_LOG",
  RESET_CONN_STATE: "CONN_ACTYPE/RESET_CONN_STATE",
};

export const CONN_STATUS = {
  INIT: "CONN_STATE/INIT",
  IDLE: "CONN_STATE/IDLE",
  CONNECTED: "CONN_STATE/CONNECTED",
};

export const INITIAL_CONN_STATE = {
  myId: null,
  hostId: null,
  peersId: [],
  status: "INIT",
  error: null,
  logs: [],
}

export function connReducer(state, action) {
  switch (action.type) {
    case CONN_ACTYPE.SET_MY_ID: {
      return {
        ...state,
        myId: action.payload,
      };
    }
    case CONN_ACTYPE.SET_HOST_ID: {
      return {
        ...state,
        hostId: action.payload,
      };
    }
    case CONN_ACTYPE.ADD_PEER_ID: {
      const peer = action.payload;
      const peersId = state.peersId.includes(peer) ? state.peersId : [...state.peersId, peer];
      return {
        ...state,
        peersId: peersId,
      };
    }
    case CONN_ACTYPE.REMOVE_PEER_ID: {
      const peersId = state.peersId.filter(item => item !== action.payload);
      return {
        ...state,
        peersId: peersId,
      }
    }
    case CONN_ACTYPE.RESET_PEER_ID: {
      return {
        ...state,
        peersId: [],
      };
    }
    case CONN_ACTYPE.SET_CONN_STATUS: {
      return {
        ...state,
        status: action.payload,
      };
    }
    case CONN_ACTYPE.RAISE_ERROR: {
      return {
        ...state,
        error: action.payload,
      };
    }
    case CONN_ACTYPE.APPEND_LOG: {
      return {
        ...state,
        logs: [...state.logs, action.payload],
      };
    }
    case CONN_ACTYPE.RESET_CONN_STATE: {
      return INITIAL_CONN_STATE;
    }
    default:
      return state;
  };
};

// In v0.1.0, let's not worry about reconnecting after refresh,
// and assume all players play on a stable browser on PC/laptop.
export const useP2PHost = (onMessageReceived) => {
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
      dispatch({ type: CONN_ACTYPE.ADD_PEER_ID, payload: remoteId });
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
      dispatch({ type: CONN_ACTYPE.REMOVE_PEER_ID, payload: remoteId });
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
      dispatch({ type: CONN_ACTYPE.SET_MY_ID, payload: id });
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
      dispatch({ type: CONN_ACTYPE.SET_HOST_ID, payload: id });
      peerRef.current.on("connection", (conn) => {
        setupConnection({
          conn: conn,
          onConnReady: (conn) => logMessage(`[Game] Guest ${conn.peer} joined your room.`),
          onConnClosed: (conn) => logMessage(`[Game] Guest ${conn.peer} left your room.`),
          onConnReceived: (data) => logMessage(`[Game] Guest ${conn.peer} sent you: ${data}.`),
        });
      });
      logMessage(`[Game] You ${id} hosted a new room.`);
    });
  }, [dispatch, logMessage, setupPeer, setupConnection]);

  const joinRoom = useCallback((hostId) => {
    setupPeer((id) => {
      dispatch({ type: CONN_ACTYPE.SET_HOST_ID, payload: hostId });
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
    hostRoom,
    joinRoom,
    leaveRoom,
    broadcast,
  };
};