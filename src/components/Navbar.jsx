import React from 'react';
import { Link } from 'react-scroll';
import logoIcon from '../assets/4.png';
import logoTextUrl from '../assets/Aarthika (1).png';

const NAV_OFFSET = -80;
const SCROLL_DURATION = 1000;

const NavLink = ({ to, children }) => (
  <Link 
    activeClass="active-nav-link"
    to={to} 
    spy={true} 
    smooth={true} 
    offset={NAV_OFFSET} 
    duration={SCROLL_DURATION}
    className="text-white hover:text-gray-200 font-medium transition-colors py-1 border-b-2 border-transparent hover:border-white/50 cursor-pointer"
  >
    {children}
  </Link>
);

const MobileNavLink = ({ to, children, onClick }) => (
  <Link 
    to={to} 
    spy={true} 
    smooth={true} 
    offset={NAV_OFFSET} 
    duration={SCROLL_DURATION}
    className="block text-white py-3 hover:bg-white/10 px-4 rounded transition-colors mb-1"
    onClick={onClick}
  >
    {children}
  </Link>
);

const Navbar = ({ isMenuOpen, toggleMenu }) => {
  const navItems = [
    { to: 'home', label: 'Home' },
    { to: 'about', label: 'About Us' },
    { to: 'services', label: 'Services' },
    { to: 'live-rates', label: 'Rates' },
    { to: 'partnerships', label: 'Partnerships' },
    { to: 'technology', label: 'Technology' },
    { to: 'contact', label: 'Contact' },
  ];

  return (
    <nav className="bg-gradient-to-r from-aarthikaDark to-aarthikaBlue py-4 w-full shadow-lg fixed top-0 left-0 right-0 z-50">
      <div className="container flex justify-between items-center px-4 md:px-12 lg:px-24 max-w-screen-2xl mx-auto">
        <Link to="home" smooth={true} offset={NAV_OFFSET} duration={SCROLL_DURATION} className="flex items-center cursor-pointer">
          <div className="bg-white rounded-full w-9 h-9 md:w-10 md:h-10 mr-2 shadow-md flex-shrink-0 overflow-hidden flex items-center justify-center">
            <img 
              src={logoIcon} 
              alt="Aarthika Logo Icon" 
              className="h-full w-full object-cover rounded-full" 
            />
          </div>
          <img 
            src={logoTextUrl} 
            alt="Aarthika Logo Text" 
            className="navbar-text-logo-img h-9 md:h-10"
          /> 
        </Link>
        
        {/* Desktop Menu */}
        <div className="hidden md:flex space-x-8 items-center">
          <NavLink to="home">Home</NavLink>
          <NavLink to="about">About Us</NavLink>
          <NavLink to="services">Services</NavLink>
          <NavLink to="live-rates">Rates</NavLink>
          <NavLink to="partnerships">Partnerships</NavLink>
          <NavLink to="technology">Technology</NavLink>
          <NavLink to="insights">Aarthika Insights</NavLink>
          <Link 
            to="contact" 
            spy={true} 
            smooth={true} 
            offset={NAV_OFFSET} 
            duration={SCROLL_DURATION}
            className="text-white bg-white/10 px-5 py-2 rounded-full hover:bg-white/20 transition-all font-medium cursor-pointer"
          >
            Contact
          </Link>
        </div>
        
        {/* Mobile Menu Button */}
        <div className="md:hidden">
          <button onClick={toggleMenu} className="text-white focus:outline-none bg-white/10 p-2 rounded-lg hover:bg-white/20 transition-colors">
            {isMenuOpen ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>
      
      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden mt-4 bg-gradient-to-r from-aarthikaDark to-aarthikaBlue border-t border-white/10 w-full backdrop-blur-md">
          <div className="container py-4 px-4 md:px-12 lg:px-24 max-w-screen-2xl mx-auto">
            <MobileNavLink to="home" onClick={toggleMenu}>Home</MobileNavLink>
            <MobileNavLink to="about" onClick={toggleMenu}>About Us</MobileNavLink>
            <MobileNavLink to="services" onClick={toggleMenu}>Services</MobileNavLink>
            <MobileNavLink to="live-rates" onClick={toggleMenu}>Rates</MobileNavLink>
            <MobileNavLink to="partnerships" onClick={toggleMenu}>Partnerships</MobileNavLink>
            <MobileNavLink to="technology" onClick={toggleMenu}>Technology</MobileNavLink>
            <MobileNavLink to="insights" onClick={toggleMenu}>Aarthika Insights</MobileNavLink>
            <MobileNavLink to="contact" onClick={toggleMenu}>Contact Us</MobileNavLink>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;