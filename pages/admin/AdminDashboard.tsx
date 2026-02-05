import React, { useEffect, useState } from 'react';
import { mockBackend } from '../../services/mockBackend';
import { Users, Wallet, FileText, Clock } from 'lucide-react';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalUserBalance: 0,
    totalWithdrawals: 0,
    pendingWithdrawals: 0
  });

  useEffect(() => {
    const fetchStats = async () => {
      const data = await mockBackend.getDashboardStats();
      setStats(data);
    };
    fetchStats();
    // Poll for updates every 5 seconds
    const interval = setInterval(fetchStats, 5000);
    return () => clearInterval(interval);
  }, []);

  const cards = [
    { label: 'Total Users', value: stats.totalUsers, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Users Wallet Balance', value: `₹${stats.totalUserBalance.toFixed(2)}`, icon: Wallet, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Total Requests', value: stats.totalWithdrawals, icon: FileText, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'Pending Withdrawals', value: stats.pendingWithdrawals, icon: Clock, color: 'text-orange-600', bg: 'bg-orange-50' },
  ];

  return (
    <div>
      <h2 className="text-2xl font-bold text-slate-800 mb-6">Admin Dashboard</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card, idx) => {
           const Icon = card.icon;
           return (
             <div key={idx} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
               <div className="flex justify-between items-start">
                 <div>
                    <p className="text-sm font-medium text-slate-500">{card.label}</p>
                    <p className="text-2xl font-bold text-slate-900 mt-2">{card.value}</p>
                 </div>
                 <div className={`p-3 rounded-xl ${card.bg} ${card.color}`}>
                    <Icon className="w-6 h-6" />
                 </div>
               </div>
             </div>
           );
        })}
      </div>

      <div className="mt-8 bg-white p-8 rounded-2xl shadow-sm border border-slate-200 text-center">
         <h3 className="text-lg font-semibold text-slate-700">Real-time System Monitor</h3>
         <p className="text-slate-500 mt-2">All system activities are tracked and updated live.</p>
      </div>
    </div>
  );
};

export default AdminDashboard;