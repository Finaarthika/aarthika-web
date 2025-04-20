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
          From 2020 to 2023, I was doing everything myself — checking gold, writing down names, counting cash, taking photos, calculating interest on paper. I knew every customer by face — but the business couldn't grow beyond me.
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
            Today, the Aarthika app (v1.0) is a working tool across Debiganj, Kishanganj, and Dharampur. It has:
          </p>
          <ul className="list-disc list-inside text-gray-600 space-y-2 pl-4 leading-relaxed">
            <li>✅ Auto LTV calculator</li>
            <li>✅ Loan & top-up tracking</li>
            <li>✅ Receipt generation with customer image</li>
            <li>✅ Staff login with performance monitoring</li>
            <li>✅ Google Sheets integration for backups</li>
            <li>✅ Firebase for secure data</li>
            <li>✅ Loan closure and interest discount features</li>
            <li>✅ Face-based risk (in progress via CredAar)</li>
          </ul>
        </div>

        {/* Impact Section */}
        <div className="mb-10">
          <h2 className="text-2xl font-semibold text-aarthikaDark mb-4">
            What Changed for Me
          </h2>
          <p className="text-gray-600 leading-relaxed mb-4">
            Now, my staff enters the data. I sit at home and watch on Google Sheets.
          </p>
          <p className="text-gray-600 leading-relaxed mb-4">
            Customers trust us more — they get receipts, SMS alerts, and even WhatsApp links for support.
          </p>
          <p className="text-gray-600 leading-relaxed italic bg-gray-100 p-4 rounded">
            When Deepa Uncle (a major crop trader) saw our printed receipts and automated loan closure reports, he said, "Bhai, tum bank se kam nahi ho."
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
            Our goal is simple: to combine the tech of a startup with the trust of a baniya.
          </p>
          <p className="text-lg text-gray-700 mt-2 leading-relaxed">
            Because rural India deserves not just capital — but class.
          </p>
        </div>
      </div>
    </div>
  );
};

export default WhyWeBuiltAarthika; 