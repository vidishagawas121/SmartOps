import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });

import POD from '../models/POD';

const cleanDemoPods = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/smartops';
    await mongoose.connect(mongoUri);
    const res = await POD.deleteMany({
      $or: [
        { driverName: { $regex: /harpreet|rajesh|vikram/i } },
        { podId: { $regex: /^POD-CMP/i } }
      ]
    });
    console.log(`[CLEANUP] Deleted ${res.deletedCount} demo seed POD records.`);
    await mongoose.disconnect();
    process.exit(0);
  } catch (err: any) {
    console.error(err);
    process.exit(1);
  }
};

cleanDemoPods();
