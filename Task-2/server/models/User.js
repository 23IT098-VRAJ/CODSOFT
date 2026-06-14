const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const AVATAR_COLORS = ["#6366f1", "#f59e0b", "#10b981", "#ef4444", "#8b5cf6", "#ec4899"];

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: { type: String, required: true, minlength: 6 },
    avatarColor: {
      type: String,
      default: '#6366f1',
    },
    createdAt: { type: Date, default: Date.now },
  },
  {
    toJSON: {
      transform(doc, ret) {
        delete ret.password;
        return ret;
      },
    },
  }
);

// Hash password before save
UserSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Compare password instance method
UserSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);
