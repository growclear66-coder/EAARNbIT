import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../types';

const Settings = () => {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <div className="max-w-xl">
      <h2 className="text-2xl font-bold text-slate-800 mb-6">Account Settings</h2>
      
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-6">
         <div>
             <label className="block text-sm font-medium text-slate-500">Email Address</label>
             <p className="text-lg font-medium text-slate-900">{user.email}</p>
         </div>

         <div>
             <label className="block text-sm font-medium text-slate-500">Account Type</label>
             <p className="text-lg font-medium text-slate-900 capitalize">{user.role.toLowerCase()}</p>
         </div>
         
         {user.role === UserRole.USER && (
             <div>
                <label className="block text-sm font-medium text-slate-500">User ID</label>
                <code className="text-sm bg-slate-100 px-2 py-1 rounded">{user.id}</code>
             </div>
         )}
      </div>
      
      <div className="mt-8">
          <p className="text-xs text-slate-400 text-center">Version 1.0.0 &bull; EarnBit Inc.</p>
      </div>
    </div>
  );
};

export default Settings;