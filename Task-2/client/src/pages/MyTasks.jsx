import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, CheckCircle2, ListTodo } from 'lucide-react';
import { Reveal } from '../components/motion';
import { Badge, EmptyState, ErrorState, Tabs } from '../components/ui';
import api, { errorMessage } from '../lib/axios';
import { formatDate, isOverdue, STATUS_LABELS } from '../lib/format';
import { STAGGER_LIST } from '../lib/motion';

const VIEWS = [
  { value: 'open', label: 'Open' },
  { value: 'overdue', label: 'Overdue' },
  { value: 'done', label: 'Done' },
];

// Everything assigned to me, across every project.
export default function MyTasks() {
  const [tasks, setTasks] = useState(null);
  const [error, setError] = useState('');
  const [view, setView] = useState('open');

  const load = () => {
    setError('');
    api.get('/api/tasks/mine').then(({ data }) => setTasks(data)).catch((err) => setError(errorMessage(err)));
  };
  useEffect(load, []);

  const groups = useMemo(() => {
    const all = tasks || [];
    return {
      open: all.filter((t) => t.status !== 'Done'),
      overdue: all.filter(isOverdue),
      done: all.filter((t) => t.status === 'Done'),
    };
  }, [tasks]);

  const tabs = VIEWS.map((v) => ({ ...v, count: groups[v.value].length }));
  const visible = groups[view];

  return (
    <div className="page py-8 max-w-3xl">
      <h1 className="text-2xl font-semibold tracking-tight">My tasks</h1>
      <p className="text-sm text-muted mt-1">Everything assigned to you, across all your projects.</p>

      <Tabs tabs={tabs} value={view} onChange={setView} className="mt-6 mb-5" />

      {error ? <ErrorState message={error} onRetry={load} /> : !tasks ? (
        <div className="space-y-3">{[0, 1, 2].map((i) => <div key={i} className="h-16 skeleton" />)}</div>
      ) : visible.length === 0 ? (
        <EmptyState icon={view === 'done' ? CheckCircle2 : ListTodo}
          title={view === 'overdue' ? 'Nothing is overdue' : view === 'done' ? 'No completed tasks yet' : 'No open tasks'}
          message={view === 'open' ? 'Tasks assigned to you in any project will show up here.' : undefined} />
      ) : (
        <ul className="space-y-2.5">
          {visible.map((t, i) => (
            <Reveal as="li" key={t._id} delay={Math.min(i, 8) * STAGGER_LIST}>
              <Link to={`/projects/${t.projectId?._id}?task=${t._id}`} className="card flex items-center gap-4 px-4 py-3 hover:shadow-lift hover:border-line-strong transition-shadow">
                <span className="w-1 self-stretch rounded-full" style={{ backgroundColor: t.projectId?.color || '#8A8680' }} />
                <div className="min-w-0 flex-1">
                  <p className={`text-sm font-medium truncate ${t.status === 'Done' ? 'line-through text-muted' : ''}`}>{t.title}</p>
                  <p className="text-xs text-muted mt-0.5 truncate">{t.projectId?.name} · {STATUS_LABELS[t.status]}</p>
                </div>
                {t.dueDate && (
                  <span className={`text-xs inline-flex items-center gap-1 shrink-0 ${isOverdue(t) ? 'text-danger' : 'text-muted'}`}>
                    <CalendarDays className="w-3.5 h-3.5" /> {formatDate(t.dueDate)}
                  </span>
                )}
                <Badge value={t.priority} className="shrink-0" />
              </Link>
            </Reveal>
          ))}
        </ul>
      )}
    </div>
  );
}
