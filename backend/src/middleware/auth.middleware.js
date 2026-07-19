const jwt = require('jsonwebtoken');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/apiError');
const Employee = require('../models/Employee');

const protect = asyncHandler(async (req, res, next) => {
  let token;

  if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    throw new ApiError(401, 'Not authorized. Please log in.');
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    throw new ApiError(401, 'Invalid or expired token. Please log in again.');
  }

  const employee = await Employee.findById(decoded.id);
  if (!employee) {
    throw new ApiError(401, 'The user belonging to this token no longer exists.');
  }
  if (employee.status === 'inactive') {
    throw new ApiError(403, 'Your account has been deactivated. Contact an administrator.');
  }

  req.user = employee;
  next();
});

module.exports = protect;
