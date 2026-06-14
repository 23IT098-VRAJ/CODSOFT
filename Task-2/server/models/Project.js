const mongoose = require('mongoose');
const { Schema } = mongoose;

const ProjectSchema = new Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  color: {
    type: String,
    default: '#6366f1',
    // No enum restriction — allow any hex color
  },
  ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  members: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  status: {
    type: String,
    enum: ['Active', 'Completed', 'On Hold'],
    default: 'Active',
  },
  dueDate: { type: Date },
  createdAt: { type: Date, default: Date.now },
});

// Auto-add ownerId to members on create
ProjectSchema.pre('save', function () {
  if (this.isNew) {
    const ownerIdStr = this.ownerId.toString();
    const alreadyMember = this.members.some((m) => m.toString() === ownerIdStr);
    if (!alreadyMember) {
      this.members.push(this.ownerId);
    }
  }
});

module.exports = mongoose.model('Project', ProjectSchema);
