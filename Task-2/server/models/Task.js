const mongoose = require('mongoose');
const { TASK_STATUSES, PRIORITIES } = require('../config/constants');

const { Schema } = mongoose;

const TaskSchema = new Schema(
  {
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
    title: { type: String, required: [true, 'Title is required'], trim: true, maxlength: 200 },
    description: { type: String, default: '', maxlength: 5000 },
    status: { type: String, enum: TASK_STATUSES, default: 'Todo' },
    priority: { type: String, enum: PRIORITIES, default: 'Medium' },
    assigneeId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    dueDate: { type: Date, default: null },
    // Position inside its column: 0, 1, 2 … with no gaps or duplicates.
    order: { type: Number, default: 0 },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    completedAt: { type: Date, default: null }, // set when the task enters "Done"
  },
  { timestamps: true }
);

// One Kanban column, in display order.
TaskSchema.index({ projectId: 1, status: 1, order: 1 });
// "Tasks assigned to me", across projects.
TaskSchema.index({ assigneeId: 1, status: 1 });

module.exports = mongoose.model('Task', TaskSchema);
