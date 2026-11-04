import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });

import User from '../models/User';

const clearDrivers = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/smartops';
    console.log(`[CLEAR DRIVERS] Connecting to MongoDB: ${mongoUri}...`);
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 8000 });
    console.log(`[CLEAR DRIVERS] Connected successfully.`);

    const deleted = await User.deleteMany({
      $or: [
        { role: { $regex: /^driver$/i } },
        { email: { $regex: /ramzan/i } }
      ]
    });
    console.log(`[CLEAR DRIVERS] Successfully deleted ${deleted.deletedCount} account(s) matching drivers or ramzan@gmail.com from MongoDB.`);

    const remainingDrivers = await User.countDocuments({ role: { $regex: /^driver$/i } });
    console.log(`[CLEAR DRIVERS] Remaining driver accounts in database: ${remainingDrivers}`);

    await mongoose.disconnect();
    console.log(`[CLEAR DRIVERS] Done.`);
    process.exit(0);
  } catch (err: any) {
    console.error(`[CLEAR DRIVERS ERROR]`, err.message);
    process.exit(1);
  }
};

clearDrivers();
