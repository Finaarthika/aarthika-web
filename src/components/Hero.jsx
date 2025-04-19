import React from 'react';
import { Link as ScrollLink } from 'react-scroll';
import heroImage from '../assets/6.jpg'; // Replace with your actual hero image path
import AnimatedLogoCustom from './AnimatedLogoCustom';

const Hero = () => {
  return (
    <section id="home" className="relative bg-gradient-to-br from-aarthikaDark via-aarthikaDark to-aarthikaBlue/80 text-white min-h-screen flex items-center overflow-hidden pt-20 md:pt-24">
      {/* Background Image Overlay */}
      <div 
        className="absolute inset-0 bg-cover bg-center opacity-10 z-0"
        style={{ backgroundImage: `url(${heroImage})` }}
      ></div>

       {/* Abstract Shapes */}
      <div className="absolute top-1/4 left-10 w-64 h-64 bg-aarthikaBlue/20 rounded-full blur-3xl opacity-40 animate-pulse-slow"></div>
      <div className="absolute bottom-1/4 right-10 w-72 h-72 bg-white/10 rounded-full blur-3xl opacity-30 animate-pulse-slow animation-delay-2000"></div>


      {/* Content */}
      <div className="premium-container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center">
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold mb-6 leading-tight">
            <span className="block">Empowering Rural India</span>
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-aarthikaBlue mt-2">Financial Solutions</span>
          </h1>
          <p className="text-lg sm:text-xl md:text-2xl text-gray-300 max-w-2xl mx-auto mb-10 font-light leading-relaxed">
            Bridging the gap with accessible gold and silver loans, built on trust and transparency for a brighter financial future.
          </p>
          <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-6">
            <ScrollLink 
              to="services" 
              spy={true} 
              smooth={true} 
              offset={-70} 
              duration={500}
              className="btn btn-primary text-base sm:text-lg px-8 py-3 w-full sm:w-auto"
            >
              Explore Services
            </ScrollLink>
            <ScrollLink 
              to="about" 
              spy={true} 
              smooth={true} 
              offset={-70} 
              duration={500}
              className="btn btn-secondary text-base sm:text-lg px-8 py-3 w-full sm:w-auto"
            >
              Learn More
            </ScrollLink>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;