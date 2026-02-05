import React, { useEffect, useState } from 'react';
import { mockBackend } from '../../services/mockBackend';
import { SystemConfig } from '../../types';
import { Save } from 'lucide-react';

const AdminSettings = () => {
  const [config, setConfig] = useState<SystemConfig | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    mockBackend.getSystemConfig().then(setConfig);
  }, []);

  const handleChange = (field: keyof SystemConfig, value: string | number) => {
    if (config) {
      setConfig({ ...config, [field]: value });
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!config) return;

    setLoading(true);
    await mockBackend.updateSystemConfig(config);
    setLoading(false);
    setMessage('Settings updated successfully!');
    setTimeout(() => setMessage(''), 3000);
  };

  if (!config) return <div>Loading...</div>;

  return (
    <div className="max-w-2xl">
      <h2 className="text-2xl font-bold text-slate-800 mb-6">App Configuration</h2>

      {message && (
        <div className="bg-green-50 text-green-700 p-4 rounded-lg mb-6">
          {message}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h3 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2">Global Affiliate Settings</h3>
            
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Affiliate Link</label>
                    <input
                        type="text"
                        value={config.globalAffiliateLink}
                        onChange={(e) => handleChange('globalAffiliateLink', e.target.value)}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <p className="text-xs text-slate-500 mt-1">This link will be visible to all users on their dashboard.</p>
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Custom Message</label>
                    <textarea
                        value={config.globalAffiliateMessage}
                        onChange={(e) => handleChange('globalAffiliateMessage', e.target.value)}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 h-24"
                    />
                    <p className="text-xs text-slate-500 mt-1">Message displayed below the affiliate link.</p>
                </div>
            </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h3 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2">Withdrawal Controls</h3>
             <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Minimum Withdrawal Amount (₹)</label>
                <input
                    type="number"
                    value={config.minWithdrawalAmount}
                    onChange={(e) => handleChange('minWithdrawalAmount', parseInt(e.target.value))}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
            </div>
        </div>

        <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
        >
            <Save className="w-5 h-5" />
            {loading ? 'Saving...' : 'Save Changes'}
        </button>
      </form>
    </div>
  );
};

export default AdminSettings;