import React from 'react';
import AnimatedLogo from './AnimatedLogo';
import AnimatedLogoLoop from './AnimatedLogoLoop';
import AnimatedLogoCustom from './AnimatedLogoCustom';
import { Link } from 'react-router-dom';

const LogoDemo = () => {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center py-12">
      <h1 className="text-3xl font-bold mb-12 text-gray-800">Aarthika Logo Animation</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-12 max-w-6xl mx-auto">
        <div className="flex flex-col items-center">
          <h2 className="text-xl font-medium mb-6 text-gray-700">Single Animation</h2>
          <div className="bg-gray-50 p-8 rounded-lg shadow-md flex items-center justify-center">
            <AnimatedLogo />
          </div>
          <p className="text-sm text-gray-500 mt-4 text-center max-w-sm">
            Plays once when the component mounts
          </p>
        </div>
        
        <div className="flex flex-col items-center">
          <h2 className="text-xl font-medium mb-6 text-gray-700">Looping Animation</h2>
          <div className="bg-gray-50 p-8 rounded-lg shadow-md flex items-center justify-center">
            <AnimatedLogoLoop />
          </div>
          <p className="text-sm text-gray-500 mt-4 text-center max-w-sm">
            Repeats the animation every 4 seconds
          </p>
        </div>

        <div className="flex flex-col items-center">
          <h2 className="text-xl font-medium mb-6 text-gray-700">Custom Logo Animation</h2>
          <div className="bg-gray-50 p-8 rounded-lg shadow-md flex items-center justify-center">
            <AnimatedLogoCustom />
          </div>
          <p className="text-sm text-gray-500 mt-4 text-center max-w-sm">
            Your custom logo design with animation
          </p>
        </div>
      </div>
      
      <div className="mt-16 w-full max-w-6xl">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">Different Sizes</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
          <div className="flex flex-col items-center">
            <div className="bg-gray-50 p-6 rounded-lg shadow-md flex items-center justify-center">
              <AnimatedLogoCustom width={100} height={100} />
            </div>
            <p className="text-sm text-gray-500 mt-2">100x100px</p>
          </div>
          
          <div className="flex flex-col items-center">
            <div className="bg-gray-50 p-6 rounded-lg shadow-md flex items-center justify-center">
              <AnimatedLogoCustom width={160} height={160} />
            </div>
            <p className="text-sm text-gray-500 mt-2">160x160px</p>
          </div>
          
          <div className="flex flex-col items-center">
            <div className="bg-gray-50 p-6 rounded-lg shadow-md flex items-center justify-center">
              <AnimatedLogoCustom width={240} height={240} />
            </div>
            <p className="text-sm text-gray-500 mt-2">240x240px</p>
          </div>
        </div>
      </div>
      
      <div className="mt-16 mb-8">
        <Link 
          to="/" 
          className="btn btn-primary py-2 px-6"
        >
          Back to Home
        </Link>
      </div>
    </div>
  );
};

export default LogoDemo; 