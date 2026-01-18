import { useReducer, useEffect, useRef, useCallback } from 'react';
import { GAME_ACTYPE, GAME_PHASE } from '../constants';
import { gameReducer, INITIAL_GAME_STATE } from '../reducers/gameReducer';
import { debug } from '../utils';

// --- Helper Functions ---
function makeRandomArray(size, rng = Math.random) {
  return Array.from({ length: size }, () => rng());
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
  const getSlot = (id) => {
    const { idToSlot } = state;
    const idRecord = Object.keys(idToSlot);
    if (!idRecord.includes(id)) {
      throw new Error(`Id ${id} is not recorded on list ${idRecord}`);
    }
    return idToSlot[id];
  }

  // --- API: Action Creators ---
  // () => action; Draw cards for players.
  const drawCardsAction = useCallback(() => {
    if (state.phase !== GAME_PHASE.DRAW_CARDS) return;
    return { type: GAME_ACTYPE.DRAW_CARDS };
  }, []);

  // (id, cards) => action; Player id play cards.
  const playCardsAction = useCallback((id, cards) => {
    if (state.phase !== GAME_PHASE.PLAY_CARDS) return;
    const slot = getSlot(id, state.idToSlot);
    return {
      type: GAME_ACTYPE.PLAY_CARDS,
      payload: { slot: slot, cards: cards },
    };
  }, [getSlot]);

  const flipCardsAction = useCallback(() => {
    if (state.phase !== GAME_PHASE.PLAY_CARDS) return;
    return { type: GAME_ACTYPE.FLIP_CARDS };
  }, []);

  const voteWinnerAction = useCallback((id, idVoteFor) => {
    if (state.phase !== GAME_PHASE.VOTE_WINNER) return;
    const slot = getSlot(id, state.idToSlot);
    const voteFor = getSlot(idVoteFor, state.idToSlot);
    return {
      type: GAME_ACTYPE.VOTE_WINNER,
      payload: { slot: slot, voteFor: voteFor },
    };
  }, [getSlot]);

  const voteTieAction = useCallback((id) => {
    if (state.phase !== GAME_PHASE.VOTE_WINNER) return;
    const slot = getSlot(id, state.idToSlot);
    return {
      type: GAME_ACTYPE.VOTE_WINNER,
      payload: { slot: slot, voteFor: "tie" },
    }
  }, [getSlot]);

  const decideWinnerAction = useCallback(() => {
    if (state.phase !== GAME_PHASE.VOTE_WINNER) return;
    return { type: GAME_ACTYPE.DECIDE_WINNER };
  }, []);

  // (id) => action; Player id loots all cards on field.
  const lootCardsAction = useCallback(() => {
    if (state.phase !== GAME_PHASE.LOOT_CARDS) return;
    return { type: GAME_ACTYPE.LOOT_CARDS };
  }, []);

  // () => action; Game moves on to the next round.
  const nextRoundAction = useCallback(() => {
    if (state.phase !== GAME_PHASE.NEXT_ROUND) return;
    return { type: GAME_ACTYPE.NEXT_ROUND, payload: makeRandomArray(52) };
  }, []);

  // (newState) => action; Game syncs to newState.
  const syncStateAction = useCallback((newState) => {
    return { type: GAME_ACTYPE.SYNC_STATE, payload: newState };
  }, []);

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

