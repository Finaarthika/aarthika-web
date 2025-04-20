import React, { useState } from 'react';
import logoIcon from '../assets/4.png'; // Keep the small icon
import logoFull from '../assets/Aarthika (1).png'; // Import the full logo
import { EMAIL, PHONE, PHONE_DISPLAY, WHATSAPP_URL, FORMSPREE_ENDPOINT } from '../constants/contactInfo';
import { Link as RouterLink } from 'react-router-dom'; // Import RouterLink for internal page navigation

const Footer = ({ toggleJoinForm }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  // Using a simple Formspree submission, no client-side submit logic needed for basic setup
  // const handleSubmit = (e) => {
  //   e.preventDefault();
  //   console.log('Form submitted:', formData);
  //   alert('Thank you for your message! We will get back to you soon.');
  //   setFormData({
  //     name: '',
  //     email: '',
  //     message: ''
  //   });
  // };

  return (
    <footer id="contact" className="bg-aarthikaDark text-white pt-20 md:pt-28 pb-10 relative overflow-hidden">
      {/* Abstract shapes for background */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-aarthikaBlue/10 rounded-full -mt-20 -mr-20 blur-3xl opacity-30"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-aarthikaBlue/10 rounded-full -mb-48 -ml-48 blur-3xl opacity-30"></div>
      
      <div className="premium-container relative z-10">
        {/* Title moved here for better structure */}
        <div className="flex flex-col items-center mb-16">
          <span className="text-sm text-aarthikaBlue font-medium tracking-wider uppercase mb-2">Get In Touch</span>
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-center text-white">Contact Us</h2>
          <div className="w-24 h-1 bg-gradient-to-r from-aarthikaDark to-aarthikaBlue rounded-full opacity-50"></div>
        </div>
          
        <div className="grid md:grid-cols-2 gap-12 md:gap-16 mb-16">
          {/* Contact Form (Restored) */}
          <div className="bg-white/5 p-8 rounded-xl backdrop-blur-sm border border-white/10 shadow-xl">
            <form action={FORMSPREE_ENDPOINT} method="POST" className="space-y-6">
              <div>
                <label htmlFor="footer-name" className="block mb-2 text-gray-300 font-medium">Name</label>
                <input
                  type="text"
                  id="footer-name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full p-3 rounded-lg border border-gray-700 bg-gray-800/80 text-white focus:border-aarthikaBlue focus:ring-2 focus:ring-aarthikaBlue/20 focus:outline-none transition-all duration-300"
                  placeholder="Your name"
                />
              </div>
              <div>
                <label htmlFor="footer-email" className="block mb-2 text-gray-300 font-medium">Email</label>
                <input
                  type="email"
                  id="footer-email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full p-3 rounded-lg border border-gray-700 bg-gray-800/80 text-white focus:border-aarthikaBlue focus:ring-2 focus:ring-aarthikaBlue/20 focus:outline-none transition-all duration-300"
                  placeholder="Your email address"
                />
              </div>
              <div>
                <label htmlFor="footer-message" className="block mb-2 text-gray-300 font-medium">Message</label>
                <textarea
                  id="footer-message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  rows="4"
                  className="w-full p-3 rounded-lg border border-gray-700 bg-gray-800/80 text-white focus:border-aarthikaBlue focus:ring-2 focus:ring-aarthikaBlue/20 focus:outline-none transition-all duration-300"
                  placeholder="How can we help you?"
                ></textarea>
              </div>
              <button type="submit" className="btn btn-primary w-full py-3 text-base">Send Message</button>
            </form>
          </div>
          
          {/* Info Column (Restored & Updated) */}
          <div className="flex flex-col justify-between">
            <div>
              <div className="flex items-center mb-6">
                {/* Circular Icon Logo - Match Navbar Size */}
                <div className="bg-white rounded-full w-9 h-9 md:w-10 md:h-10 mr-2 shadow-md flex-shrink-0 overflow-hidden flex items-center justify-center">
                  <img 
                    src={logoIcon} 
                    alt="Aarthika Logo Icon" 
                    className="h-full w-full object-cover rounded-full" 
                  />
                </div>
                {/* Full Text Logo - Match Navbar Size */}
                <img 
                  src={logoFull} // Use the imported logoFull variable
                  alt="Aarthika Logo" 
                  className="h-9 md:h-10 w-auto navbar-text-logo-img" // Add the class from Navbar
                />
              </div>
              <p className="mb-8 text-gray-400 text-base md:text-lg leading-relaxed">
                Empowering rural communities with innovative financial solutions backed by trusted assets. We bridge the gap between traditional values and modern finance.
              </p>
            </div>
            
            {/* Contact Details Integrated */}
            <div>
              <h3 className="text-lg font-semibold mb-4 text-white border-l-2 border-aarthikaBlue pl-3">Contact Information</h3>
              <div className="space-y-3 text-sm">
                <a href={`mailto:${EMAIL}`} className="flex items-start group">
                  <i className="fas fa-envelope w-4 mt-1 mr-2 text-aarthikaBlue group-hover:scale-110 transition-transform"></i>
                  <span className="text-gray-300 group-hover:text-white transition-colors">{EMAIL}</span>
                </a>
                <a href={`tel:${PHONE}`} className="flex items-start group">
                  <i className="fas fa-phone-alt w-4 mt-1 mr-2 text-aarthikaBlue group-hover:scale-110 transition-transform"></i>
                  <span className="text-gray-300 group-hover:text-white transition-colors">{PHONE_DISPLAY}</span>
                </a>
                <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="flex items-start group">
                  <i className="fab fa-whatsapp w-4 mt-1 mr-2 text-aarthikaBlue group-hover:scale-110 transition-transform"></i>
                  <span className="text-gray-300 group-hover:text-white transition-colors">Chat on WhatsApp</span>
                </a>
                {/* Add Address here if needed */}
              </div>
            </div>
              
            {/* Join Aarthika Button */}
            <div className="mt-8">
              <h3 className="text-lg font-semibold mb-4 text-white border-l-2 border-aarthikaBlue pl-3">Work With Us</h3>
               <button 
                 onClick={toggleJoinForm} // Call the function passed from App.jsx
                 className="btn btn-secondary py-3 text-base"
               >
                 Join Aarthika – Become an Associate
               </button>
            </div>
          </div>
        </div>
          
        <div className="border-t border-gray-800 py-8 text-center text-gray-400 text-sm">
          <p>&copy; {new Date().getFullYear()} Aarthika. All rights reserved. | <RouterLink to="/privacy-policy" className="hover:text-white transition-colors">Privacy Policy</RouterLink> | <RouterLink to="/terms-of-service" className="hover:text-white transition-colors">Terms of Service</RouterLink></p>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 