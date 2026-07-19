require('dotenv').config();
const connectDB = require('../config/db');
const Employee = require('../models/Employee');
const mongoose = require('mongoose');

const run = async () => {
  await connectDB();

  const email = process.env.SEED_ADMIN_EMAIL || 'admin@ems.com';
  const password = process.env.SEED_ADMIN_PASSWORD || 'Admin@12345';
  const name = process.env.SEED_ADMIN_NAME || 'Super Admin';

  const existing = await Employee.findOne({ email });
  if (existing) {
    console.log(`Super admin already exists: ${email}`);
    await mongoose.disconnect();
    return;
  }

  await Employee.create({
    name,
    email,
    phone: '+911234567890',
    password,
    department: 'Administration',
    designation: 'Super Admin',
    salary: 0,
    joiningDate: new Date(),
    status: 'active',
    role: 'super_admin',
  });

  console.log(`Super admin created: ${email} / ${password}`);
  await mongoose.disconnect();
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
