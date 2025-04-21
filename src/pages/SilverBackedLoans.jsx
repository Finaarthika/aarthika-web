import React from 'react';
import { Helmet } from 'react-helmet-async';
import { HashLink } from 'react-router-hash-link';

const SilverBackedLoans = () => {
  // WhatsApp link generation
  const phoneNumber = '6205168541';
  const internationalPhoneNumber = `91${phoneNumber}`;
  const whatsappLink = `https://wa.me/${internationalPhoneNumber}?text=Hello%20Aarthika,%20I%20would%20like%20to%20enquire%20about%20silver-backed%20loans.`;

  return (
    <div className="bg-white py-16 px-4 sm:px-6 lg:px-8">
      <Helmet>
        <title>Silver-Backed Loans in Kishanganj & Uttar Dinajpur | Aarthika</title>
        <meta name="description" content="Get quick cash loans against silver ornaments with Aarthika in Kishanganj (Bihar) and Debiganj, Dharampur (Uttar Dinajpur, WB). Flexible, local, and trusted silver loan services." />
        <meta name="keywords" content="silver loan, chandi loan, Kishanganj, Bihar, Debiganj, Dharampur, Uttar Dinajpur, West Bengal, rural finance, instant cash, silver jewellery loan" />
        <link rel="canonical" href="https://aarthika.com/services/silver-backed-loans" />
      </Helmet>
      
      <div className="max-w-3xl mx-auto">
        {/* Back link */}
        <HashLink smooth to="/#services" className="text-aarthikaBlue hover:text-aarthikaDark inline-flex items-center mb-8 group">
          <svg className="w-5 h-5 mr-2 transition-transform duration-300 group-hover:-translate-x-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd"></path></svg>
          Back to Services
        </HashLink>

        <h1 className="text-3xl md:text-4xl font-bold text-aarthikaDark mb-4">
          Silver-Backed Loans
        </h1>
        <p className="text-lg font-semibold text-aarthikaBlue mb-8">
          Quick loans against your silver ornaments – flexible, local, and trusted
        </p>

        <div className="space-y-10">
          {/* What is a Silver Loan? */}
          <section>
            <h2 className="text-2xl font-semibold text-aarthikaDark mb-3">
              What is a Silver-Backed Loan?
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              A silver-backed loan means you give us your silver jewellery or items as security, and in return, we provide you a cash loan. You can repay the amount within the agreed time and take back your silver.
            </p>
            <p className="text-gray-700 leading-relaxed">
              This is especially useful for small, urgent needs — whether it's for farming, household expenses, medical emergencies, or business use.
            </p>
          </section>

          {/* Why Prefer Us */}
          <section>
            <h2 className="text-2xl font-semibold text-aarthikaDark mb-4">
              Why People Prefer Taking Silver Loans from Us
            </h2>
            <ul className="list-disc list-inside text-gray-700 space-y-2 pl-4 leading-relaxed">
              <li>Loans are disbursed in just 5 to 8 minutes</li>
              <li>Silver is tested and valued transparently in front of you</li>
              <li>We offer fair pricing with clear calculations — no confusion</li>
              <li>Every transaction is recorded with a proper receipt</li>
              <li>We maintain full trust and privacy of your pledged items</li>
              <li>You receive SMS alerts and WhatsApp support after the loan</li>
            </ul>
          </section>

          {/* Interest Rate */}
          <section>
            <h2 className="text-2xl font-semibold text-aarthikaDark mb-3">
              Interest Rate
            </h2>
            <p className="text-gray-700 leading-relaxed">
              The interest on silver loans is between 3% and 4% per month, depending on the weight and purity of silver.
            </p>
            <p className="text-gray-600 mt-2 bg-gray-100 p-3 rounded text-sm">
              <strong>For example:</strong> If you take ₹5,000 against silver, you pay only ₹150 to ₹200 per month as interest.
            </p>
          </section>

          {/* Repayment and Return */}
          <section>
            <h2 className="text-2xl font-semibold text-aarthikaDark mb-3">
              Repayment and Return
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Our silver loans are for up to 12 months, but you can close them anytime earlier. We recommend monthly or quarterly repayments, because:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 pl-4 leading-relaxed">
              <li>It helps us trust you more for future loans</li>
              <li>You may get discounts or offers as a repeat customer</li>
              <li>You stay stress-free and avoid interest piling up</li>
              <li>You do not need to repay the full amount at once. Partial payments are also accepted.</li>
            </ul>
          </section>

          {/* Availability */}
          <section>
            <h2 className="text-2xl font-semibold text-aarthikaDark mb-3">
              Where This Service Is Available
            </h2>
            <p className="text-gray-700 leading-relaxed mb-2">Our silver loan service is currently available in the following regions:</p>
            <ul className="list-disc list-inside text-gray-700 space-y-1 pl-4 leading-relaxed">
              <li>Kishanganj (Bihar)</li>
              <li>Dharampur and Debiganj (Uttar Dinajpur, West Bengal)</li>
              <li>Surrounding villages within these districts</li>
            </ul>
          </section>

          {/* Who can take loan */}
          <section>
            <h2 className="text-2xl font-semibold text-aarthikaDark mb-3">
              Who Can Take This Loan?
            </h2>
            <p className="text-gray-700 leading-relaxed">
              Anyone who has silver and a genuine need can get a loan. We do not ask for salary proof, credit history, or formal documents. We believe in personal trust and honest dealings.
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

export default SilverBackedLoans; 