import React, { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import { Field, Spinner } from '../components/ui';
import { SoftSpotlightBackdrop } from '../components/motion/backgrounds';
import Reveal from '../components/motion/Reveal';
import BorderBeam from '../components/motion/BorderBeam';
import api, { errorMessage } from '../lib/axios';
import { usePageTitle } from '../hooks';

// Shared frame for the login and register pages.
export function AuthCard({ title, subtitle, children, footer }) {
  return (
    <div className="relative min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12 overflow-hidden">
      <SoftSpotlightBackdrop />
      <Reveal inView={false} className="relative w-full max-w-md card p-8 shadow-xl">
        <BorderBeam size={120} duration={8} />
        <div className="text-center mb-8">
          <p className="text-vividGold font-extrabold text-2xl">ShopIndi</p>
          <h1 className="text-2xl font-bold text-midnight mt-3">{title}</h1>
          <p className="text-smoke text-sm mt-1">{subtitle}</p>
        </div>
        {children}
        <p className="text-smoke text-sm text-center mt-6">{footer}</p>
      </Reveal>
    </div>
  );
}

export function PasswordInput({ value, onChange, error, autoComplete, id }) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <input id={id} type={visible ? 'text' : 'password'} value={value} onChange={onChange} autoComplete={autoComplete}
        className={`input pr-11 ${error ? 'input-error' : ''}`} />
      <button type="button" onClick={() => setVisible((v) => !v)} aria-label={visible ? 'Hide password' : 'Show password'}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-smoke hover:text-midnight">
        {visible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
    </div>
  );
}

export default function Login() {
  usePageTitle('Log in');
  const { user, login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from; // the page that sent the visitor here

  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const landing = (u) => from || (u.role === 'admin' ? '/admin' : '/');
  if (user && !loading) return <Navigate to={landing(user)} replace />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email.trim() || !form.password) return setError('Enter your email and password');
    setLoading(true);
    setError('');
    try {
      const { data } = await api.post('/auth/login', form);
      login(data.token, data.user);
      showToast(`Welcome back, ${data.user.name.split(' ')[0]}!`, 'success');
      navigate(landing(data.user), { replace: true });
    } catch (err) {
      setError(errorMessage(err, 'Login failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthCard title="Welcome back" subtitle="Log in to your ShopIndi account"
      footer={<>New here? <Link to="/register" state={{ from }} className="font-semibold text-midnight underline hover:text-vividGold">Create an account</Link></>}>
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        {error && <p role="alert" className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-2.5">{error}</p>}
        <Field label="Email">
          <input id="login-email" type="email" className="input" placeholder="you@example.com" value={form.email} onChange={set('email')} autoComplete="email" />
        </Field>
        <Field label="Password">
          <PasswordInput id="login-password" value={form.password} onChange={set('password')} autoComplete="current-password" />
        </Field>
        <button type="submit" disabled={loading} className="btn-primary w-full !py-3">
          {loading && <Spinner className="w-4 h-4" />} Log in
        </button>
      </form>
    </AuthCard>
  );
}
