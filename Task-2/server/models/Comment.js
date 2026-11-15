const mongoose = require('mongoose');

const { Schema } = mongoose;

const CommentSchema = new Schema(
  {
    taskId: { type: Schema.Types.ObjectId, ref: 'Task', required: true, index: true },
    // Stored on the comment too, so deleting a project can remove its comments in one query.
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    authorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    body: { type: String, required: [true, 'Comment cannot be empty'], trim: true, maxlength: 2000 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Comment', CommentSchema);
