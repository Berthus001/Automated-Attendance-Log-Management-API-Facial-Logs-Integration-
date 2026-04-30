require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User.model');

const createSuperAdmin = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    // Superadmin credentials
    const superadminData = {
      name: 'Super Admin',
      email: 'superadmin@attendance.com',
      password: 'Admin@123456',
      role: 'superadmin',
      isActive: true,
    };

    // Check if superadmin already exists
    const existingSuperadmin = await User.findOne({ email: superadminData.email });

    if (existingSuperadmin) {
      console.log('⚠️  Superadmin already exists!');
      console.log('\n📧 Email:', existingSuperadmin.email);
      console.log('👤 Name:', existingSuperadmin.name);
      console.log('🎭 Role:', existingSuperadmin.role);
      console.log('✅ Active:', existingSuperadmin.isActive);
      console.log('\n💡 Use this account to login');
    } else {
      // Create superadmin
      const superadmin = await User.create(superadminData);
      console.log('✅ Superadmin created successfully!\n');
      console.log('═══════════════════════════════════════');
      console.log('📧 Email: ', superadmin.email);
      console.log('🔑 Password: ', superadminData.password);
      console.log('👤 Name: ', superadmin.name);
      console.log('🎭 Role: ', superadmin.role);
      console.log('═══════════════════════════════════════');
      console.log('\n⚠️  IMPORTANT: Change this password after first login!');
    }

    await mongoose.connection.close();
    console.log('\n🔒 Connection closed');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

createSuperAdmin();
