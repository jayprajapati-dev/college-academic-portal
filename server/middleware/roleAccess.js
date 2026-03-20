// server/middleware/roleAccess.js

const checkRoleAccess = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ success: false, message: 'Forbidden' });
  }
  next();
};

const filterDataByRole = (req, baseQuery = {}) => {
  const { role, branch, semester, _id } = req.user;
  if (role === 'admin') return baseQuery;
  if (role === 'hod') return { ...baseQuery, branchId: branch };
  if (role === 'coordinator') return { ...baseQuery, branchId: branch, semesterId: semester };
  if (role === 'teacher') return { ...baseQuery, teacherId: _id };
  if (role === 'student') return { ...baseQuery, branchId: branch, semesterId: semester };
  return baseQuery;
};

module.exports = { checkRoleAccess, filterDataByRole };