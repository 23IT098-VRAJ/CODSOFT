const mongoose = require('mongoose');
const { Schema } = mongoose;

const TaskSchema = new Schema({
  projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
  title: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  status: {
    type: String,
    enum: ['Todo', 'In Progress', 'Done'],
    default: 'Todo',
  },
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High'],
    default: 'Medium',
  },
  assigneeId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  dueDate: { type: Date },
  order: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Update updatedAt before each save
TaskSchema.pre('save', function () {
  this.updatedAt = Date.now();
});

// Index for efficient Kanban queries
TaskSchema.index({ projectId: 1, status: 1, order: 1 });

module.exports = mongoose.model('Task', TaskSchema);
