import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import api from '../lib/axios';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', { email, password });
      login(data.token, data.user);
      showToast('Welcome back! 👋', 'success');
      navigate(data.user.role === 'admin' ? '/admin' : '/');
    } catch (err) {
      showToast(err.response?.data?.message || 'Login failed', 'error');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">
        {/* Glow bg */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-96 h-96 bg-violet-600/10 rounded-full blur-3xl" />
        </div>

        <div className="relative bg-pureWhite border border-parchment rounded-2xl p-6 shadow-sm p-8 shadow-2xl shadow-black/50">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-14 h-14 bg-gradient-to-br from-navy to-navy-hover rounded-2xl flex items-center justify-center text-2xl mx-auto mb-4 shadow-lg shadow-violet-500/30">
              🛍️
            </div>
            <h1 className="text-2xl font-bold text-midnight">Welcome back</h1>
            <p className="text-smoke text-sm mt-1">Sign in to your ShopIndi account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs text-smoke font-medium mb-1.5 block uppercase tracking-wider">Email</label>
              <input id="login-email" type="email" placeholder="you@example.com" value={email}
                onChange={(e) => setEmail(e.target.value)} className="bg-pureWhite border border-parchment text-bodyInk rounded-xl px-4 py-2.5 outline-none focus:border-vividGold focus:ring-1 focus:ring-vividGold w-full" required />
            </div>
            <div>
              <label className="text-xs text-smoke font-medium mb-1.5 block uppercase tracking-wider">Password</label>
              <input id="login-password" type="password" placeholder="••••••••" value={password}
                onChange={(e) => setPassword(e.target.value)} className="bg-pureWhite border border-parchment text-bodyInk rounded-xl px-4 py-2.5 outline-none focus:border-vividGold focus:ring-1 focus:ring-vividGold w-full" required />
            </div>
            <button type="submit" disabled={loading}
              className="bg-vividGold text-midnight font-semibold rounded-full px-5 py-2 hover:opacity-90 transition text-center inline-flex items-center justify-center w-full py-3 text-sm mt-2">
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          <p className="text-smoke text-sm text-center mt-6">
            Don't have an account?{' '}
            <button onClick={() => navigate('/register')}
              className="text-vividGold hover:text-vividGold font-medium transition">
              Create one free
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
