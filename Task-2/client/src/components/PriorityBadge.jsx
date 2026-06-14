const PRIORITY_STYLES = {
  Low: 'bg-green-100 text-green-700',
  Medium: 'bg-yellow-100 text-yellow-700',
  High: 'bg-red-100 text-red-700',
};

export const PriorityBadge = ({ priority }) => {
  if (!priority) return null;
  const style = PRIORITY_STYLES[priority] || 'bg-gray-100 text-gray-600';
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${style}`}>
      ● {priority}
    </span>
  );
};

export default PriorityBadge;
