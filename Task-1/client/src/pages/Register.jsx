import React, { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import { Field, Spinner } from '../components/ui';
import { AuthCard, PasswordInput } from './Login';
import api, { errorMessage, fieldErrors } from '../lib/axios';
import { usePageTitle } from '../hooks';

// Mirrors the server's password rule; returns a message or null.
export const passwordProblem = (password) => {
  if (password.length < 8) return 'Password must be at least 8 characters';
  if (!/[A-Za-z]/.test(password)) return 'Password must contain a letter';
  if (!/\d/.test(password)) return 'Password must contain a number';
  return null;
};

const validate = (f) => {
  const errors = {};
  if (f.name.trim().length < 2) errors.name = 'Enter your full name';
  if (!/^\S+@\S+\.\S+$/.test(f.email.trim())) errors.email = 'Enter a valid email address';
  const problem = passwordProblem(f.password);
  if (problem) errors.password = problem;
  if (f.confirm !== f.password) errors.confirm = 'Passwords do not match';
  return errors;
};

export default function Register() {
  usePageTitle('Create account');
  const { user, login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const from = useLocation().state?.from;

  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const set = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  if (user && !loading) return <Navigate to={from || '/'} replace />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const found = validate(form);
    setErrors(found);
    if (Object.keys(found).length) return;

    setLoading(true);
    try {
      const { data } = await api.post('/auth/register', { name: form.name, email: form.email, password: form.password });
      login(data.token, data.user);
      showToast('Account created — welcome to ShopIndi!', 'success');
      navigate(from || '/', { replace: true });
    } catch (err) {
      const fields = fieldErrors(err);
      setErrors(Object.keys(fields).length ? fields : { email: errorMessage(err, 'Registration failed') });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthCard title="Create your account" subtitle="It takes less than a minute"
      footer={<>Already have an account? <Link to="/login" state={{ from }} className="font-semibold text-midnight underline hover:text-vividGold">Log in</Link></>}>
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <Field label="Full name" error={errors.name}>
          <input id="reg-name" className={`input ${errors.name ? 'input-error' : ''}`} value={form.name} onChange={set('name')} autoComplete="name" />
        </Field>
        <Field label="Email" error={errors.email}>
          <input id="reg-email" type="email" className={`input ${errors.email ? 'input-error' : ''}`} placeholder="you@example.com" value={form.email} onChange={set('email')} autoComplete="email" />
        </Field>
        <Field label="Password" error={errors.password} hint="At least 8 characters, with a letter and a number">
          <PasswordInput id="reg-password" value={form.password} onChange={set('password')} error={errors.password} autoComplete="new-password" />
        </Field>
        <Field label="Confirm password" error={errors.confirm}>
          <PasswordInput id="reg-confirm" value={form.confirm} onChange={set('confirm')} error={errors.confirm} autoComplete="new-password" />
        </Field>
        <button type="submit" disabled={loading} className="btn-primary w-full !py-3">
          {loading && <Spinner className="w-4 h-4" />} Create account
        </button>
      </form>
    </AuthCard>
  );
}
