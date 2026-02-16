const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const { getRoleDefaults } = require('../utils/rolePermissions');

router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('role permissions');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const hasCustom = Array.isArray(user.permissions) && user.permissions.length > 0;
    const wantsAdmin = req.query.mode === 'admin';
    const isAdmin = user.role === 'admin' || user.adminAccess === true;
    const baseRole = wantsAdmin && isAdmin ? 'admin' : user.role;
    let allowedModules = wantsAdmin && isAdmin
      ? getRoleDefaults('admin')
      : (hasCustom ? user.permissions : getRoleDefaults(baseRole));

    if (baseRole === 'hod' || baseRole === 'teacher' || baseRole === 'coordinator') {
      const moduleSet = new Set(Array.isArray(allowedModules) ? allowedModules : []);
      moduleSet.add('users');
      allowedModules = Array.from(moduleSet);
    }

    return res.status(200).json({
      success: true,
      role: baseRole,
      allowedModules
    });
  } catch (error) {
    console.error('Permissions error:', error);
    res.status(500).json({
      success: false,
      message: 'Error in fetching permissions'
    });
  }
});

module.exports = router;
