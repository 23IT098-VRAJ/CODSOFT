export const TASK_STATUSES = ['Todo', 'In Progress', 'Done'];
export const STATUS_LABELS = { Todo: 'To Do', 'In Progress': 'In Progress', Done: 'Done' };
export const PRIORITIES = ['Low', 'Medium', 'High'];
export const PROJECT_STATUSES = ['Active', 'On Hold', 'Completed'];
export const PROJECT_COLORS = ['#6366f1', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#8b5cf6', '#1A1917'];

export const formatDate = (date, withYear = false) =>
  date ? new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', ...(withYear ? { year: 'numeric' } : {}) }) : '';

// For <input type="date">, which wants YYYY-MM-DD.
export const toDateInput = (date) => (date ? new Date(date).toISOString().split('T')[0] : '');

// A task is overdue when it has a due date in the past and is not finished.
export const isOverdue = (task) => Boolean(task.dueDate) && task.status !== 'Done' && new Date(task.dueDate) < new Date();

// "just now", "5 min ago", "3 h ago", "2 d ago", then a date.
export const timeAgo = (date) => {
  const seconds = Math.round((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} h ago`;
  if (seconds < 7 * 86400) return `${Math.floor(seconds / 86400)} d ago`;
  return formatDate(date, true);
};

export const greeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
};

// One sentence per activity entry, e.g. "moved Design hero from To Do to Done".
export const describeActivity = ({ type, meta = {} }) => {
  const title = meta.title ? `“${meta.title}”` : 'a task';
  const label = (s) => STATUS_LABELS[s] || s;
  switch (type) {
    case 'project.created': return 'created the project';
    case 'project.updated': return `updated the project ${(meta.fields || []).join(', ')}`.trim();
    case 'member.added': return `added ${meta.name || 'a member'} to the project`;
    case 'member.removed': return meta.left ? 'left the project' : `removed ${meta.name || 'a member'} from the project`;
    case 'task.created': return `created ${title}`;
    case 'task.updated': return `edited ${title}`;
    case 'task.moved': return `moved ${title} from ${label(meta.from)} to ${label(meta.to)}`;
    case 'task.completed': return `completed ${title}`;
    case 'task.assigned': return meta.assignee ? `assigned ${title} to ${meta.assignee}` : `unassigned ${title}`;
    case 'task.deleted': return `deleted ${title}`;
    case 'comment.added': return `commented on ${title}`;
    default: return 'made a change';
  }
};
