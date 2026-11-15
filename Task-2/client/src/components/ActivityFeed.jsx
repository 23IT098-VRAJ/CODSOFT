import { Link } from 'react-router-dom';
import { m } from 'motion/react';
import { Avatar } from './ui';
import { describeActivity, timeAgo } from '../lib/format';
import { EASE_OUT, STAGGER_LIST } from '../lib/motion';

// A list of "who did what", used on the dashboard (across projects) and on a
// project's Activity tab. Entries arrive one after another (Magic UI
// "Animated List"), 40ms apart, the first time the list is shown.
export default function ActivityFeed({ items, showProject = false }) {
  return (
    <ol className="space-y-4">
      {items.map((a, i) => (
        <m.li key={a._id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: EASE_OUT, delay: Math.min(i, 10) * STAGGER_LIST }}
          className="flex gap-3 text-sm">
          <Avatar user={a.actorId || { name: '?' }} size="sm" className="mt-0.5" />
          <div className="min-w-0">
            <p className="text-ink-soft">
              <span className="font-medium text-ink">{a.actorId?.name || 'Someone'}</span> {describeActivity(a)}
            </p>
            <p className="text-xs text-muted mt-0.5">
              {timeAgo(a.createdAt)}
              {showProject && a.projectId?.name && (
                <> · <Link to={`/projects/${a.projectId._id}`} className="hover:text-ink underline-offset-2 hover:underline">{a.projectId.name}</Link></>
              )}
            </p>
          </div>
        </m.li>
      ))}
    </ol>
  );
}
