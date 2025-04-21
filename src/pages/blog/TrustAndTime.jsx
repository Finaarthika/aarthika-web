import React from 'react';
import { Helmet } from 'react-helmet-async';
// import { Link } from 'react-router-dom'; // Removed
import { HashLink } from 'react-router-hash-link'; // Added

const TrustAndTime = () => {
  return (
    <div className="bg-white py-16 px-4 sm:px-6 lg:px-8">
      <Helmet>
        <title>Trust and Time in Rural Finance: Insights from Kishanganj & Uttar Dinajpur | Aarthika</title>
        <meta name="description" content="How trust is built in rural financial services in Kishanganj, Bihar and Uttar Dinajpur, West Bengal. Our experience shows that rural finance is founded on relationships, transparency and consistency." />
        <meta name="keywords" content="trust in rural finance, Kishanganj financial services, Uttar Dinajpur banking, Bihar rural loans, West Bengal rural finance, transparent banking, rural communities" />
        <link rel="canonical" href="https://aarthika.com/blog/trust-and-time" />
      </Helmet>
      
      <div className="max-w-3xl mx-auto">
        {/* Use HashLink with smooth prop */}
        <HashLink smooth to="/#insights" className="text-aarthikaBlue hover:text-aarthikaDark inline-flex items-center mb-8">
          <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd"></path></svg>
          Back to Insights
        </HashLink>

        <h1 className="text-3xl md:text-4xl font-bold text-aarthikaDark mb-6">
          Behind Every Loan: The Story of Trust and Time
        </h1>
        <p className="text-lg text-gray-700 mb-8 leading-relaxed">
          In the villages of Kishanganj and Uttar Dinajpur where Aarthika operates, lending isn't just a financial transaction—it's a deeply personal relationship built on trust that takes time to develop. Here's what we've learned about building trust in rural financial services:
        </p>

        {/* Sections */}
        <div className="space-y-10">
          <div>
            <h2 className="text-2xl font-semibold text-aarthikaDark mb-3">
              It Starts With Time
            </h2>
            <p className="text-gray-600 leading-relaxed">
              Before trust, there is time.
            </p>
            <p className="text-gray-600 leading-relaxed mt-4">
              Customers don't instantly hand you their gold or silver. It might take months—or years—before they even consider you. They ask around. They observe. They notice how you speak to others, how you return the pledged item, how your receipts are printed, how your tone is when they're short by a day or two.
            </p>
            <p className="text-gray-600 leading-relaxed mt-4">
              Sometimes, they just come and talk—no borrowing, no giving. Just watching.
            </p>
            <p className="text-gray-600 leading-relaxed mt-4 italic">
               And that's okay. Because in this business, rushing never works.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold text-aarthikaDark mb-3">
              Trust Is Built On Small Things
            </h2>
            <p className="text-gray-600 leading-relaxed">
              In the villages we serve across rural Bihar and West Bengal, trust doesn't come from big marketing campaigns or flashy promises. It's built in small, consistent actions:
            </p>
            <ul className="list-disc list-inside text-gray-600 space-y-2 pl-4 mt-4 leading-relaxed">
              <li>Returning the exact same gold item—not a substitute</li>
              <li>Showing the weighing scale clearly so everyone can see</li>
              <li>Printing a receipt that matches exactly what was discussed</li>
              <li>Remembering names and family details</li>
              <li>Being present in the community during festivals and hardships</li>
            </ul>
            <p className="text-gray-600 leading-relaxed mt-4">
              Each interaction either builds or breaks trust. And in rural lending, there are no second chances.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold text-aarthikaDark mb-3">
              It's Not About Fancy Apps. It's About Familiar Faces.
            </h2>
            <p className="text-gray-600 leading-relaxed">
              Technology helps. Yes, having a proper app, digital records, PDF receipts—it all adds structure. But technology only works when trust already exists.
            </p>
            <p className="text-gray-600 leading-relaxed mt-4">
              A new customer may not understand what a PDF is, but he understands when:
            </p>
             <ul className="list-disc list-inside text-gray-600 space-y-2 pl-4 mt-4 leading-relaxed">
                <li>His collateral photo is safely captured.</li>
                <li>His expected repayment date is shown clearly.</li>
                <li>He can call a known number and get a polite, helpful response.</li>
            </ul>
            <p className="text-gray-600 leading-relaxed mt-6">
              What matters is not the tech—but what the tech communicates: transparency, fairness, and accountability.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold text-aarthikaDark mb-3">
              Why Time Is More Powerful Than Money
            </h2>
            <p className="text-gray-600 leading-relaxed">
              We've seen it ourselves—customers who started with ₹2,000, then returned six months later with ₹50,000 worth of ornaments. Not because we offered the lowest rate. But because we delivered clarity, timeliness, and respect.
            </p>
             <p className="text-gray-600 leading-relaxed mt-4 font-medium">
               In rural lending, your biggest asset is not capital. It's credibility.
            </p>
            <p className="text-gray-600 leading-relaxed mt-4">
              That credibility comes only with time. And it's reinforced every single day—with every bill printed, every reminder sent, every loan closed properly.
            </p>
          </div>
        </div>

        {/* Conclusion */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <h2 className="text-2xl font-semibold text-aarthikaDark mb-4">
            A Different Kind of Banking
          </h2>
          <p className="text-lg text-gray-700 mb-4 leading-relaxed">
            In Kishanganj and Uttar Dinajpur, we're building something different. Not just a lending company, but a relationship-based financial service that understands the unique needs of rural communities.
          </p>
          <p className="text-lg text-gray-700 leading-relaxed italic font-medium">
            Because in the end, what matters most isn't how much gold we hold—it's how much trust we've earned. And that trust begins with giving people the time they deserve.
          </p>
        </div>
      </div>
    </div>
  );
};

export default TrustAndTime; 