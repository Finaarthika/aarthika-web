import React from 'react';
import { Link } from 'react-router-dom'; // For potential internal links or back button

const GoldLoansRuralIndia = () => {
  return (
    <div className="bg-white py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Optional Back Button */}
        <Link to="/#insights" className="text-aarthikaBlue hover:text-aarthikaDark inline-flex items-center mb-8">
          <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd"></path></svg>
          Back to Insights
        </Link>

        <h1 className="text-3xl md:text-4xl font-bold text-aarthikaDark mb-6">
          How Gold Loans Work in Rural India
        </h1>
        <p className="text-lg text-gray-700 mb-6 leading-relaxed">
          In the rural parts of Bihar and West Bengal where we operate, banks are far and formal. But trust travels fast. And nothing builds trust like gold — a mother's earring, a daughter's chain, a family's small savings.
        </p>
        <p className="text-lg text-gray-700 mb-8 leading-relaxed">
          At Aarthika, we started our journey in 2020 with a small table, a scale, and a big mission: to provide instant, fair, and secured loans using gold and silver as collateral. Here's how it works — simply, safely, and locally:
        </p>

        {/* Steps Section */}
        <div className="space-y-8">
          <div>
            <h2 className="text-2xl font-semibold text-aarthikaDark mb-3">
              1. Bring Your Gold/Silver
            </h2>
            <p className="text-gray-600 leading-relaxed">
              People from remote agrarian regions of rural North and East India walk in with small gold or silver ornaments — usually between 2 to 15 grams. No bank passbooks, income proof, or credit scores are required. We ask for just one thing: your trust.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold text-aarthikaDark mb-3">
              2. We Check the Purity in Front of You
            </h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              Using a desi gold testing machine, we measure purity and weight in full transparency. There are no backdoor labs or "andar le jaake dekhenge" types.
            </p>
            <ul className="list-disc list-inside text-gray-600 space-y-1 pl-4">
              <li>Gold purity from 58% to 92% accepted</li>
              <li>Silver items are also accepted with updated rates</li>
            </ul>
          </div>

          <div>
            <h2 className="text-2xl font-semibold text-aarthikaDark mb-3">
              3. Instant Valuation & Loan Amount
            </h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              We offer up to 75–80% of the value, calculated transparently using daily rates shared by our trusted lending partners. These rates are updated based on real market activity, so you always get a fair estimate. We show you the full math, not magic.
            </p>
            <p className="text-gray-600 leading-relaxed font-medium">For example:</p>
            <div className="bg-gray-100 p-4 rounded mt-2 text-gray-700">
              <p>10 grams of 22K gold at ₹8,900/gm = ~₹89,000 value</p>
              <p>At 75% LTV, loan = ~₹66,750</p>
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-semibold text-aarthikaDark mb-3">
              4. Cash or GPay Disbursal in Minutes
            </h2>
            <p className="text-gray-600 leading-relaxed">
              No form filling drama. Once you confirm, the money is in your hand — within 10 minutes. Receipts are generated, photos are taken, and your item is locked in our fireproof safe.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold text-aarthikaDark mb-3">
              5. Interest as Low as 3–5%
            </h2>
            <p className="text-gray-600 leading-relaxed">
              We charge interest monthly. If you pay early, you pay less. We give discounts on closure, and you can even check your due anytime.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold text-aarthikaDark mb-3">
              6. Loan Closure is as Easy
            </h2>
            <p className="text-gray-600 leading-relaxed">
              Come back with the amount, we count, we return your item, and give you a final Receipt. All data is saved in our Aarthika App — your loan history is clean and proofed.
            </p>
          </div>
        </div>

        {/* Conclusion */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <h2 className="text-2xl font-semibold text-aarthikaDark mb-4">
            Why This Matters
          </h2>
          <p className="text-lg text-gray-700 mb-4 leading-relaxed">
            In rural India, borrowing is usually emotional — "woh bola ki interest 5%, par nikla 10%." Our mission is to make gold lending professional, predictable, and respectful.
          </p>
          <p className="text-lg text-gray-700 leading-relaxed italic">
            We don't ask "kyun chahiye paisa?" — we just ask “Aap kab tak lauta payenge, taaki hum aapka saman ready rakkhein?” That's what financial dignity looks like.
          </p>
        </div>
      </div>
    </div>
  );
};

export default GoldLoansRuralIndia; 