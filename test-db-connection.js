const mongoose = require('mongoose');

// Test different MongoDB configurations
const configs = {
  local: "mongodb://127.0.0.1:27017/27s",
  main: "mongodb://admin:admin@127.0.0.1:27017/27s?retryWrites=true&connectTimeoutMS=10000&authSource=admin&authMechanism=SCRAM-SHA-1",
  devtestnet: "mongodb://root:Next27s%40lgo1226@13.214.203.20:27017/27s?authSource=admin"
};

async function testConnection(name, connectionString) {
  console.log(`\nTesting ${name} connection...`);
  console.log(`Connection string: ${connectionString}`);
  
  try {
    await mongoose.connect(connectionString, {
      serverSelectionTimeoutMS: 5000 // 5 second timeout
    });
    
    console.log(`✅ ${name} connection successful`);
    
    // List databases
    const admin = mongoose.connection.db.admin();
    const dbs = await admin.listDatabases();
    console.log(`Available databases: ${dbs.databases.map(db => db.name).join(', ')}`);
    
    // List collections in the current database
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log(`Collections in '27s' database: ${collections.map(col => col.name).join(', ') || 'none'}`);
    
    await mongoose.disconnect();
    
  } catch (error) {
    console.log(`❌ ${name} connection failed: ${error.message}`);
  }
}

async function runTests() {
  console.log('MongoDB Connection Test\n========================');
  
  // Test local connection first
  await testConnection('Local', configs.local);
  
  // Test main configuration
  await testConnection('Main', configs.main);
  
  // Test devtestnet configuration
  await testConnection('DevTestnet', configs.devtestnet);
  
  console.log('\nTest completed.');
  process.exit(0);
}

runTests().catch(console.error); 