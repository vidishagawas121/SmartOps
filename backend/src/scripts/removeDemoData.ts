import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });

import User from '../models/User';
import Vehicle from '../models/Vehicle';
import Trip from '../models/Trip';
import Attendance from '../models/Attendance';
import Salary from '../models/Salary';
import POD from '../models/POD';

const removeDemoData = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/smartops';
    console.log(`[REMOVE DEMO] Connecting to MongoDB: ${mongoUri}...`);
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 8000 });
    console.log(`[REMOVE DEMO] Connected successfully.`);

    // Match demo drivers Rajesh & Vikram
    const demoFilter = {
      $or: [
        { email: 'rajesh@smartops.com' },
        { email: 'driver@smartops.com' },
        { email: 'rajesh.kumar@smartops.com' },
        { email: 'vikram.sharma@smartops.com' },
        { fullName: { $regex: /rajesh/i } },
        { fullName: { $regex: /vikram/i } },
        { driverId: 'DRV-9041' },
        { driverId: 'DRV-1001' }
      ]
    };

    const demoUsers = await User.find(demoFilter);
    console.log(`Found ${demoUsers.length} demo user(s) to remove:`);
    demoUsers.forEach(u => console.log(`  - ${u.fullName} (${u.email}) [ID: ${u._id}]`));

    const demoIds = demoUsers.map(u => u._id);
    const demoDriverIds = demoUsers.map(u => u.driverId).filter(Boolean);

    // Delete demo users
    const delUsers = await User.deleteMany(demoFilter);
    console.log(`Deleted ${delUsers.deletedCount} demo user(s) from User collection.`);

    // Clean up related operational data for demo drivers
    const delTrips = await Trip.deleteMany({
      $or: [
        { driverId: { $in: [...demoIds, ...demoDriverIds] } },
        { driverName: { $regex: /rajesh|vikram/i } }
      ]
    });

    const delAttendance = await Attendance.deleteMany({
      $or: [
        { driverId: { $in: [...demoIds, ...demoDriverIds] } },
        { driverName: { $regex: /rajesh|vikram/i } },
        { employeeName: { $regex: /rajesh|vikram/i } }
      ]
    });

    const delSalaries = await Salary.deleteMany({
      $or: [
        { employee: { $regex: /rajesh|vikram/i } },
        { employeeName: { $regex: /rajesh|vikram/i } }
      ]
    });

    const delPODs = await POD.deleteMany({
      $or: [
        { driverName: { $regex: /rajesh|vikram/i } }
      ]
    });

    const delVehicles = await Vehicle.deleteMany({
      driver: { $regex: /rajesh|vikram/i }
    });

    console.log(`Cleaned associated demo data:`);
    console.log(`  - Trips: ${delTrips.deletedCount}`);
    console.log(`  - Attendance: ${delAttendance.deletedCount}`);
    console.log(`  - Salaries: ${delSalaries.deletedCount}`);
    console.log(`  - PODs: ${delPODs.deletedCount}`);
    console.log(`  - Vehicles: ${delVehicles.deletedCount}`);

    const remainingUsers = await User.find({});
    console.log(`\nRemaining users in MongoDB (${remainingUsers.length}):`);
    remainingUsers.forEach(u => console.log(`  - ${u.fullName} (${u.email}) [Role: ${u.role}]`));

    await mongoose.disconnect();
    console.log(`[REMOVE DEMO] Done.`);
    process.exit(0);
  } catch (err: any) {
    console.error(`[REMOVE DEMO ERROR]`, err.message);
    process.exit(1);
  }
};

removeDemoData();
