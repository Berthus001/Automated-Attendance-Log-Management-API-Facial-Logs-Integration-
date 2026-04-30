require('dotenv').config();
const dns = require('dns').promises;

console.log('🔍 MongoDB Atlas Connection Diagnostics\n');

const diagnose = async () => {
  // Extract cluster info from connection string
  const uri = process.env.MONGO_URI;
  const match = uri.match(/@([^/]+)/);
  const host = match ? match[1] : null;
  
  console.log('📋 Configuration:');
  console.log('   URI:', uri.replace(/:[^:@]+@/, ':****@'));
  console.log('   Host:', host);
  console.log('');
  
  // Test 1: DNS Resolution
  console.log('Test 1: DNS Resolution');
  try {
    const srvRecord = `_mongodb._tcp.${host}`;
    console.log(`   Resolving SRV: ${srvRecord}`);
    const records = await dns.resolveSrv(srvRecord);
    console.log('   ✅ DNS Resolution successful!');
    console.log(`   Found ${records.length} server(s):`);
    records.forEach(r => console.log(`      - ${r.name}:${r.port}`));
  } catch (error) {
    console.log('   ❌ DNS Resolution failed!');
    console.log(`   Error: ${error.message}`);
    console.log('\n💡 Possible causes:');
    console.log('   1. Cluster URL is incorrect');
    console.log('   2. Cluster is paused or deleted');
    console.log('   3. Network/DNS issues');
    console.log('   4. Firewall blocking DNS queries');
    return;
  }
  
  console.log('');
  
  // Test 2: Try MongoDB connection
  console.log('Test 2: MongoDB Connection');
  try {
    const mongoose = require('mongoose');
    console.log('   Attempting connection...');
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000
    });
    console.log('   ✅ Connection successful!');
    console.log(`   Host: ${conn.connection.host}`);
    console.log(`   Database: ${conn.connection.name}`);
    await mongoose.connection.close();
  } catch (error) {
    console.log('   ❌ Connection failed!');
    console.log(`   Error: ${error.message}`);
    
    if (error.message.includes('Authentication failed')) {
      console.log('\n💡 Fix: Check username and password');
      console.log('   - Username: Attendance_DB');
      console.log('   - Verify password in Atlas');
    } else if (error.message.includes('bad auth')) {
      console.log('\n💡 Fix: Invalid credentials or database name');
    } else if (error.message.includes('getaddrinfo ENOTFOUND')) {
      console.log('\n💡 Fix: DNS resolution failed - check cluster URL');
    } else {
      console.log('\n💡 Most likely: IP Address not whitelisted in Atlas');
      console.log('   Go to: Network Access → Add IP Address → Add Current IP');
    }
  }
};

diagnose().catch(console.error);
