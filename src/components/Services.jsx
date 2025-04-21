import React from 'react';
import { Link as RouterLink } from 'react-router-dom';

const ServiceCard = ({ title, description, icon, index, linkTo }) => {
  const delay = index * 100;
  
  const href = linkTo || "tel:+91-6205168541";
  const isInternalLink = href.startsWith('/');
  
  return (
    <div 
      className={`premium-card p-8 hover-lift border border-gray-100 rounded-lg shadow-sm hover:shadow-md transition-all duration-300 flex flex-col items-center text-center animate-fade-in`} 
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="text-aarthikaBlue text-4xl mb-5 w-16 h-16 rounded-full bg-aarthikaBlue/10 flex items-center justify-center">
        {icon}
      </div>
      <h3 className="text-xl font-semibold mb-4 text-gray-800">{title}</h3>
      <p className="text-gray-600 text-base leading-relaxed flex-grow mb-4">{description}</p>
      <div className="mt-auto pt-4">
        {isInternalLink ? (
          <RouterLink to={href} className="text-aarthikaBlue font-medium flex items-center justify-center hover:underline">
            Learn More
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </RouterLink>
        ) : (
          <a href={href} className="text-aarthikaBlue font-medium flex items-center justify-center hover:underline">
            Contact Us
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </a>
        )}
      </div>
    </div>
  );
};

const Services = () => {
  const services = [
    {
      title: "Gold-Backed Loans",
      description: "Get quick and secure loans by pledging your gold. We offer competitive interest rates with transparent valuation and same-day disbursal — no hidden charges.",
      icon: <i className="fas fa-coins"></i>,
      linkTo: "/services/gold-backed-loans"
    },
    {
      title: "Silver-Backed Loans",
      description: "We provide short-term loans against silver ornaments with fair pricing and full security. Ideal for urgent personal or business needs in rural communities.",
      icon: <i className="fas fa-medal"></i>
    },
    {
      title: "Jewellery Sales – Gold & Silver",
      description: "Explore a curated collection of newly crafted gold and silver jewellery. Elegant designs for daily use and occasions — made affordable for rural families.",
      icon: <i className="fas fa-gem"></i>
    },
    {
      title: "Old Gold & Silver Buying",
      description: "We also buy old gold and silver ornaments. Transparent weight testing, fair market pricing, and instant cash payout — no middlemen, no confusion.",
      icon: <i className="fas fa-balance-scale"></i>
    }
  ];

  return (
    <section id="services" className="py-20 md:py-28 bg-gray-50">
      <div className="premium-container">
        <div className="flex flex-col items-center mb-16">
          <span className="text-sm text-aarthikaBlue font-medium tracking-wider uppercase mb-2">What We Offer</span>
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-center text-gray-800">Our Services</h2>
          <div className="w-24 h-1 bg-gradient-to-r from-aarthikaDark to-aarthikaBlue rounded-full"></div>
          <p className="text-center text-gray-600 max-w-2xl mt-6">
            We provide tailored financial solutions that meet the unique needs of rural communities.
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {services.map((service, index) => (
            <ServiceCard
              key={index}
              index={index}
              title={service.title}
              description={service.description}
              icon={service.icon}
              linkTo={service.linkTo}
            />
          ))}
        </div>
        
        <div className="mt-16 md:mt-20 text-center">
          <a 
            href="tel:+91-6205168541" 
            className="btn btn-primary shadow-lg px-10 py-3 text-base"
          >
            Enquire About Our Services
          </a>
        </div>
      </div>
    </section>
  );
};

export default Services; 