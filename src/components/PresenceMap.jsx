import React from 'react';

const PresenceMap = () => {
  // Placeholder URL - Replace with your actual map image URL when ready
  const mapImageUrl = 'https://via.placeholder.com/1200x600.png?text=Map+of+Bihar+%26+West+Bengal+Branches'; 

  return (
    <section id="presence" className="py-20 md:py-28 bg-gray-50"> {/* Match background with adjacent sections if needed */}
      <div className="premium-container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Title & Subtext */}
        <div className="text-center mb-12 md:mb-16 max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-800 mb-3">Our Growing Presence</h2>
          <div className="w-24 h-1 bg-gradient-to-r from-aarthikaDark to-aarthikaBlue rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600 mx-auto">
            From the villages of Bihar to the heart of Bengal, Aarthika is building trust, one branch at a time.
          </p>
        </div>

        {/* Map Image Container - Added min-h and bg */}
        <div className="max-w-5xl mx-auto bg-white p-4 rounded-lg shadow-md border border-gray-200 min-h-[300px] flex items-center justify-center"> 
           <img 
             src={mapImageUrl} 
             alt="Map showing Aarthika branch locations across Bihar and West Bengal" 
             // Added explicit width/height, bg, and text styling for fallback
             className="w-full h-auto max-h-[500px] rounded bg-gray-100 text-center text-gray-500 italic p-4 object-contain"
             // Handle image loading error to ensure alt text is visible
             onError={(e) => { e.target.style.display = 'none'; e.target.parentElement.classList.add('bg-gray-100'); e.target.parentElement.innerHTML = `<p class="text-gray-500 italic">${e.target.alt}</p>`; }}
           />
        </div>

      </div>
    </section>
  );
};

export default PresenceMap; 