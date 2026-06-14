const sizeMap = {
  sm: 'w-6 h-6 text-[10px]',
  md: 'w-8 h-8 text-xs',
  lg: 'w-10 h-10 text-sm',
};

export const MemberAvatar = ({ user, size = 'md', showTooltip = false }) => {
  if (!user) return null;

  const avatar = (
    <div
      className={`${sizeMap[size]} rounded-full flex items-center justify-center font-bold text-white flex-shrink-0`}
      style={{ backgroundColor: user.avatarColor || '#6366f1' }}
    >
      {user.name?.charAt(0)?.toUpperCase() || '?'}
    </div>
  );

  if (showTooltip) {
    return <div title={user.name}>{avatar}</div>;
  }

  return avatar;
};

export default MemberAvatar;
