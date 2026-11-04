import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });
import User from '../models/User';

const checkUser = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/smartops';
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 5000 });

    const u = await User.findOne({ email: /choudharyrihan687/i });
    if (u) {
      console.log('User found:', {
        id: u._id,
        fullName: u.fullName,
        email: u.email,
        mobileNumber: u.mobileNumber,
        role: u.role,
        isEmailVerified: u.isEmailVerified,
        driverId: u.driverId,
        companyName: u.companyName
      });
      // Ensure isEmailVerified is true so login never fails on pending verification
      if (!u.isEmailVerified) {
        u.isEmailVerified = true;
        await u.save();
        console.log('Updated isEmailVerified to true for:', u.email);
      }
    } else {
      console.log('User choudharyrihan687 not found.');
    }

    await mongoose.disconnect();
  } catch (err: any) {
    console.error(err);
  }
};

checkUser();
