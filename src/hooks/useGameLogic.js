import { useReducer, useEffect, useRef, useCallback } from 'react';
import { GAME_ACTYPE, GAME_PHASE } from '../constants';
import { gameReducer, INITIAL_GAME_STATE } from '../reducers/gameReducer';
import { debug } from '../utils';

// --- Helper Functions ---
function makeRandomArray(size, rng = Math.random) {
  return Array.from({ length: size }, () => rng());
}

function convertIdToSlot(id, idToSlot) {
  const idRecord = Object.keys(idToSlot);
  if (!idRecord.includes(id)) {
    throw new Error(`Id ${id} is not recorded on list ${idRecord}`);
  }
  return idToSlot[id];
}

// --- Main Hook ---
export const useGameLogic = () => {
  const [state, dispatch] = useReducer(gameReducer, INITIAL_GAME_STATE);

  // --- API: Actions ---
  // (id1, id2) => void; Start a new game with players id1 and id2.
  const startNewGame = useCallback((id1, id2) => {
    dispatch({
      type: GAME_ACTYPE.SETUP_GAME,
      payload: { id1: id1, id2: id2, rand: makeRandomArray(52) },
    });
  }, [dispatch]);

  const closeGame = useCallback(() => {
    dispatch({ type: GAME_ACTYPE.RESET_GAME });
  }, [dispatch]);

  // --- API: Helper Functions ---
  const getSlot = useCallback((id) => {
    return convertIdToSlot(id, state.idToSlot);
  }, [state]);

  // --- API: Action Creators ---
  const drawCardsAction = () => ({ type: GAME_ACTYPE.DRAW_CARDS });

  const playCardsAction = (id, cards) => {
    const slot = convertIdToSlot(id, state.idToSlot);
    return {
      type: GAME_ACTYPE.PLAY_CARDS,
      payload: { slot: slot, cards: cards },
    };
  };

  const flipCardsAction = () => ({ type: GAME_ACTYPE.FLIP_CARDS });

  const voteWinnerAction = (id, idVoteFor) => {
    const slot = getSlot(id, state.idToSlot);
    const voteFor = getSlot(idVoteFor, state.idToSlot);
    return {
      type: GAME_ACTYPE.VOTE_WINNER,
      payload: { slot: slot, voteFor: voteFor },
    };
  };

  const voteTieAction = (id) => {
    const slot = getSlot(id, state.idToSlot);
    return {
      type: GAME_ACTYPE.VOTE_WINNER,
      payload: { slot: slot, voteFor: "tie" },
    }
  };

  const decideWinnerAction = () => ({ type: GAME_ACTYPE.DECIDE_WINNER });

  const lootCardsAction = () => ({ type: GAME_ACTYPE.LOOT_CARDS });

  const nextRoundAction = () => ({ type: GAME_ACTYPE.NEXT_ROUND, payload: makeRandomArray(52) });

  const syncStateAction = (newState) => ({ type: GAME_ACTYPE.SYNC_STATE, payload: newState });

  return {
    gameState: state,
    gameDispatch: dispatch,
    gameControls: {
      start: startNewGame,
      close: closeGame,
    },
    gameActions: {
      draw: drawCardsAction,
      play: playCardsAction,
      flip: flipCardsAction,
      loot: lootCardsAction,
      next: nextRoundAction,
      sync: syncStateAction,
      voteWinner: voteWinnerAction,
      voteTie: voteTieAction,
      decide: decideWinnerAction,
    },
    gameUtils: {
      getSlot: getSlot,
    },
  };
};

