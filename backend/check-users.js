require('dotenv').config();
const { MongoClient } = require('mongodb');

async function checkUsers() {
  const atlasUri = process.env.MONGO_URI;
  const localUri = process.env.MONGO_URI_OFFLINE || 'mongodb://127.0.0.1:27017/attendance_db';

  console.log('🔍 Checking users collection...\n');

  const atlasClient = new MongoClient(atlasUri);
  const localClient = new MongoClient(localUri);

  try {
    // Check Atlas
    console.log('⏳ Connecting to Atlas...');
    await atlasClient.connect();
    const atlasDb = atlasClient.db('attendance_db');
    const atlasUsers = await atlasDb.collection('users').countDocuments();
    console.log(`✅ Atlas users collection: ${atlasUsers} documents`);

    if (atlasUsers > 0) {
      const sample = await atlasDb.collection('users').findOne({});
      console.log('   Sample user:', JSON.stringify(sample, null, 2).slice(0, 200) + '...\n');
    }

    // Check local
    console.log('⏳ Connecting to local MongoDB...');
    await localClient.connect();
    const localDb = localClient.db('attendance_db');
    const localUsers = await localDb.collection('users').countDocuments();
    console.log(`✅ Local users collection: ${localUsers} documents\n`);

    // Copy if needed
    if (atlasUsers > 0 && localUsers === 0) {
      console.log('🔄 Copying users from Atlas to local...');
      await localDb.collection('users').deleteMany({});
      const users = await atlasDb.collection('users').find({}).toArray();
      await localDb.collection('users').insertMany(users);
      console.log(`✅ Copied ${users.length} users successfully!`);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await atlasClient.close();
    await localClient.close();
  }
}

checkUsers();
