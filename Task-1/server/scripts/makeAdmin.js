// Promotes an existing account to admin (or back to a normal user).
//
//   npm run make-admin -- someone@example.com
//   npm run make-admin -- someone@example.com user
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

async function main() {
  const [email, role = 'admin'] = process.argv.slice(2);
  if (!email || !['admin', 'user'].includes(role)) {
    console.error('Usage: npm run make-admin -- <email> [admin|user]');
    process.exit(1);
  }
  if (!process.env.MONGO_URI) {
    console.error('MONGO_URI is not set — copy .env.example to .env first');
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGO_URI);
  const user = await User.findOneAndUpdate({ email: email.toLowerCase() }, { role }, { new: true });
  if (!user) {
    console.error(`No account found for ${email}. Register it in the app first.`);
    process.exit(1);
  }
  console.log(`${user.email} is now "${user.role}". Log out and back in to see the change.`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
