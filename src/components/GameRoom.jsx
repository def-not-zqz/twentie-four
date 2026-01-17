import { useState } from "react";
import { useP2PHost } from "../hooks/useP2PHost";
import { useGameLogic } from "../hooks/useGameLogic";

function visualize(data) {
  return typeof data === "string"
    ? data
    : JSON.stringify(data, null, 2);
}

function getCardsId(cards) {
  return cards.map((card, index) => (card.id));
}

export default function GameRoom() {
  const {
    gameState,
    gameStartNewGame,
    gameCloseGame,
    gameDrawCards,
    gamePlayCards,
    gameLootCards,
    gameNextRound,
  } = useGameLogic();
  const { connState, hostRoom, joinRoom, leaveRoom, broadcast } = useP2PHost();

  const { players, field, round, phase, winner } = gameState;
  const { p1, p2 } = players;

  const [inputHostId, setInputHostId] = useState("");
  const [inputMessage, setInputMessage] = useState("");

  return (
    <div>
      <div style={{ padding: '20px' }}>
        <h2>P2P 重连框架</h2>
        <p>My ID: {connState.myId}</p>
        <p>Host ID: {connState.hostId}</p>
        <p>Status: {connState.status}</p>
        <p>Is Host: {(connState.hostId && connState.myId === connState.hostId) ? "Host" : "Guest"}</p>
        <p>Peer List: [{connState.peersId}]</p>

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
            field: getCardsId(field),
            round: round,
            phase: phase,
            winner: winner,
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

        <button onClick={() => {
          gameStartNewGame("p1-id", "p2-id")
        }}>
          新建游戏
        </button>

        <button onClick={() => {
          gameCloseGame()
        }}>
          关闭游戏
        </button>

        <br />

        <button onClick={() => {
          gameDrawCards()
        }}>
          发牌
        </button>

        <button onClick={() => {
          gamePlayCards("p1-id", p1.hand)
        }}>
          P1出牌
        </button>

        <button onClick={() => {
          gamePlayCards("p2-id", p2.hand)
        }}>
          P2出牌
        </button>

        <br />

        <button onClick={() => {
          gameLootCards("p1-id")
        }}>
          P1赢牌
        </button>

        <button onClick={() => {
          gameLootCards("p2-id")
        }}>
          P2赢牌
        </button>

        <button onClick={() => {
          gameNextRound()
        }}>
          进入下一轮
        </button>
      </div>
    </div>
  );
};