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
      className={`bg-white border border-[#E5E2DC] rounded-xl p-4 mb-2 cursor-grab select-none shadow-[0_1px_3px_rgba(0,0,0,0.06)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 transition-all duration-200 relative
        ${isDragging ? 'shadow-[0_12px_32px_rgba(0,0,0,0.12)] rotate-2 scale-105 border-[#1A1917]' : ''}`}
    >
      <div className="w-2 h-2 rounded-full absolute top-4 right-4" style={{ backgroundColor: project?.color || '#3730A3' }} />
      <p className="text-sm font-medium text-[#1A1917] pr-6 leading-snug mb-1">{task.title}</p>
      {task.description && (
        <p className="text-xs text-[#8A8680] line-clamp-2 mt-1.5 mb-3">{task.description}</p>
      )}
      <div className="flex justify-between items-center mt-3">
        <PriorityBadge priority={task.priority} />
        <div className="flex items-center gap-2">
          {task.assigneeId && (
            <MemberAvatar user={task.assigneeId} size="sm" showTooltip />
          )}
          {formattedDate && (
            <span className={`text-[10px] font-medium flex items-center gap-1 ${isOverdue ? 'text-[#7F1D1D] bg-[#FEF2F2] px-1.5 py-0.5 rounded-md' : 'text-[#8A8680]'}`}>
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
