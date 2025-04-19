import React from 'react';
import aboutImage from '../assets/5.png'; // Replace with your actual image

const About = () => {
  return (
    <section id="about" className="py-16 md:py-24 bg-white">
      <div className="premium-container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 md:mb-16">
          <span className="text-sm font-medium text-aarthikaBlue tracking-wider uppercase mb-2 block">About Us</span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-800">About Aarthika</h2>
          <div className="mt-4 w-24 h-1 bg-gradient-to-r from-aarthikaDark to-aarthikaBlue rounded-full mx-auto opacity-80"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16 items-center">
          {/* Image Section */}
          <div className="order-1 md:order-2">
            <img 
              src={aboutImage} 
              alt="Aarthika Team Meeting" 
              className="rounded-xl shadow-lg w-full h-auto object-cover transform hover:scale-105 transition-transform duration-500 ease-in-out"
            />
          </div>

          {/* Text Content Section */}
          <div className="space-y-8 order-2 md:order-1">
            <div>
              <h3 className="flex items-center text-xl md:text-2xl font-semibold text-gray-800 mb-3">
                <span className="w-3 h-3 bg-aarthikaBlue rounded-full mr-3"></span>
                Our Mission
              </h3>
              <p className="text-base md:text-lg text-gray-600 leading-relaxed">
                To financially empower rural communities by unlocking the value of their assets. We provide fast, fair loans against gold and silver, built on trust and transparency, bringing dignity and opportunity to every doorstep.
              </p>
            </div>
            
            <div>
              <h3 className="flex items-center text-xl md:text-2xl font-semibold text-gray-800 mb-3">
                <span className="w-3 h-3 bg-aarthikaBlue rounded-full mr-3"></span>
                Our Story
              </h3>
              <p className="text-base md:text-lg text-gray-600 leading-relaxed">
                Aarthika began with a small table, a trusted face, and a simple belief: rural India deserves better finance. From serving a few farmers, we've grown into a locally respected institution, always guided by community needs.
              </p>
            </div>

            <div>
              <h3 className="flex items-center text-xl md:text-2xl font-semibold text-gray-800 mb-3">
                <span className="w-3 h-3 bg-aarthikaBlue rounded-full mr-3"></span>
                 Our Values
              </h3>
              <ul className="list-none space-y-2 text-base md:text-lg text-gray-600 pl-6">
                <li className="flex items-start"><i className="fas fa-check-circle text-aarthikaBlue mr-2 mt-1"></i>Trust is Everything: We safeguard every loan with respect.</li>
                <li className="flex items-start"><i className="fas fa-check-circle text-aarthikaBlue mr-2 mt-1"></i>Local First: We serve rural areas where needs are real but banks often hesitate.</li>
                <li className="flex items-start"><i className="fas fa-check-circle text-aarthikaBlue mr-2 mt-1"></i>Transparency: Not Tricks. Clear rates, dues, and timelines, always.</li>
                <li className="flex items-start"><i className="fas fa-check-circle text-aarthikaBlue mr-2 mt-1"></i>Access, Not Approval: We focus on your assets, not just credit scores.</li>
                <li className="flex items-start"><i className="fas fa-check-circle text-aarthikaBlue mr-2 mt-1"></i>Growth with Integrity: Principled growth over rapid risk.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About; 