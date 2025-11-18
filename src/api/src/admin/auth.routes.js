const express = require('express');
const { loginAdmin, refreshAdminSession, logoutAdmin } = require('./auth.controller');

const router = express.Router();

router.post('/login', loginAdmin);
router.post('/refresh', refreshAdminSession);
router.post('/logout', logoutAdmin);

module.exports = router;
