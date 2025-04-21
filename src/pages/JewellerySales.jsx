import React from 'react';
import { Helmet } from 'react-helmet-async';
import { HashLink } from 'react-router-hash-link';

const JewellerySales = () => {
  // WhatsApp link generation
  const phoneNumber = '6205168541';
  const internationalPhoneNumber = `91${phoneNumber}`;
  const whatsappLink = `https://wa.me/${internationalPhoneNumber}?text=Hello%20Aarthika,%20I%20would%20like%20to%20enquire%20about%20buying%20jewellery.`;

  return (
    <div className="bg-white py-16 px-4 sm:px-6 lg:px-8">
      <Helmet>
        <title>Gold & Silver Jewellery Sales in Kishanganj & Uttar Dinajpur | Aarthika</title>
        <meta name="description" content="Buy pure gold and silver jewellery with transparent pricing and billing at Aarthika in Kishanganj (Bihar) and Debiganj, Dharampur (Uttar Dinajpur, WB). Ideal for rural families." />
        <meta name="keywords" content="buy gold jewellery, buy silver jewellery, Kishanganj, Bihar, Debiganj, Dharampur, Uttar Dinajpur, West Bengal, rural jewellery, transparent pricing, jewellery sales" />
        <link rel="canonical" href="https://aarthika.com/services/jewellery-sales" />
      </Helmet>
      
      <div className="max-w-3xl mx-auto">
        {/* Back link */}
        <HashLink smooth to="/#services" className="text-aarthikaBlue hover:text-aarthikaDark inline-flex items-center mb-8 group">
          <svg className="w-5 h-5 mr-2 transition-transform duration-300 group-hover:-translate-x-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd"></path></svg>
          Back to Services
        </HashLink>

        <h1 className="text-3xl md:text-4xl font-bold text-aarthikaDark mb-4">
          Jewellery Sales – Gold & Silver
        </h1>
        <p className="text-lg font-semibold text-aarthikaBlue mb-8">
          Pure ornaments, full billing, and future-ready support
        </p>

        <section className="mb-10">
          <h2 className="text-2xl font-semibold text-aarthikaDark mb-3">
            Why Buy Jewellery from Aarthika?
          </h2>
          <p className="text-gray-700 leading-relaxed">
            When you buy gold or silver jewellery from Aarthika, you're not just buying ornaments — you're buying peace of mind, transparency, and long-term trust.
          </p>
          <p className="text-gray-700 leading-relaxed mt-4">
            Here's what makes it different:
          </p>
        </section>

        <div className="space-y-10">
          {/* Feature 1 */}
          <section>
            <h3 className="text-xl font-semibold text-aarthikaDark mb-3">
              1. Full Purity Disclosure
            </h3>
            <p className="text-gray-700 leading-relaxed mb-3">Every ornament you buy comes with:</p>
            <ul className="list-disc list-inside text-gray-700 space-y-1 pl-4 leading-relaxed">
              <li>Clearly mentioned purity (e.g., 22K gold or 92.5% silver)</li>
              <li>Transparent pricing based on daily market rates</li>
              <li>Weight and rate shown on the bill — no hidden charges</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-3">
              So you always know exactly what you're paying for.
            </p>
          </section>

          {/* Feature 2 */}
          <section>
            <h3 className="text-xl font-semibold text-aarthikaDark mb-3">
              2. Proper Printed Bill With Recordkeeping
            </h3>
            <p className="text-gray-700 leading-relaxed mb-3">You get a printed invoice with:</p>
            <ul className="list-disc list-inside text-gray-700 space-y-1 pl-4 leading-relaxed">
              <li>Customer name</li>
              <li>Metal type and purity</li>
              <li>Weight and amount paid</li>
              <li>Purchase date and branch name</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-3">
              This bill is saved securely in our system. Even if you lose the bill, we can retrieve it. Your purchase is always traceable and protected.
            </p>
          </section>

          {/* Feature 3 */}
          <section>
            <h3 className="text-xl font-semibold text-aarthikaDark mb-3">
              3. Future Loan Advantage: No Purity Check Required
            </h3>
            <p className="text-gray-700 leading-relaxed mb-3">If you ever need a loan in future against the jewellery bought from Aarthika:</p>
            <ul className="list-disc list-inside text-gray-700 space-y-1 pl-4 leading-relaxed">
              <li>We do not re-check purity or weight</li>
              <li>We immediately approve the loan</li>
              <li>You get up to 75% LTV (Loan to Value)</li>
              <li>Disbursal in just 5 to 8 minutes</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-3">
              This gives you faster access to cash without any delay.
            </p>
          </section>

          {/* Feature 4 */}
          <section>
            <h3 className="text-xl font-semibold text-aarthikaDark mb-3">
              4. Fair Pricing for Rural Families
            </h3>
            <p className="text-gray-700 leading-relaxed mb-3">We do not overprice designs. Our margins are minimal so that rural customers can afford pure and elegant jewellery for:</p>
            <ul className="list-disc list-inside text-gray-700 space-y-1 pl-4 leading-relaxed">
              <li>Daily use</li>
              <li>Gifting</li>
              <li>Weddings and festivals</li>
              <li>Savings and asset building</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-3">
              Our jewellery is simple, clean, and meant for real-life use — not showroom display.
            </p>
          </section>

          {/* Feature 5 */}
          <section>
            <h3 className="text-xl font-semibold text-aarthikaDark mb-3">
              5. Lifetime Support & Exchange
            </h3>
            <p className="text-gray-700 leading-relaxed">
              If you want to upgrade or exchange the jewellery in future, we're here. Because your bill is recorded with us, you don't have to worry about remembering rates or purity — we already have it.
            </p>
          </section>

          {/* Ideal For */}
          <section>
            <h2 className="text-2xl font-semibold text-aarthikaDark mb-3">
              Ideal For
            </h2>
            <ul className="list-disc list-inside text-gray-700 space-y-1 pl-4 leading-relaxed">
              <li>Farmers and families saving through silver</li>
              <li>Women building emergency gold assets</li>
              <li>Young people starting their first gold purchase</li>
              <li>Anyone who prefers transparency and respect in buying</li>
            </ul>
          </section>

          {/* Locations */}
          <section>
            <h2 className="text-2xl font-semibold text-aarthikaDark mb-3">
              Available Locations
            </h2>
            <p className="text-gray-700 leading-relaxed mb-2">You can buy gold and silver jewellery from Aarthika in:</p>
            <ul className="list-disc list-inside text-gray-700 space-y-1 pl-4 leading-relaxed">
              <li>Kishanganj (Bihar)</li>
              <li>Debiganj and Dharampur (Uttar Dinajpur, West Bengal)</li>
              <li>Nearby villages (delivery and pickup options available)</li>
            </ul>
          </section>

           {/* Final Word */}
          <section>
            <h2 className="text-2xl font-semibold text-aarthikaDark mb-3">
              Final Word
            </h2>
            <p className="text-gray-700 leading-relaxed italic">
              Buying jewellery is not just about design. It's about trust, future readiness, and long-term value. Aarthika gives you all three — in simple language, at a fair price, with a proper system.
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

export default JewellerySales; 