import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { AnimatePresence, m } from 'motion/react';
import { BarChart3, CalendarDays, FolderX, KanbanSquare, List, Search, Settings, UserPlus, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import BoardView from '../components/board/BoardView';
import ListView from '../components/board/ListView';
import Overview from '../components/board/Overview';
import TaskDrawer from '../components/board/TaskDrawer';
import MembersModal from '../components/board/MembersModal';
import { AvatarStack, EmptyState, ErrorState, PageLoader, Tabs } from '../components/ui';
import api, { errorMessage } from '../lib/axios';
import { formatDate, isOverdue, PRIORITIES, PROJECT_STATUSES, TASK_STATUSES } from '../lib/format';
import { DUR, EASE_IN_OUT } from '../lib/motion';

const VIEWS = [
  { value: 'board', label: 'Board', icon: KanbanSquare },
  { value: 'list', label: 'List', icon: List },
  { value: 'overview', label: 'Overview', icon: BarChart3 },
];
const NO_FILTERS = { q: '', priority: '', assignee: '', overdue: false };

const byOrder = (a, b) => a.order - b.order;

// Move a task to (status, index) and re-number the columns it touched —
// the same rule the server applies, so the screen and the database agree
// without waiting for a refetch.
function moveLocally(tasks, taskId, toStatus, toIndex) {
  const task = tasks.find((t) => t._id === taskId);
  const fromStatus = task.status;
  const rest = tasks.filter((t) => t._id !== taskId);

  const destination = rest.filter((t) => t.status === toStatus).sort(byOrder);
  destination.splice(Math.min(toIndex, destination.length), 0, { ...task, status: toStatus });
  const renumbered = new Map(destination.map((t, i) => [t._id, { ...t, order: i }]));

  if (fromStatus !== toStatus) {
    rest.filter((t) => t.status === fromStatus).sort(byOrder).forEach((t, i) => renumbered.set(t._id, { ...t, order: i }));
  }
  return [...rest.filter((t) => !renumbered.has(t._id)), ...renumbered.values()];
}

export default function ProjectBoard() {
  const { id } = useParams();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [params, setParams] = useSearchParams();

  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [state, setState] = useState('loading'); // loading | ready | notfound | error
  const [error, setError] = useState('');
  const [filters, setFilters] = useState(NO_FILTERS);
  const [membersOpen, setMembersOpen] = useState(false);

  // The view and the open task live in the URL, so a link to a task works
  // and the back button closes the drawer.
  const view = VIEWS.some((v) => v.value === params.get('view')) ? params.get('view') : 'board';
  const openTaskId = params.get('task');
  const setParam = (key, value) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: key === 'view' });
  };

  const loadTasks = useCallback(() => api.get(`/api/tasks/${id}`).then(({ data }) => setTasks(data)), [id]);

  const load = useCallback(() => {
    setState('loading');
    Promise.all([api.get(`/api/projects/${id}`), api.get(`/api/tasks/${id}`)])
      .then(([p, t]) => {
        setProject(p.data);
        setTasks(t.data);
        setState('ready');
      })
      .catch((err) => {
        if ([400, 403, 404].includes(err.response?.status)) return setState('notfound');
        setError(errorMessage(err));
        setState('error');
      });
  }, [id]);
  useEffect(load, [load]);

  useEffect(() => {
    if (project) document.title = `${project.name} · TaskFlow`;
    return () => { document.title = 'TaskFlow — Project Management Tool'; };
  }, [project]);

  // ── Filters (applied in the browser; the tasks are already loaded) ───
  const filtering = Boolean(filters.q || filters.priority || filters.assignee || filters.overdue);
  const visible = useMemo(() => {
    const q = filters.q.trim().toLowerCase();
    return tasks.filter((t) =>
      (!q || t.title.toLowerCase().includes(q) || t.description?.toLowerCase().includes(q)) &&
      (!filters.priority || t.priority === filters.priority) &&
      (!filters.assignee || (filters.assignee === 'none' ? !t.assigneeId : t.assigneeId?._id === filters.assignee)) &&
      (!filters.overdue || isOverdue(t))
    );
  }, [tasks, filters]);

  const columns = useMemo(
    () => Object.fromEntries(TASK_STATUSES.map((s) => [s, visible.filter((t) => t.status === s).sort(byOrder)])),
    [visible]
  );
  const openTask = tasks.find((t) => t._id === openTaskId) || null;

  // ── Actions ──────────────────────────────────────────────────────────
  const moveTask = async (taskId, status, index) => {
    const previous = tasks;
    setTasks(moveLocally(tasks, taskId, status, index)); // optimistic
    try {
      await api.patch(`/api/tasks/${taskId}/move`, { status, order: index });
    } catch (err) {
      setTasks(previous);
      showToast(errorMessage(err, 'Could not move the task'), 'error');
    }
  };

  const addTask = async ({ title, status }) => {
    try {
      const { data } = await api.post('/api/tasks', { title, projectId: id, status });
      setTasks((prev) => [...prev, data]);
    } catch (err) {
      showToast(errorMessage(err, 'Could not add the task'), 'error');
    }
  };

  const changeStatus = async (e) => {
    const status = e.target.value;
    const previous = project;
    setProject({ ...project, status });
    try {
      await api.put(`/api/projects/${id}`, { status });
    } catch (err) {
      setProject(previous);
      showToast(errorMessage(err), 'error');
    }
  };

  const handleSaved = (saved, statusChanged) => {
    setTasks((prev) => prev.map((t) => (t._id === saved._id ? saved : t)));
    if (statusChanged) loadTasks().catch(() => {}); // other tasks were re-numbered on the server
    setParam('task', null);
  };
  const handleDeleted = (taskId) => {
    setTasks((prev) => prev.filter((t) => t._id !== taskId));
    setParam('task', null);
    loadTasks().catch(() => {});
  };

  if (state === 'loading') return <PageLoader />;
  if (state === 'notfound') {
    return (
      <div className="page py-16 max-w-xl">
        <EmptyState icon={FolderX} title="Project not found" message="It may have been deleted, or you are not a member of it."
          action={<Link to="/dashboard" className="btn-primary">Back to dashboard</Link>} />
      </div>
    );
  }
  if (state === 'error') return <div className="page py-16 max-w-xl"><ErrorState message={error} onRetry={load} /></div>;

  const color = project.color || '#6366f1';
  const done = tasks.filter((t) => t.status === 'Done').length;
  const pastDue = project.dueDate && project.status !== 'Completed' && new Date(project.dueDate) < new Date();

  return (
    <div>
      {/* Project header */}
      <header className="bg-surface border-b border-line">
        <div className="px-4 sm:px-6 py-4">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
                <h1 className="text-xl font-semibold tracking-tight truncate">{project.name}</h1>
              </div>
              {project.description && <p className="text-sm text-muted mt-0.5 line-clamp-1">{project.description}</p>}
            </div>
            <Link to={`/projects/${id}/edit`} className="btn-icon shrink-0" aria-label="Project settings"><Settings className="w-4 h-4" /></Link>
          </div>

          <div className="flex items-center gap-x-4 gap-y-3 mt-4 flex-wrap">
            <button onClick={() => setMembersOpen(true)} className="flex items-center gap-2 rounded-lg pr-2 hover:bg-sunken" aria-label="Manage members">
              <AvatarStack users={project.members} max={5} />
              <span className="w-6 h-6 rounded-full border border-dashed border-line-strong text-muted flex items-center justify-center"><UserPlus className="w-3 h-3" /></span>
            </button>

            <select value={project.status} onChange={changeStatus} aria-label="Project status" className="input !w-auto !py-1.5 !text-xs">
              {PROJECT_STATUSES.map((s) => <option key={s}>{s}</option>)}
            </select>

            {project.dueDate && (
              <span className={`text-xs inline-flex items-center gap-1.5 ${pastDue ? 'text-danger' : 'text-muted'}`}>
                <CalendarDays className="w-3.5 h-3.5" /> Due {formatDate(project.dueDate, true)}
              </span>
            )}
            <span className="text-xs text-muted tabular-nums">{done} / {tasks.length} done</span>

            <Tabs tabs={VIEWS} value={view} onChange={(v) => setParam('view', v === 'board' ? null : v)} className="ml-auto" />
          </div>
        </div>
      </header>

      <div className="px-4 sm:px-6 py-5">
        {/* Filters apply to the board and the list */}
        {view !== 'overview' && (
          <div className="flex flex-wrap items-center gap-2.5 mb-5">
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-faint absolute left-3 top-1/2 -translate-y-1/2" />
              <input type="search" className="input !py-1.5 pl-9" placeholder="Search tasks" aria-label="Search tasks"
                value={filters.q} onChange={(e) => setFilters((f) => ({ ...f, q: e.target.value }))} />
            </div>
            <select className="input !w-auto !py-1.5" aria-label="Filter by priority" value={filters.priority} onChange={(e) => setFilters((f) => ({ ...f, priority: e.target.value }))}>
              <option value="">Any priority</option>
              {PRIORITIES.map((p) => <option key={p}>{p}</option>)}
            </select>
            <select className="input !w-auto !py-1.5" aria-label="Filter by assignee" value={filters.assignee} onChange={(e) => setFilters((f) => ({ ...f, assignee: e.target.value }))}>
              <option value="">Anyone</option>
              <option value={user._id}>Assigned to me</option>
              <option value="none">Unassigned</option>
              {project.members.filter((mbr) => mbr._id !== user._id).map((mbr) => <option key={mbr._id} value={mbr._id}>{mbr.name}</option>)}
            </select>
            <label className="inline-flex items-center gap-2 text-sm text-ink-soft cursor-pointer select-none">
              <input type="checkbox" className="w-4 h-4 accent-[#1A1917]" checked={filters.overdue} onChange={(e) => setFilters((f) => ({ ...f, overdue: e.target.checked }))} />
              Overdue only
            </label>
            {filtering && (
              <button onClick={() => setFilters(NO_FILTERS)} className="btn-ghost !py-1.5 !px-2.5 !text-xs"><X className="w-3.5 h-3.5" /> Clear · {visible.length} of {tasks.length}</button>
            )}
          </div>
        )}

        {/* Switching views cross-fades; nothing slides. */}
        <AnimatePresence mode="wait" initial={false}>
          <m.div key={view} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: DUR.page, ease: EASE_IN_OUT }}>
            {view === 'board' && <BoardView columns={columns} color={color} onOpen={(t) => setParam('task', t._id)} onAdd={addTask} onMove={moveTask} dragDisabled={filtering} />}
            {view === 'list' && <ListView tasks={visible} onOpen={(t) => setParam('task', t._id)} />}
            {view === 'overview' && <Overview projectId={id} color={color} />}
          </m.div>
        </AnimatePresence>
      </div>

      <TaskDrawer task={openTask} project={project} onClose={() => setParam('task', null)} onSaved={handleSaved} onDeleted={handleDeleted} />
      <MembersModal open={membersOpen} onClose={() => setMembersOpen(false)} project={project}
        onChange={(updated, reloadTasks) => { setProject(updated); if (reloadTasks) loadTasks().catch(() => {}); }} />
    </div>
  );
}
