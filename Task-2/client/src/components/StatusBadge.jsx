const STATUS_STYLES = {
  'Todo': 'bg-[#F3F4F6] text-[#374151]',
  'In Progress': 'bg-[#EFF6FF] text-[#1E40AF]',
  'Done': 'bg-[#ECFDF5] text-[#064E3B]',
  'Active': 'bg-[#F0FDF4] text-[#064E3B]',
  'Completed': 'bg-[#ECFDF5] text-[#064E3B]',
  'On Hold': 'bg-[#FFFBEB] text-[#78350F]',
};

export const StatusBadge = ({ status }) => {
  if (!status) return null;
  const style = STATUS_STYLES[status] || 'bg-[#F0EFEC] text-[#8A8680]';
  return (
    <span className={`px-2 py-0.5 rounded-md text-[10px] font-medium tracking-wide uppercase ${style}`}>
      {status}
    </span>
  );
};

export default StatusBadge;
