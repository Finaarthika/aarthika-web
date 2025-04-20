import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, useLocation, useNavigationType } from 'react-router-dom'
import Navbar from './components/Navbar'
import Hero from './components/Hero'
import LiveMetalRates from './components/LiveMetalRates'
import Services from './components/Services'
import About from './components/About'
import Partnerships from './components/Partnerships'
import Technology from './components/Technology'
import Insights from './components/Insights'
import FAQ from './components/FAQ'
import PresenceMap from './components/PresenceMap'
import Footer from './components/Footer'
import LogoDemo from './components/LogoDemo'
import PrivacyPolicy from './components/PrivacyPolicy'
import TermsOfService from './components/TermsOfService'
import JoinAarthika from './components/JoinAarthika'
import GoldLoansRuralIndia from './pages/blog/GoldLoansRuralIndia'
import WhyWeBuiltAarthika from './pages/blog/WhyWeBuiltAarthika'
import WhyInterestRates from './pages/blog/WhyInterestRates'
import TrustAndTime from './pages/blog/TrustAndTime'
import './App.css'

// Restore original ScrollToTop
function ScrollToTop() {
  const { pathname } = useLocation();
  const navigationType = useNavigationType();

  useEffect(() => {
    if (navigationType !== 'POP') {
      window.scrollTo(0, 0);
    }
  }, [pathname, navigationType]);

  return null;
}

// Restore original MainLayout (remove location hook and useEffect)
function MainLayout({ toggleJoinForm }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <div className="min-h-screen w-full flex flex-col bg-white">
      <Navbar isMenuOpen={isMenuOpen} toggleMenu={toggleMenu} />
      <main className="flex-grow w-full pt-16 md:pt-20">
        <Hero />
        <LiveMetalRates />
        <About />
        <Services />
        <Partnerships />
        <Technology />
        <Insights />
        <FAQ />
        <PresenceMap />
      </main>
      <Footer toggleJoinForm={toggleJoinForm} />
    </div>
  );
}

function App() {
  const [isJoinFormVisible, setIsJoinFormVisible] = useState(false);

  const toggleJoinForm = () => {
    setIsJoinFormVisible(prev => !prev);
  };

  return (
    <Router>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<MainLayout toggleJoinForm={toggleJoinForm} />} />
        <Route path="/logo-demo" element={<LogoDemo />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/terms-of-service" element={<TermsOfService />} />
        <Route path="/blog/gold-loans-rural-india" element={<GoldLoansRuralIndia />} />
        <Route path="/blog/why-we-built-aarthika" element={<WhyWeBuiltAarthika />} />
        <Route path="/blog/why-interest-rates" element={<WhyInterestRates />} />
        <Route path="/blog/trust-and-time" element={<TrustAndTime />} />
      </Routes>
      {isJoinFormVisible && <JoinAarthika onClose={toggleJoinForm} />}
    </Router>
  );
}

export default App
