import React from 'react';
import { Helmet } from 'react-helmet-async';
import { HashLink } from 'react-router-hash-link'; // For smooth scrolling back

const GoldBackedLoans = () => {
  return (
    <div className="bg-white py-16 px-4 sm:px-6 lg:px-8">
      <Helmet>
        <title>Gold-Backed Loans in Kishanganj & Uttar Dinajpur | Aarthika</title>
        <meta name="description" content="Get instant cash with Aarthika's secure gold-backed loans in Kishanganj (Bihar) and Debiganj, Dharampur (Uttar Dinajpur, WB). Safe, simple, and fast process." />
        <meta name="keywords" content="gold loan, sona loan, Kishanganj, Bihar, Debiganj, Dharampur, Uttar Dinajpur, West Bengal, rural finance, instant cash, secure loan" />
        <link rel="canonical" href="https://aarthika.com/services/gold-backed-loans" />
      </Helmet>
      
      <div className="max-w-3xl mx-auto">
        {/* Back link */}
        <HashLink smooth to="/#services" className="text-aarthikaBlue hover:text-aarthikaDark inline-flex items-center mb-8 group">
          <svg className="w-5 h-5 mr-2 transition-transform duration-300 group-hover:-translate-x-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd"></path></svg>
          Back to Services
        </HashLink>

        <h1 className="text-3xl md:text-4xl font-bold text-aarthikaDark mb-4">
          Gold-Backed Loans
        </h1>
        <p className="text-lg font-semibold text-aarthikaBlue mb-8">
          Sona Girvi Karke Turant Loan – Safe, Simple & Fast
        </p>

        <div className="space-y-10">
          {/* What is a Gold Loan? */}
          <section>
            <h2 className="text-2xl font-semibold text-aarthikaDark mb-3">
              What Is a Gold-Backed Loan?
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              In a gold-backed loan, you pledge your gold jewellery (like bangles, chains, rings) and receive cash immediately — no paperwork, no credit score checks.
            </p>
            <p className="text-gray-700 leading-relaxed">
              We keep your gold safe and return it as soon as you repay the loan.
            </p>
          </section>

          {/* Why Trust Aarthika */}
          <section>
            <h2 className="text-2xl font-semibold text-aarthikaDark mb-4">
              Why People Trust Aarthika
            </h2>
            <ul className="list-none space-y-3 pl-0">
              <li className="flex items-start">
                <span className="text-green-500 mr-3 text-xl">✅</span> 
                <span className="text-gray-700 leading-relaxed">Cash in 5–8 minutes – Faster than any other method</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-3 text-xl">🔒</span> 
                <span className="text-gray-700 leading-relaxed">Gold stored securely with proper sealing and record</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-3 text-xl">📄</span> 
                <span className="text-gray-700 leading-relaxed">Printed receipt and SMS alerts – For every transaction</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-3 text-xl">❌</span> 
                <span className="text-gray-700 leading-relaxed">No hidden fees – Everything is clear from the start</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-3 text-xl">📱</span> 
                <span className="text-gray-700 leading-relaxed">Support via WhatsApp – Get reminders and help anytime</span>
              </li>
            </ul>
          </section>

          {/* Interest Rate */}
          <section>
            <h2 className="text-2xl font-semibold text-aarthikaDark mb-3">
              Interest Rate
            </h2>
            <p className="text-gray-700 leading-relaxed">
              Only 3% to 4% per month, based on gold weight and purity.
            </p>
            <p className="text-gray-600 mt-2 bg-gray-100 p-3 rounded text-sm">
              <strong>Example:</strong> If you take ₹10,000 loan on gold, you pay ₹300–₹400 interest monthly.
            </p>
          </section>

          {/* Repayment */}
          <section>
            <h2 className="text-2xl font-semibold text-aarthikaDark mb-3">
              Repayment Made Easy
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              We encourage customers to repay monthly or quarterly — this builds a strong repayment history, which gives you:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 pl-4 leading-relaxed">
              <li>Higher chances of getting bigger loans in future</li>
              <li>Priority support during emergency needs</li>
              <li>Discounted rates for repeat customers</li>
            </ul>
          </section>

          {/* Process */}
          <section>
            <h2 className="text-2xl font-semibold text-aarthikaDark mb-3">
              Our Process
            </h2>
            <ol className="list-decimal list-inside text-gray-700 space-y-2 pl-4 leading-relaxed">
              <li>Bring your gold to our centre</li>
              <li>We check purity and value it in front of you</li>
              <li>You choose how much you want to borrow</li>
              <li>We hand you the cash within 5–8 minutes</li>
              <li>You repay monthly or anytime in 12 months to get your gold back</li>
            </ol>
          </section>

          {/* Locations */}
          <section>
            <h2 className="text-2xl font-semibold text-aarthikaDark mb-3">
              Where We Offer Gold Loans
            </h2>
            <ul className="list-disc list-inside text-gray-700 space-y-1 pl-4 leading-relaxed">
              <li>Kishanganj (Bihar)</li>
              <li>Dharampur & Debiganj (Uttar Dinajpur, West Bengal)</li>
              <li>And many nearby villages</li>
            </ul>
          </section>
        </div>

        {/* Conclusion / CTA */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <h2 className="text-2xl font-semibold text-aarthikaDark mb-4">
            Still Have Questions?
          </h2>
          <p className="text-gray-700 leading-relaxed mb-4">
            Visit your nearest Aarthika branch or send us a message on WhatsApp. We're happy to explain everything in simple terms.
          </p>
          <p className="text-gray-700 leading-relaxed">
            Or you can <a href="tel:+91-6205168541" className="text-aarthikaBlue font-medium hover:underline">Call us</a>.
          </p>
        </div>
      </div>
    </div>
  );
};

export default GoldBackedLoans; 