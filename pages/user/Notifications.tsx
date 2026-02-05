import React, { useEffect, useState } from 'react';
import { mockBackend } from '../../services/mockBackend';
import { useAuth } from '../../contexts/AuthContext';
import { AppNotification } from '../../types';
import { Bell, Clock, User } from 'lucide-react';

const Notifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNotifs = async () => {
      if (user) {
        const data = await mockBackend.getNotifications(user.email);
        setNotifications(data);
        setLoading(false);
      }
    };
    fetchNotifs();
    
    // Poll occasionally
    const interval = setInterval(fetchNotifs, 30000);
    return () => clearInterval(interval);
  }, [user]);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Bell className="text-indigo-600 w-8 h-8" />
        <h2 className="text-2xl font-bold text-slate-800">Notifications</h2>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-500">Loading alerts...</div>
      ) : notifications.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-sm">
            <Bell className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-700">No Notifications</h3>
            <p className="text-slate-500 mt-2">You're all caught up! Check back later for updates.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {notifications.map((notif) => (
            <div key={notif.id} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow relative overflow-hidden">
               {notif.isAdmin && (
                   <div className={`absolute top-0 right-0 text-white text-[10px] uppercase font-bold px-2 py-1 rounded-bl-lg ${notif.targetEmail ? 'bg-orange-600' : 'bg-indigo-600'}`}>
                       {notif.targetEmail ? 'Private Message' : 'Admin Broadcast'}
                   </div>
               )}
               <div className="flex gap-4">
                   <div className="mt-1">
                       <div className={`w-10 h-10 rounded-full flex items-center justify-center ${notif.targetEmail ? 'bg-orange-50 text-orange-600' : 'bg-indigo-50 text-indigo-600'}`}>
                           {notif.targetEmail ? <User className="w-5 h-5" /> : <Bell className="w-5 h-5" />}
                       </div>
                   </div>
                   <div className="flex-1">
                       <h3 className="text-lg font-bold text-slate-900">{notif.title}</h3>
                       <p className="text-slate-600 mt-1 leading-relaxed">{notif.message}</p>
                       <div className="flex items-center gap-1 mt-3 text-xs text-slate-400">
                           <Clock className="w-3 h-3" />
                           {new Date(notif.date).toLocaleDateString()} at {new Date(notif.date).toLocaleTimeString()}
                       </div>
                   </div>
               </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Notifications;