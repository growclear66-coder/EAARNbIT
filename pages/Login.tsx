import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { mockBackend } from '../services/mockBackend';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../types';
import { Database } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await mockBackend.login(email, password);
      
      // 🔥 SUPER ADMIN AUTO-FIX
      // If the admin tries to login but gets "Invalid email or password" (meaning user doesn't exist yet in Firebase),
      // we try to register them on the spot.
      if (!response.success && response.message === 'Invalid email or password.' && email.trim().toLowerCase() === 'knockout15310@gmail.com') {
          console.log("Admin account not found during login. Attempting auto-registration...");
          const regResponse = await mockBackend.register(email, password);
          if (regResponse.success && regResponse.data) {
              login(regResponse.data);
              navigate('/admin/dashboard');
              return;
          } else {
               // If registration failed
               setError(regResponse.message || 'Admin Auto-Creation Failed');
               setLoading(false);
               return;
          }
      }

      if (response.success && response.data) {
        login(response.data);
        if (response.data.role === UserRole.ADMIN) {
          navigate('/admin/dashboard');
        } else {
          navigate('/dashboard');
        }
      } else {
        setError(response.message || 'Login failed');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 relative">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-2xl mx-auto mb-4">E</div>
          <h1 className="text-2xl font-bold text-slate-900">Welcome Back</h1>
          <p className="text-slate-500">Sign in to your EarnBit account</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-4 border border-red-100">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
              placeholder="you@example.com"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-50"
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-600">
          Don't have an account?{' '}
          <Link to="/register" className="text-indigo-600 font-semibold hover:underline">
            Create Wallet
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;