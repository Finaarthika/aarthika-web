import React from 'react';
import AnimatedLogoCustom from './AnimatedLogoCustom';

const Hero = () => {
  return (
    <section id="home" className="bg-gradient-to-r from-aarthikaDark to-aarthikaBlue py-20 md:py-28 text-white w-full relative overflow-hidden">
      {/* Warm overlay filter - Increased intensity */}
      <div className="absolute inset-0 bg-gradient-to-b from-amber-900/10 to-transparent mix-blend-overlay"></div>
      
      {/* Abstract shapes for background */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-aarthikaBlue/10 rounded-full -mt-20 -mr-20 blur-xl"></div>
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-aarthikaBlue/10 rounded-full -mb-40 -ml-40 blur-xl"></div>
      
      <div className="premium-container relative z-10">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6 md:space-y-8">
            <span className="inline-block px-4 py-1.5 bg-aarthikaBlue/20 backdrop-blur-sm rounded-full text-sm font-medium">
              Revolutionizing Rural Finance
            </span>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
              Empowering Rural Finance with Trust and Technology
            </h1>
            <p className="text-lg md:text-xl text-gray-200 font-light leading-relaxed">
              We provide accessible financial solutions tailored to the needs of rural communities, backed by innovative technology and trusted relationships.
            </p>
            <div className="pt-4 flex space-x-4">
              <a href="#services" className="btn btn-primary bg-white text-aarthikaBlue hover:bg-gray-100">
                Explore Our Services
              </a>
              <a href="#about" className="btn border-white text-white hover:bg-white/10">
                Learn More
              </a>
            </div>
          </div>
          <div className="flex justify-center relative">
            <div className="relative z-10">
              <div className="logo-sphere">
                <AnimatedLogoCustom width={280} height={280} />
              </div>
            </div>
          </div>
        </div>
      
        <div className="mt-20 md:mt-28">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 text-center">
            <div className="bg-aarthikaBlue/20 p-5 md:p-6 rounded-lg backdrop-blur-sm border border-aarthikaBlue/30 hover:border-aarthikaBlue/50 transition-all duration-300">
              <h3 className="font-bold text-2xl md:text-3xl mb-1">11+</h3>
              <p className="text-gray-200 font-light">Years Experience</p>
            </div>
            <div className="bg-aarthikaBlue/20 p-5 md:p-6 rounded-lg backdrop-blur-sm border border-aarthikaBlue/30 hover:border-aarthikaBlue/50 transition-all duration-300">
              <h3 className="font-bold text-2xl md:text-3xl mb-1">10,000+</h3>
              <p className="text-gray-200 font-light">Satisfied Clients</p>
            </div>
            <div className="bg-aarthikaBlue/20 p-5 md:p-6 rounded-lg backdrop-blur-sm border border-aarthikaBlue/30 hover:border-aarthikaBlue/50 transition-all duration-300">
              <h3 className="font-bold text-2xl md:text-3xl mb-1">₹40Cr+</h3>
              <p className="text-gray-200 font-light">Loans Facilitated</p>
            </div>
            <div className="bg-aarthikaBlue/20 p-5 md:p-6 rounded-lg backdrop-blur-sm border border-aarthikaBlue/30 hover:border-aarthikaBlue/50 transition-all duration-300">
              <h3 className="font-bold text-2xl md:text-3xl mb-1">15+</h3>
              <p className="text-gray-200 font-light">Partnerships</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;