require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User.model');

const listAllUsers = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    const users = await User.find().select('-password -faceDescriptor');
    
    console.log(`📊 Total Users: ${users.length}\n`);
    console.log('═══════════════════════════════════════════════════════════');
    
    users.forEach((user, index) => {
      console.log(`\n${index + 1}. ${user.name}`);
      console.log(`   📧 Email: ${user.email}`);
      console.log(`   🎭 Role: ${user.role}`);
      console.log(`   ✅ Active: ${user.isActive}`);
      console.log(`   🆔 ID: ${user._id}`);
    });
    
    console.log('\n═══════════════════════════════════════════════════════════');

    await mongoose.connection.close();
    console.log('\n🔒 Connection closed');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

listAllUsers();
