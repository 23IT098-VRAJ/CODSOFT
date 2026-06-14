import MemberAvatar from './MemberAvatar';
import PriorityBadge from './PriorityBadge';

export const TaskCard = ({ task, project, onClick, isDragging }) => {
  const isOverdue =
    task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'Done';

  const formattedDate = task.dueDate
    ? new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    : null;

  const handleClick = () => {
    if (!isDragging) onClick(task);
  };

  return (
    <div
      onClick={handleClick}
      className={`bg-white rounded-xl shadow-sm p-4 mb-2 cursor-grab select-none
        border-l-4 hover:shadow-md transition-all duration-200
        ${isDragging ? 'shadow-xl rotate-1 scale-105' : ''}`}
      style={{ borderLeftColor: project?.color || '#6366f1' }}
    >
      <p className="text-sm font-medium text-gray-800 mb-1">{task.title}</p>
      {task.description && (
        <p className="text-xs text-gray-400 truncate mb-2">{task.description}</p>
      )}
      <div className="flex justify-between items-center mt-3">
        <PriorityBadge priority={task.priority} />
        <div className="flex items-center gap-2">
          {task.assigneeId && (
            <MemberAvatar user={task.assigneeId} size="sm" showTooltip />
          )}
          {formattedDate && (
            <span className={`text-xs flex items-center gap-0.5 ${isOverdue ? 'text-red-500' : 'text-gray-400'}`}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
              {formattedDate}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default TaskCard;
