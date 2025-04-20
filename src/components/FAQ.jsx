import React, { useState } from 'react';
import { FaPlus, FaMinus } from 'react-icons/fa';

const FaqItem = ({ question, answer, isOpen, onClick }) => {
  return (
    <div className="border-b border-gray-200 py-5">
      <button 
        onClick={onClick}
        className="flex justify-between items-center w-full text-left focus:outline-none"
      >
        <h3 className="text-lg font-medium text-gray-800 hover:text-aarthikaBlue transition-colors duration-200">
          {question}
        </h3>
        <span>
          {isOpen ? (
            <FaMinus className="text-aarthikaBlue w-4 h-4" />
          ) : (
            <FaPlus className="text-gray-500 w-4 h-4" />
          )}
        </span>
      </button>
      {isOpen && (
        <div className="mt-4 pr-8">
          <p className="text-gray-600 leading-relaxed">
            {answer}
          </p>
        </div>
      )}
    </div>
  );
};

const FAQ = () => {
  const [openIndex, setOpenIndex] = useState(null);

  const faqs = [
    {
      question: "What documents do I need to take a loan from Aarthika?",
      answer: "We usually only need a valid ID proof. No PAN or income proof is required for small loans backed by gold or silver."
    },
    {
      question: "How do you calculate the value of my gold or silver?",
      answer: "We use certified digital machines to weigh your ornaments and fetch real-time rates from our system, then offer loans based on up to 75% of the calculated value."
    },
    {
      question: "Can I repay my loan before the due date? Will I get any benefit?",
      answer: "Yes, early repayment is allowed. If you repay before the committed term, we reduce the interest accordingly."
    },
    {
      question: "What happens if I miss the due date?",
      answer: "We allow a small grace period and may apply a minimal late fee. However, if repayment delays extend too long, we'll contact you before taking any further action."
    },
    {
      question: "Do I have to visit your office every time for a loan or repayment?",
      answer: "No. You can send someone from your family with your loan slip. Also, we're building options to allow repayment digitally or from nearby collection agents in your village."
    },
    {
      question: "How do I know my gold is safe?",
      answer: "Your gold is stored in our secure locker under CCTV surveillance. You also receive a printed slip with full details as proof of your pledge."
    },
    {
      question: "Can I take a new loan if I already have one?",
      answer: "Yes. If your earlier loan is repaid properly, we'll prioritize you for a second loan — even on the same day."
    },
    {
      question: "Do you offer loans on silver? What are the terms?",
      answer: "Yes. We offer loans on silver ornaments too. The amount will be lower compared to gold due to lower purity and resale value."
    }
  ];

  const handleToggle = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section id="faq" className="py-20 md:py-28 bg-white">
      <div className="premium-container max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-800 mb-3">Frequently Asked Questions</h2>
          <div className="w-24 h-1 bg-gradient-to-r from-aarthikaDark to-aarthikaBlue rounded-full mx-auto"></div>
        </div>
        
        <div className="animate-fade-in-delay">
          {faqs.map((faq, index) => (
            <FaqItem 
              key={index} 
              question={faq.question} 
              answer={faq.answer} 
              isOpen={openIndex === index}
              onClick={() => handleToggle(index)}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default FAQ; 