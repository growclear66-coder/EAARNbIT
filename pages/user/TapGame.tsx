import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { mockBackend } from '../../services/mockBackend';
import { Gamepad2, Timer, Coins, IndianRupee, Wifi } from 'lucide-react';

const TapGame = () => {
  const { user, login, refreshUser } = useAuth();
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [isTapping, setIsTapping] = useState(false);
  const [msg, setMsg] = useState('');
  
  // --- BATCHING STATE ---
  // Stores taps locally before sending to server
  const pendingTapsRef = useRef(0);
  
  // Local state for INSTANT UI updates (Optimistic UI)
  const [displayCoins, setDisplayCoins] = useState(0);
  const [displaySession, setDisplaySession] = useState(0);
  
  // Sync status
  const [isSyncing, setIsSyncing] = useState(false);

  // Initialize display state from user data when component loads
  useEffect(() => {
    if (user) {
        // Only update from user prop if we are NOT currently syncing/tapping to avoid visual jitter
        if (pendingTapsRef.current === 0 && !isSyncing) {
            setDisplayCoins(user.coins);
            setDisplaySession(user.sessionTaps);
        }
    }
  }, [user, isSyncing]);

  if (!user) return null;

  // Timer logic for cooldown (Runs every second)
  useEffect(() => {
    const checkTimer = () => {
      if (user.cooldownUntil) {
        const now = Date.now();
        const diff = user.cooldownUntil - now;
        if (diff > 0) {
          setTimeLeft(diff);
        } else {
          setTimeLeft(null);
        }
      } else {
        setTimeLeft(null);
      }
    };
    checkTimer();
    const interval = setInterval(checkTimer, 1000);
    return () => clearInterval(interval);
  }, [user.cooldownUntil]);

  // --- BATCHING SYNC LOGIC ---
  // Sends taps to server every 5 seconds (Super Fast UI + Low Data Usage)
  useEffect(() => {
      const syncInterval = setInterval(async () => {
          if (pendingTapsRef.current > 0) {
              const tapsToSend = pendingTapsRef.current;
              
              // 1. Reset local counter immediately so new taps start counting for next batch
              pendingTapsRef.current = 0; 
              setIsSyncing(true);

              try {
                  // 2. Send accumulated taps to backend
                  const response = await mockBackend.registerTap(user.id, tapsToSend);
                  
                  if (response.success && response.data) {
                      // 3. Update Global Auth State with server response
                      login(response.data); 
                      
                      if (response.message) {
                          setMsg(response.message);
                          setTimeout(() => setMsg(''), 3000);
                      }
                  } else {
                      // 4. Error Handling (e.g., Limit Reached)
                      if (response.message) setMsg(response.message);
                      // Force refresh to rollback invalid UI state
                      await refreshUser();
                  }
              } catch (err) {
                  console.error("Sync failed", err);
                  // Optional: Add taps back to pending if network failed? 
                  // For now, we drop them to prevent sync loops, user loses a few seconds of progress only.
              } finally {
                  setIsSyncing(false);
              }
          }
      }, 5000); // Sync every 5 seconds

      return () => clearInterval(syncInterval);
  }, [user.id, login, refreshUser]);

  const handleTap = () => {
    if (timeLeft !== null) return; // Block if cooldown is active
    
    // 1. Visual Animation
    setIsTapping(true);
    setTimeout(() => setIsTapping(false), 80);

    // 2. Optimistic UI Update (Instant Feedback)
    setDisplayCoins(prev => prev + 1);
    setDisplaySession(prev => {
        const newVal = prev + 1;
        // Cap visual progress at 1000 so user knows limit is hit
        return newVal > 1000 ? 1000 : newVal;
    });

    // 3. Add to Batch Queue (Processed by useEffect above)
    pendingTapsRef.current += 1;
  };

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const progress = Math.min((displaySession / 1000) * 100, 100);

  return (
    <div className="max-w-md mx-auto text-center space-y-8">
      <div className="flex flex-col items-center">
         <div className="p-3 bg-indigo-100 text-indigo-600 rounded-full mb-4">
             <Gamepad2 className="w-8 h-8" />
         </div>
         <h2 className="text-3xl font-bold text-slate-800">TAP-TAP</h2>
         <p className="text-slate-500 mt-1">Tap the button to earn coins!</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 relative overflow-hidden">
              <p className="text-xs text-slate-500 uppercase font-semibold">Coins</p>
              <div className="flex items-center justify-center gap-2 mt-1">
                  <Coins className="w-5 h-5 text-yellow-500" />
                  <span className="text-2xl font-bold text-slate-800">{displayCoins}</span>
              </div>
              {/* Sync Indicator */}
              {isSyncing && (
                  <div className="absolute top-1 right-1 flex items-center gap-1">
                      <Wifi className="w-3 h-3 text-indigo-400 animate-pulse"/>
                  </div>
              )}
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
              <p className="text-xs text-slate-500 uppercase font-semibold">Balance</p>
              <div className="flex items-center justify-center gap-1 mt-1">
                  <IndianRupee className="w-5 h-5 text-green-600" />
                  <span className="text-2xl font-bold text-slate-800">{user.balance.toFixed(2)}</span>
              </div>
          </div>
      </div>

      <div className="relative pt-4">
         {timeLeft !== null ? (
             <div className="bg-orange-50 border border-orange-200 rounded-2xl p-8 flex flex-col items-center animate-in fade-in">
                 <Timer className="w-12 h-12 text-orange-500 mb-4 animate-pulse" />
                 <h3 className="text-xl font-bold text-orange-800">Cooldown Active</h3>
                 <p className="text-orange-600 mb-4">You hit the 1000 tap limit!</p>
                 <div className="text-4xl font-mono font-bold text-orange-900">
                     {formatTime(timeLeft)}
                 </div>
                 <p className="text-xs text-orange-400 mt-4">Wait for the timer to reset.</p>
             </div>
         ) : (
             <button
                onClick={handleTap}
                className={`w-64 h-64 rounded-full shadow-xl flex flex-col items-center justify-center transition-all duration-75 select-none touch-manipulation
                    ${isTapping 
                        ? 'bg-indigo-700 scale-95 shadow-inner' 
                        : 'bg-indigo-600 hover:bg-indigo-500 scale-100 hover:scale-105 active:scale-95'
                    }
                `}
                style={{ WebkitTapHighlightColor: 'transparent' }}
             >
                 <span className="text-4xl font-bold text-white pointer-events-none">TAP!</span>
                 <span className="text-indigo-200 text-sm mt-2 pointer-events-none">+1 Coin</span>
             </button>
         )}
      </div>
      
      {msg && (
          <div className="bg-green-100 text-green-800 px-4 py-2 rounded-lg font-medium animate-bounce">
              {msg}
          </div>
      )}

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-slate-600">Session Limit</span>
              <span className="text-xs bg-slate-100 px-2 py-1 rounded text-slate-500">{displaySession} / 1000</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
              <div 
                className={`h-2.5 rounded-full transition-all duration-300 ${progress > 90 ? 'bg-orange-500' : 'bg-indigo-600'}`} 
                style={{ width: `${progress}%` }}
              ></div>
          </div>
          <div className="mt-4 text-xs text-slate-400 flex justify-between">
              <span>Auto-saves every 5 seconds</span>
              <span>1000 Coins = ₹1</span>
          </div>
      </div>
    </div>
  );
};

export default TapGame;