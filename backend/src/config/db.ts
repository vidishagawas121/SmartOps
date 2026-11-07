import dns from 'dns';
dns.setServers(['1.1.1.1', '8.8.8.8']);

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../models/User';
import Product from '../models/Product';
import Inventory from '../models/Inventory';
import Company, { generateCompanyId } from '../models/Company';
import { seedCompanyData } from '../services/seedService';

const seedDefaultInventory = async () => {
  try {
    const productCount = await Product.countDocuments();
    if (productCount === 0) {
      console.log('Seeding default enterprise products and inventory...');
      const companyId = 'CMP-SMARTOPS';
      const ownerId = '65f1a2b3c4d5e6f7a8b9c0d1'; // Default Owner ID

      const seededItems = [
        {
          productName: "CR Steel Sheets (1.2mm)",
          sku: "STL-CR-001",
          barcode: "8901234567890",
          category: "Raw Materials",
          subCategory: "Flat Rolled Steel",
          brand: "Tata Steel",
          unit: "Kg",
          purchasePrice: 65,
          sellingPrice: 85,
          minimumStockLevel: 500,
          maximumStockLevel: 5000,
          reorderLevel: 1000,
          status: "Active",
          quantity: 2400,
          reservedStock: 300,
          warehouse: "Pune Main Yard",
          storageLocation: "Row A, Shelf 2",
          supplier: "Tata Steel Ltd.",
          batchNumber: "B-STL-001",
          expiryDate: "",
          manufacturingDate: "2026-05-15",
          remarks: "High grade cold-rolled steel sheets for automotive body panel assembly."
        },
        {
          productName: "HR Steel Plates (5.0mm)",
          sku: "STL-HR-002",
          barcode: "8901234567891",
          category: "Raw Materials",
          subCategory: "Structural Steel",
          brand: "JSW Steel",
          unit: "Kg",
          purchasePrice: 58,
          sellingPrice: 76,
          minimumStockLevel: 300,
          maximumStockLevel: 3000,
          reorderLevel: 800,
          status: "Active",
          quantity: 450,
          reservedStock: 50,
          warehouse: "Pune Main Yard",
          storageLocation: "Row B, Shelf 1",
          supplier: "JSW Steel Ltd.",
          batchNumber: "B-STL-002",
          expiryDate: "",
          manufacturingDate: "2026-06-10",
          remarks: "Hot-rolled plates for heavy structural fabrication."
        },
        {
          productName: "Copper Wiring Harness 1.5m",
          sku: "ELE-COP-101",
          barcode: "8901234567892",
          category: "Electronics",
          subCategory: "Cabling",
          brand: "Finolex",
          unit: "Pieces",
          purchasePrice: 280,
          sellingPrice: 420,
          minimumStockLevel: 200,
          maximumStockLevel: 2000,
          reorderLevel: 400,
          status: "Active",
          quantity: 180,
          reservedStock: 20,
          warehouse: "Mumbai Hub",
          storageLocation: "Bin 14",
          supplier: "Finolex Cables",
          batchNumber: "B-ELE-101",
          expiryDate: "",
          manufacturingDate: "2026-04-01",
          remarks: "Standard 1.5m wiring harness for dashboard control connections."
        },
        {
          productName: "LED Control Module Gen 3",
          sku: "ELE-LED-102",
          barcode: "8901234567893",
          category: "Electronics",
          subCategory: "Microcontrollers",
          brand: "Bosch",
          unit: "Pieces",
          purchasePrice: 1250,
          sellingPrice: 1850,
          minimumStockLevel: 50,
          maximumStockLevel: 500,
          reorderLevel: 100,
          status: "Active",
          quantity: 12,
          reservedStock: 0,
          warehouse: "Mumbai Hub",
          storageLocation: "Shelf C-4",
          supplier: "Bosch India",
          batchNumber: "B-ELE-102",
          expiryDate: "",
          manufacturingDate: "2026-02-28",
          remarks: "Electronic controller for dashboard LED status illumination. Low stock, reorder required."
        },
        {
          productName: "Engine Lubricant Grade 5W-30",
          sku: "LUB-ENG-501",
          barcode: "8901234567894",
          category: "Lubricants",
          subCategory: "Motor Oils",
          brand: "Castrol",
          unit: "Litre",
          purchasePrice: 450,
          sellingPrice: 620,
          minimumStockLevel: 100,
          maximumStockLevel: 1000,
          reorderLevel: 200,
          status: "Active",
          quantity: 0,
          reservedStock: 0,
          warehouse: "Pune Main Yard",
          storageLocation: "Rack 3, Row D",
          supplier: "Castrol India",
          batchNumber: "B-LUB-501",
          expiryDate: "2029-06-30",
          manufacturingDate: "2026-06-30",
          remarks: "High performance synthetic engine oil for fleet vehicles. Out of stock, critical replenishment."
        },
        {
          productName: "Hydraulic Brake Fluid Dot 4",
          sku: "LUB-BRK-502",
          barcode: "8901234567895",
          category: "Lubricants",
          subCategory: "Brake Fluids",
          brand: "Mobil 1",
          unit: "Litre",
          purchasePrice: 380,
          sellingPrice: 510,
          minimumStockLevel: 50,
          maximumStockLevel: 500,
          reorderLevel: 100,
          status: "Active",
          quantity: 340,
          reservedStock: 15,
          warehouse: "Pune Main Yard",
          storageLocation: "Rack 3, Row E",
          supplier: "Mobil Distributors",
          batchNumber: "B-LUB-502",
          expiryDate: "2028-12-15",
          manufacturingDate: "2025-12-15",
          remarks: "Standard DOT 4 brake fluid for hydraulic braking systems."
        },
        {
          productName: "Corrugated Cardboard Box XL",
          sku: "PKG-CAR-301",
          barcode: "8901234567896",
          category: "Packaging",
          subCategory: "Shipping Boxes",
          brand: "Packwell",
          unit: "Pieces",
          purchasePrice: 45,
          sellingPrice: 65,
          minimumStockLevel: 1000,
          maximumStockLevel: 10000,
          reorderLevel: 2000,
          status: "Active",
          quantity: 6200,
          reservedStock: 500,
          warehouse: "Pune Main Yard",
          storageLocation: "Aisle 7",
          supplier: "Packwell Packaging Ltd.",
          batchNumber: "B-PKG-301",
          expiryDate: "",
          manufacturingDate: "2026-07-01",
          remarks: "Heavy duty corrugated shipping boxes for finished assemblies."
        },
        {
          productName: "Industrial Bubble Wrap Roll 100m",
          sku: "PKG-BUB-302",
          barcode: "8901234567897",
          category: "Packaging",
          subCategory: "Protective Wrap",
          brand: "3M",
          unit: "Pieces",
          purchasePrice: 850,
          sellingPrice: 1200,
          minimumStockLevel: 30,
          maximumStockLevel: 300,
          reorderLevel: 60,
          status: "Active",
          quantity: 45,
          reservedStock: 5,
          warehouse: "Pune Main Yard",
          storageLocation: "Aisle 8",
          supplier: "3M India Ltd.",
          batchNumber: "B-PKG-302",
          expiryDate: "",
          manufacturingDate: "2026-05-10",
          remarks: "High quality protective packaging rolls for delicate electronics shipping. Low stock status."
        },
        {
          productName: "Front Axle Assembly v2.1",
          sku: "ASM-FRT-201",
          barcode: "8901234567898",
          category: "Assemblies",
          subCategory: "Axles",
          brand: "SmartOps Heavy",
          unit: "Pieces",
          purchasePrice: 8500,
          sellingPrice: 12500,
          minimumStockLevel: 15,
          maximumStockLevel: 150,
          reorderLevel: 30,
          status: "Active",
          quantity: 42,
          reservedStock: 10,
          warehouse: "Pune Main Yard",
          storageLocation: "Staging Area 1",
          supplier: "SmartOps Assembly Division",
          batchNumber: "B-ASM-201",
          expiryDate: "",
          manufacturingDate: "2026-07-20",
          remarks: "Complete front axle structural assembly ready for chassis mounting."
        },
        {
          productName: "Rear Axle Assembly v2.1",
          sku: "ASM-RER-202",
          barcode: "8901234567899",
          category: "Assemblies",
          subCategory: "Axles",
          brand: "SmartOps Heavy",
          unit: "Pieces",
          purchasePrice: 9200,
          sellingPrice: 13800,
          minimumStockLevel: 15,
          maximumStockLevel: 150,
          reorderLevel: 30,
          status: "Active",
          quantity: 8,
          reservedStock: 2,
          warehouse: "Pune Main Yard",
          storageLocation: "Staging Area 2",
          supplier: "SmartOps Assembly Division",
          batchNumber: "B-ASM-202",
          expiryDate: "",
          manufacturingDate: "2026-07-22",
          remarks: "Complete rear axle assembly with integrated differential gears. Low stock, reorder required."
        }
      ];

      for (const item of seededItems) {
        // Create Product
        const product = new Product({
          productName: item.productName,
          sku: item.sku,
          barcode: item.barcode,
          category: item.category,
          subCategory: item.subCategory,
          brand: item.brand,
          unit: item.unit,
          purchasePrice: item.purchasePrice,
          sellingPrice: item.sellingPrice,
          minimumStockLevel: item.minimumStockLevel,
          maximumStockLevel: item.maximumStockLevel,
          reorderLevel: item.reorderLevel,
          status: item.status,
          companyId,
          ownerId,
          createdBy: ownerId
        });
        await product.save();

        // Create Inventory
        const inventory = new Inventory({
          productId: product._id,
          quantity: item.quantity,
          reservedStock: item.reservedStock,
          warehouse: item.warehouse,
          storageLocation: item.storageLocation,
          supplier: item.supplier,
          batchNumber: item.batchNumber,
          expiryDate: item.expiryDate,
          manufacturingDate: item.manufacturingDate,
          lastRestockedDate: (item as any).lastRestockedDate || new Date().toLocaleDateString(),
          remarks: item.remarks,
          status: item.status,
          companyId,
          ownerId,
          // Legacy fields
          itemName: item.productName,
          category: item.category,
          sku: item.sku,
          minimumQuantity: item.minimumStockLevel,
          purchasePrice: item.purchasePrice,
          sellingPrice: item.sellingPrice,
          description: item.remarks
        });
        await inventory.save();
      }
      console.log('Seeded 10 enterprise products and inventory successfully.');
    }
  } catch (err: any) {
    console.error('Error seeding default inventory:', err.message);
  }
};

const seedDefaultAccounts = async () => {
  try {
    // 1. Ensure default Company exists
    let defaultCompany = await Company.findOne({ companyName: 'SmartOps Logistics' });
    if (!defaultCompany) {
      defaultCompany = await Company.create({
        companyId: 'CMP-SMARTOPS',
        companyName: 'SmartOps Logistics',
        companyType: 'Logistics',
        createdBy: '65f1a2b3c4d5e6f7a8b9c0d1'
      });
      console.log('Seeded default Company CMP-SMARTOPS.');
    }

    // 2. Seed default Owner if not present
    const ownerEmail = 'rehanchaudhari181133@gmail.com';
    let existingOwner = await User.findOne({ email: ownerEmail });
    if (!existingOwner) {
      console.log('Seeding default Owner account...');
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash('123456', salt);
      existingOwner = new User({
        _id: new mongoose.Types.ObjectId('65f1a2b3c4d5e6f7a8b9c0d1'),
        fullName: 'Rehan Chaudhari',
        email: ownerEmail,
        mobileNumber: '9876543210',
        role: 'Owner',
        passwordHash,
        provider: 'local',
        isEmailVerified: true,
        isPhoneVerified: true,
        verifiedAt: new Date(),
        securityQuestion: "What is your best friend's name?",
        securityAnswerHash: await bcrypt.hash('friend', 10),
        companyId: defaultCompany.companyId,
        companyName: 'SmartOps Logistics'
      });
      await existingOwner.save();
      console.log('Default Owner account seeded successfully!');
    } else if (!existingOwner.companyId) {
      existingOwner.companyId = defaultCompany.companyId;
      if (!existingOwner.companyName) existingOwner.companyName = defaultCompany.companyName;
      await existingOwner.save();
    }

    // 3. Auto-heal any existing Owner accounts missing companyId
    const ownersWithoutCompany = await User.find({
      role: 'Owner',
      $or: [{ companyId: { $exists: false } }, { companyId: null }, { companyId: '' }]
    });
    for (const owner of ownersWithoutCompany) {
      let company = await Company.findOne({ createdBy: String(owner._id) });
      if (!company && owner.companyName) {
        company = await Company.findOne({ companyName: owner.companyName });
      }
      if (!company) {
        const cId = await generateCompanyId();
        company = await Company.create({
          companyId: cId,
          companyName: owner.companyName || 'SmartOps Logistics',
          companyType: 'Logistics',
          createdBy: String(owner._id)
        });
      }
      owner.companyId = company.companyId;
      if (!owner.companyName) owner.companyName = company.companyName;
      await owner.save();
    }

        // 4. Seed Demo Accounts for the 4 Dashboards
    const demoAccounts = [
      { fullName: 'Enterprise Owner', email: 'owner@smartops.com', role: 'Owner', mobileNumber: '9998881111', companyId: defaultCompany.companyId, companyName: 'SmartOps Logistics' },
      { fullName: 'Factory Floor Supervisor', email: 'supervisor@smartops.com', role: 'Supervisor', mobileNumber: '9998882222', employeeId: 'SUP-001', branch: 'Pune Main Branch', companyId: defaultCompany.companyId },
      { fullName: 'Logistics Driver', email: 'driver@smartops.com', role: 'Driver', mobileNumber: '9998883333', driverId: 'DRV-001', vehicleNumber: 'MH-12-AB-1234', companyId: defaultCompany.companyId },
      { fullName: 'Assembly Floor Worker', email: 'worker@smartops.com', role: 'Worker', mobileNumber: '9998884444', employeeId: 'EMP-1001', branch: 'Pune Main Branch', companyId: defaultCompany.companyId }
    ];

    const defaultSalt = await bcrypt.genSalt(10);
    const defaultPasswordHash = await bcrypt.hash('password123', defaultSalt);

    for (const acc of demoAccounts) {
      const existing = await User.findOne({ email: acc.email });
      if (!existing) {
        await User.create({
          ...acc,
          passwordHash: defaultPasswordHash,
          isEmailVerified: true,
          isPhoneVerified: true,
          verifiedAt: new Date(),
          status: 'Active'
        });
        console.log(`[SEED] Seeded demo role account: ${acc.email} (${acc.role})`);
      }
    }

    // 5. Ensure linked Worker records for Worker and Supervisor
    const WorkerModel = require('../factory/models/Worker');
    const TaskModel = require('../factory/models/Task');
    const FactoryInventoryModel = require('../factory/models/Inventory');

    const workerUser = await User.findOne({ email: 'worker@smartops.com' });
    const supervisorUser = await User.findOne({ email: 'supervisor@smartops.com' });

    let workerDoc: any = null;
    let supervisorDoc: any = null;

    if (workerUser) {
      workerDoc = await WorkerModel.findOne({ email: workerUser.email });
      if (!workerDoc) {
        workerDoc = await WorkerModel.create({
          name: workerUser.fullName || 'Assembly Floor Worker',
          email: workerUser.email,
          employeeId: workerUser.employeeId || 'EMP-1001',
          phone: workerUser.mobileNumber || '9998884444',
          department: 'Operations',
          designation: 'Floor Operator',
          role: 'Worker',
          salary: 25000,
          status: 'Active',
          shiftTiming: '9:00 AM - 6:00 PM',
          user: workerUser._id
        });
        console.log('[SEED] Created linked Worker document for worker@smartops.com');
      }
      if (!workerUser.worker) {
        workerUser.worker = workerDoc._id;
        await workerUser.save();
      }
    }

    if (supervisorUser) {
      supervisorDoc = await WorkerModel.findOne({ email: supervisorUser.email });
      if (!supervisorDoc) {
        supervisorDoc = await WorkerModel.create({
          name: supervisorUser.fullName || 'Factory Floor Supervisor',
          email: supervisorUser.email,
          employeeId: supervisorUser.employeeId || 'SUP-001',
          phone: supervisorUser.mobileNumber || '9998882222',
          department: 'Management',
          designation: 'Floor Supervisor',
          role: 'Supervisor',
          salary: 45000,
          status: 'Active',
          shiftTiming: '9:00 AM - 6:00 PM',
          user: supervisorUser._id
        });
        console.log('[SEED] Created linked Worker document for supervisor@smartops.com');
      }
      if (!supervisorUser.worker) {
        supervisorUser.worker = supervisorDoc._id;
        await supervisorUser.save();
      }
    }

    // 6. Seed a default factory task if none exists
    const taskCount = await TaskModel.countDocuments();
    if (taskCount === 0 && workerDoc && supervisorDoc) {
      await TaskModel.create({
        title: 'Assembly & Quality Inspection — Batch #LOT-2026-A',
        name: 'Assembly & Quality Inspection — Batch #LOT-2026-A',
        description: 'Perform dimensional check, verify barcode scan, seal cartons and stage for logistics dispatch.',
        assignedTo: workerDoc._id,
        assignedBy: supervisorDoc._id,
        priority: 'High',
        status: 'In Progress',
        progressPercent: 35,
        progress: 35,
        assignedDate: new Date(),
        dueDate: new Date(Date.now() + 48 * 3600 * 1000),
        checklist: [
          { name: 'Perform dimensional inspection with vernier caliper', isMandatory: true, isCompleted: true },
          { name: 'Scan item QR code on primary packaging', isMandatory: true, isCompleted: false },
          { name: 'Apply tamper-evident hologram seal', isMandatory: true, isCompleted: false },
          { name: 'Stage at outbound shipping dock B-3', isMandatory: true, isCompleted: false }
        ]
      });
      console.log('[SEED] Seeded demo connected task for Worker & Supervisor.');
    }

    // 7. Seed default factory inventory if empty
    const invCount = await FactoryInventoryModel.countDocuments();
    if (invCount === 0) {
      const demoItems = [
        { name: 'CR Steel Sheets (1.2mm)', sku: 'STL-CR-001', cat: 'Raw Materials', qty: 120, threshold: 30, val: 65, loc: 'Rack A-01', gst: 18, emoji: '🔩' },
        { name: 'Industrial Ball Bearings (6204-2RS)', sku: 'BRG-6204-001', cat: 'Mechanical', qty: 85, threshold: 25, val: 120, loc: 'Shelf B-04', gst: 18, emoji: '⚙️' },
        { name: 'Microcontroller Units (MCU-32)', sku: 'MCU-32-001', cat: 'Electronics', qty: 18, threshold: 20, val: 450, loc: 'Bin C-12', gst: 18, emoji: '⚡' },
        { name: 'Corrugated Packaging Boxes (Large)', sku: 'BOX-CRG-001', cat: 'Packaging', qty: 350, threshold: 50, val: 28, loc: 'Pallet P-02', gst: 12, emoji: '📦' }
      ];
      for (const it of demoItems) {
        await FactoryInventoryModel.create(it);
      }
      console.log('[SEED] Seeded demo factory inventory items.');
    }

    // 8. Seed default Vehicle and Trip for Driver & Owner
    const VehicleModel = mongoose.models.Vehicle || mongoose.model('Vehicle');
    const TripModel = mongoose.models.Trip || mongoose.model('Trip');

    const vCount = await VehicleModel.countDocuments();
    if (vCount === 0) {
      await VehicleModel.create({
        vehicleNumber: 'MH-12-AB-1234',
        vehicleType: 'Heavy Truck (10T)',
        driver: 'Logistics Driver',
        rcNumber: 'RC-MH12-2024-9988',
        insurance: '2027-12-31',
        permit: '2027-06-30',
        fitness: '2027-08-15',
        fuelType: 'Diesel',
        mileage: 4.8,
        currentLocation: 'Pune Logistics Hub, Gate 2',
        status: 'Moving',
        companyId: defaultCompany.companyId
      });
      console.log('[SEED] Seeded demo Vehicle MH-12-AB-1234');
    }

    const tripCount = await TripModel.countDocuments();
    if (tripCount === 0) {
      await TripModel.create({
        tripNumber: 'TRIP-2026-001',
        vehicleNumber: 'MH-12-AB-1234',
        driverId: 'DRV-001',
        driverName: 'Logistics Driver',
        pickupLocation: 'Pune Manufacturing Plant, Sector 4',
        dropLocation: 'Mumbai Distribution Center, Dock 3',
        customerName: 'Apex Industrial Corp',
        customerPhone: '9876543210',
        material: 'Machined Components & Bearings',
        weight: '4.5 Tons',
        invoiceNumber: 'INV-2026-8812',
        priority: 'High',
        status: 'In Transit',
        scheduledStart: new Date(),
        companyId: defaultCompany.companyId,
        stops: [
          { sequence: 1, address: 'Pune Plant Gate 4', latitude: 18.5204, longitude: 73.8567, status: 'Completed', arrivedAt: new Date(Date.now() - 3600000), completedAt: new Date(Date.now() - 3000000) },
          { sequence: 2, address: 'Mumbai Distribution Center', latitude: 19.0760, longitude: 72.8777, status: 'Pending' }
        ]
      });
      console.log('[SEED] Seeded demo Trip TRIP-2026-001');
    }

    // 9. Call seedDefaultInventory for Enterprise Product & Inventory catalog
    await seedDefaultInventory();
  } catch (err: any) {
    console.error('Error seeding default accounts:', err.message);
  }
};

/**
 * Automatically spawns the installed local MongoDB binary with dbpath on D: drive
 * (to avoid running out of disk space on C: drive).
 */
const startLocalMongodDaemon = async (): Promise<boolean> => {
  const fs = require('fs');
  const path = require('path');
  const { spawn } = require('child_process');
  const net = require('net');

  const candidateBinaries = [
    process.env.MONGOD_BIN,
    'C:/Program Files/MongoDB/Server/8.3/bin/mongod.exe',
    'C:/Program Files/MongoDB/Server/8.0/bin/mongod.exe',
    'C:/Program Files/MongoDB/Server/7.0/bin/mongod.exe',
    'C:/Program Files/MongoDB/Server/6.0/bin/mongod.exe'
  ].filter(Boolean);

  let binaryPath: string | null = null;
  for (const b of candidateBinaries) {
    if (b && fs.existsSync(b)) {
      binaryPath = b;
      break;
    }
  }

  if (!binaryPath) return false;

  // Use D: drive workspace data directory (which has 150+ GB free space)
  const devDbPath = path.resolve(process.cwd(), '.mongo-dev-data');
  if (!fs.existsSync(devDbPath)) {
    fs.mkdirSync(devDbPath, { recursive: true });
  }

  console.log(`[DB] Launching installed MongoDB daemon from: ${binaryPath}`);
  console.log(`[DB] Storage path on D: drive: ${devDbPath}`);

  try {
    const child = spawn(binaryPath, [
      '--dbpath', devDbPath,
      '--port', '27017',
      '--bind_ip', '127.0.0.1',
      '--setParameter', 'diagnosticDataCollectionEnabled=false'
    ], {
      detached: true,
      stdio: 'ignore'
    });
    child.unref();

    // Poll port 27017 for up to 15 seconds
    for (let i = 0; i < 30; i++) {
      await new Promise(res => setTimeout(res, 500));
      const isOpen = await new Promise<boolean>(resolve => {
        const sock = new net.Socket();
        sock.setTimeout(400);
        sock.once('connect', () => { sock.destroy(); resolve(true); });
        sock.once('error', () => { sock.destroy(); resolve(false); });
        sock.once('timeout', () => { sock.destroy(); resolve(false); });
        sock.connect(27017, '127.0.0.1');
      });
      if (isOpen) {
        console.log('[DB] Local MongoDB daemon is ready and listening on port 27017.');
        return true;
      }
    }
  } catch (err: any) {
    console.warn(`[DB] Failed to launch local mongod process: ${err?.message}`);
  }

  return false;
};

export const connectDB = async () => {
  const primaryUri = process.env.MONGO_URI || 'mongodb://localhost:27017/smartops';

  // ── Attempt 1: Primary URI (Atlas or configured MONGO_URI) ─────────────────
  try {
    console.log(`Connecting to MongoDB: ${primaryUri.replace(/:([^:@]{4})[^:@]*@/, ':****@')}...`);
    const conn = await mongoose.connect(primaryUri, {
      serverSelectionTimeoutMS: 6000
    });
    console.log(`MongoDB Connected successfully: ${conn.connection.host}`);
    await seedDefaultAccounts();

    // Drop legacy stale indexes
    try {
      if (mongoose.connection.db) {
        const usersCol = mongoose.connection.db.collection('users');
        const indexes = await usersCol.indexes();
        if (indexes.some((idx: any) => idx.name === 'username_1')) {
          await usersCol.dropIndex('username_1');
          console.log('[DB] Dropped legacy username_1 index.');
        }
      }
    } catch {
      // ignore — index cleanup is non-critical
    }
    return;
  } catch (primaryErr: any) {
    console.warn(`[DB] Primary MongoDB unreachable: ${primaryErr.message}`);
  }

  // ── Attempt 2: Auto-start installed local MongoDB binary on D: drive ─────────
  try {
    const started = await startLocalMongodDaemon();
    if (started) {
      const conn = await mongoose.connect('mongodb://localhost:27017/smartops', {
        serverSelectionTimeoutMS: 5000
      });
      console.log(`[DB] Connected successfully to auto-started local MongoDB: ${conn.connection.host}`);
      await seedDefaultAccounts();
      return;
    }
  } catch (startErr: any) {
    console.warn(`[DB] Auto-starting local MongoDB failed: ${startErr.message}`);
  }

  // ── Attempt 3: In-Memory MongoDB Fallback for Dev (configured on D: drive) ───
  try {
    console.log('[DB] Falling back to In-Memory MongoMemoryServer for development...');
    const { MongoMemoryServer } = require('mongodb-memory-server');
    const path = require('path');
    const fs = require('fs');

    const devDbPath = path.resolve(process.cwd(), '.mongo-dev-data');
    if (!fs.existsSync(devDbPath)) {
      fs.mkdirSync(devDbPath, { recursive: true });
    }

    const candidatePaths = [
      process.env.MONGOMS_SYSTEM_BINARY,
      path.resolve(__dirname, '../../../node_modules/.cache/mongodb-memory-server/mongod-x64-win32-8.2.6.exe'),
      path.resolve(__dirname, '../../node_modules/.cache/mongodb-memory-server/mongod-x64-win32-8.2.6.exe'),
      path.resolve(process.cwd(), 'node_modules/.cache/mongodb-memory-server/mongod-x64-win32-8.2.6.exe'),
      'D:/SmartOps/node_modules/.cache/mongodb-memory-server/mongod-x64-win32-8.2.6.exe'
    ].filter(Boolean);

    let systemBinary: string | undefined;
    for (const p of candidatePaths) {
      if (typeof p === 'string' && fs.existsSync(p)) {
        systemBinary = p;
        break;
      }
    }

    const opts: any = {
      instance: {
        dbPath: devDbPath,
        launchTimeout: 30000,
        args: ['--setParameter', 'diagnosticDataCollectionEnabled=false']
      }
    };
    if (systemBinary) {
      console.log(`[DB] Using cached MongoDB binary: ${systemBinary}`);
      opts.binary = { systemBinary };
    }

    const mongod = await MongoMemoryServer.create(opts);
    const memUri = mongod.getUri();
    const conn = await mongoose.connect(memUri);
    console.log(`[DB] Connected to In-Memory MongoDB: ${conn.connection.host}`);
    await seedDefaultAccounts();
    return;
  } catch (memErr: any) {
    console.warn(`[DB] In-memory MongoDB failed to start: ${memErr.message}`);
  }

  // ── All connections failed ─────────────────────────────────────────────────
  if (mongoose.connection.readyState !== 1) {
    throw new Error(
      `MongoDB connection failed. Please do ONE of the following:\n` +
      `  1. Whitelist your current IP in Atlas Network Access:\n` +
      `     https://cloud.mongodb.com → Network Access → Add IP Address → Allow Current IP\n` +
      `  2. Install MongoDB Community Edition locally:\n` +
      `     https://www.mongodb.com/try/download/community\n` +
      `     Then run: mongod --dbpath ./data/db`
    );
  }
};


