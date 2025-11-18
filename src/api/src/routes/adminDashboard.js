const express = require('express');
const router = express.Router();
const { requireAdminAuth } = require('../middleware/adminAuth');
const { getKpis, getCharts } = require('../services/dashboardService');

router.get('/', requireAdminAuth(['super_admin', 'branch_admin', 'staff']), async (req, res) => {
  try {
    const [kpis, charts] = await Promise.all([getKpis(), getCharts()]);
    res.json({ kpis, charts, generatedAt: new Date().toISOString() });
  } catch (error) {
    console.error('Failed to load admin dashboard', { error: error.message, adminId: req.admin?.id });
    res.status(500).json({ message: 'Failed to load dashboard data' });
  }
});

module.exports = router;
