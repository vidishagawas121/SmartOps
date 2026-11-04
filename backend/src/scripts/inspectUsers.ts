import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });

import User from '../models/User';

const inspectUsers = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/smartops';
    console.log(`Connecting to MongoDB: ${mongoUri}`);
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 5000 });

    const users = await User.find({});
    console.log(`Total users found: ${users.length}`);
    users.forEach(u => {
      console.log(`- ID: ${u._id} | Name: ${u.fullName} | Email: ${u.email} | Role: ${u.role} | CompanyId: "${u.companyId || ''}" | CompanyName: "${u.companyName || ''}"`);
    });

    await mongoose.disconnect();
  } catch (err: any) {
    console.error('Error inspecting users:', err.message);
  }
};

inspectUsers();
