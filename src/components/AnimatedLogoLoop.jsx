import React, { useEffect, useState } from 'react';
import '../styles/AnimatedLogoLoop.css';

const AnimatedLogoLoop = ({ width = 160, height = 160 }) => {
  const [key, setKey] = useState(0);
  
  // Reset animation every 4 seconds to create a looping effect
  useEffect(() => {
    const interval = setInterval(() => {
      setKey(prevKey => prevKey + 1);
    }, 4000);
    
    return () => clearInterval(interval);
  }, []);
  
  return (
    <div 
      className="animated-logo-container-loop" 
      style={{ width: `${width}px`, height: `${height}px` }}
      key={key}
    >
      <div className="logo-wrapper-loop">
        <div className="accent-loop accent-left-loop"></div>
        <div className="accent-loop accent-right-loop"></div>
        <div className="logo-letter-loop">a</div>
        <div className="logo-dot-loop"></div>
      </div>
      <div className="full-logo-loop">
        <span className="logo-text-loop">aarthika</span>
        <span className="logo-registered-loop">®</span>
      </div>
    </div>
  );
};

export default AnimatedLogoLoop; 