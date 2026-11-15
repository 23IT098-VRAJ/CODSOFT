const mongoose = require('mongoose');
const { PROJECT_STATUSES } = require('../config/constants');

const { Schema } = mongoose;

const ProjectSchema = new Schema(
  {
    name: { type: String, required: [true, 'Project name is required'], trim: true, maxlength: 100 },
    description: { type: String, default: '', maxlength: 1000 },
    color: { type: String, default: '#6366f1' }, // any hex colour
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    members: [{ type: Schema.Types.ObjectId, ref: 'User' }], // always includes the owner
    status: { type: String, enum: PROJECT_STATUSES, default: 'Active' },
    dueDate: { type: Date, default: null },
  },
  { timestamps: true }
);

// "Projects I belong to" is the most common query in the app.
ProjectSchema.index({ members: 1 });

// The owner is always a member.
ProjectSchema.pre('save', function addOwnerToMembers() {
  if (!this.isNew) return;
  const owner = String(this.ownerId);
  if (!this.members.some((m) => String(m) === owner)) this.members.push(this.ownerId);
});

ProjectSchema.methods.hasMember = function hasMember(userId) {
  const id = String(userId);
  return String(this.ownerId) === id || this.members.some((m) => String(m._id || m) === id);
};

ProjectSchema.methods.isOwner = function isOwner(userId) {
  return String(this.ownerId) === String(userId);
};

module.exports = mongoose.model('Project', ProjectSchema);
