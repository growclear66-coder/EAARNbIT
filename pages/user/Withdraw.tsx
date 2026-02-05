import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { mockBackend } from '../../services/mockBackend';
import { SystemConfig, WithdrawalRequest, WithdrawalStatus } from '../../types';
import { AlertCircle, IndianRupee, Loader2, History, Check, X, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Withdraw = () => {
  const { user, refreshUser } = useAuth();
  const [amount, setAmount] = useState('');
  const [upiId, setUpiId] = useState('');
  const [config, setConfig] = useState<SystemConfig | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [history, setHistory] = useState<WithdrawalRequest[]>([]);
  
  const navigate = useNavigate();

  const fetchHistory = async () => {
    if(user) {
        const data = await mockBackend.getUserWithdrawals(user.id);
        setHistory(data);
    }
  };

  useEffect(() => {
    mockBackend.getSystemConfig().then(setConfig);
    fetchHistory();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !config) return;
    setError('');
    setSuccessMsg('');

    const val = parseFloat(amount);
    if (isNaN(val) || val < config.minWithdrawalAmount) {
      setError(`Minimum withdrawal amount is ₹${config.minWithdrawalAmount}`);
      return;
    }
    if (val > user.balance) {
      setError('Insufficient balance');
      return;
    }

    setLoading(true);
    try {
      const res = await mockBackend.createWithdrawal(user.id, val, upiId);
      if (res.success) {
        await refreshUser();
        setSuccessMsg(res.message || 'Success');
        setAmount('');
        setUpiId('');
        // Refresh history to show new pending request
        await fetchHistory();
        alert(res.message);
      } else {
        setError(res.message || 'Failed');
      }
    } catch (err) {
      setError('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: WithdrawalStatus) => {
      switch(status) {
          case WithdrawalStatus.APPROVED:
              return <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded-full text-xs font-bold flex items-center w-fit gap-1"><Check size={10}/> Approved</span>;
          case WithdrawalStatus.REJECTED:
               return <span className="bg-red-100 text-red-800 px-2 py-0.5 rounded-full text-xs font-bold flex items-center w-fit gap-1"><X size={10}/> Rejected</span>;
          default:
               return <span className="bg-orange-100 text-orange-800 px-2 py-0.5 rounded-full text-xs font-bold flex items-center w-fit gap-1"><Clock size={10}/> Pending</span>;
      }
  };

  if (!user || !config) return <div className="p-8 text-center">Loading config...</div>;

  return (
    <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* LEFT COLUMN: Withdrawal Form */}
      <div>
          <h2 className="text-2xl font-bold text-slate-800 mb-6">Withdraw Funds</h2>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
            <div className="flex items-center justify-between mb-8 p-4 bg-slate-50 rounded-xl border border-slate-100">
                <div>
                    <p className="text-sm text-slate-500">Available Balance</p>
                    <p className="text-2xl font-bold text-slate-800">₹{user.balance.toFixed(2)}</p>
                </div>
                 <div className="h-10 w-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600">
                    <IndianRupee size={20} />
                </div>
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6 flex items-center gap-2">
                <AlertCircle size={20} />
                {error}
              </div>
            )}

            {successMsg && (
              <div className="bg-green-50 text-green-700 p-4 rounded-lg mb-6">
                {successMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Amount (₹)</label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  placeholder={`Min ₹${config.minWithdrawalAmount}`}
                  min={config.minWithdrawalAmount}
                  required
                />
                <p className="text-xs text-slate-500 mt-1">Minimum withdrawal: ₹{config.minWithdrawalAmount}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">UPI ID</label>
                <input
                  type="text"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  placeholder="example@upi"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-lg transition-colors disabled:opacity-50 flex justify-center items-center gap-2"
              >
                {loading && <Loader2 className="animate-spin w-5 h-5" />}
                {loading ? 'Processing...' : 'Submit Withdrawal Request'}
              </button>
            </form>
          </div>

          <div className="mt-6 text-center text-sm text-slate-500">
            <p>Withdrawals are typically processed within 24-48 hours.</p>
          </div>
      </div>

      {/* RIGHT COLUMN: History */}
      <div>
           <div className="flex items-center gap-2 mb-6">
                <History className="text-slate-400" />
                <h2 className="text-2xl font-bold text-slate-800">History</h2>
           </div>
           
           <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden min-h-[400px]">
               {history.length === 0 ? (
                   <div className="flex flex-col items-center justify-center h-full p-8 text-slate-400">
                       <History className="w-12 h-12 mb-2 opacity-20" />
                       <p>No withdrawal history yet.</p>
                   </div>
               ) : (
                   <div className="overflow-x-auto">
                       <table className="w-full text-left border-collapse">
                           <thead className="bg-slate-50 border-b border-slate-200">
                               <tr>
                                   <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Date</th>
                                   <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Amount</th>
                                   <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Status</th>
                               </tr>
                           </thead>
                           <tbody className="divide-y divide-slate-100">
                               {history.map((req) => (
                                   <tr key={req.id} className="hover:bg-slate-50 transition-colors">
                                       <td className="px-4 py-3">
                                           <div className="text-sm font-medium text-slate-700">{new Date(req.date).toLocaleDateString()}</div>
                                           <div className="text-xs text-slate-400">{new Date(req.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                                       </td>
                                       <td className="px-4 py-3">
                                           <div className="text-sm font-bold text-slate-900">₹{req.amount}</div>
                                           <div className="text-xs text-slate-400 font-mono">{req.upiId}</div>
                                       </td>
                                       <td className="px-4 py-3">
                                           {getStatusBadge(req.status)}
                                       </td>
                                   </tr>
                               ))}
                           </tbody>
                       </table>
                   </div>
               )}
           </div>
      </div>
    </div>
  );
};

export default Withdraw;