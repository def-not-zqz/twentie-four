import React, { useState } from 'react';
import '../styles/Lobby.css';
import { CONN_STATUS } from '../constants';
import Loader from './Loader';

const Lobby = ({ onHost, onJoin, onLeave, myId, status }) => {
  const [isHosting, setIsHosting] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [isWaiting, setIsWaiting] = useState(false);
  const [inputID, setInputID] = useState("");

  const handleHostClick = () => {
    setIsHosting(true);
    setIsWaiting(true);
    onHost();
  };

  const handleJoinClick = () => {
    setIsJoining(true);
  };

  const handleJoinSubmit = () => {
    const hostId = inputID.trim();
    if (hostId) {
      setIsJoining(false);
      setIsWaiting(true);
      setInputID("");
      onJoin(hostId);
    }
  };

  const handleBackClick = () => {
    setIsWaiting(false);
    setIsHosting(false);
    setIsJoining(false);
    setInputID("");
    onLeave();
  };

  const handleCopyId = () => {
    if (myId) {
      navigator.clipboard.writeText(myId);
    }
  };

  const getStatusText = (state) => {
    switch (state) {
      case CONN_STATUS.OFFLINE:
        return "Connecting to network..."
      case CONN_STATUS.HOST_WAITING:
        return "Waiting for guest to join...";
      case CONN_STATUS.GUEST_WAITING:
        return "Waiting to join host room...";
      default:
        return "";
    }
  };

  return (
    <div className="lobby__container">
      {/* Logo Section */}
      <div className="lobby__logo-section">
        <h1 className="lobby__title">24 POINTS</h1>
        <p className="lobby__subtitle">ONLINE BATTLE</p>
      </div>

      {/* Action Section */}
      <div className="lobby__actions">
        {!isJoining && !isWaiting && (
          <div className="lobby__default-group">
            <button className="lobby__btn lobby__btn--host" onClick={handleHostClick}>
              HOST GAME
            </button>
            <div className="lobby__divider">OR</div>
            <button className="lobby__btn lobby__btn--join" onClick={handleJoinClick}>
              JOIN GAME
            </button>
          </div>
        )}

        {isJoining && (
          <div className="lobby__input-group">
            <input
              className="lobby__input"
              type="text"
              placeholder="Enter Host ID"
              value={inputID}
              onChange={(e) => setInputID(e.target.value)}
            />
            <button className="lobby__btn lobby__btn--connect" onClick={handleJoinSubmit}>
              CONNECT
            </button>
            <button className="lobby__btn--back" onClick={handleBackClick}>
              ← Back to Menu
            </button>
          </div>
        )}

        {isWaiting && (
          <div className="lobby__waiting-group">
            <Loader isLoading={status !== CONN_STATUS.HOST_CONNECTED || status !== CONN_STATUS.GUEST_CONNECTED} />
            <p className="lobby__waiting-text">{getStatusText(status)}</p>
            {isHosting && (
              <div
                className="lobby__id-card"
                onClick={handleCopyId}
                title="Click to copy ID"
              >
                {myId || 'Generating...'}
              </div>
            )}
            <button className="lobby__btn lobby__btn--disconnect" onClick={handleBackClick}>
              DISCONNECT
            </button>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="lobby__footer">
        <div className="lobby__status">
          STATUS: <span className={"lobby__status-text"}>
            {status}
          </span>
        </div>
      </div>
    </div>
  );
};

export default Lobby;