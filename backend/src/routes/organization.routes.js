const express = require('express');
const { getOrgTree } = require('../controllers/organization.controller');
const protect = require('../middleware/auth.middleware');

const router = express.Router();

router.use(protect);
router.get('/tree', getOrgTree);

module.exports = router;
