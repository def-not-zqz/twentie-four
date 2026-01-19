// Couples P2P hook and gameLogic hook and packs as one hook for all UI API.
import { useEffect, useCallback } from "react";
import { useP2PHost } from "../hooks/useP2PHost";
import { useGameLogic } from "../hooks/useGameLogic";
import { CONN_STATUS, GAME_PHASE } from "../constants";
import { debug } from "../utils";

const hostCapacity = 1;
const hostOnly = true;
const phaseRefreshTimer = 200;

export const useGameRoom = () => {
  const { gameState, gameDispatch, gameControls, gameActions, gameUtils } = useGameLogic();
  const { getSlot: gameGetSlot } = gameUtils;

  const onMessageReceived = (data) => gameDispatch(data);
  const { connState, connInfo, hostRoom, joinRoom, leaveRoom, broadcast }
    = useP2PHost(hostCapacity, onMessageReceived);
  const { isHost, isConnected } = connInfo;

  const playerSelf = gameState.players[gameState.idToSlot[connState.myId]] || {};
  const playerOther = gameState.players[gameState.idToSlot[connState.peersId[0]]] || {};

  // --- Adaptive Dispatch for Host and Guests ---
  const handleAction = useCallback((action, hostOnly = false) => {
    debug(`[GameRoom] handling action ${JSON.stringify(action)}...`);
    if (!isConnected) return;
    if (isHost) {
      gameDispatch(action); // locally dispatch action
    } else if (!hostOnly) {
      broadcast(action);    // send action to host
    }
  }, [isConnected, isHost, gameDispatch, broadcast]);

  // Draw cards (dev mode)
  const handleDrawCards = useCallback(() =>
    handleAction(gameActions.draw(), hostOnly),
    [handleAction, gameActions, hostOnly]);

  // Play cards
  const handlePlayCards = useCallback((id, isHostOnly = false) => {
    if (!isConnected) return;
    const slot = gameGetSlot(id);
    const cards = gameState.players[slot]?.hand || [];
    handleAction(gameActions.play(id, cards), isHostOnly);
  }, [isConnected, gameGetSlot, gameState.players, handleAction, gameActions]);

  const handleSelfPlayCards = useCallback(() => handlePlayCards(connState.myId), [handlePlayCards, connState.myId]);
  const handleOtherPlayCards = useCallback(() => handlePlayCards(connState.peersId[0], hostOnly), [handlePlayCards, connState.peersId, hostOnly]);

  // Flip cards (dev mode)
  const handleFlipCards = useCallback(() => handleAction(gameActions.flip(), hostOnly), [handleAction, gameActions, hostOnly]);

  // Vote winner or tie
  const handleVoteWinner = useCallback((idVoteFor) => {
    handleAction(gameActions.voteWinner(connState.myId, idVoteFor));
  }, [handleAction, gameActions, connState.myId]);

  const handleVoteSelfWinner = useCallback(() => handleVoteWinner(connState.myId), [handleVoteWinner, connState.myId]);
  const handleVoteOtherWinner = useCallback(() => handleVoteWinner(connState.peersId[0]), [handleVoteWinner, connState.peersId]);
  const handleVoteTie = useCallback(() => handleAction(gameActions.voteTie(connState.myId)), [handleAction, gameActions, connState.myId]);

  // Set winner or tie (dev mode)
  const handleSetWinner = useCallback((idVoteFor) => {
    handleAction(gameActions.voteWinner(connState.myId, idVoteFor), hostOnly);
    handleAction(gameActions.voteWinner(connState.peersId[0], idVoteFor), hostOnly);
  }, [handleAction, gameActions, connState.myId, connState.peersId, hostOnly]);

  const handleSetSelfWinner = useCallback(() => handleSetWinner(connState.myId), [handleSetWinner, connState.myId]);
  const handleSetOtherWinner = useCallback(() => handleSetWinner(connState.peersId[0]), [handleSetWinner, connState.peersId]);

  // Decide winner (dev mode)
  const handleDecideWinner = useCallback(() => handleAction(gameActions.decide(), hostOnly), [handleAction, gameActions, hostOnly]);

  // Loot cards (dev mode)
  const handleLootCards = useCallback(() => handleAction(gameActions.loot(), hostOnly), [handleAction, gameActions, hostOnly]);

  // Next round (dev mode)
  const handleNextRound = useCallback(() => handleAction(gameActions.next(), hostOnly), [handleAction, gameActions, hostOnly]);

  // --- Other UI APIs ---
  const handleStartGame = useCallback(() => {
    if (connState.status !== CONN_STATUS.HOST_CONNECTED) return;
    gameControls.start(connState.myId, connState.peersId[0]);
  }, [connState.status, connState.myId, connState.peersId, gameControls]);

  const handleCloseGame = useCallback(() => gameControls.close(), [gameControls]);

  // --- Game Listener ---
  // Broadcast gameState on state change.
  useEffect(() => {
    if (isHost) broadcast(gameActions.sync(gameState));
  }, [gameState, isHost, broadcast, gameActions]);

  // Start game upon connected.
  useEffect(() => {
    if (connState.status === CONN_STATUS.HOST_CONNECTED) {
      handleStartGame();
    }
  }, [connState.status, handleStartGame]);

  // Game phase automator.
  useEffect(() => {
    if (!isHost) return;

    const timer = setTimeout(() => {
      switch (gameState.phase) {
        case GAME_PHASE.DRAW_CARDS:
          handleDrawCards();
          break;
        case GAME_PHASE.PLAY_CARDS:
          handleFlipCards();
          break;
        case GAME_PHASE.VOTE_WINNER:
          handleDecideWinner();
          break;
        case GAME_PHASE.LOOT_CARDS:
          handleLootCards();
          break;
        case GAME_PHASE.NEXT_ROUND:
          handleNextRound();
          break;
        default:
          break;
      }
    }, phaseRefreshTimer);

    return () => clearTimeout(timer);
  }, [
    isHost,
    gameState.phase,
    handleDrawCards,
    handleFlipCards,
    handleDecideWinner,
    handleLootCards,
    handleNextRound,
  ]);

  return {
    gameState,
    connState,
    isHost,
    isConnected,
    playerSelf,
    playerOther,
    connHandles: {
      host: hostRoom,
      join: joinRoom,
      leave: leaveRoom,
    },
    gameHandles: {
      startGame: handleStartGame,
      closeGame: handleCloseGame,
      play: handleSelfPlayCards,
      voteSelf: handleVoteSelfWinner,
      voteOther: handleVoteOtherWinner,
      voteTie: handleVoteTie,
    },
  };
};