import React from 'react';

const TechItem = ({ icon, title, description }) => (
  <div className="flex items-start space-x-6 p-6 bg-white rounded-lg border border-gray-100 shadow-sm">
    <div className="text-aarthikaBlue text-3xl mt-1 flex-shrink-0 w-10 text-center">
      {icon}
    </div>
    <div>
      <h4 className="text-lg font-semibold mb-2 text-gray-800">{title}</h4>
      <p className="text-gray-600 text-base leading-relaxed">{description}</p>
    </div>
  </div>
);

const BenefitItem = ({ icon, text }) => (
  <div className="flex items-center space-x-3">
    <div className="text-aarthikaBlue text-xl">
      {icon}
    </div>
    <span className="text-gray-700">{text}</span>
  </div>
);

const Technology = () => {
  return (
    <section id="technology" className="py-20 md:py-28 bg-gray-50">
      <div className="premium-container">
        <div className="flex flex-col items-center mb-16">
          <span className="text-sm text-aarthikaBlue font-medium tracking-wider uppercase mb-2">Our Innovation</span>
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-center text-gray-800">Our Technology</h2>
          <div className="w-24 h-1 bg-gradient-to-r from-aarthikaDark to-aarthikaBlue rounded-full"></div>
          <p className="text-center text-gray-600 max-w-3xl mx-auto mt-6 text-base md:text-lg">
            We're building technology to simplify and secure financial processes, tailored for the unique needs of rural India.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-10 mb-16">
          <TechItem 
            icon={<i className="fas fa-mobile-alt"></i>}
            title="Aarthika App"
            description="Our flagship gold/silver loan management app simplifies the entire loan lifecycle — from disbursement and tracking to receipts, top-ups, and closures."
          />
          <TechItem 
            icon={<i className="fas fa-user-shield"></i>} 
            title="AarCred App"
            description="Our upcoming facial-recognition and credit-risk app instantly retrieves customer repayment history, helping field agents reduce fraud and lending risk."
          />
        </div>

        <div className="text-center mb-12">
          <h3 className="text-2xl font-semibold text-gray-800 mb-8">Benefits of Our Tech</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
            <BenefitItem icon={<i className="fas fa-times-circle"></i>} text="Reduce Human Error" />
            <BenefitItem icon={<i className="fas fa-stopwatch"></i>} text="Improve Turnaround Time" />
            <BenefitItem icon={<i className="fas fa-handshake"></i>} text="Increase Customer Trust" />
            <BenefitItem icon={<i className="fas fa-history"></i>} text="Verifiable Histories" />
          </div>
        </div>

        <p className="text-center text-gray-700 italic max-w-3xl mx-auto">
          "We are committed to simplifying complex financial processes using clean tech design and rural-first engineering. More innovations are on the way."
        </p>

      </div>
    </section>
  );
};

export default Technology; 