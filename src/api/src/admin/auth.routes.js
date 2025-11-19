const express = require('express');
const { loginAdmin, refreshAdminSession, logoutAdmin, getCurrentAdmin } = require('./auth.controller');
const { requireAdminAuth } = require('../middleware/adminAuth');

const router = express.Router();

router.post('/login', loginAdmin);
router.post('/refresh', refreshAdminSession);
router.post('/logout', logoutAdmin);
router.post('/me', requireAdminAuth(), getCurrentAdmin);

module.exports = router;
