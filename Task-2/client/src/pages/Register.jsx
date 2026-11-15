import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AuthLayout from '../components/AuthLayout';
import { Field, Spinner } from '../components/ui';
import { PasswordInput } from './Login';
import api, { errorMessage, fieldErrors } from '../lib/axios';

// The same rules as the server — checking here just gives instant feedback.
const validate = (f) => {
  const errors = {};
  if (f.name.trim().length < 2) errors.name = 'Enter your full name';
  if (!/^\S+@\S+\.\S+$/.test(f.email.trim())) errors.email = 'Enter a valid email address';
  if (f.password.length < 6) errors.password = 'Password must be at least 6 characters';
  if (f.confirm !== f.password) errors.confirm = 'Passwords do not match';
  return errors;
};

export default function Register() {
  const navigate = useNavigate();
  const from = useLocation().state?.from;
  const { login, isAuthenticated } = useAuth();

  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  if (isAuthenticated && !loading) return <Navigate to={from || '/dashboard'} replace />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const found = validate(form);
    setErrors(found);
    setFormError('');
    if (Object.keys(found).length) return;

    setLoading(true);
    try {
      const { data } = await api.post('/api/auth/register', { name: form.name, email: form.email, password: form.password });
      login(data);
      navigate(from || '/dashboard', { replace: true });
    } catch (err) {
      const fields = fieldErrors(err);
      if (Object.keys(fields).length) setErrors(fields);
      else if (err.response?.status === 409) setErrors({ email: errorMessage(err) });
      else setFormError(errorMessage(err, 'Registration failed. Please try again.')); // e.g. the server is not running
    } finally {
      setLoading(false);
    }
  };

  const cls = (key) => `input ${errors[key] ? 'input-error' : ''}`;

  return (
    <AuthLayout title="Create your account" subtitle="It takes less than a minute"
      footer={<>Already have an account? <Link to="/login" state={{ from }} className="text-ink underline underline-offset-2">Sign in</Link></>}>
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        {formError && <p role="alert" className="bg-danger-soft border border-red-200 text-danger text-sm rounded-lg px-3 py-2">{formError}</p>}
        <Field label="Full name" error={errors.name}>
          <input className={cls('name')} value={form.name} onChange={set('name')} autoComplete="name" />
        </Field>
        <Field label="Email" error={errors.email}>
          <input type="email" className={cls('email')} placeholder="you@example.com" value={form.email} onChange={set('email')} autoComplete="email" />
        </Field>
        <Field label="Password" error={errors.password} hint="At least 6 characters">
          <PasswordInput value={form.password} onChange={set('password')} error={errors.password} autoComplete="new-password" />
        </Field>
        <Field label="Confirm password" error={errors.confirm}>
          <PasswordInput value={form.confirm} onChange={set('confirm')} error={errors.confirm} autoComplete="new-password" />
        </Field>
        <button type="submit" disabled={loading} className="btn-primary w-full !py-2.5">
          {loading && <Spinner />} {loading ? 'Creating account…' : 'Create account'}
        </button>
      </form>
    </AuthLayout>
  );
}
