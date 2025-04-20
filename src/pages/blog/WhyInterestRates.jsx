import React from 'react';
import { Link } from 'react-router-dom';

const WhyInterestRates = () => {
  return (
    <div className="bg-white py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Optional Back Button */}
        <Link to="/#insights" className="text-aarthikaBlue hover:text-aarthikaDark inline-flex items-center mb-8">
          <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd"></path></svg>
          Back to Insights
        </Link>

        <h1 className="text-3xl md:text-4xl font-bold text-aarthikaDark mb-6">
          Why 3% to 4% Interest? A Thoughtful Look Behind the Numbers
        </h1>
        <p className="text-lg text-gray-700 mb-6 leading-relaxed">
          When people hear that Aarthika charges 3% to 4% interest per month on gold and silver-backed loans, some raise eyebrows. "Isn't that a bit high?" they ask. We understand the concern. But behind every rate lies a story — a rural reality that urban spreadsheets often ignore.
        </p>
        <p className="text-lg text-gray-700 mb-8 leading-relaxed italic">
          Let's take a moment to explain kyun yeh zaruri hai — and why our rates are not just justified, but fair, thoughtful, and necessary.
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
              2. No Banks. No Branches. Just Aarthika
            </h2>
            <p className="text-gray-600 leading-relaxed">
              We don't have the luxury of large bank teams or nationwide infrastructure. At Aarthika, we built everything from scratch — from our own app to customer onboarding to credit risk assessments.
            </p>
            <p className="text-gray-600 leading-relaxed mt-4">
              Unlike banks, which manage risk with paperwork and delay, we manage it with speed, personalization, and empathy. That has a cost — not just in technology and manpower, but in risk-bearing.
            </p>
             <p className="text-gray-600 leading-relaxed mt-4">
              A borrower might pledge a silver chain at 85% LTV and not return for months. Losses, delays, and operational costs — they all add up.
            </p>
             <p className="text-gray-600 leading-relaxed mt-4">
              Unlike banks or big NBFCs, Aarthika doesn't operate from air-conditioned offices. We operate from the ground — among the people.
            </p>
             <p className="text-gray-600 leading-relaxed mt-4">
               The 3% to 4% interest helps us sustain this ecosystem without charging any processing fees, legal charges, or hidden commissions.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold text-aarthikaDark mb-3">
              3. No Hidden Fees. No Penalties. Just Simplicity.
            </h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              Compare a rural borrower's experience with us to any institutional lender:
            </p>
            {/* Simple Table or comparison list could go here */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 border border-gray-200 rounded-lg">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Factor</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aarthika</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Typical NBFC/Bank</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200 text-sm text-gray-700">
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap font-medium">Documentation</td>
                    <td className="px-6 py-4 whitespace-nowrap">Bare minimum</td>
                    <td className="px-6 py-4 whitespace-nowrap">Lengthy</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap font-medium">Loan disbursal time</td>
                    <td className="px-6 py-4 whitespace-nowrap">Within minutes</td>
                    <td className="px-6 py-4 whitespace-nowrap">Days or weeks</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap font-medium">Relationship</td>
                    <td className="px-6 py-4 whitespace-nowrap">Personal + Face-to-Face</td>
                    <td className="px-6 py-4 whitespace-nowrap">Distant + Bureaucratic</td>
                  </tr>
                   <tr>
                    <td className="px-6 py-4 whitespace-nowrap font-medium">Closure process</td>
                    <td className="px-6 py-4 whitespace-nowrap">Transparent, fast, automated</td>
                    <td className="px-6 py-4 whitespace-nowrap">Often delayed or confusing</td>
                  </tr>
                   <tr>
                    <td className="px-6 py-4 whitespace-nowrap font-medium">Charges</td>
                    <td className="px-6 py-4 whitespace-nowrap">Flat monthly interest (3-4%)</td>
                    <td className="px-6 py-4 whitespace-nowrap">Processing fees, hidden terms</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-gray-600 leading-relaxed mt-6">
              Our promise? No processing charges. No compound interest if repaid on time. Just clear, upfront math.
            </p>
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
              5. Why Not Lower the Rates?
            </h2>
            <p className="text-gray-600 leading-relaxed">
               We ask ourselves this regularly.
            </p>
             <p className="text-gray-600 leading-relaxed mt-4">
               But here's the truth: we are not in the business of earning on gold. We are in the business of earning your trust.
            </p>
            <p className="text-gray-600 leading-relaxed mt-4">
              And 3% to 4% monthly ensures we can grow without needing external capital that dilutes our values or forces us to compromise customer care.
            </p>
             <p className="text-gray-600 leading-relaxed mt-4">
              As we grow and automate more, we hope to reduce rates — but only when it can be done without risking your ornaments or our commitment.
            </p>
            <p className="text-gray-600 leading-relaxed mt-4">
              However, our long-term goal is to bring these rates down. We're actively working on partnering with formal institutions like NBFCs, rural cooperatives, and HNIs to lower our cost of funds. As our access to cheaper capital improves, our borrowers will be the first to benefit.
            </p>
            <p className="text-gray-600 leading-relaxed mt-4 font-medium">
              And for that, 3% to 4% monthly interest isn't a cost — it's an investment in service quality and security.
            </p>
          </div>
        </div>

        {/* Conclusion */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <h2 className="text-2xl font-semibold text-aarthikaDark mb-4">
            The Bigger Picture
          </h2>
          <p className="text-lg text-gray-700 mb-4 leading-relaxed">
            This isn't just about interest.
          </p>
          <p className="text-lg text-gray-700 mb-4 leading-relaxed">
             Aarthika doesn't aim to extract profits. It aims to build a long-lasting, transparent, and scalable rural credit system.
          </p>
          <p className="text-lg text-gray-700 mb-4 leading-relaxed">
             It's about building a model that scales trust, that can someday integrate with banks, NBFCs, and co-operatives, and bring rural lending out of the shadows — with class, dignity, and simplicity.
          </p>
          <p className="text-lg text-gray-700 leading-relaxed font-semibold italic">
            Yahi hai Aarthika ka vada. Simple loans. Serious responsibility.
          </p>
        </div>
      </div>
    </div>
  );
};

export default WhyInterestRates; 