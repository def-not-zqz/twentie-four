import React from 'react';
import '../styles/Loader.css';

const Loader = ({ isLoading }) => {
  return (
    <div className={`loader__wrapper ${!isLoading ? 'loader--complete' : ''}`}>
      {isLoading ? (
        // 加载中的旋转圈
        <div className="loader__spinner"></div>
      ) : (
        // 完成后的对勾图标
        <svg className="loader__check-icon" viewBox="0 0 24 24">
          <path
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M5 13l4 4L19 7"
          />
        </svg>
      )}
    </div>
  );
};

export default Loader;