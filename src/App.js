import logo from './logo.svg';
import './App.css';
import { useGameRoom } from './hooks/useGameRoom';
import GameRoom from './components/GameRoom';
import Lobby from './components/Lobby';

function App() {
  const { connState, isHost, isConnected, connHandles,
    gameState, gameHandles } = useGameRoom();

  return (
    <div className="App">
      <div className="App__dev-panel">
        <h3>Dev Panel</h3>
        <pre>{JSON.stringify({ ...connState, isHost: isHost, isConnected: isConnected }, null, 2)}</pre>
        <pre>{JSON.stringify(gameState, null, 2)}</pre>
      </div>

      <div className="App__game-viewport">
        <div className="App__game-container">
          {!isConnected ? (
            <Lobby
              onHost={connHandles.host}
              onJoin={connHandles.join}
              onLeave={connHandles.leave}
              myId={connState.myId}
              status={connState.status}
            />
          ) : (
            <div className="game-play-area">
              {/* 这是我们下一步要写的战斗Page */}
              GAME PLAY
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
