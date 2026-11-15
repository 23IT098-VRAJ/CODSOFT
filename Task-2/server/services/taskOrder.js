// Keeping Kanban columns in order.
//
// A column is every task with the same project and status, sorted by `order`.
// The rule these helpers maintain: within a column, `order` is 0, 1, 2 … with
// no gaps and no duplicates. Before this existed, dropping a task at position
// 1 just set its order to 1 and left the task already at 1 untouched, so the
// two tied and the column's order became arbitrary.
const Task = require('../models/Task');

const columnOf = (projectId, status, exceptId) =>
  Task.find({ projectId, status, ...(exceptId ? { _id: { $ne: exceptId } } : {}) })
    .sort({ order: 1, createdAt: 1 })
    .select('_id order')
    .lean();

// Re-number a column after something left it.
async function closeGaps(projectId, status) {
  const tasks = await columnOf(projectId, status);
  const ops = tasks
    .map((t, i) => (t.order === i ? null : { updateOne: { filter: { _id: t._id }, update: { $set: { order: i } } } }))
    .filter(Boolean);
  if (ops.length) await Task.bulkWrite(ops);
}

// Put `task` into column `toStatus` at position `toIndex` (end of the column
// when omitted), shifting the tasks after it down by one. All the writes go
// out as a single bulk operation.
async function placeTask(task, toStatus, toIndex) {
  const fromStatus = task.status;
  const others = await columnOf(task.projectId, toStatus, task._id);
  const index = toIndex === undefined ? others.length : Math.min(Math.max(toIndex, 0), others.length);

  const ops = [];
  others.forEach((t, i) => {
    const order = i < index ? i : i + 1; // tasks at or after the slot move down
    if (t.order !== order) ops.push({ updateOne: { filter: { _id: t._id }, update: { $set: { order } } } });
  });

  const changes = { status: toStatus, order: index };
  if (toStatus === 'Done' && fromStatus !== 'Done') changes.completedAt = new Date();
  if (toStatus !== 'Done' && fromStatus === 'Done') changes.completedAt = null;
  ops.push({ updateOne: { filter: { _id: task._id }, update: { $set: changes } } });

  await Task.bulkWrite(ops);
  if (fromStatus !== toStatus) await closeGaps(task.projectId, fromStatus);

  Object.assign(task, changes); // keep the in-memory document in step
  return { fromStatus, toStatus, index };
}

module.exports = { placeTask, closeGaps };
