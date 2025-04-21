import React from 'react';
import { Helmet } from 'react-helmet-async';
import { HashLink } from 'react-router-hash-link';

const OldGoldSilverBuying = () => {
  // WhatsApp link generation
  const phoneNumber = '6205168541';
  const internationalPhoneNumber = `91${phoneNumber}`;
  const whatsappLink = `https://wa.me/${internationalPhoneNumber}?text=Hello%20Aarthika,%20I%20would%20like%20to%20enquire%20about%20selling%20old%20gold/silver.`;

  return (
    <div className="bg-white py-16 px-4 sm:px-6 lg:px-8">
      <Helmet>
        <title>Old Gold & Silver Buying in Kishanganj & Uttar Dinajpur | Aarthika</title>
        <meta name="description" content="Sell your old gold and silver jewellery for instant cash at Aarthika in Kishanganj (Bihar) and Debiganj, Dharampur (Uttar Dinajpur, WB). Fair valuation and transparent process." />
        <meta name="keywords" content="sell gold, sell silver, old jewellery, instant cash, Kishanganj, Bihar, Debiganj, Dharampur, Uttar Dinajpur, West Bengal, gold buying, silver buying" />
        <link rel="canonical" href="https://aarthika.com/services/old-gold-silver-buying" />
      </Helmet>
      
      <div className="max-w-3xl mx-auto">
        {/* Back link */}
        <HashLink smooth to="/#services" className="text-aarthikaBlue hover:text-aarthikaDark inline-flex items-center mb-8 group">
          <svg className="w-5 h-5 mr-2 transition-transform duration-300 group-hover:-translate-x-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd"></path></svg>
          Back to Services
        </HashLink>

        <h1 className="text-3xl md:text-4xl font-bold text-aarthikaDark mb-4">
          Old Gold & Silver Buying
        </h1>
        <p className="text-lg font-semibold text-aarthikaBlue mb-8">
          Instant cash, fair valuation, and full transparency
        </p>

        <section className="mb-10">
          <h2 className="text-2xl font-semibold text-aarthikaDark mb-3">
            Why Sell Old Ornaments to Aarthika?
          </h2>
          <p className="text-gray-700 leading-relaxed mb-2">Sometimes jewellery breaks.</p>
          <p className="text-gray-700 leading-relaxed mb-2">Sometimes it's out of use.</p>
          <p className="text-gray-700 leading-relaxed mb-4">Sometimes people just need cash.</p>
          <p className="text-gray-700 leading-relaxed">
            At Aarthika, we make sure you get the right value for your old gold and silver — without feeling cheated or embarrassed.
          </p>
        </section>

        <div className="space-y-10">
          {/* Feature 1 */}
          <section>
            <h3 className="text-xl font-semibold text-aarthikaDark mb-3">
              1. Transparent Purity Testing
            </h3>
            <p className="text-gray-700 leading-relaxed mb-3">We use basic purity check methods in front of you:</p>
            <ul className="list-none space-y-1 pl-4 text-gray-700 leading-relaxed">
              <li className="flex items-center"><span className="text-aarthikaBlue mr-2">✓</span> No hidden process</li>
              <li className="flex items-center"><span className="text-aarthikaBlue mr-2">✓</span> No confusion</li>
              <li className="flex items-center"><span className="text-aarthikaBlue mr-2">✓</span> No guesswork</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-3">
              You see the test, understand the result, and then decide freely whether to sell or not. There is no pressure.
            </p>
          </section>

          {/* Feature 2 */}
          <section>
            <h3 className="text-xl font-semibold text-aarthikaDark mb-3">
              2. Fair Price Based on Daily Market Rates
            </h3>
            <p className="text-gray-700 leading-relaxed mb-3">We follow the live market rate of gold and silver — same as used in our loans and sales.</p>
            <p className="text-gray-700 leading-relaxed mb-3">You get:</p>
            <ul className="list-disc list-inside text-gray-700 space-y-1 pl-4 leading-relaxed">
              <li>Proper rate based on purity</li>
              <li>Net weight calculation (excluding stones or attachments)</li>
              <li>Cash or UPI transfer — same day</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-3">
              No need to run from shop to shop. No rounding down of your value.
            </p>
          </section>

          {/* Feature 3 */}
          <section>
            <h3 className="text-xl font-semibold text-aarthikaDark mb-3">
              3. Proper Receipt for Every Transaction
            </h3>
            <p className="text-gray-700 leading-relaxed mb-3">Whether you're selling 1 gram or 100 grams — you will get a printed receipt with:</p>
            <ul className="list-disc list-inside text-gray-700 space-y-1 pl-4 leading-relaxed">
              <li>Purity, weight, rate</li>
              <li>Amount paid</li>
              <li>Your name and contact (optional)</li>
              <li>Date and location</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-3">
              Even if you come back later, we'll know the exact details.
            </p>
          </section>

          {/* Feature 4 */}
          <section>
            <h3 className="text-xl font-semibold text-aarthikaDark mb-3">
              4. Trust Over Tricks
            </h3>
            <p className="text-gray-700 leading-relaxed mb-3">We don't use tactics like:</p>
            <ul className="list-disc list-inside text-gray-700 space-y-1 pl-4 leading-relaxed italic">
              <li>"Stone weight kaat diya"</li>
              <li>"Purity kam hai, rate kam milega"</li>
              <li>"Abhi rate down hai, baad mein bechna"</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-3">
              Instead, we explain the process, give the rate clearly, and respect your decision.
            </p>
          </section>

          {/* Feature 5 */}
          <section>
            <h3 className="text-xl font-semibold text-aarthikaDark mb-3">
              5. Buyback / Upgrade Support
            </h3>
            <p className="text-gray-700 leading-relaxed">
              If you sell gold to us and later want to buy jewellery from us — we adjust that value in your purchase. This makes your sale worth more, not less.
            </p>
          </section>
          
          {/* Feature 6 */}
          <section>
            <h3 className="text-xl font-semibold text-aarthikaDark mb-3">
              6. For Emergencies or Planning Ahead
            </h3>
            <p className="text-gray-700 leading-relaxed mb-3">People sell gold and silver when:</p>
            <ul className="list-disc list-inside text-gray-700 space-y-1 pl-4 leading-relaxed">
              <li>Someone is sick</li>
              <li>School fees are due</li>
              <li>Business needs cash</li>
              <li>The item is no longer useful</li>
            </ul>
             <p className="text-gray-700 leading-relaxed mt-3">
              Whatever the reason — you're treated with respect, speed, and confidentiality.
            </p>
          </section>

          {/* Promise */}
          <section>
            <h2 className="text-2xl font-semibold text-aarthikaDark mb-3">
              Our Promise
            </h2>
             <ul className="list-none space-y-2 pl-0">
              <li className="flex items-start">
                <span className="text-green-500 mr-3 text-xl">✅</span> 
                <span className="text-gray-700 leading-relaxed">No melting</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-3 text-xl">✅</span> 
                <span className="text-gray-700 leading-relaxed">No hidden cuts</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-3 text-xl">✅</span> 
                <span className="text-gray-700 leading-relaxed">No pressure to sell</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-3 text-xl">✅</span> 
                <span className="text-gray-700 leading-relaxed">Printed receipt every time</span>
              </li>
            </ul>
          </section>

          {/* Locations */}
          <section>
            <h2 className="text-2xl font-semibold text-aarthikaDark mb-3">
              Available At
            </h2>
            <ul className="list-disc list-inside text-gray-700 space-y-1 pl-4 leading-relaxed">
              <li>Kishanganj (Bihar)</li>
              <li>Dharampur & Debiganj (Uttar Dinajpur, West Bengal)</li>
              <li>Surrounding villages (pickup available in some cases)</li>
            </ul>
          </section>

           {/* Final Word */}
          <section>
            <h2 className="text-2xl font-semibold text-aarthikaDark mb-3">
              Final Word
            </h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              Aarthika buys your old gold and silver with the dignity you deserve.
            </p>
            <p className="text-gray-700 leading-relaxed mb-3 italic">
              We know it's not just metal — it's often emotion, memory, or an asset built over time.
            </p>
            <p className="text-gray-700 leading-relaxed">
              That's why we pay fairly, work clearly, and leave the decision to you.
            </p>
          </section>
        </div>

        {/* Visit or Enquire / CTA */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <h2 className="text-2xl font-semibold text-aarthikaDark mb-4">
            Visit or Enquire
          </h2>
          <p className="text-gray-700 leading-relaxed mb-4">
            If you are unsure or have questions, you can walk into any Aarthika branch, or simply <a href={`tel:+${internationalPhoneNumber}`} className="text-aarthikaBlue font-medium hover:underline">Call us</a> or <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="text-green-600 font-medium hover:underline">WhatsApp Us</a>. We are always ready to help and explain in your local language.
          </p>
        </div>
      </div>
    </div>
  );
};

export default OldGoldSilverBuying; 