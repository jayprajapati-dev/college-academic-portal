const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

const testLogin = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/smartacademics');
    console.log('✅ MongoDB Connected');

    // Find admin user
    const user = await User.findOne({ email: 'admin@smartacademic.com' }).select('+password');
    
    if (!user) {
      console.log('❌ User not found');
      process.exit(1);
    }

    console.log('✅ User found:', user.email);
    console.log('Password field exists:', !!user.password);
    console.log('Password hash:', user.password);

    // Test password comparison
    const testPassword = 'admin123';
    const isMatch = await user.comparePassword(testPassword);
    
    console.log('\n🔐 Password Test:');
    console.log('Test password:', testPassword);
    console.log('Match result:', isMatch);

    if (isMatch) {
      console.log('✅ Password comparison successful!');
    } else {
      console.log('❌ Password comparison failed!');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

testLogin();
