import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import { ConfirmDialog, ErrorState, Field, PageLoader, Spinner } from '../components/ui';
import api, { errorMessage, fieldErrors } from '../lib/axios';
import { PROJECT_COLORS, PROJECT_STATUSES, toDateInput } from '../lib/format';

const EMPTY = { name: '', description: '', color: PROJECT_COLORS[0], status: 'Active', dueDate: '' };

// One form for both "new project" (/projects/new) and "project settings"
// (/projects/:id/edit) — they used to be two near-identical pages.
export default function ProjectForm() {
  const { id } = useParams();
  const editing = Boolean(id);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [form, setForm] = useState(EMPTY);
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(editing);
  const [loadError, setLoadError] = useState('');
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [confirm, setConfirm] = useState(null); // 'delete' | 'leave' | null
  const [working, setWorking] = useState(false);

  useEffect(() => {
    if (!editing) return;
    api.get(`/api/projects/${id}`)
      .then(({ data }) => {
        setProject(data);
        setForm({ name: data.name, description: data.description || '', color: data.color || PROJECT_COLORS[0], status: data.status, dueDate: toDateInput(data.dueDate) });
      })
      .catch((err) => setLoadError(errorMessage(err)))
      .finally(() => setLoading(false));
  }, [id, editing]);

  const set = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return setErrors({ name: 'Give the project a name' });
    setSaving(true);
    try {
      const { data } = editing ? await api.put(`/api/projects/${id}`, form) : await api.post('/api/projects', form);
      showToast(editing ? 'Project updated' : 'Project created', 'success');
      navigate(`/projects/${data._id}`);
    } catch (err) {
      setErrors(fieldErrors(err));
      showToast(errorMessage(err, 'Could not save the project'), 'error');
    } finally {
      setSaving(false);
    }
  };

  const isOwner = project && project.ownerId === user?._id;

  const runConfirm = async () => {
    setWorking(true);
    try {
      if (confirm === 'delete') await api.delete(`/api/projects/${id}`);
      else await api.delete(`/api/projects/${id}/members/${user._id}`);
      showToast(confirm === 'delete' ? 'Project deleted' : 'You left the project', 'success');
      navigate('/dashboard');
    } catch (err) {
      showToast(errorMessage(err), 'error');
      setWorking(false);
      setConfirm(null);
    }
  };

  if (loading) return <PageLoader />;
  if (loadError) return <div className="page py-10 max-w-xl"><ErrorState message={loadError} /></div>;

  return (
    <div className="page py-8 max-w-xl">
      <Link to={editing ? `/projects/${id}` : '/dashboard'} className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink mb-5">
        <ArrowLeft className="w-4 h-4" /> {editing ? 'Back to board' : 'Dashboard'}
      </Link>
      <h1 className="text-2xl font-semibold tracking-tight mb-6">{editing ? 'Project settings' : 'New project'}</h1>

      <form onSubmit={handleSubmit} noValidate className="card p-6 space-y-5">
        <Field label="Name" error={errors.name}>
          <input className={`input ${errors.name ? 'input-error' : ''}`} value={form.name} onChange={set('name')} placeholder="e.g. Website relaunch" maxLength={100} autoFocus />
        </Field>
        <Field label="Description" error={errors.description}>
          <textarea className="input resize-none" rows={3} value={form.description} onChange={set('description')} placeholder="What is this project about?" maxLength={1000} />
        </Field>

        <div>
          <span className="label">Colour</span>
          <div className="flex flex-wrap gap-2.5" role="radiogroup" aria-label="Project colour">
            {PROJECT_COLORS.map((c) => (
              <button key={c} type="button" role="radio" aria-checked={form.color === c} aria-label={c} onClick={() => setForm((f) => ({ ...f, color: c }))}
                className={`w-8 h-8 rounded-full flex items-center justify-center transition active:scale-[0.98] ${form.color === c ? 'ring-2 ring-offset-2 ring-ink' : 'hover:scale-105'}`}
                style={{ backgroundColor: c }}>
                {form.color === c && <Check className="w-4 h-4 text-white" />}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Status" error={errors.status}>
            <select className="input" value={form.status} onChange={set('status')}>
              {PROJECT_STATUSES.map((s) => <option key={s}>{s}</option>)}
            </select>
          </Field>
          <Field label="Due date" error={errors.dueDate}>
            <input type="date" className="input" value={form.dueDate} onChange={set('dueDate')} />
          </Field>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Link to={editing ? `/projects/${id}` : '/dashboard'} className="btn-outline">Cancel</Link>
          <button type="submit" disabled={saving} className="btn-primary">{saving && <Spinner />}{editing ? 'Save changes' : 'Create project'}</button>
        </div>
      </form>

      {editing && (
        <section className="card p-6 mt-6 border-red-200">
          <h2 className="text-sm font-semibold tracking-tight text-danger">Danger zone</h2>
          {isOwner ? (
            <div className="flex items-center justify-between gap-4 mt-3">
              <p className="text-sm text-ink-soft">Delete this project and all of its tasks, comments and history.</p>
              <button onClick={() => setConfirm('delete')} className="btn-danger shrink-0">Delete project</button>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-4 mt-3">
              <p className="text-sm text-ink-soft">Leave this project. Tasks assigned to you become unassigned.</p>
              <button onClick={() => setConfirm('leave')} className="btn-danger shrink-0">Leave project</button>
            </div>
          )}
        </section>
      )}

      <ConfirmDialog open={Boolean(confirm)} onClose={() => setConfirm(null)} onConfirm={runConfirm} busy={working}
        title={confirm === 'delete' ? 'Delete this project?' : 'Leave this project?'}
        message={confirm === 'delete'
          ? `“${form.name}” and everything in it will be permanently deleted. This cannot be undone.`
          : `You will lose access to “${form.name}” until someone adds you again.`}
        confirmLabel={confirm === 'delete' ? 'Delete project' : 'Leave project'} />
    </div>
  );
}
