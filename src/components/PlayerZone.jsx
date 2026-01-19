import React from 'react';
import '../styles/PlayerZone.css';
import PokerCards from './PokerCards';

const PlayerZone = ({ type, hand, deckCount, lootCount }) => {
  // type: "self" | "opponent"

  return (
    <div className={`player-zone player-zone--${type}`}>
      {/* Loot */}
      <div className="player-zone__stats-aside">
        <div className="player-zone__loot">
          <small>LOOT</small>
          <div className="player-zone__card-count">{lootCount}</div>
        </div>
      </div>

      {/* Hand */}
      <div className="player-zone__hand-container">
        {hand.map((card, i) => (
          <PokerCards card={card} revealed={false} key={i} />
        ))}
        {/* {handCount === 0 && <div className="player-zone__empty-slot">EMPTY</div>} */}
      </div>

      {/* Deck */}
      <div className="player-zone__stats-aside">
        <div className="player-zone__deck">
          <small>DECK</small>
          <div className="player-zone__card-count">{deckCount}</div>
        </div>
      </div>
    </div>
  );
};

export default PlayerZone;