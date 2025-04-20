import React from 'react';
import { Link } from 'react-router-dom'; // For potential internal links or back button

const WhyWeBuiltAarthika = () => {
  return (
    <div className="bg-white py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Optional Back Button */}
        <Link to="/#insights" className="text-aarthikaBlue hover:text-aarthikaDark inline-flex items-center mb-8">
          <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd"></path></svg>
          Back to Insights
        </Link>

        <h1 className="text-3xl md:text-4xl font-bold text-aarthikaDark mb-6">
          Why We Built the Aarthika App
        </h1>
        <p className="text-lg text-gray-700 mb-6 leading-relaxed">
          From 2020 to 2023, We were doing everything manually — checking gold, writing down names, counting cash, taking photos, calculating interest on paper. I knew every customer by face — but the business couldn't grow beyond me.
        </p>
        <p className="text-lg text-gray-700 mb-8 leading-relaxed">
          Then one day, after a long day of disbursing ₹5 lakh across 4 villages, I sat down and realized: I am stuck being the technician — not the entrepreneur. That night, Aarthika App was born on paper.
        </p>

        {/* Problems Section */}
        <div className="mb-10">
          <h2 className="text-2xl font-semibold text-aarthikaDark mb-4">
            What Problems We Faced Before the App
          </h2>
          <ul className="list-disc list-inside text-gray-600 space-y-2 pl-4 leading-relaxed">
            <li>No centralized data — loan entries were on loose slips</li>
            <li>Manual errors in LTV, interest, or dates</li>
            <li>No staff accountability — hard to track performance</li>
            <li>Old records lost — especially if the register got wet or misplaced</li>
            <li>Collateral pictures got deleted from phones</li>
            <li>Partial deposits and top-ups were hard to manage</li>
          </ul>
        </div>

        {/* Solution Section */}
        <div className="mb-10">
          <h2 className="text-2xl font-semibold text-aarthikaDark mb-4">
            What We Built in the App
          </h2>
          <p className="text-gray-600 leading-relaxed mb-4">
            Today, the Aarthika app (v1.0) is a working tool across Multiple Regions of rural Bihar and West Bengal. It has:
          </p>
          <ul className="list-disc list-inside text-gray-600 space-y-2 pl-4 leading-relaxed">
            <li>✅ Auto LTV calculator</li>
            <li>✅ Loan & top-up tracking</li>
            <li>✅ Receipt generation with customer image and collateral image</li>
            <li>✅ Staff login with performance monitoring</li>
            <li>✅ Separate Data Sheets integration for backups</li>
            <li>✅ Firebase for secure data</li>
            <li>✅ Loan closure and interest discount features</li>
            <li>✅ Face-based Credit Risk Assessment(in progress via AarCred)</li>
          </ul>
        </div>

        {/* Impact Section */}
        <div className="mb-10">
          <h2 className="text-2xl font-semibold text-aarthikaDark mb-4">
            What Changed for Me
          </h2>
          <p className="text-gray-600 leading-relaxed mb-4">
          Today, our team handles customer onboarding and data entry, while operations are tracked in real-time through our internal systems.This has allowed us to focus more on expanding into newer geographies, improving our services, and building stronger relationships with our customers.
          </p>
          <p className="text-gray-600 leading-relaxed mb-4">
          Now, our borrowers receive on-time receipts, SMS alerts, and WhatsApp support, making the lending experience transparent and trustworthy.
          </p>
          <p className="text-gray-600 leading-relaxed italic bg-gray-100 p-4 rounded">
          "Earlier, we used to borrow from whoever would lend — there was no receipt, no record, just trust and fear. But with Aarthika, things feel different."

"When we took a loan, we got a printed receipt with full details. When we closed it, we got a proper final bill. We even got messages and support on WhatsApp!"

"Now we feel like we're dealing with a proper financial service, not just a local sahukar. This is how borrowing should be — clear, respectful, and trustworthy."
          </p>
        </div>

        {/* What's Next Section */}
        <div className="mt-10 pt-8 border-t border-gray-200">
          <h2 className="text-2xl font-semibold text-aarthikaDark mb-4">
            What's Next
          </h2>
          <p className="text-lg text-gray-700 mb-4 leading-relaxed">
            We're now integrating Repayment Risk AI, building Aarthika Insights, and slowly expanding to more villages.
          </p>
          <p className="text-lg text-gray-700 leading-relaxed font-semibold">
            Our goal is simple: to combine the tech of a startup while preserving the human trust that drives grassroots finance.
          </p>
          <p className="text-lg text-gray-700 mt-2 leading-relaxed">
          Because rural India doesn’t just need capital — it deserves dignity, innovation, and a future worth dreaming of.
          </p>
        </div>
      </div>
    </div>
  );
};

export default WhyWeBuiltAarthika; 