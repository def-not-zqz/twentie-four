import logo from './logo.svg';
import './App.css';
import { useGameRoom } from './hooks/useGameRoom';
import GameRoom from './components/GameRoom';
import Lobby from './components/Lobby';
import GamePlay from './components/GamePlay';

function App() {
  const { connState, isHost, isConnected, connHandles,
    gameState, playerSelf, playerOther, gameHandles } = useGameRoom();

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
            <GamePlay
              playerSelf={playerSelf}
              playerOpponent={playerOther}
              field={gameState.field}
              phase={gameState.phase}
              handlePlay={gameHandles.play}
              handleWin={gameHandles.voteSelf}
              handleTie={gameHandles.voteTie}
              handleLose={gameHandles.voteOther}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
