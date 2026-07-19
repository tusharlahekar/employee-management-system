const ApiError = require('../utils/apiError');

/**
 * Usage: restrictTo('super_admin', 'hr_manager')
 * Must run after `protect` middleware so req.user is populated.
 */
const restrictTo = (...roles) => (req, res, next) => {
  if (!req.user) {
    return next(new ApiError(401, 'Not authorized.'));
  }
  if (!roles.includes(req.user.role)) {
    return next(new ApiError(403, 'You do not have permission to perform this action.'));
  }
  next();
};

module.exports = restrictTo;
