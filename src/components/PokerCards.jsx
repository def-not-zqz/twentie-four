import React, { useState } from 'react';
import '../styles/PokerCards.css';

const SUIT_MAP = {
  'h': { icon: '♥', color: 'red', name: 'heart' },
  'd': { icon: '♦', color: 'red', name: 'diamond' },
  's': { icon: '♠', color: 'black', name: 'spade' },
  'c': { icon: '♣', color: 'black', name: 'club' }
};

const GameCard = ({ card, revealed }) => {
  const [reveal, setReveal] = useState(false);
  const handleClick = () => setReveal(!reveal); // for testing flipping animation

  if (!card) {
    return <div className={`poker-card--empty`}></div>;
  }

  const { value, suit } = card;
  const { icon, color } = SUIT_MAP[suit.toLowerCase()];

  return (
    <div className={`poker-card`}>
      <div className={`poker-card__inner ${revealed ? 'is-revealed' : ''}`}>

        {/* 牌背 - Back Side */}
        <div className="poker-card__side poker-card__side--back">
          <div className="card-pattern"></div>
        </div>

        {/* 牌面 - Front Side */}
        <div className={`poker-card__side poker-card__side--front color-${color}`}>
          <div className="card-value-top">{value}</div>
          <div className="card-suit-center">{icon}</div>
          <div className="card-value-bottom">{value}</div>
        </div>

      </div>
    </div>
  );
};

export default GameCard;