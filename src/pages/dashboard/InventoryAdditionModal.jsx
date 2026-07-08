import React, { useState, useEffect } from 'react';
import { X, CheckCircle, PackagePlus, Loader2 } from 'lucide-react';

const InventoryAdditionModal = ({ isOpen, onClose, inventoryData, onSuccess }) => {
  const [formData, setFormData] = useState({
    category: '',
    metalType: 'Gold',
    purity: '22K',
    addedCount: '',
    addedWeight: '',
    pricePaid: '',
    makingCharge: '',
    addedBy: '',
    verifiedBy: '',
    sourcedFrom: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Auto-set the date to today in DD-MM-YYYY format
  const getTodayDate = () => {
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, '0');
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const yyyy = today.getFullYear();
    return `${dd}-${mm}-${yyyy}`;
  };

  useEffect(() => {
    if (isOpen) {
      setSuccess(false);
      setError('');
      setFormData({
        category: '',
        metalType: 'Gold',
        purity: '22K',
        addedCount: '',
        addedWeight: '',
        pricePaid: '',
        makingCharge: '',
        addedBy: '',
        verifiedBy: '',
        sourcedFrom: ''
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const categories = inventoryData ? inventoryData.map(item => item.name) : [];

  // Attempt to auto-infer metal type based on category
  const handleCategoryChange = (e) => {
    const cat = e.target.value;
    let metal = formData.metalType;
    let purity = formData.purity;
    
    if (cat.toLowerCase().includes('gold')) {
      metal = 'Gold';
      purity = '22K';
    } else if (cat.toLowerCase().includes('silver')) {
      metal = 'Silver';
      purity = '99.90%';
    }
    
    setFormData({ ...formData, category: cat, metalType: metal, purity });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.category || !formData.addedCount || !formData.addedWeight || !formData.pricePaid || !formData.addedBy) {
      setError("Please fill all required fields.");
      return;
    }

    setLoading(true);
    setError('');

    try {
      const FIREBASE_API_URL = 'https://us-central1-aarthika-backend.cloudfunctions.net/masterApi';
      
      const payload = {
        ...formData,
        dateAdded: getTodayDate(),
        pricePaid: `₹${Number(formData.pricePaid).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        makingCharge: formData.makingCharge ? `₹${Number(formData.makingCharge).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '₹0.00'
      };

      const response = await fetch(`${FIREBASE_API_URL}/add-inventory`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        setSuccess(true);
        setTimeout(() => {
          onClose();
          if (onSuccess) onSuccess();
        }, 1500);
      } else {
        throw new Error(data.error || 'Failed to add inventory');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 text-emerald-600 rounded-xl">
              <PackagePlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-zinc-900">Add New Inventory</h2>
              <p className="text-xs text-zinc-500">Log purchases and update stock</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto">
          {success ? (
            <div className="flex flex-col items-center justify-center py-12 animate-in zoom-in-95 duration-300">
              <CheckCircle className="w-16 h-16 text-emerald-500 mb-4" />
              <h3 className="text-xl font-bold text-zinc-900">Inventory Added Successfully!</h3>
              <p className="text-zinc-500 mt-2 text-center max-w-sm">
                The database and master dashboard have been updated.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-xs font-semibold text-zinc-600 uppercase tracking-wider">Category <span className="text-red-500">*</span></label>
                  <select 
                    value={formData.category} 
                    onChange={handleCategoryChange}
                    className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                    required
                  >
                    <option value="" disabled>Select a category...</option>
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-600 uppercase tracking-wider">Metal Type</label>
                  <select 
                    value={formData.metalType} 
                    onChange={e => setFormData({...formData, metalType: e.target.value})}
                    className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                  >
                    <option value="Gold">Gold</option>
                    <option value="Silver">Silver</option>
                    <option value="Diamond">Diamond</option>
                    <option value="Platinum">Platinum</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-600 uppercase tracking-wider">Purity</label>
                  <input 
                    type="text" 
                    value={formData.purity} 
                    onChange={e => setFormData({...formData, purity: e.target.value})}
                    className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                    placeholder="e.g. 22K, 99.90%"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-600 uppercase tracking-wider">Added Count <span className="text-red-500">*</span></label>
                  <input 
                    type="number" 
                    min="0"
                    value={formData.addedCount} 
                    onChange={e => setFormData({...formData, addedCount: e.target.value})}
                    className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                    placeholder="e.g. 5"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-600 uppercase tracking-wider">Added Weight (g) <span className="text-red-500">*</span></label>
                  <input 
                    type="number" 
                    step="0.01"
                    min="0"
                    value={formData.addedWeight} 
                    onChange={e => setFormData({...formData, addedWeight: e.target.value})}
                    className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                    placeholder="e.g. 15.5"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-600 uppercase tracking-wider">Price Paid (Cost) <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400">₹</span>
                    <input 
                      type="number" 
                      min="0"
                      value={formData.pricePaid} 
                      onChange={e => setFormData({...formData, pricePaid: e.target.value})}
                      className="w-full pl-8 pr-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                      placeholder="Total purchase cost"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-600 uppercase tracking-wider">Making Charge Paid</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400">₹</span>
                    <input 
                      type="number" 
                      min="0"
                      value={formData.makingCharge} 
                      onChange={e => setFormData({...formData, makingCharge: e.target.value})}
                      className="w-full pl-8 pr-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                      placeholder="0"
                    />
                  </div>
                </div>

                <div className="space-y-1.5 md:col-span-2 border-t border-zinc-100 pt-4 mt-2">
                  <h4 className="text-sm font-semibold text-zinc-900 mb-3">Audit Details</h4>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-600 uppercase tracking-wider">Added By <span className="text-red-500">*</span></label>
                  <input 
                    type="text" 
                    value={formData.addedBy} 
                    onChange={e => setFormData({...formData, addedBy: e.target.value})}
                    className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                    placeholder="Staff name"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-600 uppercase tracking-wider">Verified By</label>
                  <input 
                    type="text" 
                    value={formData.verifiedBy} 
                    onChange={e => setFormData({...formData, verifiedBy: e.target.value})}
                    className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                    placeholder="Manager name"
                  />
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-xs font-semibold text-zinc-600 uppercase tracking-wider">Sourced From</label>
                  <input 
                    type="text" 
                    value={formData.sourcedFrom} 
                    onChange={e => setFormData({...formData, sourcedFrom: e.target.value})}
                    className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                    placeholder="Vendor / Supplier name"
                  />
                </div>

              </div>

              {/* Footer Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 text-sm font-medium text-zinc-600 hover:text-zinc-900 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white text-sm font-medium rounded-xl transition-all shadow-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Add to Inventory'
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default InventoryAdditionModal;
