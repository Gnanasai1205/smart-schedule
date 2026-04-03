/**
 * Run this script once to create the admin user:
 *   node src/scripts/createAdmin.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const mongoose = require('mongoose');
const User = require('../models/User');

async function createAdmin() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  const existing = await User.findOne({ email: 'admin@smartcurriculum.com' });
  if (existing) {
    console.log('Admin already exists:', existing.email);
    process.exit(0);
  }

  const admin = await User.create({
    name: 'Admin',
    email: 'admin@smartcurriculum.com',
    password: 'Admin@123',
    role: 'Admin',
    status: 'approved',
  });

  console.log('✅ Admin user created!');
  console.log('   Email:    admin@smartcurriculum.com');
  console.log('   Password: Admin@123');
  process.exit(0);
}

createAdmin().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
