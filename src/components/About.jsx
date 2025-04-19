import React from 'react';
import logo from '../assets/3.png';

const Feature = ({ title, description }) => (
  <div className="mb-8">
    <h3 className="text-xl font-semibold mb-3 text-gray-800 flex items-center">
      <span className="w-1.5 h-6 bg-gradient-to-b from-aarthikaDark to-aarthikaBlue rounded-full mr-3"></span>
      {title}
    </h3>
    <p className="text-gray-600 ml-4.5 pl-3 leading-relaxed">{description}</p>
  </div>
);

const ValueItem = ({ text }) => (
  <li className="flex items-start">
    <span className="inline-block w-1.5 h-1.5 bg-aarthikaBlue rounded-full mt-2 mr-2"></span>
    <span>{text}</span>
  </li>
);

const About = () => {
  return (
    <section id="about" className="py-20 md:py-28 bg-white">
      <div className="premium-container">
        <div className="flex flex-col items-center mb-16">
          <span className="text-sm text-aarthikaBlue font-medium tracking-wider uppercase mb-2">About Us</span>
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-center text-gray-800">About Aarthika</h2>
          <div className="w-24 h-1 bg-gradient-to-r from-aarthikaDark to-aarthikaBlue rounded-full"></div>
        </div>
        
        <div className="grid md:grid-cols-1 lg:grid-cols-2 gap-12 md:gap-16 items-start">
          <div className="animate-fade-in">
            <Feature 
              title="Our Mission"
              description="To financially empower rural communities by unlocking the value of their assets. We provide fast, fair loans against gold and silver, built on trust and transparency, bringing dignity and opportunity to every doorstep."
            />
            
            <Feature 
              title="Our Story"
              description="Aarthika began with a small table, a trusted face, and a simple belief: rural India deserves better finance. From serving a few farmers, we've grown into a locally trusted brand, understanding that our customers value trust over apps and paperwork. That focus on people is why our community grows, referral by referral."
            />
          </div>
          
          <div className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <h3 className="text-xl font-semibold mb-3 text-gray-800 flex items-center">
              <span className="w-1.5 h-6 bg-gradient-to-b from-aarthikaDark to-aarthikaBlue rounded-full mr-3"></span>
              Our Values
            </h3>
            <ul className="text-gray-600 ml-4.5 pl-3 space-y-2">
              <ValueItem text="Trust is Everything: We safeguard every loan with respect." />
              <ValueItem text="Local First: We serve rural areas where needs are real but banks often hesitate." />
              <ValueItem text="Transparency, Not Tricks: Clear rates, dues, and timelines, always." />
              <ValueItem text="Access, Not Approval: We focus on your assets, not just credit scores." />
              <ValueItem text="Growth with Integrity: Principled growth over rapid risk." />
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About; 