import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });

const inspectAll = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/smartops';
    console.log(`Connecting to MongoDB: ${mongoUri}`);
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 5000 });

    if (!mongoose.connection.db) {
      console.log('No DB connection object');
      return;
    }

    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('Collections in database:', collections.map(c => c.name));

    for (const collInfo of collections) {
      const coll = mongoose.connection.db.collection(collInfo.name);
      const docs = await coll.find({}).toArray();
      console.log(`\n--- Collection: ${collInfo.name} (${docs.length} documents) ---`);
      docs.forEach(doc => {
        console.log(JSON.stringify(doc));
      });
    }

    await mongoose.disconnect();
  } catch (err: any) {
    console.error('Error inspecting all:', err.message);
  }
};

inspectAll();
