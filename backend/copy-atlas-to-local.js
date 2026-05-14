require('dotenv').config();
const { MongoClient } = require('mongodb');

async function copyAtlasToLocal() {
  const atlasUri = process.env.MONGO_URI;
  const localUri = process.env.MONGO_URI_OFFLINE || 'mongodb://127.0.0.1:27017/attendance_db';

  if (!atlasUri) {
    console.error('❌ MONGO_URI not found in .env');
    process.exit(1);
  }

  console.log('🔄 Starting Atlas → Local copy...\n');
  console.log('📍 Atlas URI:', atlasUri.replace(/:[^:@]+@/, ':****@')); // Hide password
  console.log('📍 Local URI:', localUri);

  const atlasClient = new MongoClient(atlasUri);
  const localClient = new MongoClient(localUri);

  try {
    console.log('\n⏳ Connecting to Atlas...');
    await atlasClient.connect();
    console.log('✅ Connected to Atlas');

    console.log('⏳ Connecting to local MongoDB...');
    await localClient.connect();
    console.log('✅ Connected to local MongoDB');

    const atlasDb = atlasClient.db('attendance_db');
    const localDb = localClient.db('attendance_db');

    const collections = await atlasDb.listCollections().toArray();
    console.log(`\n📚 Found ${collections.length} collections to copy:\n`);

    for (const collectionInfo of collections) {
      const collectionName = collectionInfo.name;
      console.log(`⏳ Copying collection: ${collectionName}`);

      const atlasCollection = atlasDb.collection(collectionName);
      const localCollection = localDb.collection(collectionName);

      const count = await atlasCollection.countDocuments();
      console.log(`   Total documents: ${count}`);

      if (count === 0) {
        console.log(`   ✅ Skipped (empty collection)\n`);
        continue;
      }

      // Clear local collection
      await localCollection.deleteMany({});
      console.log('   Cleared local collection');

      // Copy all documents
      const documents = await atlasCollection.find({}).toArray();
      if (documents.length > 0) {
        await localCollection.insertMany(documents);
        console.log(`   ✅ Copied ${documents.length} documents\n`);
      }
    }

    // Copy indexes
    console.log('⏳ Copying indexes...');
    for (const collectionInfo of collections) {
      const collectionName = collectionInfo.name;
      const atlasCollection = atlasDb.collection(collectionName);
      const localCollection = localDb.collection(collectionName);

      const indexes = await atlasCollection.listIndexes().toArray();
      for (const index of indexes) {
        if (index.name !== '_id_') {
          try {
            await localCollection.createIndex(index.key, {
              name: index.name,
              unique: index.unique || false,
            });
            console.log(`   ✅ Created index: ${index.name} on ${collectionName}`);
          } catch (err) {
            console.log(`   ⚠️  Index ${index.name} already exists or error: ${err.message}`);
          }
        }
      }
    }

    console.log('\n✅ Copy completed successfully!');
    console.log('\n📊 Summary:');
    for (const collectionInfo of collections) {
      const collectionName = collectionInfo.name;
      const localCollection = localDb.collection(collectionName);
      const localCount = await localCollection.countDocuments();
      console.log(`   ${collectionName}: ${localCount} documents`);
    }

  } catch (error) {
    console.error('\n❌ Error during copy:', error.message);
    process.exit(1);
  } finally {
    await atlasClient.close();
    await localClient.close();
    console.log('\n✅ Disconnected from databases');
  }
}

copyAtlasToLocal();