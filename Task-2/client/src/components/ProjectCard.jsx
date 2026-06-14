import { useNavigate } from 'react-router-dom';
import MemberAvatar from './MemberAvatar';
import StatusBadge from './StatusBadge';

export const ProjectCard = ({ project }) => {
  const navigate = useNavigate();
  const { taskStats = { done: 0, total: 0 } } = project;
  const percent = taskStats.total > 0 ? Math.round((taskStats.done / taskStats.total) * 100) : 0;

  const isPastDue = project.dueDate && new Date(project.dueDate) < new Date();

  const formattedDate = project.dueDate
    ? new Date(project.dueDate).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : null;

  return (
    <div
      onClick={() => navigate(`/projects/${project._id}`)}
      className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer overflow-hidden border border-gray-100"
    >
      {/* Color accent top bar */}
      <div className="h-1.5" style={{ backgroundColor: project.color || '#6366f1' }} />

      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-2">
          <h3 className="text-base font-semibold text-gray-900 leading-snug">{project.name}</h3>
          <StatusBadge status={project.status} />
        </div>

        {/* Description */}
        {project.description && (
          <p
            className="text-sm text-gray-500 mb-3 line-clamp-2"
          >
            {project.description}
          </p>
        )}

        {/* Due date */}
        {formattedDate && (
          <p className={`text-xs mb-3 ${isPastDue ? 'text-red-500' : 'text-gray-400'}`}>
            Due {formattedDate}
            {isPastDue && ' · Overdue'}
          </p>
        )}

        {/* Members */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex -space-x-2">
            {project.members?.slice(0, 3).map((member) => (
              <MemberAvatar key={member._id} user={member} size="sm" showTooltip />
            ))}
            {project.members?.length > 3 && (
              <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-[10px] text-gray-600 font-medium border-2 border-white">
                +{project.members.length - 3}
              </div>
            )}
          </div>
          <span className="text-xs text-gray-400">{taskStats.done}/{taskStats.total} tasks</span>
        </div>

        {/* Progress bar */}
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${percent}%`,
              backgroundColor: project.color || '#6366f1',
            }}
          />
        </div>
        <p className="text-xs text-gray-400 mt-1">{percent}% complete</p>
      </div>
    </div>
  );
};

export default ProjectCard;
