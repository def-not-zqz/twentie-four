import { CONN_ACTYPE, CONN_STATUS } from "../constants";

export const INITIAL_CONN_STATE = {
  myId: null,
  hostId: null,
  peersId: [],
  status: CONN_STATUS.OFFLINE,
  error: null,
  logs: [],
}

// --- Helper Functions ---
function checkHost(state) {
  return state.hostId && state.myId === state.hostId;
}

export function connReducer(state, action) {
  switch (action.type) {
    case CONN_ACTYPE.SETUP_PEER: {
      const myId = action.payload;
      return {
        ...state,
        myId: myId,
        status: CONN_STATUS.ONLINE,
      }
    }

    case CONN_ACTYPE.SETUP_CONN: {
      const { peersId } = state;
      const { remoteId, hostCapacity } = action.payload;
      // Max capacity reached.
      const capacity = (checkHost(state)) ? hostCapacity : 1;
      if (peersId.length > capacity - 1) return state;

      const newPeersId = peersId.includes(remoteId)
        ? peersId : [...peersId, remoteId];
      const status = (checkHost(state)) ?
        ((newPeersId.length < capacity) ? CONN_STATUS.HOST_WAITING : CONN_STATUS.HOST_CONNECTED) : // host status
        ((newPeersId.length < capacity) ? CONN_STATUS.GUEST_WAITING : CONN_STATUS.GUEST_CONNECTED); // guest status
      return {
        ...state,
        peersId: newPeersId,
        status: status,
      };
    }

    case CONN_ACTYPE.CLOSE_CONN: {
      const { peersId } = state;
      const remoteId = action.payload;
      if (!peersId.includes(remoteId)) return state;

      return {
        ...state,
        peersId: peersId.filter(id => id !== remoteId),
        status: (checkHost(state)) ?
          CONN_STATUS.HOST_WAITING : CONN_STATUS.GUEST_WAITING,
      }
    }

    case CONN_ACTYPE.RAISE_ERROR: {
      const err = action.payload;
      return {
        ...state,
        error: err,
      };
    }

    case CONN_ACTYPE.HOST_ROOM: {
      const hostId = action.payload
      return {
        ...state,
        hostId: hostId,
        status: CONN_STATUS.HOST_WAITING,
      };
    }

    case CONN_ACTYPE.JOIN_ROOM: {
      const hostId = action.payload
      return {
        ...state,
        hostId: hostId,
        status: CONN_STATUS.GUEST_WAITING,
      };
    }

    case CONN_ACTYPE.RESET_CONN_STATE: {
      return INITIAL_CONN_STATE;
    }

    case CONN_ACTYPE.APPEND_LOG: {
      return {
        ...state,
        logs: [...state.logs, action.payload],
      };
    }

    default:
      return state;
  };
};