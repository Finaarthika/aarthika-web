import React from 'react';

// Example partner logos (replace with actual paths or imports)
import partnerLogo1 from '../assets/partner-placeholder-1.png';
import partnerLogo2 from '../assets/partner-placeholder-2.png';
import partnerLogo3 from '../assets/partner-placeholder-3.png';
import partnerLogo4 from '../assets/partner-placeholder-4.png';
import partnerLogo5 from '../assets/partner-placeholder-5.png';
import partnerLogo6 from '../assets/partner-placeholder-6.png';

const PartnerLogo = ({ src, alt }) => (
  <div className="flex justify-center items-center p-4 h-20 md:h-24 grayscale opacity-60 hover:grayscale-0 hover:opacity-100 transition-all duration-300 ease-in-out">
    <img src={src} alt={alt} className="max-h-full max-w-full object-contain" />
  </div>
);

const Partnerships = () => {
  const partners = [
    { src: partnerLogo1, alt: 'Partner 1 Logo' },
    { src: partnerLogo2, alt: 'Partner 2 Logo' },
    { src: partnerLogo3, alt: 'Partner 3 Logo' },
    { src: partnerLogo4, alt: 'Partner 4 Logo' },
    { src: partnerLogo5, alt: 'Partner 5 Logo' },
    { src: partnerLogo6, alt: 'Partner 6 Logo' },
    // Add more partners as needed
  ];

  return (
    <section id="partnerships" className="py-16 md:py-24 bg-white">
      <div className="premium-container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 md:mb-16">
          <span className="text-sm font-medium text-aarthikaBlue tracking-wider uppercase mb-2 block">Our Partners</span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-800">Trusted Collaborations</h2>
           <div className="mt-4 w-24 h-1 bg-gradient-to-r from-aarthikaDark to-aarthikaBlue rounded-full mx-auto opacity-80"></div>
           <p className="text-base md:text-lg text-gray-600 max-w-2xl mx-auto mt-6 leading-relaxed">
             We collaborate with leading organizations and financial institutions to enhance our services and reach within rural communities.
           </p>
        </div>

        {/* Partner Logos Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 md:gap-6 lg:gap-8">
          {partners.map((partner, index) => (
             <PartnerLogo key={index} src={partner.src} alt={partner.alt} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default Partnerships; 