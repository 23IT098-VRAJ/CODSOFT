import React, { useState } from 'react';
import { KeyRound, UserRound } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import { Field, Spinner } from '../components/ui';
import api, { errorMessage, fieldErrors } from '../lib/axios';
import { usePageTitle } from '../hooks';
import { formatDate } from '../lib/format';
import { passwordProblem } from './Register';

function DetailsForm() {
  const { user, updateUser } = useAuth();
  const { showToast } = useToast();
  const [name, setName] = useState(user.name);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (name.trim().length < 2) return setError('Name must be at least 2 characters');
    setSaving(true);
    try {
      const { data } = await api.put('/auth/me', { name });
      updateUser(data.user);
      setError('');
      showToast('Profile updated', 'success');
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} noValidate className="card p-6 space-y-4">
      <h2 className="font-bold text-midnight text-lg flex items-center gap-2"><UserRound className="w-5 h-5 text-vividGold" /> Your details</h2>
      <Field label="Full name" error={error}>
        <input className={`input ${error ? 'input-error' : ''}`} value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
      </Field>
      <Field label="Email" hint="Email cannot be changed">
        <input className="input bg-warmIvory text-smoke" value={user.email} disabled />
      </Field>
      <button type="submit" disabled={saving || name.trim() === user.name} className="btn-dark">
        {saving && <Spinner className="w-4 h-4" />} Save changes
      </button>
    </form>
  );
}

function PasswordForm() {
  const { showToast } = useToast();
  const empty = { currentPassword: '', newPassword: '', confirm: '' };
  const [form, setForm] = useState(empty);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    const found = {};
    if (!form.currentPassword) found.currentPassword = 'Enter your current password';
    const problem = passwordProblem(form.newPassword);
    if (problem) found.newPassword = problem;
    if (form.confirm !== form.newPassword) found.confirm = 'Passwords do not match';
    setErrors(found);
    if (Object.keys(found).length) return;

    setSaving(true);
    try {
      await api.put('/auth/password', { currentPassword: form.currentPassword, newPassword: form.newPassword });
      setForm(empty);
      showToast('Password changed', 'success');
    } catch (err) {
      const fields = fieldErrors(err);
      setErrors(Object.keys(fields).length ? fields : { currentPassword: errorMessage(err) });
    } finally {
      setSaving(false);
    }
  };

  const input = (key, autoComplete) => (
    <input type="password" className={`input ${errors[key] ? 'input-error' : ''}`} value={form[key]} onChange={set(key)} autoComplete={autoComplete} />
  );

  return (
    <form onSubmit={submit} noValidate className="card p-6 space-y-4">
      <h2 className="font-bold text-midnight text-lg flex items-center gap-2"><KeyRound className="w-5 h-5 text-vividGold" /> Change password</h2>
      <Field label="Current password" error={errors.currentPassword}>{input('currentPassword', 'current-password')}</Field>
      <Field label="New password" error={errors.newPassword} hint="At least 8 characters, with a letter and a number">{input('newPassword', 'new-password')}</Field>
      <Field label="Confirm new password" error={errors.confirm}>{input('confirm', 'new-password')}</Field>
      <button type="submit" disabled={saving} className="btn-dark">
        {saving && <Spinner className="w-4 h-4" />} Update password
      </button>
    </form>
  );
}

export default function Profile() {
  usePageTitle('Profile');
  const { user } = useAuth();

  return (
    <div className="container-page py-8 max-w-2xl">
      <div className="flex items-center gap-4 mb-8">
        <span className="w-16 h-16 rounded-full bg-midnight text-vividGold text-2xl font-bold flex items-center justify-center">{user.name?.[0]?.toUpperCase()}</span>
        <div>
          <h1 className="text-2xl font-bold text-midnight">{user.name}</h1>
          <p className="text-smoke text-sm">
            {user.role === 'admin' ? 'Administrator' : 'Customer'}
            {user.createdAt && ` · member since ${formatDate(user.createdAt)}`}
          </p>
        </div>
      </div>
      <div className="space-y-6">
        <DetailsForm />
        <PasswordForm />
      </div>
    </div>
  );
}
