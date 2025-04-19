import React, { useState } from 'react';
import logoIcon from '../assets/4.png'; // Using the icon logo
import { EMAIL, PHONE, PHONE_DISPLAY, WHATSAPP_URL, FORMSPREE_ENDPOINT } from '../constants/contactInfo';
import { Link as RouterLink } from 'react-router-dom'; // Import RouterLink for internal page navigation

const Footer = () => {
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
    <footer id="contact" className="bg-aarthikaDark text-white pt-16 md:pt-28 pb-8 md:pb-10 relative overflow-hidden">
      {/* Abstract shapes for background */}
      <div className="absolute top-0 right-0 w-72 h-72 md:w-96 md:h-96 bg-aarthikaBlue/10 rounded-full -mt-16 -mr-16 md:-mt-20 md:-mr-20 blur-3xl opacity-30"></div>
      <div className="absolute bottom-0 left-0 w-72 h-72 md:w-96 md:h-96 bg-aarthikaBlue/10 rounded-full -mb-32 -ml-32 md:-mb-48 md:-ml-48 blur-3xl opacity-30"></div>
      
      <div className="premium-container relative z-10 mx-auto px-4 sm:px-6 lg:px-8">
        {/* Title moved here for better structure */}
        <div className="flex flex-col items-center mb-12 md:mb-16">
          <span className="text-sm font-medium text-aarthikaBlue tracking-wider uppercase mb-2">Get In Touch</span>
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-center text-white">Contact Us</h2>
          <div className="w-20 md:w-24 h-1 bg-gradient-to-r from-aarthikaDark to-aarthikaBlue rounded-full opacity-50"></div>
        </div>
          
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 mb-12 md:mb-16">
          {/* Contact Form (Restored) */}
          <div className="bg-white/5 p-6 md:p-8 rounded-xl backdrop-blur-sm border border-white/10 shadow-xl order-2 md:order-1">
            <form action={FORMSPREE_ENDPOINT} method="POST" className="space-y-5 md:space-y-6">
              <div>
                <label htmlFor="footer-name" className="block mb-1.5 md:mb-2 text-sm md:text-base text-gray-300 font-medium">Name</label>
                <input
                  type="text"
                  id="footer-name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full p-2.5 md:p-3 rounded-lg border border-gray-700 bg-gray-800/80 text-white text-sm md:text-base focus:border-aarthikaBlue focus:ring-2 focus:ring-aarthikaBlue/20 focus:outline-none transition-all duration-300"
                  placeholder="Your name"
                />
              </div>
              <div>
                <label htmlFor="footer-email" className="block mb-1.5 md:mb-2 text-sm md:text-base text-gray-300 font-medium">Email</label>
                <input
                  type="email"
                  id="footer-email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full p-2.5 md:p-3 rounded-lg border border-gray-700 bg-gray-800/80 text-white text-sm md:text-base focus:border-aarthikaBlue focus:ring-2 focus:ring-aarthikaBlue/20 focus:outline-none transition-all duration-300"
                  placeholder="Your email address"
                />
              </div>
              <div>
                <label htmlFor="footer-message" className="block mb-1.5 md:mb-2 text-sm md:text-base text-gray-300 font-medium">Message</label>
                <textarea
                  id="footer-message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  rows="4"
                  className="w-full p-2.5 md:p-3 rounded-lg border border-gray-700 bg-gray-800/80 text-white text-sm md:text-base focus:border-aarthikaBlue focus:ring-2 focus:ring-aarthikaBlue/20 focus:outline-none transition-all duration-300"
                  placeholder="How can we help you?"
                ></textarea>
              </div>
              <button type="submit" className="btn btn-primary w-full py-2.5 md:py-3 text-base">Send Message</button>
            </form>
          </div>
          
          {/* Info Column (Restored & Updated) */}
          <div className="flex flex-col justify-between order-1 md:order-2">
            <div>
              <div className="flex items-center mb-4 md:mb-6">
                <div className="bg-white rounded-full w-9 h-9 md:w-10 md:h-10 mr-3 shadow-md flex-shrink-0 overflow-hidden flex items-center justify-center">
                  <img 
                    src={logoIcon} 
                    alt="Aarthika Logo Icon" 
                    className="h-full w-full object-cover rounded-full" 
                  />
                </div>
                <span className="text-xl md:text-2xl font-bold text-white">Aarthika</span>
              </div>
              <p className="mb-6 md:mb-8 text-gray-300 text-base leading-relaxed">
                Empowering rural communities with innovative financial solutions backed by trusted assets. We bridge the gap between traditional values and modern finance.
              </p>
            </div>
            
            {/* Contact Details Integrated */}
            <div className="mb-6 md:mb-8">
              <h3 className="text-lg font-semibold mb-3 md:mb-4 text-white border-l-2 border-aarthikaBlue pl-3">Contact Information</h3>
              <div className="space-y-2 md:space-y-3 text-sm">
                <a href={`mailto:${EMAIL}`} className="flex items-start group">
                  <i className="fas fa-envelope w-4 mt-1 mr-2 text-aarthikaBlue group-hover:scale-110 transition-transform"></i>
                  <span className="text-gray-300 group-hover:text-white transition-colors break-all">{EMAIL}</span>
                </a>
                <a href={`tel:${PHONE}`} className="flex items-start group">
                  <i className="fas fa-phone-alt w-4 mt-1 mr-2 text-aarthikaBlue group-hover:scale-110 transition-transform"></i>
                  <span className="text-gray-300 group-hover:text-white transition-colors whitespace-nowrap">{PHONE_DISPLAY}</span>
                </a>
                <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="flex items-start group">
                  <i className="fab fa-whatsapp w-4 mt-1 mr-2 text-aarthikaBlue group-hover:scale-110 transition-transform"></i>
                  <span className="text-gray-300 group-hover:text-white transition-colors whitespace-nowrap">Chat on WhatsApp</span>
                </a>
                {/* Add Address here if needed */}
              </div>
            </div>
              
            {/* Follow Us (Placeholder) */}
            <div>
              <h3 className="text-lg font-semibold mb-3 md:mb-4 text-white border-l-2 border-aarthikaBlue pl-3">Follow Us</h3>
              <div className="flex space-x-4">
                <span className="text-sm italic text-gray-400">Coming Soon</span>
              </div>
            </div>
          </div>
        </div>
          
        <div className="border-t border-gray-800 pt-6 md:pt-8 text-center text-gray-400 text-xs md:text-sm">
          <p>&copy; {new Date().getFullYear()} Aarthika. All rights reserved.</p>
          <div className="mt-2">
             <RouterLink to="/privacy-policy" className="mx-2 hover:text-white transition-colors">Privacy Policy</RouterLink>
             |
             <RouterLink to="/terms-of-service" className="mx-2 hover:text-white transition-colors">Terms of Service</RouterLink>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 