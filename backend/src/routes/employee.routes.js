const express = require('express');
const multer = require('multer');
const {
  getEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  getReportees,
  assignManager,
  importCSV,
} = require('../controllers/employee.controller');
const protect = require('../middleware/auth.middleware');
const restrictTo = require('../middleware/rbac.middleware');
const {
  employeeCreateRules,
  employeeUpdateRules,
  runValidation,
} = require('../middleware/validate');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 2 * 1024 * 1024 } });

router.use(protect);

router.get('/', restrictTo('super_admin', 'hr_manager'), getEmployees);
router.post(
  '/import',
  restrictTo('super_admin', 'hr_manager'),
  upload.single('file'),
  importCSV
);
router.post('/', restrictTo('super_admin', 'hr_manager'), employeeCreateRules, runValidation, createEmployee);

router.get('/:id/reportees', getReportees);
router.patch('/:id/manager', restrictTo('super_admin', 'hr_manager'), assignManager);

router.get('/:id', getEmployeeById);
router.put('/:id', employeeUpdateRules, runValidation, updateEmployee);
router.delete('/:id', restrictTo('super_admin'), deleteEmployee);

module.exports = router;
