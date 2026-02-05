import React, { useEffect, useState, useRef } from 'react';
import { mockBackend } from '../../services/mockBackend';
import { SupportChat, ChatMessage } from '../../types';
import { Search, MessageCircle, Send, User, Shield, Loader2 } from 'lucide-react';

const AdminSupportChat = () => {
  const [chats, setChats] = useState<SupportChat[]>([]);
  const [selectedChat, setSelectedChat] = useState<SupportChat | null>(null);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const fetchAllChats = async () => {
    const data = await mockBackend.getAllSupportChats();
    setChats(data);
    
    // If a chat is selected, update its messages live
    if (selectedChat) {
        const updatedSelected = data.find(c => c.userId === selectedChat.userId);
        if (updatedSelected) {
            // Only update if message count changed to avoid jitter, or just update messages
            if(updatedSelected.messages.length !== selectedChat.messages.length) {
                setSelectedChat(updatedSelected);
            }
        }
    }
  };

  useEffect(() => {
    fetchAllChats();
    const interval = setInterval(fetchAllChats, 3000);
    return () => clearInterval(interval);
  }, [selectedChat]); // dep on selectedChat to ensure logic inside works

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedChat]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !selectedChat) return;

    setSending(true);
    await mockBackend.sendMessage(selectedChat.userId, input, 'admin');
    setInput('');
    // Manually update UI for instant feedback
    const newMessage: ChatMessage = { sender: 'admin', text: input, timestamp: Date.now() };
    const updatedChat = { ...selectedChat, messages: [...selectedChat.messages, newMessage] };
    setSelectedChat(updatedChat);
    
    setSending(false);
  };

  return (
    <div className="flex h-[calc(100vh-8rem)] bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Sidebar List */}
      <div className={`w-full md:w-80 border-r border-slate-200 flex flex-col ${selectedChat ? 'hidden md:flex' : 'flex'}`}>
         <div className="p-4 border-b border-slate-200 bg-slate-50">
             <h3 className="font-bold text-slate-800 mb-2">Inbox</h3>
             <div className="relative">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"/>
                 <input type="text" placeholder="Search email..." className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none"/>
             </div>
         </div>
         <div className="flex-1 overflow-y-auto">
             {chats.length === 0 ? (
                 <div className="p-8 text-center text-slate-400">No active chats</div>
             ) : (
                 chats.map(chat => (
                     <div 
                        key={chat.userId} 
                        onClick={() => setSelectedChat(chat)}
                        className={`p-4 border-b border-slate-100 cursor-pointer hover:bg-slate-50 transition-colors ${selectedChat?.userId === chat.userId ? 'bg-indigo-50 border-l-4 border-l-indigo-600' : ''}`}
                     >
                         <div className="flex justify-between mb-1">
                             <span className="font-medium text-slate-900 text-sm truncate w-32">{chat.userEmail}</span>
                             <span className="text-[10px] text-slate-400">{new Date(chat.lastUpdated).toLocaleDateString()}</span>
                         </div>
                         <p className={`text-xs truncate ${chat.lastSender === 'user' ? 'font-bold text-slate-800' : 'text-slate-500'}`}>
                            {chat.lastSender === 'user' ? 'Create: ' : 'You: '}
                            {chat.messages[chat.messages.length - 1]?.text}
                         </p>
                     </div>
                 ))
             )}
         </div>
      </div>

      {/* Chat Window */}
      <div className={`flex-1 flex flex-col ${!selectedChat ? 'hidden md:flex' : 'flex'}`}>
         {selectedChat ? (
             <>
                <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-white">
                    <div className="flex items-center gap-3">
                         <button onClick={() => setSelectedChat(null)} className="md:hidden text-slate-500">← Back</button>
                         <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center">
                             <User className="text-slate-500 w-5 h-5" />
                         </div>
                         <div>
                             <h3 className="font-bold text-slate-800">{selectedChat.userEmail}</h3>
                             <p className="text-xs text-slate-500">User ID: {selectedChat.userId}</p>
                         </div>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
                    {selectedChat.messages.map((msg, idx) => {
                        const isAdmin = msg.sender === 'admin';
                        return (
                            <div key={idx} className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}>
                                <div className={`flex items-end gap-2 max-w-[80%] ${isAdmin ? 'flex-row-reverse' : 'flex-row'}`}>
                                     <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${isAdmin ? 'bg-orange-100' : 'bg-indigo-100'}`}>
                                        {isAdmin ? <Shield className="w-4 h-4 text-orange-600" /> : <User className="w-4 h-4 text-indigo-600" />}
                                    </div>
                                    <div className={`p-3 rounded-2xl text-sm ${isAdmin ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-white border border-slate-200 text-slate-800 rounded-bl-none'}`}>
                                        <p>{msg.text}</p>
                                        <p className={`text-[10px] mt-1 text-right ${isAdmin ? 'text-indigo-200' : 'text-slate-400'}`}>
                                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                    <div ref={bottomRef} />
                </div>

                <form onSubmit={handleSend} className="p-4 bg-white border-t border-slate-200 flex gap-2">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Reply as Admin..."
                        className="flex-1 bg-slate-50 border border-slate-300 rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <button 
                        type="submit" 
                        disabled={sending || !input.trim()}
                        className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white p-2 rounded-full transition-colors w-10 h-10 flex items-center justify-center"
                    >
                        {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5 ml-0.5" />}
                    </button>
                </form>
             </>
         ) : (
             <div className="flex-1 flex flex-col items-center justify-center text-slate-400 bg-slate-50">
                 <MessageCircle className="w-16 h-16 mb-4 opacity-20" />
                 <p>Select a conversation to start chatting</p>
             </div>
         )}
      </div>
    </div>
  );
};

export default AdminSupportChat;