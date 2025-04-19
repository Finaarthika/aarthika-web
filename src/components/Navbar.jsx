import React, { useState, useEffect } from 'react';
import { Link as ScrollLink } from 'react-scroll';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import logoFull from '../assets/Aarthika (1).png';

const NavLink = ({ to, children, onClick }) => (
  <ScrollLink
    to={to}
    spy={true}
    smooth={true}
    offset={-70} // Adjust offset based on navbar height
    duration={500}
    className="text-white hover:text-aarthikaBlue transition-colors duration-300 cursor-pointer font-medium text-sm md:text-base"
    onClick={onClick}
  >
    {children}
  </ScrollLink>
);

const Navbar = ({ isMenuOpen, toggleMenu }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const location = useLocation();
  const isHomePage = location.pathname === '/';

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
    { to: 'home', label: 'Home' },
    { to: 'about', label: 'About Us' },
    { to: 'services', label: 'Services' },
    { to: 'partnerships', label: 'Partnerships' },
    { to: 'technology', label: 'Technology' },
    { to: 'contact', label: 'Contact' },
  ];

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? 'bg-aarthikaDark/95 backdrop-blur-lg shadow-lg' : 'bg-transparent'}`}> 
      <div className="premium-container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <div className="flex-shrink-0">
            <RouterLink to="/">
              <img 
                className="h-8 md:h-10 w-auto transition-all duration-300" 
                src={logoFull} 
                alt="Aarthika Logo" 
              />
            </RouterLink>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6 lg:space-x-8">
            {isHomePage ? (
              navItems.map(item => (
                <NavLink key={item.to} to={item.to}>{item.label}</NavLink>
              ))
            ) : (
              <RouterLink to="/" className="text-white hover:text-aarthikaBlue transition-colors duration-300 cursor-pointer font-medium text-sm md:text-base">
                Back to Home
              </RouterLink>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={toggleMenu}
              type="button"
              className="inline-flex items-center justify-center p-2 rounded-md text-white hover:text-aarthikaBlue focus:outline-none focus:ring-2 focus:ring-inset focus:ring-aarthikaBlue transition-colors duration-200"
              aria-controls="mobile-menu"
              aria-expanded={isMenuOpen}
            >
              <span className="sr-only">Open main menu</span>
              {isMenuOpen ? (
                <i className="fas fa-times block h-6 w-6"></i> // Close icon
              ) : (
                <i className="fas fa-bars block h-6 w-6"></i> // Hamburger icon
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <div className={`md:hidden transition-all duration-300 ease-in-out ${isMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`} id="mobile-menu">
        <div className={`px-2 pt-2 pb-3 space-y-1 sm:px-3 ${isScrolled ? 'bg-aarthikaDark/95' : 'bg-aarthikaDark'}`}> 
          {isHomePage ? (
            navItems.map(item => (
              <ScrollLink
                key={item.to}
                to={item.to}
                spy={true}
                smooth={true}
                offset={-60} // Adjust offset for mobile navbar height
                duration={500}
                className="block px-3 py-2 rounded-md text-base font-medium text-white hover:bg-aarthikaBlue/20 transition-colors duration-200 cursor-pointer"
                onClick={toggleMenu} // Close menu on click
              >
                {item.label}
              </ScrollLink>
            ))
          ) : (
            <RouterLink 
              to="/"
              className="block px-3 py-2 rounded-md text-base font-medium text-white hover:bg-aarthikaBlue/20 transition-colors duration-200 cursor-pointer"
              onClick={toggleMenu} // Close menu on click
            >
              Back to Home
            </RouterLink>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;