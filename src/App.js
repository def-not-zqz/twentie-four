import logo from './logo.svg';
import './App.css';
// import P2PManager from './components/P2PManager';
import GameRoom from './components/GameRoom';

function App() {
  return (
    <div className="App" style={{ "backgroundColor": "#ccc" }}>
      {/* <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.js</code> and save to reload.
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
      </header> */}
      {/* <P2PManager /> */}
      <GameRoom />
    </div>
  );
}

export default App;
