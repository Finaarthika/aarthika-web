import React, { useState, useEffect } from 'react';
import { FaSpinner, FaTimes } from 'react-icons/fa';

const JoinAarthika = ({ onClose }) => {
  const [step, setStep] = useState('loading'); // loading, branches, form
  const [formData, setFormData] = useState({
    fullName: '',
    phoneNumber: '',
    email: '',
    location: '',
    preferredLocation: 'Kishanganj',
    smartphoneComfort: '',
    appManagementTraining: '',
    handlingExperience: '',
    bankingAppUsage: '',
    comfortTalkingRural: '',
    travelWillingness: '',
    motivation: '',
    pressureHandlingResponse: ''
  });

  useEffect(() => {
    if (step === 'loading') {
      const timer = setTimeout(() => {
        setStep('branches');
      }, 2000); // 2 second delay
      return () => clearTimeout(timer);
    }
  }, [step]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const renderContent = () => {
    switch (step) {
      case 'loading':
        return (
          <div className="flex flex-col items-center justify-center text-center p-8">
            <FaSpinner className="animate-spin text-4xl text-aarthikaBlue mb-4" />
            <p className="text-lg font-medium text-gray-700">Detecting nearest Aarthika branch...</p>
          </div>
        );
      case 'branches':
        return (
          <div className="text-center p-8">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Your nearest work location options are:</h3>
            <ul className="list-disc list-inside text-gray-600 mb-6 inline-block text-left">
              <li>Kishanganj</li>
              <li>Dharampur</li>
              <li>Debiganj</li>
            </ul>
            <button 
              onClick={() => setStep('form')} 
              className="w-full bg-aarthikaBlue hover:bg-aarthikaDark text-white font-bold py-3 px-4 rounded-lg transition duration-300"
            >
              Proceed to Application
            </button>
          </div>
        );
      case 'form':
        return (
          <form action="https://formspree.io/f/mblgnlvv" method="POST" className="space-y-6 p-6 md:p-8">
            <h2 className="text-2xl font-bold text-center text-aarthikaDark mb-6">Staff Application</h2>
            
            {/* Personal Info */}
            <fieldset className="border border-gray-300 p-4 rounded-md">
              <legend className="text-lg font-semibold text-aarthikaDark px-2">Personal Info</legend>
              <div className="space-y-4 mt-2">
                 <div>
                    <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                    <input type="text" name="fullName" id="fullName" value={formData.fullName} onChange={handleChange} required className="w-full p-2 border border-gray-300 rounded-md focus:ring-aarthikaBlue focus:border-aarthikaBlue" />
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                       <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                       <input type="tel" name="phoneNumber" id="phoneNumber" value={formData.phoneNumber} onChange={handleChange} required className="w-full p-2 border border-gray-300 rounded-md focus:ring-aarthikaBlue focus:border-aarthikaBlue" />
                    </div>
                    <div>
                       <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                       <input type="email" name="email" id="email" value={formData.email} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded-md focus:ring-aarthikaBlue focus:border-aarthikaBlue" />
                    </div>
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">Village / Town</label>
                        <input type="text" name="location" id="location" value={formData.location} onChange={handleChange} required className="w-full p-2 border border-gray-300 rounded-md focus:ring-aarthikaBlue focus:border-aarthikaBlue" />
                    </div>
                    <div>
                        <label htmlFor="preferredLocation" className="block text-sm font-medium text-gray-700 mb-1">Preferred Work Location</label>
                        <select name="preferredLocation" id="preferredLocation" value={formData.preferredLocation} onChange={handleChange} required className="w-full p-2 border border-gray-300 rounded-md focus:ring-aarthikaBlue focus:border-aarthikaBlue bg-white">
                          <option>Kishanganj</option>
                          <option>Debiganj</option>
                          <option>Dharampur</option>
                          <option>Other</option>
                        </select>
                    </div>
                 </div>
              </div>
            </fieldset>

            {/* Skills & Suitability */}
            <fieldset className="border border-gray-300 p-4 rounded-md">
              <legend className="text-lg font-semibold text-aarthikaDark px-2">Skills & Suitability</legend>
              <div className="space-y-4 mt-2">
                <div>
                    <label htmlFor="smartphoneComfort" className="block text-sm font-medium text-gray-700 mb-1">Can you use a smartphone confidently?</label>
                    <select name="smartphoneComfort" id="smartphoneComfort" value={formData.smartphoneComfort} onChange={handleChange} required className="w-full p-2 border border-gray-300 rounded-md focus:ring-aarthikaBlue focus:border-aarthikaBlue bg-white">
                       <option value="" disabled>Select...</option>
                       <option>Yes, very comfortably</option>
                       <option>Yes, with some help</option>
                       <option>No, but willing to learn</option>
                       <option>No</option>
                    </select>
                 </div>
                 <div>
                    <label htmlFor="appManagementTraining" className="block text-sm font-medium text-gray-700 mb-1">If trained for 2 days, can you manage data in Aarthika app?</label>
                    <select name="appManagementTraining" id="appManagementTraining" value={formData.appManagementTraining} onChange={handleChange} required className="w-full p-2 border border-gray-300 rounded-md focus:ring-aarthikaBlue focus:border-aarthikaBlue bg-white">
                       <option value="" disabled>Select...</option>
                       <option>Yes</option>
                       <option>Maybe</option>
                       <option>Not sure</option>
                       <option>No</option>
                    </select>
                 </div>
                 <div>
                    <label htmlFor="handlingExperience" className="block text-sm font-medium text-gray-700 mb-1">Have you handled cash, trust, or customer data before?</label>
                    <select name="handlingExperience" id="handlingExperience" value={formData.handlingExperience} onChange={handleChange} required className="w-full p-2 border border-gray-300 rounded-md focus:ring-aarthikaBlue focus:border-aarthikaBlue bg-white">
                       <option value="" disabled>Select...</option>
                       <option>Yes, in a finance or shop job</option>
                       <option>Yes, in general labor</option>
                       <option>No, but I'm responsible</option>
                       <option>No</option>
                    </select>
                 </div>
                 <div>
                    <label htmlFor="bankingAppUsage" className="block text-sm font-medium text-gray-700 mb-1">Have you ever used any banking app like PhonePe, Paytm, SBI, etc.?</label>
                    <select name="bankingAppUsage" id="bankingAppUsage" value={formData.bankingAppUsage} onChange={handleChange} required className="w-full p-2 border border-gray-300 rounded-md focus:ring-aarthikaBlue focus:border-aarthikaBlue bg-white">
                       <option value="" disabled>Select...</option>
                       <option>Yes, I use them often</option>
                       <option>Yes, but very rarely</option>
                       <option>No, never used one</option>
                    </select>
                 </div>
                 <div>
                    <label htmlFor="comfortTalkingRural" className="block text-sm font-medium text-gray-700 mb-1">How comfortable are you talking to farmers, labourers, or local people daily?</label>
                    <select name="comfortTalkingRural" id="comfortTalkingRural" value={formData.comfortTalkingRural} onChange={handleChange} required className="w-full p-2 border border-gray-300 rounded-md focus:ring-aarthikaBlue focus:border-aarthikaBlue bg-white">
                       <option value="" disabled>Select...</option>
                       <option>Very comfortable</option>
                       <option>Somewhat comfortable</option>
                       <option>I feel nervous at times</option>
                    </select>
                 </div>
                  <div>
                    <label htmlFor="travelWillingness" className="block text-sm font-medium text-gray-700 mb-1">Can you travel 5–10 km daily to different villages if needed?</label>
                    <select name="travelWillingness" id="travelWillingness" value={formData.travelWillingness} onChange={handleChange} required className="w-full p-2 border border-gray-300 rounded-md focus:ring-aarthikaBlue focus:border-aarthikaBlue bg-white">
                       <option value="" disabled>Select...</option>
                       <option>Yes, easily</option>
                       <option>Yes, if arrangements are there</option>
                       <option>No, I prefer to stay nearby</option>
                    </select>
                 </div>
              </div>
            </fieldset>

            {/* Handling Pressure - Moved Before Motivation */}
            <fieldset className="border border-gray-300 p-4 rounded-md">
               <legend className="text-lg font-semibold text-aarthikaDark px-2">Handling Pressure</legend>
               <div className="mt-2">
                 <label htmlFor="pressureHandlingResponse" className="block text-sm font-medium text-gray-700 mb-1">If a customer is accusing you or yelling at you, how do you control your anger or respond calmly?</label>
                 <textarea name="pressureHandlingResponse" id="pressureHandlingResponse" rows="4" value={formData.pressureHandlingResponse} onChange={handleChange} required className="w-full p-2 border border-gray-300 rounded-md focus:ring-aarthikaBlue focus:border-aarthikaBlue" placeholder="Your answer helps us know how you handle pressure..."></textarea>
                 <p className="text-xs text-gray-500 mt-1">(Your answer helps us know how you handle pressure in real field work.)</p>
               </div>
            </fieldset>

            {/* Motivation - Moved After Handling Pressure */}
            <fieldset className="border border-gray-300 p-4 rounded-md">
               <legend className="text-lg font-semibold text-aarthikaDark px-2">Motivation</legend>
               <div className="mt-2">
                 <label htmlFor="motivation" className="block text-sm font-medium text-gray-700 mb-1">Why do you want to join Aarthika?</label>
                 <textarea name="motivation" id="motivation" rows="4" value={formData.motivation} onChange={handleChange} required className="w-full p-2 border border-gray-300 rounded-md focus:ring-aarthikaBlue focus:border-aarthikaBlue"></textarea>
               </div>
            </fieldset>
            
            <button type="submit" className="w-full bg-aarthikaBlue hover:bg-aarthikaDark text-white font-bold py-3 px-4 rounded-lg transition duration-300">
              Submit Application
            </button>
          </form>
        );
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto relative">
        <button 
          onClick={onClose} 
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-800 text-2xl z-10"
          aria-label="Close"
        >
          <FaTimes />
        </button>
        {renderContent()}
      </div>
    </div>
  );
};

export default JoinAarthika; 