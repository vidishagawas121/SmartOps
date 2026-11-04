import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });

import User from '../models/User';
import Vehicle from '../models/Vehicle';
import Product from '../models/Product';
import Inventory from '../models/Inventory';
import Trip from '../models/Trip';
import Attendance from '../models/Attendance';
import Salary from '../models/Salary';
import POD from '../models/POD';
import TripEvent from '../models/TripEvent';
import Location from '../models/Location';

const purgeAllDemoData = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/smartops';
    console.log(`[PURGE] Connecting to MongoDB: ${mongoUri}...`);
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 8000 });
    console.log(`[PURGE] Connected successfully.`);

    // 1. Purge Demo Drivers (Harpreet, Rajesh, Vikram, Suresh, or emails ending with @smartops.com, or DRV-000101/102/103/9041/1001)
    const demoUserFilter = {
      role: 'Driver',
      $or: [
        { email: { $regex: /smartops\.com$/i } },
        { fullName: { $regex: /harpreet|rajesh|vikram|suresh/i } },
        { driverId: { $in: ['DRV-000101', 'DRV-000102', 'DRV-000103', 'DRV-9041', 'DRV-1001'] } }
      ]
    };

    const demoUsers = await User.find(demoUserFilter);
    const demoUserIds = demoUsers.map(u => u._id);
    const demoDriverIds = demoUsers.map(u => u.driverId).filter(Boolean);

    const deletedUsers = await User.deleteMany(demoUserFilter);
    console.log(`[PURGE] Deleted ${deletedUsers.deletedCount} demo driver account(s).`);

    // 2. Purge Operational Data for Demo Drivers & Seeded Items
    const delVehicles = await Vehicle.deleteMany({
      $or: [
        { driver: { $regex: /harpreet|rajesh|vikram|suresh/i } },
        { vehicleNumber: { $in: ['MH-12-PQ-4589', 'MH-14-GH-1122', 'MH-43-AB-7788', 'KA-01-MJ-9002'] } }
      ]
    });

    const delTrips = await Trip.deleteMany({
      $or: [
        { driverId: { $in: [...demoUserIds, ...demoDriverIds] } },
        { driverName: { $regex: /harpreet|rajesh|vikram|suresh/i } },
        { tripNumber: { $regex: /^TRP-/i } },
        { invoiceNumber: { $in: ['INV-2026-901', 'INV-2026-902', 'INV-2026-903'] } }
      ]
    });

    const delAttendance = await Attendance.deleteMany({
      $or: [
        { driverId: { $in: [...demoUserIds, ...demoDriverIds] } },
        { driverName: { $regex: /harpreet|rajesh|vikram|suresh/i } },
        { employeeName: { $regex: /harpreet|rajesh|vikram|suresh/i } }
      ]
    });

    const delSalaries = await Salary.deleteMany({
      $or: [
        { employee: { $regex: /harpreet|rajesh|vikram|suresh/i } },
        { employeeName: { $regex: /harpreet|rajesh|vikram|suresh/i } }
      ]
    });

    const delPODs = await POD.deleteMany({
      $or: [
        { driverName: { $regex: /harpreet|rajesh|vikram|suresh/i } },
        { podId: { $regex: /^POD-/i } },
        { orderNumber: { $in: ['ORD-90812', 'ORD-90815'] } }
      ]
    });

    const delProducts = await Product.deleteMany({
      $or: [
        { sku: { $regex: /^(STL|ELE|LUB|PKG|ASM)-/i } }
      ]
    });

    const delInventory = await Inventory.deleteMany({
      $or: [
        { sku: { $regex: /^(STL|ELE|LUB|PKG|ASM)-/i } }
      ]
    });

    const delTripEvents = await TripEvent.deleteMany({
      driverId: { $in: [...demoUserIds, ...demoDriverIds] }
    });

    const delLocations = await Location.deleteMany({
      driverId: { $in: [...demoUserIds, ...demoDriverIds] }
    });

    console.log(`[PURGE] Cleaned associated operational demo records:`);
    console.log(`  - Vehicles: ${delVehicles.deletedCount}`);
    console.log(`  - Trips: ${delTrips.deletedCount}`);
    console.log(`  - Attendance: ${delAttendance.deletedCount}`);
    console.log(`  - Salaries: ${delSalaries.deletedCount}`);
    console.log(`  - PODs: ${delPODs.deletedCount}`);
    console.log(`  - Products: ${delProducts.deletedCount}`);
    console.log(`  - Inventory: ${delInventory.deletedCount}`);
    console.log(`  - Trip Events: ${delTripEvents.deletedCount}`);
    console.log(`  - Driver Locations: ${delLocations.deletedCount}`);

    console.log(`\n[PURGE] ✅ All demo data successfully purged from MongoDB.`);
    await mongoose.disconnect();
    process.exit(0);
  } catch (err: any) {
    console.error(`[PURGE ERROR]`, err.message);
    process.exit(1);
  }
};

purgeAllDemoData();
