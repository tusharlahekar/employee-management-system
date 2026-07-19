const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/apiError');
const Employee = require('../models/Employee');
const { generateToken, cookieOptions } = require('../utils/generateToken');

// POST /api/auth/login
exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const employee = await Employee.findOne({ email }).select('+password');
  if (!employee) {
    throw new ApiError(401, 'Invalid email or password');
  }

  const isMatch = await employee.comparePassword(password);
  if (!isMatch) {
    throw new ApiError(401, 'Invalid email or password');
  }

  if (employee.status === 'inactive') {
    throw new ApiError(403, 'Your account has been deactivated. Contact an administrator.');
  }

  const token = generateToken(employee);
  res.cookie('token', token, cookieOptions());

  res.status(200).json({
    success: true,
    message: 'Login successful',
    data: {
      token,
      employee: employee.toSafeObject(),
    },
  });
});

// POST /api/auth/logout
exports.logout = asyncHandler(async (req, res) => {
  res.clearCookie('token', { httpOnly: true, sameSite: 'lax' });
  res.status(200).json({ success: true, message: 'Logged out successfully' });
});

// GET /api/auth/me
exports.getMe = asyncHandler(async (req, res) => {
  res.status(200).json({ success: true, data: req.user.toSafeObject() });
});
