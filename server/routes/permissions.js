const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const { getRoleDefaults } = require('../utils/rolePermissions');

router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('role permissions adminAccess coordinator');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const hasCustom = Array.isArray(user.permissions) && user.permissions.length > 0;
    const requestedMode = String(req.query.mode || '').trim();
    const isAdmin = user.role === 'admin' || user.adminAccess === true;

    const availableModes = new Set([user.role]);
    if (isAdmin) {
      availableModes.add('admin');
    }

    const coordinatorStatus = user?.coordinator?.status;
    const coordinatorBaseRole = user?.coordinator?.baseRole;
    const coordinatorActive = Boolean(user?.coordinator?.branch) && coordinatorStatus !== 'expired';

    if (user.role === 'coordinator' && coordinatorActive && ['teacher', 'hod'].includes(coordinatorBaseRole)) {
      availableModes.add(coordinatorBaseRole);
    }

    if (['teacher', 'hod'].includes(user.role) && coordinatorActive) {
      availableModes.add('coordinator');
    }

    const baseRole = requestedMode && availableModes.has(requestedMode) ? requestedMode : user.role;

    let allowedModules;
    if (baseRole === user.role && hasCustom) {
      allowedModules = user.permissions;
    } else {
      allowedModules = getRoleDefaults(baseRole);
    }

    if (baseRole === 'hod' || baseRole === 'teacher' || baseRole === 'coordinator') {
      const moduleSet = new Set(Array.isArray(allowedModules) ? allowedModules : []);
      moduleSet.add('users');
      allowedModules = Array.from(moduleSet);
    }

    return res.status(200).json({
      success: true,
      role: baseRole,
      adminAccess: user.adminAccess === true,
      availableModes: Array.from(availableModes),
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
