const { validationResult, body } = require('express-validator');
const ApiError = require('../utils/apiError');

const runValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const messages = errors.array().map((e) => `${e.path}: ${e.msg}`);
    return next(new ApiError(400, 'Validation failed', messages));
  }
  next();
};

const loginRules = [
  body('email').isEmail().withMessage('A valid email is required').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
];

const employeeCreateRules = [
  body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters'),
  body('email').isEmail().withMessage('A valid email is required').normalizeEmail(),
  body('phone').matches(/^\+?[0-9]{7,15}$/).withMessage('A valid phone number is required'),
  body('password')
    .optional()
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters'),
  body('department').trim().notEmpty().withMessage('Department is required'),
  body('designation').trim().notEmpty().withMessage('Designation is required'),
  body('salary').isFloat({ min: 0 }).withMessage('Salary must be a positive number'),
  body('joiningDate').isISO8601().withMessage('Joining date must be a valid date'),
  body('status').optional().isIn(['active', 'inactive']).withMessage('Invalid status'),
  body('role')
    .optional()
    .isIn(['super_admin', 'hr_manager', 'employee'])
    .withMessage('Invalid role'),
  body('reportingManager').optional({ nullable: true }).isMongoId().withMessage('Invalid reporting manager id'),
];

const employeeUpdateRules = [
  body('name').optional().trim().isLength({ min: 2, max: 100 }),
  body('email').optional().isEmail().normalizeEmail(),
  body('phone').optional().matches(/^\+?[0-9]{7,15}$/),
  body('password').optional().isLength({ min: 8 }),
  body('department').optional().trim().notEmpty(),
  body('designation').optional().trim().notEmpty(),
  body('salary').optional().isFloat({ min: 0 }),
  body('joiningDate').optional().isISO8601(),
  body('status').optional().isIn(['active', 'inactive']),
  body('role').optional().isIn(['super_admin', 'hr_manager', 'employee']),
  body('reportingManager').optional({ nullable: true }).isMongoId(),
];

// Restricted set of fields an 'employee' role may edit on their own profile
const selfUpdateAllowedFields = ['phone', 'password', 'profileImage'];

const employeeSelfUpdateRules = [
  body('phone').optional().matches(/^\+?[0-9]{7,15}$/),
  body('password').optional().isLength({ min: 8 }),
];

module.exports = {
  runValidation,
  loginRules,
  employeeCreateRules,
  employeeUpdateRules,
  employeeSelfUpdateRules,
  selfUpdateAllowedFields,
};
