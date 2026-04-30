require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User.model');

const fixSuperadminRole = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find the user
    const user = await User.findOne({ email: 'superadmin@attendance.com' });

    if (!user) {
      console.log('❌ User not found! Creating new superadmin...\n');
      
      const superadmin = await User.create({
        name: 'Super Admin',
        email: 'superadmin@attendance.com',
        password: 'Admin@123456',
        role: 'superadmin',
        isActive: true,
      });

      console.log('✅ Superadmin created successfully!\n');
      console.log('═══════════════════════════════════════');
      console.log('📧 Email: ', superadmin.email);
      console.log('🔑 Password: Admin@123456');
      console.log('👤 Name: ', superadmin.name);
      console.log('🎭 Role: ', superadmin.role);
      console.log('═══════════════════════════════════════');
    } else {
      console.log('📋 Current user details:');
      console.log('═══════════════════════════════════════');
      console.log('📧 Email: ', user.email);
      console.log('👤 Name: ', user.name);
      console.log('🎭 Current Role: ', user.role);
      console.log('✅ Active: ', user.isActive);
      console.log('═══════════════════════════════════════\n');

      if (user.role !== 'superadmin') {
        console.log('⚠️  Role is NOT superadmin! Fixing...\n');
        
        user.role = 'superadmin';
        await user.save();

        console.log('✅ Role updated successfully!');
        console.log('🎭 New Role: ', user.role);
      } else {
        console.log('✅ Role is already set to superadmin!');
      }

      console.log('\n═══════════════════════════════════════');
      console.log('📧 Email: superadmin@attendance.com');
      console.log('🔑 Password: Admin@123456');
      console.log('🎭 Role: superadmin');
      console.log('═══════════════════════════════════════');
    }

    await mongoose.connection.close();
    console.log('\n🔒 Connection closed');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

fixSuperadminRole();
