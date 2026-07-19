const express = require('express');
const { getStats } = require('../controllers/dashboard.controller');
const protect = require('../middleware/auth.middleware');
const restrictTo = require('../middleware/rbac.middleware');

const router = express.Router();

router.use(protect);
router.get('/stats', restrictTo('super_admin', 'hr_manager'), getStats);

module.exports = router;
