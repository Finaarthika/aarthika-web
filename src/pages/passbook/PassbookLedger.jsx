import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { User, ArrowLeft, Download, Upload, Loader2 } from 'lucide-react';

export default function PassbookLedger() {
  const location = useLocation();
  const navigate = useNavigate();
  const accountNumber = location.state?.account_number;

  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Static mock customer profile for display
  const mockProfile = {
    fullName: "Aman Kumar", // Note: In a real app, this static data would be passed via state or fetched
    fathersName: "Ramesh Prasad",
    village: "Main Bazar",
    phone: "91234-XXXXX",
    currentBalance: "14,500.00"
  };

  const fetchTransactions = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/passbook/ledger?accountNumber=${encodeURIComponent(accountNumber)}`);
      if (!response.ok) throw new Error('Failed to fetch live ledger.');
      const json = await response.json();
      setTransactions(json.data || []);
    } catch (err) {
      console.error(err);
      setError('Could not connect to live ledger. Showing mock history.');
      setTransactions([
        { id: 1, timestamp: "2026-06-17 14:22:10", type: "WITHDRAWAL", amount: "1,500.00", runningBalance: "14,500.00", status: "SUCCESS" },
        { id: 2, timestamp: "2026-06-12 11:05:43", type: "DEPOSIT", amount: "10,000.00", runningBalance: "16,000.00", status: "SUCCESS" },
        { id: 3, timestamp: "2026-06-01 09:15:22", type: "DEPOSIT", amount: "6,000.00", runningBalance: "6,000.00", status: "SUCCESS" }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (accountNumber) {
      fetchTransactions();
    }
  }, [accountNumber]);

  const handleTransactionSubmit = async (type) => {
    const amount = type === 'DEPOSIT' ? depositAmount : withdrawAmount;
    if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
      alert("Please enter a valid amount.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/passbook/transaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountNumber,
          type,
          amount
        })
      });

      if (!response.ok) throw new Error(`Failed to process ${type}`);
      
      // Clear inputs upon success
      if (type === 'DEPOSIT') setDepositAmount('');
      if (type === 'WITHDRAWAL') setWithdrawAmount('');
      
      // Refresh the transaction grid
      await fetchTransactions();
      
    } catch (err) {
      console.error(err);
      alert(`Error processing ${type}. Please check console.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!accountNumber) {
    return (
      <div className="w-full max-w-4xl mx-auto mt-12 p-8 border-2 border-dashed border-red-400 bg-red-50 text-center font-mono">
        <h2 className="text-xl font-bold text-red-600 mb-4">[! UNAUTHORIZED ACCESS !]</h2>
        <p className="text-slate-600 mb-6">No account state active in memory. Please return to the portal.</p>
        <button 
          onClick={() => navigate('/passbook')}
          className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white font-bold tracking-widest uppercase transition-colors"
        >
          [ Return to Search ]
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6 mt-4 font-mono text-sm md:text-base">
      
      {error && (
        <div className="bg-orange-50 border-2 border-dashed border-orange-400 text-orange-800 px-4 py-2 text-center uppercase tracking-wider font-bold text-xs">
          [⚠] {error}
        </div>
      )}

      {/* Navigation Bar */}
      <div className="flex items-center">
        <button 
          onClick={() => navigate('/passbook')}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-800 font-bold uppercase tracking-widest transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          [ Back to Customer Search List ]
        </button>
      </div>

      {/* TOP PANEL: Customer Account Profile */}
      <div className="w-full bg-white border-y-2 border-dashed border-slate-400 py-6 px-4">
        <div className="text-center font-bold text-slate-800 tracking-widest uppercase mb-4">
          CUSTOMER ACCOUNT PROFILE
        </div>
        <div className="border-t-2 border-dashed border-slate-400 pt-6 flex flex-col md:flex-row justify-between gap-6">
          <div className="flex gap-6">
            <div className="w-32 h-32 border-2 border-slate-300 flex flex-col items-center justify-center bg-slate-50 text-slate-400 font-bold text-xs uppercase text-center shrink-0">
              <User className="w-12 h-12 mb-2 text-slate-600" />
              [ HIGH-RES PHOTO ]
            </div>
            <div className="flex flex-col space-y-1">
              <div className="flex gap-2">
                <span className="text-slate-500 w-36">Account Number:</span>
                <span className="font-bold text-slate-800">{accountNumber}</span>
              </div>
              <div className="flex gap-2">
                <span className="text-slate-500 w-36">Full Name:</span>
                <span className="text-slate-800">{mockProfile.fullName}</span>
              </div>
              <div className="flex gap-2">
                <span className="text-slate-500 w-36">Father's Name:</span>
                <span className="text-slate-800">{mockProfile.fathersName}</span>
              </div>
              <div className="flex gap-2">
                <span className="text-slate-500 w-36">Village/Area:</span>
                <span className="text-slate-800">{mockProfile.village}</span>
              </div>
              <div className="flex gap-2">
                <span className="text-slate-500 w-36">Phone Number:</span>
                <span className="text-slate-800">{mockProfile.phone}</span>
              </div>
            </div>
          </div>
          <div className="flex flex-col md:text-right mt-4 md:mt-0">
            <span className="text-slate-500 mb-1">Current Net Balance:</span>
            <span className="text-2xl font-bold text-slate-800">₹{mockProfile.currentBalance}</span>
          </div>
        </div>
      </div>

      {/* ACTION PANEL: Deposit & Withdrawal */}
      <div className="w-full border-y-2 border-dashed border-slate-400 py-6 px-4 grid grid-cols-1 md:grid-cols-2 gap-8 bg-white relative">
        
        {isSubmitting && (
          <div className="absolute inset-0 bg-white/70 flex items-center justify-center z-10">
            <div className="flex items-center gap-2 font-bold text-slate-800 tracking-widest uppercase">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600" /> EXECUTING TRANSACTION...
            </div>
          </div>
        )}

        {/* Deposit Column */}
        <div className="space-y-4">
          <div className="font-bold text-slate-800 flex items-center gap-2 uppercase tracking-widest">
            [ <Download className="w-5 h-5 text-green-600" /> DEPOSIT CASH ]
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-600">Amount (₹):</span>
            <span className="text-slate-500 font-bold">[</span>
            <input
              type="number"
              placeholder="Enter Amount"
              value={depositAmount}
              onChange={(e) => setDepositAmount(e.target.value)}
              disabled={isSubmitting}
              className="w-32 bg-transparent focus:outline-none focus:text-blue-600 text-slate-800 text-center placeholder-slate-400 disabled:opacity-50"
            />
            <span className="text-slate-500 font-bold">]</span>
          </div>
          <button 
            onClick={() => handleTransactionSubmit('DEPOSIT')}
            disabled={isSubmitting}
            className="font-bold text-green-700 hover:text-green-900 transition-colors tracking-widest uppercase mt-2 disabled:opacity-50"
          >
            [ BUTTON: EXECUTE DEPOSIT ]
          </button>
        </div>

        {/* Withdrawal Column */}
        <div className="space-y-4">
          <div className="font-bold text-slate-800 flex items-center gap-2 uppercase tracking-widest">
            [ <Upload className="w-5 h-5 text-red-600" /> WITHDRAW CASH ]
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-600">Amount (₹):</span>
            <span className="text-slate-500 font-bold">[</span>
            <input
              type="number"
              placeholder="Enter Amount"
              value={withdrawAmount}
              onChange={(e) => setWithdrawAmount(e.target.value)}
              disabled={isSubmitting}
              className="w-32 bg-transparent focus:outline-none focus:text-red-600 text-slate-800 text-center placeholder-slate-400 disabled:opacity-50"
            />
            <span className="text-slate-500 font-bold">]</span>
          </div>
          <button 
            onClick={() => handleTransactionSubmit('WITHDRAWAL')}
            disabled={isSubmitting}
            className="font-bold text-red-700 hover:text-red-900 transition-colors tracking-widest uppercase mt-2 disabled:opacity-50"
          >
            [ BUTTON: EXECUTE WITHDRAWAL ]
          </button>
        </div>

      </div>

      {/* BOTTOM PORTION: Chronological Passbook Grid */}
      <div className="w-full bg-white border-y-2 border-dashed border-slate-400">
        <div className="text-center font-bold text-slate-800 tracking-widest uppercase py-4 border-b-2 border-dashed border-slate-400 flex items-center justify-center gap-2">
          COMPLETE TRANSACTION PASSBOOK HISTORY {isLoading && <Loader2 className="w-4 h-4 animate-spin text-slate-400" />}
        </div>
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse min-w-max">
            <thead>
              <tr className="border-b-2 border-dashed border-slate-400 text-slate-700">
                <th className="py-3 px-4 font-semibold border-r border-dashed border-slate-400 tracking-wider">Date & Time</th>
                <th className="py-3 px-4 font-semibold border-r border-dashed border-slate-400 tracking-wider">Transaction Type</th>
                <th className="py-3 px-4 font-semibold border-r border-dashed border-slate-400 tracking-wider">Amount (INR)</th>
                <th className="py-3 px-4 font-semibold border-r border-dashed border-slate-400 tracking-wider">Running Balance</th>
                <th className="py-3 px-4 font-semibold tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody>
              {transactions.length === 0 && !isLoading ? (
                <tr>
                  <td colSpan="5" className="text-center py-8 text-slate-500 font-bold uppercase tracking-widest">
                    NO TRANSACTIONS FOUND
                  </td>
                </tr>
              ) : (
                transactions.map((tx) => (
                  <tr key={tx.id} className="border-b border-dashed border-slate-400 hover:bg-slate-50">
                    <td className="py-3 px-4 border-r border-dashed border-slate-400 text-slate-800 whitespace-nowrap">
                      {tx.timestamp}
                    </td>
                    <td className="py-3 px-4 border-r border-dashed border-slate-400">
                      <span className={`font-bold ${tx.type === 'DEPOSIT' ? 'text-green-600' : 'text-red-600'}`}>
                        {tx.type}
                      </span>
                    </td>
                    <td className="py-3 px-4 border-r border-dashed border-slate-400 text-slate-800">
                      ₹{tx.amount}
                    </td>
                    <td className="py-3 px-4 border-r border-dashed border-slate-400 text-slate-800">
                      {tx.runningBalance && tx.runningBalance !== 'PENDING' ? `₹${tx.runningBalance}` : tx.runningBalance}
                    </td>
                    <td className="py-3 px-4 text-slate-800">
                      {tx.status}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
