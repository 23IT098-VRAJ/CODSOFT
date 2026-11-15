const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Name is required'], trim: true, maxlength: 60 },
    email: { type: String, required: [true, 'Email is required'], unique: true, lowercase: true, trim: true },
    // select:false keeps the hash out of every query unless explicitly asked for.
    password: { type: String, required: true, minlength: 6, select: false },
    avatarColor: { type: String, default: '#3730A3' },
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        delete ret.password;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Hash the password whenever it is set or changed.
UserSchema.pre('save', async function hashPassword() {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 10);
});

UserSchema.methods.comparePassword = function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.password);
};

// Shape sent to clients — never includes the password hash.
UserSchema.methods.toPublic = function toPublic() {
  return { _id: this._id, name: this.name, email: this.email, avatarColor: this.avatarColor };
};

module.exports = mongoose.model('User', UserSchema);
