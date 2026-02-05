import React, { useEffect, useState } from 'react';
import { mockBackend } from '../../services/mockBackend';
import { User } from '../../types';
import { Search, Ban, Unlock, Image as ImageIcon, X, Edit2, Save, Loader2, Trash2 } from 'lucide-react';

const UserManagement = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal State
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [viewingUserProofs, setViewingUserProofs] = useState<User | null>(null);

  // Edit Form State
  const [editBalance, setEditBalance] = useState('');
  const [editTotalEarned, setEditTotalEarned] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const fetchUsers = async () => {
    const data = await mockBackend.getAllUsers();
    setUsers(data);
    return data;
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleOpenEdit = (user: User) => {
    setSelectedUser(user);
    setEditBalance(user.balance.toString());
    setEditTotalEarned(user.totalEarned.toString());
    setIsEditModalOpen(true);
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    setIsSaving(true);
    const balance = parseFloat(editBalance);
    const totalEarned = parseFloat(editTotalEarned);

    if (!isNaN(balance) && !isNaN(totalEarned)) {
        await mockBackend.updateUserDetails(selectedUser.id, {
            balance,
            totalEarned
        });
        await fetchUsers();
        setIsEditModalOpen(false);
        setSelectedUser(null);
    }
    setIsSaving(false);
  };

  const handleBlockToggle = async (user: User) => {
    await mockBackend.toggleBlockUser(user.id);
    // Update local state immediately for better UX
    if(selectedUser && selectedUser.id === user.id) {
        setSelectedUser({...selectedUser, isBlocked: !selectedUser.isBlocked});
    }
    fetchUsers();
  };

  const handleDeleteImage = async (userId: string, index: number) => {
      if(!window.confirm("Are you sure you want to delete this image? This action cannot be undone.")) return;
      
      const res = await mockBackend.deleteUserImage(userId, index);
      if(res.success) {
          // Re-fetch everything to ensure synchronization
          const updatedUsers = await fetchUsers();
          
          // Force update the local modal state with the FRESH user object from the backend
          const freshUser = updatedUsers.find(u => u.id === userId);
          if (freshUser) {
              setViewingUserProofs(freshUser);
          } else {
              setViewingUserProofs(null); // Close if user somehow disappeared
          }
      } else {
          alert("Failed to delete image: " + res.message);
      }
  };

  const filteredUsers = users.filter(u => u.email.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <h2 className="text-2xl font-bold text-slate-800">User Management</h2>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search users..."
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">User</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Wallet</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Total Earned</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Proofs</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Status</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.length === 0 ? (
                <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-slate-500">No users found.</td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-slate-900">{u.email}</div>
                      <div className="text-xs text-slate-400">ID: {u.id}</div>
                    </td>
                    <td className="px-6 py-4">
                       <span className="text-sm font-bold text-slate-700">₹{u.balance.toFixed(2)}</span>
                    </td>
                    <td className="px-6 py-4">
                       <span className="text-sm font-medium text-slate-500">₹{u.totalEarned.toFixed(2)}</span>
                    </td>
                    <td className="px-6 py-4">
                        {u.affiliateImages && u.affiliateImages.length > 0 ? (
                            <button onClick={() => setViewingUserProofs(u)} className="flex items-center gap-1 text-xs text-indigo-600 hover:underline">
                                <ImageIcon className="w-3 h-3" /> View ({u.affiliateImages.length})
                            </button>
                        ) : (
                            <span className="text-xs text-slate-400">None</span>
                        )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        u.isBlocked ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                      }`}>
                        {u.isBlocked ? 'Blocked' : 'Active'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleOpenEdit(u)}
                        className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-xs font-medium transition-colors"
                      >
                         <Edit2 className="w-3 h-3"/> Manage
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit User Modal */}
      {isEditModalOpen && selectedUser && (
          <div className="fixed inset-0 bg-black/50 z-40 flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                  <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
                      <h3 className="text-lg font-bold text-slate-800">Manage User</h3>
                      <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5"/></button>
                  </div>
                  
                  <form onSubmit={handleSaveUser} className="p-6 space-y-4">
                      <div>
                          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">User Email</label>
                          <input type="text" value={selectedUser.email} disabled className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-500 text-sm cursor-not-allowed"/>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Wallet Balance (₹)</label>
                            <input 
                                type="number" 
                                step="0.01"
                                value={editBalance} 
                                onChange={e => setEditBalance(e.target.value)}
                                className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-slate-800"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Total Earned (₹)</label>
                            <input 
                                type="number" 
                                step="0.01"
                                value={editTotalEarned} 
                                onChange={e => setEditTotalEarned(e.target.value)}
                                className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none text-slate-600"
                            />
                        </div>
                      </div>

                      <div className="pt-2">
                        <label className="flex items-center justify-between p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50">
                            <span className="text-sm font-medium text-slate-700">Account Status</span>
                            <button 
                                type="button"
                                onClick={() => handleBlockToggle(selectedUser)}
                                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${selectedUser.isBlocked ? 'bg-red-500' : 'bg-green-500'}`}
                            >
                                <span className="sr-only">Use setting</span>
                                <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${selectedUser.isBlocked ? 'translate-x-5' : 'translate-x-0'}`} />
                            </button>
                        </label>
                        <p className="text-xs text-slate-400 mt-1 text-right">{selectedUser.isBlocked ? 'User is Blocked' : 'User is Active'}</p>
                      </div>

                      <div className="pt-4 flex gap-3">
                          <button 
                            type="button" 
                            onClick={() => setIsEditModalOpen(false)}
                            className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-50 transition-colors"
                          >
                              Cancel
                          </button>
                          <button 
                            type="submit" 
                            disabled={isSaving}
                            className="flex-1 px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors flex justify-center items-center gap-2"
                          >
                              {isSaving ? <Loader2 className="animate-spin w-4 h-4"/> : <Save className="w-4 h-4"/>}
                              Save Changes
                          </button>
                      </div>
                  </form>
              </div>
          </div>
      )}

      {/* View Proofs Gallery Modal */}
      {viewingUserProofs && (
        <div className="fixed inset-0 bg-black/90 z-50 flex flex-col p-4" onClick={() => setViewingUserProofs(null)}>
             <div className="flex justify-between items-center mb-4 text-white">
                 <h3 className="text-xl font-bold">Proof Gallery: {viewingUserProofs.email}</h3>
                 <button onClick={() => setViewingUserProofs(null)} className="p-2 hover:bg-white/10 rounded-full"><X className="w-6 h-6"/></button>
             </div>
             
             <div className="flex-1 overflow-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 p-4" onClick={e => e.stopPropagation()}>
                {viewingUserProofs.affiliateImages && viewingUserProofs.affiliateImages.length > 0 ? (
                    viewingUserProofs.affiliateImages.map((img, idx) => (
                        <div key={`${viewingUserProofs.id}-${idx}`} className="relative bg-slate-800 rounded-lg overflow-hidden border border-slate-700 shadow-2xl h-80 flex flex-col">
                             <div className="flex-1 flex items-center justify-center p-2">
                                <img src={img} alt={`Proof ${idx}`} className="max-w-full max-h-full object-contain" />
                             </div>
                             
                             {/* Always visible action bar for better accessibility on mobile */}
                             <div className="bg-slate-900/90 p-3 flex justify-between items-center border-t border-slate-700">
                                 <span className="text-white text-xs px-2 py-1 rounded bg-slate-700">
                                     {idx + 1} / {viewingUserProofs.affiliateImages.length}
                                 </span>
                                 <button 
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        handleDeleteImage(viewingUserProofs.id, idx);
                                    }}
                                    className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg flex items-center gap-2 font-medium text-sm transition-colors"
                                 >
                                     <Trash2 className="w-4 h-4" /> Delete
                                 </button>
                             </div>
                        </div>
                    ))
                ) : (
                    <div className="col-span-full text-center text-slate-500 py-10 flex flex-col items-center">
                        <ImageIcon className="w-12 h-12 mb-2 opacity-50"/>
                        <p>No images uploaded by this user.</p>
                    </div>
                )}
             </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;