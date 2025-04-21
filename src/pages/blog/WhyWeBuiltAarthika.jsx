import React from 'react';
import { Helmet } from 'react-helmet-async';
import { HashLink } from 'react-router-hash-link';

const WhyWeBuiltAarthika = () => {
  return (
    <div className="bg-white py-16 px-4 sm:px-6 lg:px-8">
      <Helmet>
        <title>Why We Built the Aarthika App for Rural Finance | Aarthika</title>
        <meta name="description" content="How our rural finance app is transforming financial services in Kishanganj and Uttar Dinajpur. Learn how technology is helping us serve rural communities in Bihar and West Bengal safely and efficiently." />
        <meta name="keywords" content="rural finance app, Aarthika, Bihar finance, West Bengal microfinance, Kishanganj technology, Uttar Dinajpur fintech, rural banking technology" />
        <link rel="canonical" href="https://aarthika.com/blog/why-we-built-aarthika" />
      </Helmet>
      
      <div className="max-w-3xl mx-auto">
        {/* Back to insights link */}
        <HashLink smooth to="/#insights" className="text-aarthikaBlue hover:text-aarthikaDark inline-flex items-center mb-8">
          <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd"></path></svg>
          Back to Insights
        </HashLink>

        <h1 className="text-3xl md:text-4xl font-bold text-aarthikaDark mb-6">
          Why We Built the Aarthika App
        </h1>
        <p className="text-lg text-gray-700 mb-8 leading-relaxed">
          When we first started offering gold-secured loans in the remote villages of Kishanganj and Uttar Dinajpur, we operated with paper receipts and handwritten books. But as we grew, we faced a problem: How do we keep track of hundreds of small loans across multiple locations while ensuring complete security and transparency?
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
            The Impact We've Seen
          </h2>
          <ul className="list-disc list-inside text-gray-600 space-y-2 pl-4 leading-relaxed">
            <li>Loan processing time cut from 25 minutes to 8 minutes</li>
            <li>Collateral security improved with automated photo backups</li>
            <li>Errors in calculation reduced to almost zero</li>
            <li>Customer trust increased significantly with clean receipts</li>
            <li>Staff performance is now measurable and improvable</li>
            <li>Data security improved despite intermittent internet in rural areas</li>
          </ul>
        </div>

        {/* Conclusion */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <h2 className="text-2xl font-semibold text-aarthikaDark mb-4">
            What's Next?
          </h2>
          <p className="text-lg text-gray-700 mb-4 leading-relaxed">
            We're continuously improving the app based on real feedback from our team in the field. Our focus is now on building better systems for top-ups, multiple item loans, and partial repayments.
          </p>
          <p className="text-lg text-gray-700 mb-4 leading-relaxed">
            The goal isn't just efficiency — it's bringing banking-grade security and transparency to every small village we serve in Bihar and West Bengal.
          </p>
          <p className="text-lg text-gray-700 leading-relaxed italic font-medium">
            Because at Aarthika, we believe rural finance deserves modern technology with a human touch.
          </p>
        </div>
      </div>
    </div>
  );
};

export default WhyWeBuiltAarthika; 