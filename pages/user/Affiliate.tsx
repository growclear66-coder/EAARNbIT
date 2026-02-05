import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { mockBackend } from '../../services/mockBackend';
import { SystemConfig } from '../../types';
import { Copy, Upload, CheckCircle, Image as ImageIcon } from 'lucide-react';

const Affiliate = () => {
  const { user, refreshUser } = useAuth();
  const [config, setConfig] = useState<SystemConfig | null>(null);
  const [copied, setCopied] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  useEffect(() => {
    mockBackend.getSystemConfig().then(setConfig);
  }, []);

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

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0] && user) {
      const file = e.target.files[0];
      
      // Limit size to avoid LocalStorage explosion (2MB limit for demo)
      if (file.size > 2 * 1024 * 1024) {
          alert("File too large. Please select an image under 2MB.");
          return;
      }

      setUploading(true);
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        await mockBackend.uploadAffiliateImage(user.id, base64);
        await refreshUser();
        setUploading(false);
        // Reset input
        e.target.value = '';
      };
      reader.readAsDataURL(file);
    }
  };

  if (!config || !user) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-slate-800">Affiliate Zone</h2>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <h3 className="text-lg font-bold text-slate-800 mb-2">Your Affiliate Link</h3>
        <p className="text-slate-500 text-sm mb-4">Share this link to grow your network.</p>
        
        <div className="flex flex-col sm:flex-row gap-3">
            <input 
                type="text" 
                readOnly 
                value={config.globalAffiliateLink} 
                className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-slate-600 focus:outline-none"
            />
             <button 
                onClick={copyLink}
                className="flex items-center justify-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                {copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copied' : 'Copy'}
              </button>
        </div>
         {config.globalAffiliateMessage && (
            <div className="mt-4 p-4 bg-blue-50 text-blue-800 rounded-lg border border-blue-100 text-sm">
            {config.globalAffiliateMessage}
            </div>
        )}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <h3 className="text-lg font-bold text-slate-800 mb-4">Upload Proofs</h3>
        <p className="text-slate-500 text-sm mb-6">Upload screenshots or images related to your affiliate activities.</p>

        <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:bg-slate-50 transition-colors cursor-pointer relative mb-8">
            <input 
                type="file" 
                accept="image/*"
                onChange={handleFileChange}
                disabled={uploading}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
            />
            <div className="flex flex-col items-center">
                <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mb-3">
                    {uploading ? <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div> : <Upload className="w-6 h-6" />}
                </div>
                <p className="font-medium text-slate-700">{uploading ? 'Uploading...' : 'Click to upload image'}</p>
                <p className="text-xs text-slate-400 mt-1">PNG, JPG up to 2MB. You can upload multiple times.</p>
            </div>
        </div>

        {user.affiliateImages && user.affiliateImages.length > 0 && (
            <div>
                <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                    <ImageIcon className="w-4 h-4" /> My Uploads ({user.affiliateImages.length})
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {user.affiliateImages.map((img, idx) => (
                         <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border border-slate-200 group">
                            <img src={img} alt={`Proof ${idx + 1}`} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors"></div>
                        </div>
                    ))}
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default Affiliate;