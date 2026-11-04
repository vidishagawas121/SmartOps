import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });

import User from '../models/User';
import VerificationCode from '../models/VerificationCode';

const clearGmailAccountsWithMobile = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/smartops';
    console.log(`[DB CLEAR] Connecting to MongoDB: ${mongoUri}...`);
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 5000 });
    console.log(`[DB CLEAR] Connected successfully.`);

    const gmailRegex = /@gmail\.com$/i;

    // Find users matching Gmail email AND non-empty mobileNumber
    const matchingUsers = await User.find({
      email: gmailRegex,
      mobileNumber: { $exists: true, $ne: '' }
    });

    console.log(`[DB CLEAR] Found ${matchingUsers.length} Gmail user account(s) registered with a mobile number:`);
    matchingUsers.forEach(u => {
      console.log(`  - [ID: ${u._id}] [${u.role}] ${u.fullName} (${u.email}) | Mobile: ${u.mobileNumber}`);
    });

    if (matchingUsers.length > 0) {
      const idsToDelete = matchingUsers.map(u => u._id);
      const deleteUserResult = await User.deleteMany({ _id: { $in: idsToDelete } });
      console.log(`[DB CLEAR] Deleted ${deleteUserResult.deletedCount} Gmail user record(s) from MongoDB 'users' collection.`);
    } else {
      console.log(`[DB CLEAR] No matching Gmail accounts with mobile numbers found to delete.`);
    }

    // Also check and delete any Gmail entries in verification codes
    const deleteCodeResult = await VerificationCode.deleteMany({ identifier: gmailRegex });
    if (deleteCodeResult.deletedCount > 0) {
      console.log(`[DB CLEAR] Deleted ${deleteCodeResult.deletedCount} OTP verification code record(s) matching Gmail from 'verificationcodes'.`);
    }

    console.log(`[DB CLEAR] ✅ Cleanup complete!`);
    await mongoose.disconnect();
    process.exit(0);
  } catch (err: any) {
    console.error(`[DB CLEAR ERROR] Failed to clear Gmail accounts:`, err.message);
    process.exit(1);
  }
};

clearGmailAccountsWithMobile();
