import { useEffect, useState } from 'react';
import { m } from 'motion/react';
import { AlertTriangle, CheckCircle2, UserRoundX } from 'lucide-react';
import ActivityFeed from '../ActivityFeed';
import { CountUp, Reveal } from '../motion';
import { Avatar, ErrorState, ProgressRing } from '../ui';
import api, { errorMessage } from '../../lib/axios';
import { PRIORITIES, STATUS_LABELS, TASK_STATUSES } from '../../lib/format';
import { EASE_DRAWER, STAGGER_LIST } from '../../lib/motion';

const STATUS_COLOR = { Todo: '#BAB6B0', 'In Progress': '#1E40AF', Done: '#065F46' };
const PRIORITY_COLOR = { Low: '#065F46', Medium: '#92400E', High: '#9B1C1C' };

// One horizontal bar of a small chart. It grows with scaleX — a transform —
// rather than by animating its width.
function Bar({ label, value, max, color, index }) {
  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="w-24 shrink-0 text-ink-soft truncate">{label}</span>
      <div className="flex-1 h-2 rounded-full bg-sunken overflow-hidden">
        <m.div className="h-full rounded-full origin-left" style={{ backgroundColor: color, width: `${max ? (value / max) * 100 : 0}%` }}
          initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 0.5, ease: EASE_DRAWER, delay: index * STAGGER_LIST }} />
      </div>
      <span className="w-6 text-right tabular-nums text-ink">{value}</span>
    </div>
  );
}

function Figure({ icon: Icon, label, value, tone = 'text-ink' }) {
  return (
    <div className="card p-4">
      <div className="flex items-center justify-between"><p className="eyebrow">{label}</p><Icon className={`w-4 h-4 ${tone === 'text-ink' ? 'text-muted' : tone}`} /></div>
      <p className={`text-2xl font-light tabular-nums mt-1.5 ${tone}`}><CountUp end={value} /></p>
    </div>
  );
}

// The project's report: completion, where the work sits, who is carrying it,
// and what has happened recently.
export default function Overview({ projectId, color }) {
  const [stats, setStats] = useState(null);
  const [activity, setActivity] = useState(null);
  const [error, setError] = useState('');

  const load = () => {
    setError('');
    Promise.all([api.get(`/api/projects/${projectId}/stats`), api.get(`/api/projects/${projectId}/activity?limit=25`)])
      .then(([s, a]) => { setStats(s.data); setActivity(a.data); })
      .catch((err) => setError(errorMessage(err)));
  };
  useEffect(load, [projectId]);

  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!stats) return <div className="grid lg:grid-cols-3 gap-5">{[0, 1, 2].map((i) => <div key={i} className="h-56 skeleton" />)}</div>;

  const maxStatus = Math.max(1, ...Object.values(stats.byStatus));
  const maxPriority = Math.max(1, ...Object.values(stats.openByPriority));
  const maxLoad = Math.max(1, ...stats.workload.map((w) => w.open + w.done));

  return (
    <div className="grid lg:grid-cols-3 gap-5">
      <div className="lg:col-span-2 space-y-5">
        <div className="grid sm:grid-cols-[auto_1fr] gap-5">
          <Reveal className="card p-6 flex flex-col items-center justify-center">
            <ProgressRing percent={stats.completion} color={color}>
              <span className="text-2xl font-light tabular-nums"><CountUp end={stats.completion} format={(n) => `${Math.round(n)}%`} /></span>
              <span className="eyebrow">complete</span>
            </ProgressRing>
            <p className="text-xs text-muted mt-3">{stats.byStatus.Done} of {stats.total} tasks done</p>
          </Reveal>

          <div className="grid grid-cols-3 gap-4 content-start">
            <Figure icon={AlertTriangle} label="Overdue" value={stats.overdue} tone={stats.overdue ? 'text-danger' : 'text-ink'} />
            <Figure icon={UserRoundX} label="Unassigned" value={stats.unassigned} />
            <Figure icon={CheckCircle2} label="Done this week" value={stats.completedThisWeek} tone={stats.completedThisWeek ? 'text-success' : 'text-ink'} />
            <Reveal className="card p-5 col-span-3">
              <h3 className="text-sm font-semibold tracking-tight mb-4">Tasks by status</h3>
              <div className="space-y-3">
                {TASK_STATUSES.map((s, i) => <Bar key={s} index={i} label={STATUS_LABELS[s]} value={stats.byStatus[s]} max={maxStatus} color={STATUS_COLOR[s]} />)}
              </div>
            </Reveal>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-5">
          <Reveal className="card p-5">
            <h3 className="text-sm font-semibold tracking-tight mb-4">Open tasks by priority</h3>
            <div className="space-y-3">
              {[...PRIORITIES].reverse().map((p, i) => <Bar key={p} index={i} label={p} value={stats.openByPriority[p]} max={maxPriority} color={PRIORITY_COLOR[p]} />)}
            </div>
          </Reveal>

          <Reveal className="card p-5">
            <h3 className="text-sm font-semibold tracking-tight mb-4">Workload</h3>
            <ul className="space-y-3.5">
              {stats.workload.map((w, i) => (
                <li key={w.user._id} className="flex items-center gap-3 text-sm">
                  <Avatar user={w.user} size="sm" />
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between gap-2">
                      <span className="truncate text-ink-soft">{w.user.name}</span>
                      <span className="text-xs text-muted shrink-0 tabular-nums">{w.open} open · {w.done} done</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-sunken overflow-hidden mt-1.5 flex">
                      <m.div className="h-full origin-left" style={{ backgroundColor: color, width: `${(w.open / maxLoad) * 100}%` }}
                        initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 0.5, ease: EASE_DRAWER, delay: i * STAGGER_LIST }} />
                      <div className="h-full bg-line-strong" style={{ width: `${(w.done / maxLoad) * 100}%` }} />
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </div>

      <Reveal as="section" className="card p-5 h-fit">
        <h3 className="text-sm font-semibold tracking-tight mb-4">Activity</h3>
        {activity.length ? <ActivityFeed items={activity} /> : <p className="text-xs text-muted">Nothing has happened yet.</p>}
      </Reveal>
    </div>
  );
}
