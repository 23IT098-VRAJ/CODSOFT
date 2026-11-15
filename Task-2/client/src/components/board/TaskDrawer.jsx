import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, m } from 'motion/react';
import { Send, Trash2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../Toast';
import { Avatar, ConfirmDialog, Drawer, Field, Spinner } from '../ui';
import api, { errorMessage, fieldErrors } from '../../lib/axios';
import { PRIORITIES, STATUS_LABELS, TASK_STATUSES, timeAgo, toDateInput } from '../../lib/format';
import { T_EXIT, T_STATE } from '../../lib/motion';

const toForm = (task) => ({
  title: task.title,
  description: task.description || '',
  status: task.status,
  priority: task.priority,
  assigneeId: task.assigneeId?._id || '',
  dueDate: toDateInput(task.dueDate),
});

// ── Comments ──────────────────────────────────────────────────────────
function Comments({ taskId, isOwner }) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [comments, setComments] = useState(null);
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const endRef = useRef(null);

  useEffect(() => {
    let alive = true;
    setComments(null);
    api.get(`/api/tasks/${taskId}/comments`).then(({ data }) => alive && setComments(data)).catch(() => alive && setComments([]));
    return () => { alive = false; };
  }, [taskId]);

  const send = async (e) => {
    e.preventDefault();
    if (!body.trim()) return;
    setSending(true);
    try {
      const { data } = await api.post(`/api/tasks/${taskId}/comments`, { body });
      setComments((prev) => [...(prev || []), data]);
      setBody('');
      requestAnimationFrame(() => endRef.current?.scrollIntoView({ block: 'nearest' }));
    } catch (err) {
      showToast(errorMessage(err), 'error');
    } finally {
      setSending(false);
    }
  };

  const remove = async (id) => {
    const previous = comments;
    setComments((prev) => prev.filter((c) => c._id !== id)); // optimistic
    try {
      await api.delete(`/api/tasks/${taskId}/comments/${id}`);
    } catch (err) {
      setComments(previous);
      showToast(errorMessage(err), 'error');
    }
  };

  return (
    <section className="px-6 py-5 border-t border-line">
      <h3 className="eyebrow mb-4">Comments{comments?.length ? ` · ${comments.length}` : ''}</h3>

      {comments === null ? <div className="h-12 skeleton" /> : comments.length === 0 ? (
        <p className="text-xs text-muted">No comments yet. Start the conversation.</p>
      ) : (
        <ul className="space-y-4">
          {/* a deleted comment fades out and the rest close the gap */}
          <AnimatePresence initial={false} mode="popLayout">
            {comments.map((c) => (
              <m.li key={c._id} layout="position" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0, transition: T_STATE }} exit={{ opacity: 0, transition: T_EXIT }}
                className="group flex gap-3">
                <Avatar user={c.authorId} size="sm" className="mt-0.5" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-muted"><span className="font-medium text-ink">{c.authorId?.name}</span> · {timeAgo(c.createdAt)}</p>
                  <p className="text-sm text-ink-soft mt-0.5 whitespace-pre-wrap break-words">{c.body}</p>
                </div>
                {(c.authorId?._id === user._id || isOwner) && (
                  <button onClick={() => remove(c._id)} aria-label="Delete comment" className="btn-icon !p-1 opacity-0 group-hover:opacity-100 focus:opacity-100 self-start"><Trash2 className="w-3.5 h-3.5" /></button>
                )}
              </m.li>
            ))}
          </AnimatePresence>
        </ul>
      )}
      <div ref={endRef} />

      <form onSubmit={send} className="flex gap-2 mt-4">
        <input className="input !py-2" placeholder="Write a comment…" aria-label="Write a comment" value={body} onChange={(e) => setBody(e.target.value)} maxLength={2000} />
        <button type="submit" disabled={sending || !body.trim()} className="btn-primary !px-3" aria-label="Send comment">{sending ? <Spinner /> : <Send className="w-4 h-4" />}</button>
      </form>
    </section>
  );
}

// ── The drawer ────────────────────────────────────────────────────────
// Task details slide in from the right, leaving the board visible behind.
// The last task is kept while the panel slides out, so its content does not
// vanish mid-animation.
export default function TaskDrawer({ task, project, onClose, onSaved, onDeleted }) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [shown, setShown] = useState(task);
  const [form, setForm] = useState(task ? toForm(task) : null);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (task) {
      setShown(task);
      setForm(toForm(task));
      setErrors({});
    }
  }, [task]);

  if (!shown || !form) return null;

  const set = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
  };
  const dirty = JSON.stringify(form) !== JSON.stringify(toForm(shown));

  const save = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return setErrors({ title: 'A task needs a title' });
    setSaving(true);
    try {
      const { data } = await api.put(`/api/tasks/${shown._id}`, { ...form, assigneeId: form.assigneeId || null, dueDate: form.dueDate || null });
      showToast('Task saved', 'success');
      onSaved(data, shown.status !== data.status);
    } catch (err) {
      setErrors(fieldErrors(err));
      showToast(errorMessage(err, 'Could not save the task'), 'error');
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    setDeleting(true);
    try {
      await api.delete(`/api/tasks/${shown._id}`);
      showToast('Task deleted', 'success');
      setConfirmDelete(false);
      onDeleted(shown._id);
    } catch (err) {
      showToast(errorMessage(err), 'error');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <Drawer open={Boolean(task)} onClose={onClose} title="Task details"
        footer={
          <div className="flex items-center justify-between">
            <button type="button" onClick={() => setConfirmDelete(true)} className="btn-ghost !text-danger hover:!bg-danger-soft"><Trash2 className="w-4 h-4" /> Delete</button>
            <div className="flex gap-2">
              <button type="button" onClick={onClose} className="btn-outline">Close</button>
              <button type="submit" form="task-form" disabled={saving || !dirty} className="btn-primary">{saving && <Spinner />}Save</button>
            </div>
          </div>
        }>
        <form id="task-form" onSubmit={save} noValidate className="px-6 py-5 space-y-4">
          <Field label="Title" error={errors.title}>
            <input className={`input ${errors.title ? 'input-error' : ''}`} value={form.title} onChange={set('title')} maxLength={200} />
          </Field>
          <Field label="Description" error={errors.description}>
            <textarea className="input resize-none" rows={4} value={form.description} onChange={set('description')} placeholder="Add more detail…" maxLength={5000} />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Status">
              <select className="input" value={form.status} onChange={set('status')}>
                {TASK_STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
              </select>
            </Field>
            <Field label="Priority">
              <select className="input" value={form.priority} onChange={set('priority')}>
                {PRIORITIES.map((p) => <option key={p}>{p}</option>)}
              </select>
            </Field>
            <Field label="Assignee" error={errors.assigneeId}>
              <select className="input" value={form.assigneeId} onChange={set('assigneeId')}>
                <option value="">Unassigned</option>
                {project.members?.map((mbr) => <option key={mbr._id} value={mbr._id}>{mbr.name}</option>)}
              </select>
            </Field>
            <Field label="Due date" error={errors.dueDate}>
              <input type="date" className="input" value={form.dueDate} onChange={set('dueDate')} />
            </Field>
          </div>
          <p className="text-xs text-muted">Created {timeAgo(shown.createdAt)}{shown.completedAt ? ` · completed ${timeAgo(shown.completedAt)}` : ''}</p>
        </form>

        <Comments taskId={shown._id} isOwner={project.ownerId === user._id} />
      </Drawer>

      <ConfirmDialog open={confirmDelete} onClose={() => setConfirmDelete(false)} onConfirm={remove} busy={deleting}
        title="Delete this task?" message={`“${shown.title}” and its comments will be permanently deleted.`} confirmLabel="Delete task" />
    </>
  );
}
