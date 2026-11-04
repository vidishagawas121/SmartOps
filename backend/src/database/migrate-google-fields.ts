import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User';

dotenv.config();

export const runMigration = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/smartops';
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(mongoUri);
    }
    
    console.log('Running migration: backfilling user provider and email verification status...');
    
    const result = await User.updateMany(
      { provider: { $exists: false } },
      { $set: { provider: 'local', isEmailVerified: false } }
    );
    
    console.log(`Migration completed successfully. Modified ${result.modifiedCount} user documents.`);
    return result;
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
};

if (require.main === module) {
  runMigration()
    .then(() => mongoose.disconnect())
    .catch(() => process.exit(1));
}
