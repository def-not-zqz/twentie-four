import { useReducer, useEffect, useRef, useCallback } from 'react';
import { GAME_ACTYPE, GAME_PHASE } from '../constants';
import { gameReducer, INITIAL_GAME_STATE } from '../reducers/gameReducer';

// --- Helper Functions ---
function makeRandomArray(size, rng = Math.random) {
  return Array.from({ length: size }, () => rng());
}

// --- Main Hook ---
export const useGameLogic = () => {
  const [state, dispatch] = useReducer(gameReducer, INITIAL_GAME_STATE);
  const idRef = useRef(null);

  // Unmount
  useEffect(() => {
    return () => {
      idRef.current = null;
    };
  }, []);

  // --- API Handlers ---
  // (id1, id2) => void
  // Start a new game with players id1 and id2.
  const startNewGame = useCallback((id1, id2) => {
    const idMapping = new Map();
    idRef.current = idMapping;
    idMapping.set(id1, "p1");
    idMapping.set(id2, "p2");

    dispatch({ type: GAME_ACTYPE.SETUP_GAME, payload: makeRandomArray(52) });
  }, [dispatch]);

  const closeGame = useCallback(() => {
    dispatch({ type: GAME_ACTYPE.RESET_GAME });
  }, [dispatch]);

  // () => void
  // Draw cards for players.
  const drawCards = useCallback(() => {
    if (!GAME_PHASE.ROUND_PREP) return;
    dispatch({ type: GAME_ACTYPE.DRAW_CARDS });
  }, [dispatch]);

  // (id, cards) => void
  // Player id play cards.
  const playCards = useCallback((id, cards) => {
    if (!GAME_PHASE.ROUND_DRAWED) return;
    const slot = idRef.current.get(id);
    dispatch({
      type: GAME_ACTYPE.PLAY_CARDS,
      payload: {
        slot: slot,
        cards: cards,
      }
    });
  }, [dispatch]);

  // (id) => void
  // Player id loots all cards on field.
  const lootCards = useCallback((id) => {
    if (!GAME_PHASE.ROUND_PLAYED) return;
    const slot = idRef.current.get(id);
    dispatch({ type: GAME_ACTYPE.LOOT_CARDS, payload: slot });
  }, [dispatch]);

  // () => void
  // Game moves on to the next round.
  const nextRound = useCallback(() => {
    if (!GAME_PHASE.ROUND_RESULT) return;
    dispatch({ type: GAME_ACTYPE.NEXT_ROUND, payload: makeRandomArray(52) });
  }, [dispatch]);

  // (newState) => void
  // Game syncs to newState.
  const syncState = useCallback((newState) => {
    dispatch({ type: GAME_ACTYPE.SYNC_STATE, payload: newState });
  }, [dispatch]);

  return {
    gameState: state,
    gameDispatch: dispatch,
    gameStartNewGame: startNewGame,
    gameCloseGame: closeGame,
    gameDrawCards: drawCards,
    gamePlayCards: playCards,
    gameLootCards: lootCards,
    gameNextRound: nextRound,
    gameSyncState: syncState,
  };
};

