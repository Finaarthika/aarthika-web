import React from 'react';
import '../styles/AnimatedLogoCustom.css';
import logo4 from '../assets/4.png';

const AnimatedLogoCustom = ({ width = 160, height = 160 }) => {
  return (
    <div 
      className="custom-logo-container" 
      style={{ width: `${width}px`, height: `${height}px` }}
    >
      <div className="custom-logo-inner">
        <img src={logo4} alt="Aarthika Logo" className="custom-logo-image" />
      </div>
    </div>
  );
};

export default AnimatedLogoCustom; 