const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

async function run() {
  const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/nfforms';
  console.log('Connecting to', mongoUri);
  await mongoose.connect(mongoUri);

  try {
    const db = mongoose.connection.db;
    const collection = db.collection('responses');
    
    console.log('Listing indexes for "responses" collection...');
    const indexes = await collection.listIndexes().toArray();
    console.log(JSON.stringify(indexes, null, 2));

    const uniqueIndexes = indexes.filter(idx => idx.unique);
    
    for (const idx of uniqueIndexes) {
      console.log(`Dropping unique index: ${idx.name}`);
      await collection.dropIndex(idx.name);
    }
    
    console.log('Unique indexes dropped successfully.');
  } catch (err) {
    console.error('Error dropping indexes:', err);
  } finally {
    await mongoose.disconnect();
  }
}

run();
