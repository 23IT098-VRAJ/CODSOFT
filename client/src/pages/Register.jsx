import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import api from '../lib/axios';

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirm) return showToast('Passwords do not match', 'error');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/register', { name: form.name, email: form.email, password: form.password });
      login(data.token, data.user);
      showToast('Account created! 🎉', 'success');
      navigate('/');
    } catch (err) {
      showToast(err.response?.data?.message || 'Registration failed', 'error');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">
        <div className="relative bg-pureWhite border border-parchment rounded-2xl p-6 shadow-sm p-8 shadow-2xl shadow-black/50">
          <div className="text-center mb-8">
            <div className="w-14 h-14 bg-gradient-to-br from-navy to-navy-hover rounded-2xl flex items-center justify-center text-2xl mx-auto mb-4 shadow-lg shadow-violet-500/30">
              ✨
            </div>
            <h1 className="text-2xl font-bold text-midnight">Create account</h1>
            <p className="text-smoke text-sm mt-1">Join thousands of happy shoppers</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {[
              { k: 'name', label: 'Full Name', type: 'text', ph: 'John Doe' },
              { k: 'email', label: 'Email', type: 'email', ph: 'you@example.com' },
              { k: 'password', label: 'Password', type: 'password', ph: '••••••••' },
              { k: 'confirm', label: 'Confirm Password', type: 'password', ph: '••••••••' },
            ].map(({ k, label, type, ph }) => (
              <div key={k}>
                <label className="text-xs text-smoke font-medium mb-1.5 block uppercase tracking-wider">{label}</label>
                <input id={`reg-${k}`} type={type} placeholder={ph} value={form[k]}
                  onChange={set(k)} className="bg-pureWhite border border-parchment text-bodyInk rounded-xl px-4 py-2.5 outline-none focus:border-vividGold focus:ring-1 focus:ring-vividGold w-full" required />
              </div>
            ))}
            <button type="submit" disabled={loading}
              className="bg-vividGold text-midnight font-semibold rounded-full px-5 py-2 hover:opacity-90 transition text-center inline-flex items-center justify-center w-full py-3 text-sm mt-2">
              {loading ? 'Creating account…' : 'Create Account'}
            </button>
          </form>

          <p className="text-smoke text-sm text-center mt-6">
            Already have an account?{' '}
            <button onClick={() => navigate('/login')}
              className="text-vividGold hover:text-vividGold font-medium transition">
              Sign in
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
