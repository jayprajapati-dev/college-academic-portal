const mongoose = require('mongoose');
require('dotenv').config();
const User = require('../models/User');
const { getRoleDefaults } = require('../utils/rolePermissions');

const run = async () => {
  const [,, emailArg, modulesArg] = process.argv;

  if (!emailArg) {
    console.log('Usage: node scripts/setUserPermissions.js <email> <comma-separated-modules|default|clear>');
    process.exit(1);
  }

  const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/smartacademics', {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });

  try {
    const user = await User.findOne({ email: emailArg });

    if (!user) {
      console.log('User not found:', emailArg);
      process.exit(1);
    }

    if (!['admin', 'hod', 'teacher'].includes(user.role)) {
      console.log('Permissions supported only for admin/hod/teacher. Role:', user.role);
      process.exit(1);
    }

    let nextPermissions = [];

    if (!modulesArg || modulesArg === 'default') {
      nextPermissions = getRoleDefaults(user.role);
    } else if (modulesArg === 'clear') {
      nextPermissions = [];
    } else {
      nextPermissions = modulesArg.split(',').map((item) => item.trim()).filter(Boolean);
      const allowed = new Set(getRoleDefaults(user.role));
      nextPermissions = nextPermissions.filter((item) => allowed.has(item));
    }

    user.permissions = nextPermissions;
    await user.save();

    console.log('Updated permissions for', user.email, 'role:', user.role);
    console.log('Permissions:', user.permissions);
  } catch (error) {
    console.error('Error updating permissions:', error.message);
  } finally {
    await conn.disconnect();
  }
};

run();
