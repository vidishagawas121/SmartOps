import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import bcrypt from 'bcryptjs';

dotenv.config({ path: path.join(__dirname, '../../.env') });

import User from '../models/User';
import Vehicle from '../models/Vehicle';
import Inventory from '../models/Inventory';
import Trip from '../models/Trip';
import Salary from '../models/Salary';
import Attendance from '../models/Attendance';
import POD from '../models/POD';

const cleanOwnerAndMockData = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/smartops';
    console.log(`[CLEANUP] Connecting to MongoDB: ${mongoUri}...`);
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 5000 });
    console.log(`[CLEANUP] Connected successfully.`);

    const TARGET_OWNER_EMAIL = 'rehanchaudhari181133@gmail.com';

    // 1. Delete all other owners except target owner
    const deletedOwners = await User.deleteMany({
      role: 'Owner',
      email: { $ne: TARGET_OWNER_EMAIL }
    });
    console.log(`[CLEANUP] Removed ${deletedOwners.deletedCount} non-primary owner account(s).`);

    // 2. Ensure single owner account exists
    let targetOwner = await User.findOne({ email: TARGET_OWNER_EMAIL });
    if (!targetOwner) {
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash('Password@123', salt);
      targetOwner = await User.create({
        fullName: 'Rehan Chaudhari',
        email: TARGET_OWNER_EMAIL,
        mobileNumber: '9999999999',
        role: 'Owner',
        passwordHash,
        provider: 'local',
        isEmailVerified: true,
        isPhoneVerified: true,
        verifiedAt: new Date(),
        companyName: 'SmartOps Manufacturing'
      });
      console.log(`[CLEANUP] Created single owner account: ${TARGET_OWNER_EMAIL}`);
    } else {
      console.log(`[CLEANUP] Single owner account verified: ${TARGET_OWNER_EMAIL}`);
    }

    // 3. Clean mock operational collections
    const delVehicles = await Vehicle.deleteMany({});
    const delInventory = await Inventory.deleteMany({});
    const delTrips = await Trip.deleteMany({});
    const delSalaries = await Salary.deleteMany({});
    const delAttendance = await Attendance.deleteMany({});
    const delPODs = await POD.deleteMany({});

    console.log(`[CLEANUP] Deleted mock data:`);
    console.log(`  - Vehicles: ${delVehicles.deletedCount}`);
    console.log(`  - Inventory: ${delInventory.deletedCount}`);
    console.log(`  - Trips: ${delTrips.deletedCount}`);
    console.log(`  - Salaries: ${delSalaries.deletedCount}`);
    console.log(`  - Attendance: ${delAttendance.deletedCount}`);
    console.log(`  - PODs: ${delPODs.deletedCount}`);

    console.log(`[CLEANUP] ✅ Cleanup finished successfully. Only 1 owner remains: ${TARGET_OWNER_EMAIL}`);
    await mongoose.disconnect();
    process.exit(0);
  } catch (err: any) {
    console.error(`[CLEANUP ERROR] Failed:`, err.message);
    process.exit(1);
  }
};

cleanOwnerAndMockData();
