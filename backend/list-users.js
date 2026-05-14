require('dotenv').config();
const { MongoClient } = require('mongodb');

async function listUsers() {
  const localUri = process.env.MONGO_URI_OFFLINE || 'mongodb://127.0.0.1:27017/attendance_db';
  const localClient = new MongoClient(localUri);

  try {
    await localClient.connect();
    const localDb = localClient.db('attendance_db');
    const users = await localDb.collection('users').find({}).toArray();

    console.log('📋 All local users:\n');
    users.forEach((user, i) => {
      console.log(`${i + 1}. ${user.name} (${user.role}) - ${user.email || user.studentId || 'no ID'}`);
    });
    console.log(`\nTotal: ${users.length} users`);
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await localClient.close();
  }
}

listUsers();
