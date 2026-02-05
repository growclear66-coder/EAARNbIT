import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { mockBackend } from '../../services/mockBackend';
import { SystemConfig } from '../../types';
import { Wallet, TrendingUp, ArrowUpRight, Copy, CheckCircle, Image as ImageIcon } from 'lucide-react';
import { Link } from 'react-router-dom';

const UserDashboard = () => {
  const { user, refreshUser } = useAuth();
  const [config, setConfig] = useState<SystemConfig | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    refreshUser();
    mockBackend.getSystemConfig().then(setConfig);
  }, [refreshUser]);

  const copyLink = async () => {
    if (!config?.globalAffiliateLink) return;

    try {
      await navigator.clipboard.writeText(config.globalAffiliateLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      try {
        const textArea = document.createElement("textarea");
        textArea.value = config.globalAffiliateLink;
        textArea.style.position = "fixed"; 
        textArea.style.left = "-9999px";
        textArea.style.top = "0";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err2) {
        console.error('Failed to copy', err2);
        alert("Unable to copy automatically. Please select the text and copy manually.");
      }
    }
  };

  if (!user) return null;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800">Dashboard</h2>
        <span className="text-sm text-slate-500">Last updated: Just now</span>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-white/20 rounded-lg">
              <Wallet className="w-6 h-6" />
            </div>
            <span className="text-xs bg-white/20 px-2 py-1 rounded-full">Available</span>
          </div>
          <h3 className="text-slate-100 text-sm font-medium">Wallet Balance</h3>
          <p className="text-3xl font-bold mt-1">₹{user.balance.toFixed(2)}</p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
          <div className="flex justify-between items-start mb-4">
             <div className="p-2 bg-green-50 rounded-lg text-green-600">
              <TrendingUp className="w-6 h-6" />
            </div>
          </div>
          <h3 className="text-slate-500 text-sm font-medium">Total Earned</h3>
          <p className="text-3xl font-bold mt-1 text-slate-900">₹{user.totalEarned.toFixed(2)}</p>
        </div>
        
         <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
          <div className="flex justify-between items-start mb-4">
             <div className="p-2 bg-orange-50 rounded-lg text-orange-600">
              <ArrowUpRight className="w-6 h-6" />
            </div>
          </div>
          <h3 className="text-slate-500 text-sm font-medium">Withdrawal Status</h3>
           <p className="text-lg font-semibold mt-2 text-slate-900">Active</p>
           <Link to="/withdraw" className="text-sm text-indigo-600 hover:underline mt-1 block">Request Withdrawal &rarr;</Link>
        </div>
      </div>

      {/* Affiliate Section */}
      {config && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-100">
            <h3 className="text-lg font-bold text-slate-800">Affiliate Program</h3>
            <p className="text-slate-500 text-sm mt-1">Share the link below to earn rewards.</p>
          </div>
          <div className="p-6">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col md:flex-row gap-4 items-center justify-between">
              <code className="text-slate-600 text-sm font-mono break-all select-all">{config.globalAffiliateLink}</code>
              <button 
                onClick={copyLink}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shrink-0"
              >
                {copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copied' : 'Copy Link'}
              </button>
            </div>
            {config.globalAffiliateMessage && (
              <div className="mt-4 p-4 bg-indigo-50 text-indigo-800 rounded-lg text-sm border border-indigo-100">
                <span className="font-semibold">Note from Admin:</span> {config.globalAffiliateMessage}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Uploaded Images Preview */}
      {user.affiliateImages && user.affiliateImages.length > 0 && (
         <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-indigo-600" />
                Your Uploaded Proofs
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {user.affiliateImages.slice(0, 5).map((img, idx) => (
                    <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border border-slate-100 group">
                         <img src={img} alt={`Proof ${idx + 1}`} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                    </div>
                ))}
                {user.affiliateImages.length > 5 && (
                    <div className="aspect-square rounded-lg bg-slate-50 flex items-center justify-center border border-slate-200 text-slate-500 font-medium">
                        +{user.affiliateImages.length - 5} more
                    </div>
                )}
            </div>
         </div>
      )}
    </div>
  );
};

export default UserDashboard;