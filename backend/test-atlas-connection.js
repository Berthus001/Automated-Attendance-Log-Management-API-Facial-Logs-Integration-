require('dotenv').config();
const mongoose = require('mongoose');

console.log('Testing MongoDB Atlas Connection...\n');
console.log('Connection String:', process.env.MONGO_URI.replace(/:[^:@]+@/, ':****@')); // Hide password

const testConnection = async () => {
  try {
    console.log('\n⏳ Connecting to MongoDB Atlas...');
    
    const conn = await mongoose.connect(process.env.MONGO_URI);
    
    console.log('✅ MongoDB Connected Successfully!');
    console.log(`📍 Host: ${conn.connection.host}`);
    console.log(`📂 Database: ${conn.connection.name}`);
    console.log(`🔌 Connection State: ${conn.connection.readyState === 1 ? 'Connected' : 'Disconnected'}`);
    
    // Test a simple operation
    console.log('\n⏳ Testing database operation...');
    const collections = await conn.connection.db.listCollections().toArray();
    console.log(`✅ Found ${collections.length} collections in database`);
    
    if (collections.length > 0) {
      console.log('Collections:', collections.map(c => c.name).join(', '));
    }
    
    console.log('\n✅ Connection test completed successfully!');
    
    await mongoose.connection.close();
    console.log('🔒 Connection closed');
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ Connection Failed!');
    console.error('Error:', error.message);
    
    if (error.message.includes('Authentication failed')) {
      console.error('\n💡 Tip: Check your username and password');
    } else if (error.message.includes('network')) {
      console.error('\n💡 Tip: Check your internet connection and MongoDB Atlas IP whitelist');
    }
    
    process.exit(1);
  }
};

testConnection();
