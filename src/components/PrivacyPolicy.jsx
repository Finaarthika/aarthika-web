import React from 'react';
import { Link } from 'react-router-dom'; // For linking back home
import { EMAIL } from '../constants/contactInfo';

const PrivacyPolicy = () => {
  const lastUpdated = "April 19, 2025"; // Update this date whenever the policy changes

  return (
    <div className="bg-white pt-24 pb-16 md:pt-32 md:pb-24 px-4 md:px-8 lg:px-16">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-6 border-b pb-4">Privacy Policy</h1>
        <p className="text-sm text-gray-500 mb-8">Last Updated: {lastUpdated}</p>

        <div className="prose prose-lg max-w-none text-gray-700">
          <p>Aarthika ("we," "us," or "our") is committed to protecting the privacy of our users ("user," "you"). This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website [Your Website URL - Add Later if applicable] and use our services. Please read this privacy policy carefully. If you do not agree with the terms of this privacy policy, please do not access the site or use our services.</p>
          
          <h2 className="text-2xl font-semibold text-gray-800 mt-8 mb-4">Information We Collect</h2>
          <p>We may collect information about you in a variety of ways. The information we may collect on the Site includes:</p>
          
          <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">Personal Data</h3>
          <p>Personally identifiable information, such as your name, email address, and telephone number, and message content that you voluntarily give to us when you contact us through our website form or directly via email/phone.</p>

          <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">Derivative Data</h3>
          <p>Information our servers automatically collect when you access the Site, such as your IP address, your browser type, your operating system, your access times, and the pages you have viewed directly before and after accessing the Site. This information is used for statistical purposes and to improve website functionality and security.</p>
          
          <h2 className="text-2xl font-semibold text-gray-800 mt-8 mb-4">How We Use Your Information</h2>
          <p>Having accurate information about you permits us to provide you with a smooth, efficient, and customized experience. Specifically, we may use information collected about you via the Site to:</p>
          <ul>
            <li>Respond to your inquiries, questions, and comments and provide customer support.</li>
            <li>Communicate with you regarding services or partnership opportunities you have expressed interest in.</li>
            <li>Monitor and analyze usage and trends to improve your experience with the Site.</li>
            <li>Maintain the security and operation of our Site.</li>
            <li>Comply with legal and regulatory requirements.</li>
          </ul>

          <h2 className="text-2xl font-semibold text-gray-800 mt-8 mb-4">Disclosure of Your Information</h2>
          <p>We value your trust and are committed to maintaining the confidentiality of your information. We do not sell, trade, rent, or otherwise share your personal information for marketing purposes. We may share information we have collected about you in certain situations:</p>
          <ul>
            <li><strong>By Law or to Protect Rights:</strong> If we believe the release of information about you is necessary to respond to legal process, to investigate or remedy potential violations of our policies, or to protect the rights, property, and safety of others, we may share your information as permitted or required by any applicable law, rule, or regulation.</li>
            <li><strong>Third-Party Service Providers:</strong> We may share your information with third parties that perform services for us or on our behalf, including data analysis, hosting services, customer service, and marketing assistance (e.g., Formspree for contact form submissions).</li>
            <li><strong>Business Transfers:</strong> We may share or transfer your information in connection with, or during negotiations of, any merger, sale of company assets, financing, or acquisition of all or a portion of our business to another company.</li>
             <li><strong>With Your Consent:</strong> We may disclose your personal information for any other purpose with your consent.</li>
          </ul>

          <h2 className="text-2xl font-semibold text-gray-800 mt-8 mb-4">Security of Your Information</h2>
          <p>We use administrative, technical, and physical security measures to help protect your personal information. While we have taken reasonable steps to secure the personal information you provide to us, please be aware that despite our efforts, no security measures are perfect or impenetrable, and no method of data transmission can be guaranteed against any interception or other type of misuse.</p>

          <h2 className="text-2xl font-semibold text-gray-800 mt-8 mb-4">Data Retention</h2>
          <p>We will retain your personal information only for as long as is necessary for the purposes set out in this Privacy Policy, unless a longer retention period is required or permitted by law (such as tax, accounting, or other legal requirements).</p>

          <h2 className="text-2xl font-semibold text-gray-800 mt-8 mb-4">Your Rights</h2>
          <p>Depending on your location, you may have certain rights regarding your personal information, including the right to access, correct, update, or request deletion of your personal information. To exercise these rights, please contact us using the contact information provided below.</p>

          <h2 className="text-2xl font-semibold text-gray-800 mt-8 mb-4">Policy for Children</h2>
          <p>We do not knowingly solicit information from or market to children under the age of 13 (or applicable age in your jurisdiction). If we learn that we have collected personal information from a child under such age without verification of parental consent, we will delete that information as quickly as possible.</p>

          <h2 className="text-2xl font-semibold text-gray-800 mt-8 mb-4">Changes to This Privacy Policy</h2>
          <p>We may update this Privacy Policy from time to time. The updated version will be indicated by an updated "Last Updated" date and the updated version will be effective as soon as it is accessible. We encourage you to review this privacy policy frequently to be informed of how we are protecting your information.</p>

          <h2 className="text-2xl font-semibold text-gray-800 mt-8 mb-4">Contact Us</h2>
          <p>If you have questions or comments about this Privacy Policy, please contact us at:</p>
          <p>Email: <a href={`mailto:${EMAIL}`} className="text-aarthikaBlue hover:underline">{EMAIL}</a></p>
        </div>

        <div className="mt-12 text-center">
          <Link to="/" className="btn btn-primary">Back to Home</Link>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy; 