import React from 'react';
import { Helmet } from 'react-helmet-async';
// import { Link } from 'react-router-dom'; // Removed
import { HashLink } from 'react-router-hash-link'; // Added

const WhyInterestRates = () => {
  return (
    <div className="bg-white py-16 px-4 sm:px-6 lg:px-8">
      <Helmet>
        <title>Why Our Interest Rates Are 3-4% in Rural Bihar & West Bengal | Aarthika</title>
        <meta name="description" content="Understanding Aarthika's interest rates for gold loans in Kishanganj and Uttar Dinajpur. Learn why our rates are fair, transparent and designed specifically for rural communities in Bihar and West Bengal." />
        <meta name="keywords" content="interest rates, rural finance, Kishanganj, Bihar, Uttar Dinajpur, West Bengal, gold loans, transparent pricing, rural banking" />
        <link rel="canonical" href="https://aarthika.com/blog/why-interest-rates" />
      </Helmet>
      
      <div className="max-w-3xl mx-auto">
        {/* Use HashLink with smooth prop */}
        <HashLink smooth to="/#insights" className="text-aarthikaBlue hover:text-aarthikaDark inline-flex items-center mb-8">
          <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd"></path></svg>
          Back to Insights
        </HashLink>

        <h1 className="text-3xl md:text-4xl font-bold text-aarthikaDark mb-6">
          Why 3% to 4% Interest?
        </h1>
        <p className="text-lg text-gray-700 mb-8 leading-relaxed">
          Our customers often ask why we charge 3-4% interest when a typical bank would charge much less. It's a fair question. Here's an honest look at what shapes our pricing model in the rural areas of Kishanganj and Uttar Dinajpur:
        </p>

        {/* Sections */}
        <div className="space-y-10">
          <div>
            <h2 className="text-2xl font-semibold text-aarthikaDark mb-3">
              1. Our Customers Don't Have a CIBIL Score, They Have Trust
            </h2>
            <p className="text-gray-600 leading-relaxed">
              In many parts of rural Bihar and Bengal, access to formal credit is still a dream. Most of our customers don't have bank passbooks, let alone a credit score. They rely on people — not portals.
            </p>
            <p className="text-gray-600 leading-relaxed mt-4">
              In such settings, gold and silver become their credit card, and trust becomes the underwriting tool. But to make this trust-based system work securely, our business has to bear some invisible costs.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold text-aarthikaDark mb-3">
              2. It's Not Just Loan Money—It's Security
            </h2>
            <p className="text-gray-600 leading-relaxed">
              When you deposit your gold with us, our responsibility goes beyond just advancing cash. We:
            </p>
            <ul className="list-disc list-inside text-gray-600 space-y-2 pl-4 mt-4 leading-relaxed">
              <li>Install 24-hour security systems at our vaults</li>
              <li>Pay for double-authentication systems</li>
              <li>Do regular inventory audits</li>
              <li>Invest in fireproof, secure storage</li>
              <li>Maintain insurance premiums on stored collateral</li>
              <li>Use physical verification technologies to ensure authenticity</li>
            </ul>
          </div>

          <div>
            <h2 className="text-2xl font-semibold text-aarthikaDark mb-3">
              3. We Are Not "Loan Sharks." We're Building a Viable Alternative.
            </h2>
            <p className="text-gray-600 leading-relaxed">
              Regular pawnbrokers in our areas charge between 8% to 12% monthly—yes, monthly! That's 96% to 144% per year. We charge 3-4% per month, a third of the local average.
            </p>
            <p className="text-gray-600 leading-relaxed mt-4">
              But maintaining this competitive rate requires us to:
            </p>
            <ul className="list-disc list-inside text-gray-600 space-y-2 pl-4 mt-4 leading-relaxed">
              <li>Operate with tight margins</li>
              <li>Spend on staff who understand rural needs</li>
              <li>Maintain technology systems for accurate accounting</li>
              <li>Provide same-day service (unlike banks with lengthy loan processing times)</li>
            </ul>
          </div>

          <div>
            <h2 className="text-2xl font-semibold text-aarthikaDark mb-3">
              4. Our Model is Local. And That's Our Strength.
            </h2>
            <p className="text-gray-600 leading-relaxed">
              We are from here. We live here. We understand rural seasonalities — harvesting cycles, festival cash needs, crop failures — better than any corporate office in a metro city ever could.
            </p>
             <p className="text-gray-600 leading-relaxed mt-4">
               This proximity allows us to be flexible, responsive, and deeply human in our lending decisions. But again, this local model needs sustainability.
            </p>
            <p className="text-gray-600 leading-relaxed mt-4">
              To stay resilient — even during low seasons — we need to earn enough to protect our customers' gold, our staff's salaries, and the credibility of our brand.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold text-aarthikaDark mb-3">
              5. Here's How We Actually Keep It Fair
            </h2>
            <p className="text-gray-600 leading-relaxed">
              While our rate is 3-4%, the way we calculate it is designed for fairness:
            </p>
            <ul className="list-disc list-inside text-gray-600 space-y-2 pl-4 mt-4 leading-relaxed">
              <li>We only charge for days the loan is active (unlike others who round up to whole months)</li>
              <li>We offer early repayment discounts</li>
              <li>We provide a 3-day grace period for most customers</li>
              <li>Zero hidden charges—ever</li>
              <li>Transparent LTV (loan-to-value) calculations that you can verify</li>
              <li>No compounding of interest</li>
            </ul>
          </div>
        </div>

        {/* Conclusion */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <h2 className="text-2xl font-semibold text-aarthikaDark mb-4">
            Moving Forward Together
          </h2>
          <p className="text-lg text-gray-700 mb-4 leading-relaxed">
            Our goal is to eventually reduce rates as our local reputation grows and operational costs stabilize. We've already gone from 4-5% to 3-4% in many cases. This isn't the endpoint—it's part of our journey toward sustainable rural finance.
          </p>
          <p className="text-lg text-gray-700 leading-relaxed italic font-medium">
            Because we believe that dignity in finance starts with transparency about the real costs—and a commitment to building something better, step by step.
          </p>
        </div>
      </div>
    </div>
  );
};

export default WhyInterestRates; 