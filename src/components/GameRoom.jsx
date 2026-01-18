import { useEffect, useState } from "react";
import { useP2PHost } from "../hooks/useP2PHost";
import { useGameLogic } from "../hooks/useGameLogic";
import { CONN_ACTYPE, CONN_STATUS, GAME_ACTYPE } from "../constants";
import { debug } from "../utils";

const gameCapacity = 2;
const hostCapacity = gameCapacity - 1;

function visualize(data) {
  return typeof data === "string"
    ? data
    : JSON.stringify(data, null, 2);
}

function getCardsId(cards) {
  return cards.map((card, index) => (card.id));
}

export default function GameRoom() {
  const { gameState, gameDispatch, gameControls, gameActions, gameUtils } = useGameLogic();
  const { getSlot: gameGetSlot } = gameUtils;

  const {
    connState, connInfo,
    hostRoom, joinRoom, leaveRoom, broadcast
  } = useP2PHost(
    hostCapacity,
    (data) => {
      gameDispatch(data);
    }
  );
  const { isHost, isConnected } = connInfo;

  const { players, field, round, phase, winner } = gameState;
  const { p1, p2 } = players;

  const [inputHostId, setInputHostId] = useState("");
  const [inputMessage, setInputMessage] = useState("");

  // --- Game Listener ---
  // Broadcast gameState on state change.
  useEffect(() => {
    if (isHost) broadcast(gameActions.sync(gameState));
  }, [gameState, isHost, broadcast]);

  // --- Adaptive Dispatch for Host and Guests ---
  const handleAction = (action) => {
    debug(`[GameRoom] handling action ${action}...`);
    if (!action) return;
    if (!isConnected) return;
    if (isHost) {
      gameDispatch(action); // locally dispatch action
    } else {
      broadcast(action);    // send action to host
    }
  };

  // Draw cards (dev mode)
  const handleDrawCards = () => handleAction(gameActions.draw());

  // Play cards
  const handlePlayCards = (id) => {
    if (!isConnected) return;
    const slot = gameGetSlot(id);
    const cards = gameState.players[slot].hand;
    handleAction(gameActions.play(id, cards));
  };
  const handleSelfPlayCards = () => handlePlayCards(connState.myId);
  const handleOtherPlayCards = () => handlePlayCards(connState.peersId[0]);

  // Flip cards (dev mode)
  const handleFlipCards = () => handleAction(gameActions.flip());

  // Vote winner or tie
  const handleVoteWinner = (idVoteFor) => {
    handleAction(gameActions.voteWinner(connState.myId, idVoteFor));
  };
  const handleVoteSelfWinner = () => handleVoteWinner(connState.myId);
  const handleVoteOtherWinner = () => handleVoteWinner(connState.peersId[0]);
  const handleVoteTie = () => handleAction(gameActions.voteTie(connState.myId));

  // Set winner or tie (dev mode)
  const handleSetWinner = (idVoteFor) => {
    handleAction(gameActions.voteWinner(connState.myId, idVoteFor));
    handleAction(gameActions.voteWinner(connState.peersId[0], idVoteFor));
  };
  const handleSetSelfWinner = () => handleSetWinner(connState.myId);
  const handleSetOtherWinner = () => handleSetWinner(connState.peersId[0]);

  // Loot cards (dev mode)
  const handleLootCards = () => handleAction(gameActions.loot());

  // Next round (dev mode)
  const handleNextRound = () => handleAction(gameActions.next());

  // --- Other UI APIs ---
  const handleStartGame = () => {
    if (connState.status !== CONN_STATUS.HOST_CONNECTED) return;
    gameControls.start(connState.myId, connState.peersId[0]);
  };

  const handleCloseGame = gameControls.close;

  const toggleGameAutomate = () => { };


  return (
    <div>
      <div style={{ padding: '20px' }}>
        <h2>P2P 重连框架</h2>
        <pre style={{ whiteSpace: "pre-wrap" }}>
          {visualize({
            ...connState,
            isHost: isHost ? "Yes" : "No",
            isConnected: isConnected ? "Yes" : "No",
          })}
        </pre>

        <button onClick={() => {
          hostRoom();
        }}>
          创建房间
        </button>

        <div>
          <input
            placeholder="Host ID"
            value={inputHostId}
            onChange={e => setInputHostId(e.target.value)}
          />
          <button onClick={() => {
            joinRoom(inputHostId);
          }}>
            加入房间
          </button>
        </div>

        <button onClick={() => {
          leaveRoom();
        }}>
          离开房间
        </button>

        <div>
          <input
            placeholder="Message"
            value={inputMessage}
            onChange={e => setInputMessage(e.target.value)}
          />
          <button onClick={() => {
            broadcast(inputMessage);
          }}>
            发送信息
          </button>
        </div>

        <h3>Logs</h3>
        {connState.logs.map((log, index) => (
          <p key={index}>{log}</p>
        ))}
      </div>

      <div style={{ padding: '20px' }}>
        <h2>游戏核心逻辑</h2>
        <pre style={{ whiteSpace: "pre-wrap" }}>
          {visualize({
            votes: gameState.votes,
            idToSlot: gameState.idToSlot,
            field: getCardsId(field),
            round: round,
            phase: phase,
            roundWinner: gameState.roundWinner,
            gameWinner: winner,
          })}
        </pre>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 4,
          }}
        >
          <pre style={{ whiteSpace: "pre-wrap" }}>
            p1:
            {visualize({
              hand: getCardsId(p1.hand),
              played: getCardsId(p1.played),
              loot: getCardsId(p1.loot),
              deck: getCardsId(p1.deck),
            })}
          </pre>

          <pre style={{ whiteSpace: "pre-wrap" }}>
            p2:
            {visualize({
              hand: getCardsId(p2.hand),
              played: getCardsId(p2.played),
              loot: getCardsId(p2.loot),
              deck: getCardsId(p2.deck),
            })}
          </pre>
        </div>

        {isHost &&
          <div>
            <h2>房主按钮</h2>
            <button onClick={handleStartGame}>新建游戏</button>
            <button onClick={handleCloseGame}>关闭游戏</button>
            <br />
            <button onClick={handleDrawCards}>发牌</button>
            <button onClick={handleSelfPlayCards}>P1出牌</button>
            <button onClick={handleOtherPlayCards}>P2出牌</button>
            <button onClick={handleFlipCards}>开牌</button>
            <br />
            <button onClick={handleSetSelfWinner}>自己赢牌</button>
            <button onClick={handleSetOtherWinner}>对方赢牌</button>
            <button onClick={handleLootCards}>收牌</button>
            <br />
            <button onClick={handleNextRound}>进入下一轮</button>
            <button onClick={toggleGameAutomate}>自动游戏</button>
          </div>
        }

        <div>
          <h2>玩家按钮</h2>
          <button onClick={handleSelfPlayCards}>出牌</button>
          <button onClick={handleVoteSelfWinner}>我赢</button>
          <button onClick={handleVoteTie}>平手</button>
          <button onClick={handleVoteOtherWinner}>你赢</button>
        </div>
      </div>
    </div>
  );
};