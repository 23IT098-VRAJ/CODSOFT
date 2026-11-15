const PROJECT_STATUSES = ['Active', 'Completed', 'On Hold'];
const TASK_STATUSES = ['Todo', 'In Progress', 'Done'];
const PRIORITIES = ['Low', 'Medium', 'High'];

// Each new account gets one of these at random for its avatar.
const AVATAR_COLORS = ['#3730A3', '#78350F', '#064E3B', '#7F1D1D', '#4C1D95', '#881337'];

// The only user fields ever sent to other users.
const PUBLIC_USER_FIELDS = '_id name email avatarColor';

// What gets written to a project's activity feed.
const ACTIVITY_TYPES = [
  'project.created',
  'project.updated',
  'member.added',
  'member.removed',
  'task.created',
  'task.updated',
  'task.moved',
  'task.assigned',
  'task.completed',
  'task.deleted',
  'comment.added',
];

module.exports = { PROJECT_STATUSES, TASK_STATUSES, PRIORITIES, AVATAR_COLORS, PUBLIC_USER_FIELDS, ACTIVITY_TYPES };
