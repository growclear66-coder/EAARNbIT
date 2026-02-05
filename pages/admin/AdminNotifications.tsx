import React, { useState } from 'react';
import { mockBackend } from '../../services/mockBackend';
import { Send, Bell, CheckCircle, AlertTriangle, Users, User } from 'lucide-react';

const AdminNotifications = () => {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [targetType, setTargetType] = useState<'all' | 'single'>('all');
  const [targetEmail, setTargetEmail] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [statusMsg, setStatusMsg] = useState('');

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !message) return;
    if (targetType === 'single' && !targetEmail) return;

    setLoading(true);
    setStatus('idle');
    setStatusMsg('');

    try {
      const emailToSend = targetType === 'single' ? targetEmail : undefined;
      const res = await mockBackend.sendNotification(title, message, emailToSend);
      
      if (res.success) {
          setStatus('success');
          setTitle('');
          setMessage('');
          setTargetEmail('');
          setStatusMsg(targetType === 'all' ? 'Broadcast sent to all users.' : `Notification sent to ${targetEmail}`);
          setTimeout(() => setStatus('idle'), 3000);
      } else {
          setStatus('error');
          setStatusMsg(res.message || 'Failed to send notification.');
      }
    } catch (e) {
      console.error(e);
      setStatus('error');
      setStatusMsg('An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2">
        <Send className="text-indigo-600" /> Send Notification
      </h2>

      <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
        
        {/* Type Selection */}
        <div className="grid grid-cols-2 gap-4 mb-8">
            <button 
                type="button"
                onClick={() => setTargetType('all')}
                className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${
                    targetType === 'all' 
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-700' 
                    : 'border-slate-100 hover:border-slate-200 text-slate-500'
                }`}
            >
                <Users className={`w-6 h-6 mb-2 ${targetType === 'all' ? 'text-indigo-600' : 'text-slate-400'}`} />
                <span className="font-bold text-sm">All Users</span>
            </button>
            <button 
                type="button"
                onClick={() => setTargetType('single')}
                className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${
                    targetType === 'single' 
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-700' 
                    : 'border-slate-100 hover:border-slate-200 text-slate-500'
                }`}
            >
                <User className={`w-6 h-6 mb-2 ${targetType === 'single' ? 'text-indigo-600' : 'text-slate-400'}`} />
                <span className="font-bold text-sm">Specific User</span>
            </button>
        </div>

        <div className="flex items-start gap-4 mb-8 p-4 bg-slate-50 rounded-xl border border-slate-100">
             <Bell className="text-slate-400 shrink-0 mt-1" />
             <div>
                 <h4 className="font-bold text-slate-700">
                    {targetType === 'all' ? 'Broadcast Mode' : 'Direct Message Mode'}
                 </h4>
                 <p className="text-sm text-slate-500 mt-1">
                    {targetType === 'all' 
                        ? 'This message will be visible to ALL registered users immediately.' 
                        : 'This message will ONLY be visible to the user with the email address you provide below.'}
                 </p>
             </div>
        </div>

        {status === 'success' && (
             <div className="mb-6 p-4 bg-green-50 text-green-700 rounded-lg flex items-center gap-2">
                 <CheckCircle className="w-5 h-5"/> {statusMsg}
             </div>
        )}
        
        {status === 'error' && (
             <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg flex items-center gap-2">
                 <AlertTriangle className="w-5 h-5"/> {statusMsg}
             </div>
        )}

        <form onSubmit={handleSend} className="space-y-6">
          
          {targetType === 'single' && (
              <div className="animate-in fade-in slide-in-from-top-2 duration-200">
                <label className="block text-sm font-medium text-slate-700 mb-1">Target User Email</label>
                <input
                  type="email"
                  value={targetEmail}
                  onChange={(e) => setTargetEmail(e.target.value)}
                  placeholder="user@example.com"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required={targetType === 'single'}
                />
              </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={targetType === 'all' ? "e.g. Weekend Bonus Live!" : "e.g. Account Verification"}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Message Body</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Enter your detailed message here..."
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 h-32"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? 'Sending...' : (
                <>
                    <Send className="w-5 h-5" /> 
                    {targetType === 'all' ? 'Send Broadcast' : 'Send Private Message'}
                </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminNotifications;