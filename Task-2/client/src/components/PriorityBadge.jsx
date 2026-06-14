const PRIORITY_STYLES = {
  Low: 'bg-[#F0FDF4] text-[#065F46]',
  Medium: 'bg-[#FFFBEB] text-[#78350F]',
  High: 'bg-[#FEF2F2] text-[#7F1D1D]',
};

export const PriorityBadge = ({ priority }) => {
  if (!priority) return null;
  const style = PRIORITY_STYLES[priority] || 'bg-[#F0EFEC] text-[#8A8680]';
  return (
    <span className={`px-2 py-0.5 rounded-md text-[10px] font-medium tracking-wide uppercase ${style}`}>
      {priority}
    </span>
  );
};

export default PriorityBadge;
