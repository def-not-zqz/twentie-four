import React from 'react';
import '../styles/Controls.css';

// 提取出的图标库
const Icons = {
  Play: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 11V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0" />
      <path d="M14 10V4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0" />
      <path d="M10 10.5V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0" />
      <path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15" />
    </svg>
  ),
  Check: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"></polyline>
    </svg>
  ),
  Tie: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="9" x2="19" y2="9"></line>
      <line x1="5" y1="15" x2="19" y2="15"></line>
    </svg>
  ),
  Cross: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"></line>
      <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
  )
};

const ControlButton = ({ icon, label, type, onClick }) => (
  <div className="control-btn__wrapper" onClick={onClick}>
    <div className={`control-btn__circle control-btn--${type}`}>
      <span className="control-btn__icon">{icon}</span>
    </div>
    {/* <span className="control-btn__label">{label}</span> */}
  </div>
);


const Controls = ({ handlePlay, handleWin, handleTie, handleLose }) => {
  return (
    <div className="game__controls-inner">
      <div className="controls__section-left">
        <ControlButton type="action" icon={<Icons.Play />} label="PLAY" onClick={handlePlay} />
      </div>
      <div className="controls__section-right">
        <ControlButton type="win" icon={<Icons.Check />} label="I WIN" onClick={handleWin} />
        <ControlButton type="tie" icon={<Icons.Tie />} label="TIE" onClick={handleTie} />
        <ControlButton type="lose" icon={<Icons.Cross />} label="YOU WIN" onClick={handleLose} />
      </div>
    </div>
  );
};

export default Controls;