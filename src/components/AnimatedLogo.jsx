import React from 'react';
import '../styles/AnimatedLogo.css';

const AnimatedLogo = () => {
  return (
    <div className="animated-logo-container">
      <div className="logo-wrapper">
        <div className="accent accent-left"></div>
        <div className="accent accent-right"></div>
        <div className="logo-letter">a</div>
        <div className="logo-dot"></div>
      </div>
      <div className="full-logo">
        <span className="logo-text">aarthika</span>
        <span className="logo-registered">®</span>
      </div>
    </div>
  );
};

export default AnimatedLogo; 