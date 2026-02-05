import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { mockBackend } from '../../services/mockBackend';
import { ChatMessage, SupportChat } from '../../types';
import { Send, User as UserIcon, Shield, MessageCircle, Loader2 } from 'lucide-react';

const HelpSupport = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const fetchChat = async () => {
    if (!user) return;
    const chat = await mockBackend.getSupportChat(user.id);
    if (chat && chat.messages) {
      setMessages(chat.messages);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchChat();
    // Poll for new messages every 3 seconds
    const interval = setInterval(fetchChat, 3000);
    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !user) return;

    setSending(true);
    await mockBackend.sendMessage(user.id, input, 'user', user.email);
    setInput('');
    await fetchChat(); // Instant refresh
    setSending(false);
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="bg-indigo-600 p-4 text-white flex items-center gap-3">
        <MessageCircle className="w-6 h-6" />
        <div>
          <h2 className="font-bold text-lg">Support Chat</h2>
          <p className="text-indigo-100 text-xs">Direct line to admin support</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
        {loading && messages.length === 0 ? (
          <div className="flex justify-center items-center h-full">
            <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center text-slate-400 mt-10">
            <p>Start a conversation with us!</p>
          </div>
        ) : (
          messages.map((msg, idx) => {
            const isUser = msg.sender === 'user';
            return (
              <div key={idx} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                <div className={`flex items-end gap-2 max-w-[80%] ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${isUser ? 'bg-indigo-100' : 'bg-orange-100'}`}>
                    {isUser ? <UserIcon className="w-4 h-4 text-indigo-600" /> : <Shield className="w-4 h-4 text-orange-600" />}
                  </div>
                  <div className={`p-3 rounded-2xl text-sm ${isUser ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-white border border-slate-200 text-slate-800 rounded-bl-none'}`}>
                    <p>{msg.text}</p>
                    <p className={`text-[10px] mt-1 text-right ${isUser ? 'text-indigo-200' : 'text-slate-400'}`}>
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSend} className="p-4 bg-white border-t border-slate-200 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message..."
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
    </div>
  );
};

export default HelpSupport;