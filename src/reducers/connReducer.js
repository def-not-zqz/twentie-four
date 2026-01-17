import { CONNECTION_STATUS, CONNECTION_ACTION_TYPE, LOCAL_STORAGE_VARS } from "../constants";

export function connectionReducer(action) {
  switch (action.type) {
    case CONNECTION_ACTION_TYPE.HOST: {
      // player hosts a new game
      const myId = action.payload;
      localStorage.setItem(LOCAL_STORAGE_VARS.MY_ID, myId);
      localStorage.setItem(LOCAL_STORAGE_VARS.HOST_ID, myId);
      return {
        myId: myId,
        hostId: myId,
        connectionStatus: CONNECTION_STATUS.IDLE,
      };
    };

    case CONNECTION_ACTION_TYPE.JOIN: {
      const { myId, hostId } = action.payload;
      // localStorage.setItem(LOCAL_STORAGE_VARS.)
      return {
        myId: myId,
        hostId: hostId,
        connectionStatus: CONNECTION_STATUS.CONNECTED,
      }
    };

    case CONNECTION_ACTION_TYPE.DISCONNECT: { };

    default: {
      return state;
    };
  };
};