import React, { useEffect, useState } from 'react';
import { mockBackend } from '../../services/mockBackend';
import { WithdrawalRequest, WithdrawalStatus } from '../../types';
import { Check, X, Clock, AlertTriangle, Loader2, RefreshCw } from 'lucide-react';

const WithdrawalManagement = () => {
  const [requests, setRequests] = useState<WithdrawalRequest[]>([]);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const fetchRequests = async () => {
    try {
      const data = await mockBackend.getAllWithdrawals();
      setRequests(data);
    } catch (e) {
      console.error("Failed to fetch withdrawals", e);
    }
  };

  useEffect(() => {
    fetchRequests();
    const interval = setInterval(fetchRequests, 5000); // Polling more frequently
    return () => clearInterval(interval);
  }, []);

  const handleAction = async (id: string, approve: boolean) => {
    setLoadingId(id);
    try {
        const res = await mockBackend.processWithdrawal(id, approve);
        if (res.success) {
            // Success: Wait a moment then refresh
            await fetchRequests(); 
        } else {
            // Show specific error from backend (e.g., "User not found")
            alert(`Error: ${res.message}`);
        }
    } catch (e) {
        console.error(e);
        alert('An unexpected error occurred while processing the request.');
    } finally {
        setLoadingId(null);
    }
  };

  const getStatusBadge = (status: WithdrawalStatus) => {
    switch(status) {
        case WithdrawalStatus.APPROVED:
            return <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-bold flex items-center w-fit gap-1"><Check size={12}/> Approved</span>;
        case WithdrawalStatus.REJECTED:
             return <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-bold flex items-center w-fit gap-1"><X size={12}/> Rejected</span>;
        default:
             return <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded-full text-xs font-bold flex items-center w-fit gap-1"><Clock size={12}/> Pending</span>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-slate-800">Withdrawal Requests</h2>
          <button 
            onClick={fetchRequests} 
            className="flex items-center gap-1 text-sm text-indigo-600 hover:underline hover:text-indigo-800 transition-colors"
          >
            <RefreshCw className="w-4 h-4" /> Refresh List
          </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">User</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Amount</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">UPI ID</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Date</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Status</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {requests.length === 0 ? (
                <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-slate-500">No withdrawal requests found.</td>
                </tr>
              ) : (
                requests.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 text-sm text-slate-900">
                        <div className="font-medium">{req.userEmail}</div>
                        <div className="text-xs text-slate-400">ID: {req.userId}</div>
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-slate-900">₹{req.amount}</td>
                    <td className="px-6 py-4 text-sm font-mono text-slate-600">
                        <span className="bg-slate-100 px-2 py-1 rounded select-all">{req.upiId}</span>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500">{new Date(req.date).toLocaleDateString()} {new Date(req.date).toLocaleTimeString()}</td>
                    <td className="px-6 py-4">{getStatusBadge(req.status)}</td>
                    <td className="px-6 py-4">
                      {req.status === WithdrawalStatus.PENDING ? (
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => handleAction(req.id, true)}
                            disabled={loadingId !== null}
                            className={`p-3 rounded-lg border flex items-center justify-center transition-all ${
                                loadingId === req.id 
                                ? 'bg-green-100 border-green-200 cursor-wait' 
                                : loadingId !== null 
                                    ? 'bg-slate-50 border-slate-200 opacity-50 cursor-not-allowed'
                                    : 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100 hover:shadow-md cursor-pointer'
                            }`}
                            title="Approve"
                          >
                            {loadingId === req.id ? <Loader2 className="w-5 h-5 animate-spin text-green-700" /> : <Check className="w-5 h-5" />}
                          </button>
                          
                          <button
                            type="button"
                            onClick={() => handleAction(req.id, false)}
                            disabled={loadingId !== null}
                            className={`p-3 rounded-lg border flex items-center justify-center transition-all ${
                                loadingId !== null 
                                    ? 'bg-slate-50 border-slate-200 opacity-50 cursor-not-allowed'
                                    : 'bg-red-50 border-red-200 text-red-700 hover:bg-red-100 hover:shadow-md cursor-pointer'
                            }`}
                            title="Reject & Refund"
                          >
                             <X className="w-5 h-5" />
                          </button>
                        </div>
                      ) : (
                          <span className="text-xs text-slate-400 italic font-medium">Processed</span>
                      )}
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
};

export default WithdrawalManagement;