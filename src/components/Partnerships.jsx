import React from 'react';

const PartnerCard = ({ name, type, description, icon, index }) => {
  const delay = index * 100;
  
  return (
    <div 
      className="premium-card p-8 hover-lift border border-gray-100 rounded-lg shadow-sm hover:shadow-md transition-all duration-300 flex flex-col items-center text-center animate-fade-in"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="text-aarthikaBlue text-4xl mb-5 w-16 h-16 rounded-full bg-aarthikaBlue/10 flex items-center justify-center">
        {icon}
      </div>
      <h3 className="text-xl font-semibold mb-3 text-gray-800">{name}</h3>
      <span className="inline-block px-3 py-1 bg-gray-100 text-aarthikaBlue text-xs font-medium rounded-full mb-4">
        {type}
      </span>
      <p className="text-gray-600 text-base leading-relaxed flex-grow">{description}</p>
    </div>
  );
};

const Partnerships = () => {
  const partners = [
    {
      name: "High Net Worth Individuals",
      type: "Investment & Vision Partners",
      description: "Collaborating with HNIs who share our vision for empowering rural India through impactful, community-focused investments.",
      icon: <i className="fas fa-user-tie"></i>
    },
    {
      name: "NBFCs & Banks",
      type: "Financial Collaboration",
      description: "Actively engaging with established NBFCs and banks to explore synergistic partnerships that enhance financial inclusion in underserved rural markets.",
      icon: <i className="fas fa-landmark"></i>
    },
    {
      name: "Jewellers Associations",
      type: "Valuation & Trust Partners",
      description: "Partnering with local jewellers associations to ensure fair valuation practices and build trust within the communities we serve.",
      icon: <i className="fas fa-gem"></i>
    },
    {
      name: "Rural Cooperatives",
      type: "Community Network",
      description: "Building relationships with rural cooperatives to extend our reach and better understand the unique financial needs at the grassroots level.",
      icon: <i className="fas fa-users"></i>
    }
  ];

  return (
    <section id="partnerships" className="py-20 md:py-28 bg-white">
      <div className="premium-container">
        <div className="flex flex-col items-center mb-16">
          <span className="text-sm text-aarthikaBlue font-medium tracking-wider uppercase mb-2">Our Collaborations</span>
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-center text-gray-800">Strategic Partnerships</h2>
          <div className="w-24 h-1 bg-gradient-to-r from-aarthikaDark to-aarthikaBlue rounded-full"></div>
        </div>
        
        <p className="text-center text-gray-600 max-w-3xl mx-auto mb-16 text-base md:text-lg">
          At Aarthika, we believe in the power of collaboration. Our strategic partnerships help us deliver better services to our clients and extend our reach.
        </p>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {partners.map((partner, index) => (
            <PartnerCard
              key={index}
              index={index}
              name={partner.name}
              type={partner.type}
              icon={partner.icon}
              description={partner.description}
            />
          ))}
        </div>
        
        <div className="mt-20 md:mt-24 text-center bg-gray-50 rounded-xl p-10 border border-gray-200">
          <h3 className="text-2xl font-semibold mb-4 text-gray-800">Become a Partner</h3>
          <p className="text-center mb-8 text-gray-600 text-base md:text-lg max-w-2xl mx-auto">
            We're always open to forming new strategic partnerships that can help us extend our impact and bring financial solutions to more communities.
          </p>
          <div className="text-center mt-12 md:mt-16">
            <a
              href="#contact"
              className="btn btn-primary inline-block text-lg px-8 py-3"
            >
              Partner with us
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Partnerships; 