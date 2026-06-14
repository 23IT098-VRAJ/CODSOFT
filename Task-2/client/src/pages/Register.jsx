import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../lib/axios';

export default function Register() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/api/auth/register', {
        name: form.name,
        email: form.email,
        password: form.password,
      });
      login(res.data);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F6F4] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <p className="text-lg font-semibold tracking-tight text-[#1A1917] mb-1">TaskFlow</p>
          <p className="text-sm text-[#8A8680] mb-6">Create your account</p>
        </div>

        {/* Card */}
        <div className="bg-white border border-[#E5E2DC] rounded-xl p-8 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-medium tracking-widest uppercase text-[#8A8680] mb-1.5">Full Name</label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full bg-[#F7F6F4] border border-[#E5E2DC] rounded-lg px-3 py-2.5 text-sm text-[#1A1917] placeholder:text-[#BAB6B0] focus:border-[#1A1917] focus:outline-none focus:ring-1 focus:ring-[#1A1917] focus:bg-white transition-all"
                placeholder="John Doe"
              />
            </div>

            <div>
              <label className="block text-xs font-medium tracking-widest uppercase text-[#8A8680] mb-1.5">Email</label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full bg-[#F7F6F4] border border-[#E5E2DC] rounded-lg px-3 py-2.5 text-sm text-[#1A1917] placeholder:text-[#BAB6B0] focus:border-[#1A1917] focus:outline-none focus:ring-1 focus:ring-[#1A1917] focus:bg-white transition-all"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="block text-xs font-medium tracking-widest uppercase text-[#8A8680] mb-1.5">Password</label>
              <input
                type="password"
                required
                minLength={6}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full bg-[#F7F6F4] border border-[#E5E2DC] rounded-lg px-3 py-2.5 text-sm text-[#1A1917] placeholder:text-[#BAB6B0] focus:border-[#1A1917] focus:outline-none focus:ring-1 focus:ring-[#1A1917] focus:bg-white transition-all"
                placeholder="Minimum 6 characters"
              />
            </div>

            <div>
              <label className="block text-xs font-medium tracking-widest uppercase text-[#8A8680] mb-1.5">Confirm Password</label>
              <input
                type="password"
                required
                value={form.confirmPassword}
                onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                className="w-full bg-[#F7F6F4] border border-[#E5E2DC] rounded-lg px-3 py-2.5 text-sm text-[#1A1917] placeholder:text-[#BAB6B0] focus:border-[#1A1917] focus:outline-none focus:ring-1 focus:ring-[#1A1917] focus:bg-white transition-all"
                placeholder="Re-enter your password"
              />
            </div>

            {error && (
              <p className="text-[#7F1D1D] text-xs mt-1">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#1A1917] text-white text-sm font-medium py-2.5 rounded-lg hover:bg-[#2E2C2A] transition-colors disabled:opacity-40 flex items-center justify-center gap-2"
            >
              {loading && (
                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                </svg>
              )}
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-sm text-[#8A8680] mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-[#1A1917] underline underline-offset-2">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
