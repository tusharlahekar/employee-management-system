const express = require('express');
const { login, logout, getMe } = require('../controllers/auth.controller');
const protect = require('../middleware/auth.middleware');
const { loginRules, runValidation } = require('../middleware/validate');

const router = express.Router();

router.post('/login', loginRules, runValidation, login);
router.post('/logout', protect, logout);
router.get('/me', protect, getMe);

module.exports = router;
