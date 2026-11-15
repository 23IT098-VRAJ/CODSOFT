import { useState } from 'react';
import { KeyRound, UserRound } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import { Avatar, Field, Spinner } from '../components/ui';
import { PasswordInput } from './Login';
import api, { errorMessage, fieldErrors } from '../lib/axios';

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
      const { data } = await api.put('/api/auth/me', { name });
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
      <h2 className="text-sm font-semibold tracking-tight flex items-center gap-2"><UserRound className="w-4 h-4 text-muted" /> Your details</h2>
      <Field label="Full name" error={error}>
        <input className={`input ${error ? 'input-error' : ''}`} value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
      </Field>
      <Field label="Email" hint="Email cannot be changed">
        <input className="input text-muted" value={user.email} disabled />
      </Field>
      <button type="submit" disabled={saving || name.trim() === user.name} className="btn-primary">{saving && <Spinner />}Save changes</button>
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
    if (form.newPassword.length < 6) found.newPassword = 'Password must be at least 6 characters';
    if (form.confirm !== form.newPassword) found.confirm = 'Passwords do not match';
    setErrors(found);
    if (Object.keys(found).length) return;

    setSaving(true);
    try {
      await api.put('/api/auth/password', { currentPassword: form.currentPassword, newPassword: form.newPassword });
      setForm(empty);
      showToast('Password changed', 'success');
    } catch (err) {
      const fields = fieldErrors(err);
      setErrors(Object.keys(fields).length ? fields : { currentPassword: errorMessage(err) });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} noValidate className="card p-6 space-y-4">
      <h2 className="text-sm font-semibold tracking-tight flex items-center gap-2"><KeyRound className="w-4 h-4 text-muted" /> Change password</h2>
      <Field label="Current password" error={errors.currentPassword}>
        <PasswordInput value={form.currentPassword} onChange={set('currentPassword')} error={errors.currentPassword} autoComplete="current-password" />
      </Field>
      <Field label="New password" error={errors.newPassword} hint="At least 6 characters">
        <PasswordInput value={form.newPassword} onChange={set('newPassword')} error={errors.newPassword} autoComplete="new-password" />
      </Field>
      <Field label="Confirm new password" error={errors.confirm}>
        <PasswordInput value={form.confirm} onChange={set('confirm')} error={errors.confirm} autoComplete="new-password" />
      </Field>
      <button type="submit" disabled={saving} className="btn-primary">{saving && <Spinner />}Update password</button>
    </form>
  );
}

export default function Profile() {
  const { user } = useAuth();
  return (
    <div className="page py-8 max-w-xl">
      <div className="flex items-center gap-4 mb-8">
        <Avatar user={user} size="lg" />
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{user.name}</h1>
          <p className="text-sm text-muted">{user.email}</p>
        </div>
      </div>
      <div className="space-y-6">
        <DetailsForm />
        <PasswordForm />
      </div>
    </div>
  );
}
