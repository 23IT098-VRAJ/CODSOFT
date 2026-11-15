import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import AuthLayout from '../components/AuthLayout';
import { Field, Spinner } from '../components/ui';
import { IconSwap } from '../components/motion';
import api, { errorMessage } from '../lib/axios';

export function PasswordInput({ value, onChange, error, autoComplete, placeholder }) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <input type={visible ? 'text' : 'password'} value={value} onChange={onChange} autoComplete={autoComplete} placeholder={placeholder}
        className={`input pr-10 ${error ? 'input-error' : ''}`} />
      <button type="button" onClick={() => setVisible((v) => !v)} aria-label={visible ? 'Hide password' : 'Show password'}
        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted hover:text-ink">
        <IconSwap swapKey={visible ? 'hide' : 'show'}>{visible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</IconSwap>
      </button>
    </div>
  );
}

export default function Login() {
  const navigate = useNavigate();
  const from = useLocation().state?.from; // the page that sent the visitor here
  const { login, isAuthenticated } = useAuth();

  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  if (isAuthenticated && !loading) return <Navigate to={from || '/dashboard'} replace />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email.trim() || !form.password) return setError('Enter your email and password');
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/api/auth/login', form);
      login(data);
      navigate(from || '/dashboard', { replace: true });
    } catch (err) {
      setError(errorMessage(err, 'Login failed. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Welcome back" subtitle="Sign in to your workspace"
      footer={<>Don&apos;t have an account? <Link to="/register" state={{ from }} className="text-ink underline underline-offset-2">Sign up</Link></>}>
      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        {error && <p role="alert" className="bg-danger-soft border border-red-200 text-danger text-sm rounded-lg px-3 py-2">{error}</p>}
        <Field label="Email">
          <input type="email" className="input" placeholder="you@example.com" value={form.email} onChange={set('email')} autoComplete="email" />
        </Field>
        <Field label="Password">
          <PasswordInput value={form.password} onChange={set('password')} autoComplete="current-password" placeholder="••••••••" />
        </Field>
        <button type="submit" disabled={loading} className="btn-primary w-full !py-2.5">
          {loading && <Spinner />} {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </AuthLayout>
  );
}
