import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, CalendarClock, CheckCircle2, FolderKanban, ListTodo, Plus, Search } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import ProjectCard from '../components/ProjectCard';
import ActivityFeed from '../components/ActivityFeed';
import { CountUp, Reveal } from '../components/motion';
import { Badge, EmptyState, ErrorState, Tabs } from '../components/ui';
import api, { errorMessage } from '../lib/axios';
import { formatDate, greeting, PROJECT_STATUSES } from '../lib/format';
import { STAGGER_LIST } from '../lib/motion';

// Kept between visits, so coming back to the dashboard shows it at once and
// refreshes quietly instead of flashing skeletons again. It remembers whose
// data it holds, so one account never sees another account's dashboard.
let cache = null;

function Stat({ icon: Icon, label, value, tone = 'text-ink', to, index }) {
  const body = (
    <>
      <div className="flex items-center justify-between">
        <p className="eyebrow">{label}</p>
        <Icon className={`w-4 h-4 ${tone === 'text-ink' ? 'text-muted' : tone}`} />
      </div>
      <p className={`text-3xl font-light tabular-nums mt-2 ${tone}`}><CountUp end={value} /></p>
    </>
  );
  return (
    <Reveal delay={index * STAGGER_LIST}>
      {to ? <Link to={to} className="card block p-5 hover:shadow-lift hover:border-line-strong transition-shadow">{body}</Link> : <div className="card p-5">{body}</div>}
    </Reveal>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(() => (cache?.userId === user?._id ? cache : null));
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('All');

  const load = () => {
    setError('');
    Promise.all([api.get('/api/projects'), api.get('/api/dashboard')])
      .then(([projects, summary]) => {
        cache = { userId: user?._id, projects: projects.data, summary: summary.data };
        setData(cache);
      })
      .catch((err) => { if (cache?.userId !== user?._id) setError(errorMessage(err)); });
  };
  useEffect(load, []);

  const projects = data?.projects || [];
  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return projects.filter((p) => (status === 'All' || p.status === status) && (!q || p.name.toLowerCase().includes(q)));
  }, [projects, query, status]);

  const tabs = [{ value: 'All', label: 'All', count: projects.length }].concat(
    PROJECT_STATUSES.map((s) => ({ value: s, label: s, count: projects.filter((p) => p.status === s).length }))
  );

  if (error) return <div className="page py-10"><ErrorState message={error} onRetry={load} /></div>;

  const summary = data?.summary;
  const loading = !data;

  return (
    <div>
      {/* Greeting and personal summary */}
      <section className="bg-surface border-b border-line">
        <div className="page py-8">
          <h1 className="text-2xl font-semibold tracking-tight">{greeting()}, {user?.name?.split(' ')[0]}</h1>
          <p className="text-sm text-muted mt-1">
            {loading ? 'Loading your workspace…'
              : summary.myTasks.open
                ? `You have ${summary.myTasks.open} open task${summary.myTasks.open === 1 ? '' : 's'}${summary.myTasks.overdue ? `, ${summary.myTasks.overdue} overdue` : ''}.`
                : 'Nothing is waiting on you right now.'}
          </p>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
            {loading ? [0, 1, 2, 3].map((i) => <div key={i} className="h-24 skeleton" />) : (
              <>
                <Stat index={0} icon={FolderKanban} label="Projects" value={summary.projects.total} />
                <Stat index={1} icon={ListTodo} label="My open tasks" value={summary.myTasks.open} to="/my-tasks" />
                <Stat index={2} icon={AlertTriangle} label="Overdue" value={summary.myTasks.overdue} tone={summary.myTasks.overdue ? 'text-danger' : 'text-ink'} to="/my-tasks" />
                <Stat index={3} icon={CheckCircle2} label="Completed by me" value={summary.myTasks.byStatus.Done} />
              </>
            )}
          </div>
        </div>
      </section>

      <div className="page py-8 grid lg:grid-cols-[1fr_20rem] gap-8">
        {/* Projects */}
        <section className="min-w-0">
          <div className="flex items-center justify-between gap-3 mb-4">
            <h2 className="text-base font-semibold tracking-tight">Your projects</h2>
            <Link to="/projects/new" className="btn-primary !py-1.5"><Plus className="w-4 h-4" /> New project</Link>
          </div>

          <div className="flex flex-wrap items-center gap-3 mb-5">
            <Tabs tabs={tabs} value={status} onChange={setStatus} />
            <div className="relative flex-1 min-w-[12rem]">
              <Search className="w-4 h-4 text-faint absolute left-3 top-1/2 -translate-y-1/2" />
              <input type="search" className="input !py-2 pl-9" placeholder="Search projects" aria-label="Search projects"
                value={query} onChange={(e) => setQuery(e.target.value)} />
            </div>
          </div>

          {loading ? (
            <div className="grid sm:grid-cols-2 gap-5">{[0, 1, 2, 3].map((i) => <div key={i} className="h-52 skeleton" />)}</div>
          ) : projects.length === 0 ? (
            <EmptyState icon={FolderKanban} title="No projects yet" message="Create your first project to start organising work."
              action={<Link to="/projects/new" className="btn-primary">Create a project</Link>} />
          ) : visible.length === 0 ? (
            <EmptyState icon={Search} title="No projects match" message="Try a different search or status." />
          ) : (
            <div className="grid sm:grid-cols-2 gap-5">
              {visible.map((p, i) => (
                <Reveal key={p._id} delay={Math.min(i, 6) * STAGGER_LIST}><ProjectCard project={p} /></Reveal>
              ))}
            </div>
          )}
        </section>

        {/* Side column */}
        <aside className="space-y-6">
          <Reveal as="section" className="card p-5">
            <h2 className="text-sm font-semibold tracking-tight flex items-center gap-2 mb-4"><CalendarClock className="w-4 h-4 text-muted" /> Due this week</h2>
            {loading ? <div className="h-20 skeleton" /> : summary.dueSoon.length === 0 ? (
              <p className="text-xs text-muted">Nothing due in the next 7 days.</p>
            ) : (
              <ul className="space-y-3">
                {summary.dueSoon.map((t) => (
                  <li key={t._id}>
                    <Link to={`/projects/${t.projectId?._id}`} className="group block">
                      <p className="text-sm text-ink group-hover:underline underline-offset-2 truncate">{t.title}</p>
                      <p className="text-xs text-muted flex items-center gap-2 mt-0.5">
                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: t.projectId?.color }} />
                        <span className="truncate">{t.projectId?.name}</span>
                        <span>· {formatDate(t.dueDate)}</span>
                        <Badge value={t.priority} className="ml-auto" />
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Reveal>

          <Reveal as="section" className="card p-5">
            <h2 className="text-sm font-semibold tracking-tight mb-4">Recent activity</h2>
            {loading ? <div className="h-32 skeleton" /> : summary.recentActivity.length === 0 ? (
              <p className="text-xs text-muted">Activity from your projects will appear here.</p>
            ) : (
              <ActivityFeed items={summary.recentActivity} showProject />
            )}
          </Reveal>
        </aside>
      </div>
    </div>
  );
}
