import React from 'react';

const ServiceCard = ({ icon, title, description }) => (
  <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 border border-gray-100 h-full flex flex-col">
    <div className="mb-4">
      <i className={`${icon} text-3xl text-aarthikaBlue`}></i>
    </div>
    <h3 className="text-xl font-semibold text-gray-800 mb-2">{title}</h3>
    <p className="text-gray-600 text-base leading-relaxed flex-grow">{description}</p>
  </div>
);

const Services = () => {
  const servicesData = [
    {
      icon: 'fas fa-coins', // Font Awesome class
      title: 'Gold Loans',
      description: 'Unlock the value of your gold ornaments with our quick, transparent, and secure loan process. Competitive rates and flexible repayment options.'
    },
    {
      icon: 'fas fa-ring', // Font Awesome class for silver (example)
      title: 'Silver Loans',
      description: 'Leverage your silver articles and jewelry for immediate financial needs. Fair valuation and straightforward terms.'
    },
    {
      icon: 'fas fa-shield-alt', // Font Awesome class
      title: 'Secure Storage',
      description: 'Your pledged assets are kept safe in state-of-the-art vaults with comprehensive insurance coverage for complete peace of mind.'
    },
    {
      icon: 'fas fa-calculator', // Font Awesome class
      title: 'Transparent Valuation',
      description: 'We use certified methods and modern technology for accurate and fair assessment of your precious metals.'
    },
     {
      icon: 'fas fa-hand-holding-usd', // Font Awesome class
      title: 'Flexible Repayment',
      description: 'Choose from various repayment schedules designed to fit your financial situation, including interest-only options.'
    },
     {
      icon: 'fas fa-headset', // Font Awesome class
      title: 'Dedicated Support',
      description: 'Our local team is always available to assist you with any queries or support throughout your loan tenure.'
    },
  ];

  return (
    <section id="services" className="py-16 md:py-24 bg-gradient-to-b from-white to-gray-50">
      <div className="premium-container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 md:mb-16">
           <span className="text-sm font-medium text-aarthikaBlue tracking-wider uppercase mb-2 block">Our Services</span>
           <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-800">What We Offer</h2>
           <div className="mt-4 w-24 h-1 bg-gradient-to-r from-aarthikaDark to-aarthikaBlue rounded-full mx-auto opacity-80"></div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {servicesData.map((service, index) => (
            <div key={index} className="animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
                <ServiceCard 
                    icon={service.icon}
                    title={service.title}
                    description={service.description}
                />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Services; 