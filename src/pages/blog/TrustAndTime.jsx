import React from 'react';
// import { Link } from 'react-router-dom'; // Removed
import { HashLink } from 'react-router-hash-link'; // Added

const TrustAndTime = () => {
  return (
    <div className="bg-white py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Use HashLink with smooth prop */}
        <HashLink smooth to="/#insights" className="text-aarthikaBlue hover:text-aarthikaDark inline-flex items-center mb-8">
          <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd"></path></svg>
          Back to Insights
        </HashLink>

        <h1 className="text-3xl md:text-4xl font-bold text-aarthikaDark mb-6">
          Behind Every Loan: The Story of Trust and Time
        </h1>
        <p className="text-lg text-gray-700 mb-6 leading-relaxed">
          In rural India, a loan is not just a financial transaction. It's a moment of vulnerability. It's when someone walks into your office with a small bag of ornaments and a world of worry in their eyes.
        </p>
        <p className="text-lg text-gray-700 mb-8 leading-relaxed">
          Maybe they need money for a daughter's wedding, a hospital visit, or to sow seeds for the season. Maybe they don't say why. But you can see it in their hands—the way they tightly hold the plastic pouch, as if it carries their entire life.
        </p>
        <p className="text-lg text-gray-700 mb-8 leading-relaxed font-semibold">
          And that's where the real story begins.
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
              Trust Is Built in Small Moments
            </h2>
            <p className="text-gray-600 leading-relaxed">
              Trust isn't built in a single grand gesture. It's built in the small, consistent acts:
            </p>
            <ul className="list-disc list-inside text-gray-600 space-y-2 pl-4 mt-4 leading-relaxed">
                <li>When you explain the interest clearly, without hiding anything.</li>
                <li>When the receipts show exactly what was said.</li>
                <li>When customers receive a WhatsApp message with the details—without asking.</li>
                <li>When a husband and wife both feel safe walking in, without being judged.</li>
            </ul>
             <p className="text-gray-600 leading-relaxed mt-4">
              People remember respect. They remember honesty, even if you charge more than a bank. Because in the villages, banks might be cheaper—but they're also farther, slower, colder.
            </p>
             <p className="text-gray-600 leading-relaxed mt-4 font-medium">
               We are nearer, faster, warmer.
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
            This is What Makes Lending Work Here
          </h2>
          <p className="text-lg text-gray-700 mb-4 leading-relaxed">
            Behind every loan:
          </p>
            <ul className="list-disc list-inside text-lg text-gray-700 space-y-2 pl-4 mb-6 leading-relaxed">
                <li>There's a person who hesitated for weeks before walking in.</li>
                <li>There's a promise made, not on paper, but on understanding.</li>
                <li>There's a relationship growing—between a lender who shows up and a borrower who needs support.</li>
            </ul>
          <p className="text-lg text-gray-700 mb-4 leading-relaxed">
             And if we protect that relationship with systems, respect, and a sense of responsibility, then the business doesn't just grow…
          </p>
          <p className="text-lg text-gray-700 leading-relaxed font-semibold italic">
            It lasts.
          </p>
        </div>
      </div>
    </div>
  );
};

export default TrustAndTime; 