import React from 'react';
import '../styles/GamePlay.css';
import PlayerZone from './PlayerZone';
import Controls from './Controls';
import TableArea from './TableArea';
import { GAME_PHASE } from '../constants';

const GamePlay = ({
  playerSelf = {}, playerOpponent = {}, field, phase,
  handlePlay, handleWin, handleTie, handleLose,
}) => {
  return (
    <div className="game__container">
      {/* 1. Opponent Area */}
      <section className="game__opponent-zone">
        {/* <div className="placeholder-content">Opponent Area</div> */}
        <PlayerZone type={"opponent"}
          hand={playerOpponent?.hand ?? []}
          deckCount={playerOpponent?.deck?.length ?? 0}
          lootCount={playerOpponent?.loot?.length ?? 0} />
      </section>

      {/* 2. Board/Table Area */}
      <section className="game__table-zone">
        {/* <div className="placeholder-content">Table Area (Cards)</div> */}
        <TableArea field={field} revealed={phase === GAME_PHASE.VOTE_WINNER} />
      </section>

      {/* 3. Self Area */}
      <section className="game__self-zone">
        {/* <div className="placeholder-content">Player Area</div> */}
        <PlayerZone type={"self"}
          hand={playerSelf?.hand ?? []}
          deckCount={playerSelf?.deck?.length ?? 0}
          lootCount={playerSelf?.loot?.length ?? 0} />
      </section>

      {/* 4. Controls Area */}
      <section className="game__controls-zone">
        {/* <div className="placeholder-content">Controls Area</div> */}
        <Controls
          handlePlay={handlePlay}
          handleWin={handleWin}
          handleTie={handleTie}
          handleLose={handleLose}
        />
      </section>
    </div>
  );
};

export default GamePlay;