import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

// Load backend .env file
dotenv.config({ path: path.join(__dirname, '../../.env') });

import User from '../models/User';
import VerificationCode from '../models/VerificationCode';

const eraseGmailAccounts = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/smartops';
    console.log(`[DB ERASE] Connecting to MongoDB: ${mongoUri}...`);
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 5000 });
    console.log(`[DB ERASE] Connected successfully.`);

    // Regex matching any email containing gmail.com (case insensitive)
    const gmailRegex = /@gmail\.com$/i;

    // Find all users matching gmail
    const gmailUsers = await User.find({ email: gmailRegex });
    console.log(`[DB ERASE] Found ${gmailUsers.length} Gmail user account(s) to erase:`);
    gmailUsers.forEach(u => {
      console.log(`  - [${u.role}] ${u.fullName} (${u.email}) - Provider: ${u.provider}`);
    });

    // Delete matching users
    const deleteUserResult = await User.deleteMany({ email: gmailRegex });
    console.log(`[DB ERASE] Deleted ${deleteUserResult.deletedCount} user record(s) from MongoDB 'users' collection.`);

    // Delete verification codes matching gmail
    const deleteCodeResult = await VerificationCode.deleteMany({ identifier: gmailRegex });
    console.log(`[DB ERASE] Deleted ${deleteCodeResult.deletedCount} OTP verification code record(s) from MongoDB 'verificationcodes' collection.`);

    console.log(`[DB ERASE] ✅ Gmail account cleanup complete!`);
    await mongoose.disconnect();
    process.exit(0);
  } catch (err: any) {
    console.error(`[DB ERASE ERROR] Failed to erase Gmail accounts:`, err.message);
    process.exit(1);
  }
};

eraseGmailAccounts();
