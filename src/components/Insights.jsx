import React from 'react';
import { Link } from 'react-router-dom'; // Assuming react-router-dom is used for routing

const blogPosts = [
  {
    title: 'How Gold Loans Work in Rural India',
    summary: 'Understand how your gold can help you unlock instant cash with full safety and transparency. This blog explains the step-by-step process of valuation, disbursal, safety measures, and repayment timelines in simple terms.',
    link: '/blog/gold-loans-rural-india',
  },
  {
    title: 'Why We Built the Aarthika App',
    summary: 'A short story on how technology is helping us serve rural India faster and safer. This blog shares how managing everything manually was slowing us down — and how a mobile app transformed gold loan tracking, customer data safety, and staff efficiency.',
    link: '/blog/why-we-built-aarthika',
  },
  {
    title: 'Why 3% to 4% Interest?',
    summary: 'A thoughtful look behind our interest rates. Understand the rural realities, operational costs, and trust factors that shape our fair and transparent pricing model.',
    link: '/blog/why-interest-rates',
  },
];

const Insights = () => {
  return (
    <section id="insights" className="py-16 bg-white">
      <div className="container mx-auto px-6 md:px-12 lg:px-24 max-w-screen-xl">
        <h2 className="text-3xl md:text-4xl font-bold text-center text-aarthikaDark mb-4">
          Aarthika Insights
        </h2>
        <div className="w-24 h-1 bg-aarthikaLightPurple mx-auto mb-12"></div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
          {blogPosts.map((post, index) => (
            <div key={index} className="bg-gray-50 rounded-lg shadow-md p-6 flex flex-col transition-shadow hover:shadow-lg">
              {/* Optional: Icon or banner placeholder */}
              {/* <div className="mb-4"> Icon/Banner </div> */}
              <h3 className="text-xl font-semibold text-aarthikaDark mb-3">{post.title}</h3>
              <p className="text-gray-600 text-base mb-4 flex-grow">{post.summary}</p>
              <Link 
                to={post.link} 
                className="mt-auto inline-block text-white bg-aarthikaBlue hover:bg-aarthikaDark transition-colors duration-300 font-medium rounded-full px-6 py-2 text-center self-start"
              >
                Read More
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Insights; 