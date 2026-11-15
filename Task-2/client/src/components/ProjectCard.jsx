import { Link } from 'react-router-dom';
import { m } from 'motion/react';
import { AlertTriangle } from 'lucide-react';
import { AvatarStack, Badge, ProgressBar } from './ui';
import { DUR, EASE_OUT } from '../lib/motion';
import { formatDate } from '../lib/format';

// Shared objects, so every card hands Motion the same hover animation.
const HOVER = { y: -3 };
const HOVER_T = { duration: DUR.press, ease: EASE_OUT };

export default function ProjectCard({ project }) {
  const { done = 0, total = 0, overdue = 0 } = project.taskStats || {};
  const percent = total ? Math.round((done / total) * 100) : 0;
  const color = project.color || '#6366f1';
  const pastDue = project.dueDate && project.status !== 'Completed' && new Date(project.dueDate) < new Date();

  return (
    <m.div whileHover={HOVER} transition={HOVER_T} className="h-full">
      <Link to={`/projects/${project._id}`} className="card block h-full overflow-hidden hover:shadow-lift hover:border-line-strong transition-shadow">
        <div className="h-[3px]" style={{ backgroundColor: color }} />
        <div className="p-5 flex flex-col h-full">
          <div className="flex items-start justify-between gap-3">
            <h3 className="text-base font-semibold tracking-tight leading-snug">{project.name}</h3>
            <Badge value={project.status} />
          </div>
          <p className="text-sm text-muted mt-1 line-clamp-2 min-h-[2.5rem]">{project.description || 'No description'}</p>

          <div className="flex items-center gap-3 text-xs mt-3 min-h-[1.25rem]">
            {project.dueDate && <span className={pastDue ? 'text-danger' : 'text-muted'}>Due {formatDate(project.dueDate, true)}</span>}
            {overdue > 0 && (
              <span className="inline-flex items-center gap-1 text-danger"><AlertTriangle className="w-3 h-3" /> {overdue} overdue</span>
            )}
          </div>

          <div className="flex items-center justify-between mt-4 mb-3">
            <AvatarStack users={project.members} max={4} />
            <span className="eyebrow">{done} / {total} tasks</span>
          </div>
          <ProgressBar percent={percent} color={color} />
          <p className="eyebrow mt-1.5">{percent}% complete</p>
        </div>
      </Link>
    </m.div>
  );
}
