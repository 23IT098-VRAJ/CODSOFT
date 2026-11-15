const mongoose = require('mongoose');
const { ACTIVITY_TYPES } = require('../config/constants');

const { Schema } = mongoose;

// One entry in a project's activity feed: who did what, and when.
const ActivitySchema = new Schema(
  {
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
    actorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ACTIVITY_TYPES, required: true },
    taskId: { type: Schema.Types.ObjectId, ref: 'Task', default: null },
    // Small snapshot of the details (task title, from/to status, member name…),
    // so the entry still reads correctly after the task or member is gone.
    meta: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

ActivitySchema.index({ projectId: 1, createdAt: -1 });

// Record an event. The feed is a convenience, so a failure to write it is
// logged and swallowed — it must never fail the request that caused it.
ActivitySchema.statics.record = async function record(entry) {
  try {
    await this.create(entry);
  } catch (err) {
    console.error('Could not record activity:', err.message);
  }
};

module.exports = mongoose.model('Activity', ActivitySchema);
