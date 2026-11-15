import { useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, ListTodo } from 'lucide-react';
import { Avatar, Badge, EmptyState } from '../ui';
import { formatDate, isOverdue, PRIORITIES, STATUS_LABELS, TASK_STATUSES } from '../../lib/format';

const COLUMNS = [
  { key: 'title', label: 'Task', value: (t) => t.title.toLowerCase() },
  { key: 'status', label: 'Status', value: (t) => TASK_STATUSES.indexOf(t.status) },
  { key: 'priority', label: 'Priority', value: (t) => PRIORITIES.indexOf(t.priority) },
  { key: 'assignee', label: 'Assignee', value: (t) => t.assigneeId?.name?.toLowerCase() || '￿' },
  { key: 'dueDate', label: 'Due', value: (t) => (t.dueDate ? new Date(t.dueDate).getTime() : Infinity) },
];

// The same tasks as a table. Click a column heading to sort by it.
export default function ListView({ tasks, onOpen }) {
  const [sort, setSort] = useState({ key: 'status', dir: 1 });

  const sorted = useMemo(() => {
    const column = COLUMNS.find((c) => c.key === sort.key);
    return [...tasks].sort((a, b) => {
      const x = column.value(a);
      const y = column.value(b);
      return (x < y ? -1 : x > y ? 1 : 0) * sort.dir || a.order - b.order;
    });
  }, [tasks, sort]);

  if (!tasks.length) return <EmptyState icon={ListTodo} title="No tasks match" message="Try clearing the filters, or add a task on the board." />;

  const toggle = (key) => setSort((s) => (s.key === key ? { key, dir: -s.dir } : { key, dir: 1 }));

  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line bg-paper">
              {COLUMNS.map((c) => (
                <th key={c.key} scope="col" aria-sort={sort.key === c.key ? (sort.dir === 1 ? 'ascending' : 'descending') : 'none'} className="text-left px-4 py-2.5">
                  <button onClick={() => toggle(c.key)} className="eyebrow inline-flex items-center gap-1 hover:text-ink">
                    {c.label}
                    {sort.key === c.key && (sort.dir === 1 ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />)}
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {sorted.map((t) => (
              <tr key={t._id} onClick={() => onOpen(t)} tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && onOpen(t)} className="hover:bg-paper cursor-pointer">
                <td className="px-4 py-3 max-w-[22rem]">
                  <p className={`font-medium truncate ${t.status === 'Done' ? 'text-muted line-through' : ''}`}>{t.title}</p>
                  {t.description && <p className="text-xs text-muted truncate">{t.description}</p>}
                </td>
                <td className="px-4 py-3"><Badge value={t.status} label={STATUS_LABELS[t.status]} /></td>
                <td className="px-4 py-3"><Badge value={t.priority} /></td>
                <td className="px-4 py-3">
                  {t.assigneeId ? (
                    <span className="inline-flex items-center gap-2 text-ink-soft whitespace-nowrap"><Avatar user={t.assigneeId} size="sm" /> {t.assigneeId.name}</span>
                  ) : <span className="text-faint">Unassigned</span>}
                </td>
                <td className={`px-4 py-3 whitespace-nowrap ${isOverdue(t) ? 'text-danger' : 'text-ink-soft'}`}>{t.dueDate ? formatDate(t.dueDate, true) : <span className="text-faint">—</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
