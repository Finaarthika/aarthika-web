import React from 'react';
import { Link } from 'react-router-dom'; // For linking back home
import { EMAIL } from '../constants/contactInfo'; // Assuming contact info might be useful

const TermsOfService = () => {
  const effectiveDate = "[01-04-2025]"; // Update this date

  return (
    <div className="bg-white pt-24 pb-16 md:pt-32 md:pb-24 px-4 md:px-8 lg:px-16">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-6 border-b pb-4">Terms of Service</h1>
        <p className="text-sm text-gray-500 mb-8">Effective Date: {effectiveDate}</p>

        <div className="prose prose-lg max-w-none text-gray-700 space-y-6">
          
          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mt-8 mb-4">1. Loan Eligibility and Disbursement</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Loans are granted based on the purity and weight of the gold/silver ornaments provided as collateral.</li>
              <li>The maximum loan-to-value (LTV) ratio is 75%, in accordance with RBI guidelines.</li>
              <li>The tenure of the loan is 12 months.</li>
              <li>The borrower must be the rightful owner of the pledged ornaments.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mt-8 mb-4">2. Repayment Terms</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>The loan, along with applicable interest, must be repaid within the stipulated tenure.</li>
              <li>Interest rates are determined based on the loan scheme selected by the borrower.</li>
              <li>Prepayment is allowed without any penalties.</li>
              <li>In case of default, the pledged ornaments may be auctioned after providing a 14-day notice to the borrower.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mt-8 mb-4">3. Use of Loan Proceeds</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>The loan amount must not be used for any illegal or unlawful activities.</li>
              <li>The borrower agrees not to engage in sub-lending using the borrowed funds.</li>
            </ul>
          </section>
          
          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mt-8 mb-4">4. Valuation and Purity Assessment</h2>
             <ul className="list-disc pl-6 space-y-2">
              <li>The purity of the pledged ornaments is assessed using standard appraisal methods.</li>
              <li>If the ornaments are found to be of lower purity or counterfeit, the borrower is liable for any resulting losses.</li>
            </ul>
          </section>
          
          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mt-8 mb-4">5. Security and Custody</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>The pledged ornaments are stored securely and insured against risks like theft or burglary.</li>
              <li>In case of loss due to unforeseen circumstances, compensation will be based on the net weight and prevailing market rates, after deducting outstanding dues.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mt-8 mb-4">6. Communication</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>All communications will be sent to the address provided by the borrower.</li>
              <li>The borrower must inform the lender of any changes in contact details promptly.</li>
              <li>The lender may send reminders and information via SMS, WhatsApp, or other modes.</li>
            </ul>
          </section>
          
          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mt-8 mb-4">7. Legal and Dispute Resolution</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>In case of disputes, the matter will be resolved through arbitration under the Arbitration and Conciliation Act, 1996.</li>
              <li>The jurisdiction for any legal proceedings will be Kishanganj, Bihar.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mt-8 mb-4">8. Amendments</h2>
             <ul className="list-disc pl-6 space-y-2">
              <li>The lender reserves the right to amend these terms and conditions.</li>
              <li>Any changes will be communicated to the borrower through appropriate channels.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mt-8 mb-4">Declaration and Undertaking</h2>
            <p>By availing the loan, the borrower:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Confirms understanding and acceptance of all terms and conditions.</li>
              <li>Declares ownership and purity of the pledged ornaments.</li>
              <li>Agrees to repay the loan with interest within the stipulated tenure.</li>
              <li>Acknowledges that any false declaration may lead to legal action.</li>
            </ul>
          </section>
           
          <section>
             <h2 className="text-2xl font-semibold text-gray-800 mt-8 mb-4">Contact Information</h2>
             <p>If you have any questions about these Terms of Service, please contact us at:</p>
             <p>Email: <a href={`mailto:${EMAIL}`} className="text-aarthikaBlue hover:underline">{EMAIL}</a></p>
           </section>
        </div>

        <div className="mt-12 text-center">
          <Link to="/" className="btn btn-primary">Back to Home</Link>
        </div>
      </div>
    </div>
  );
};

export default TermsOfService; 