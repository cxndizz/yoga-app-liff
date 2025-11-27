const express = require('express');
const router = express.Router();
const db = require('../db');
const { requireAdminAuth } = require('../middleware/adminAuth');

const parseLimit = (value, fallback) => {
  if (value === undefined || value === null) return fallback;
  const parsed = parseInt(value, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
};

router.post('/list', requireAdminAuth(['super_admin', 'branch_admin', 'instructor']), async (req, res) => {
  try {
    const { user_id, course_id, session_id, limit = 100, offset = 0 } = req.body || {};

    const queryParams = [];
    let query = `
      SELECT l.id,
             l.attended_at,
             l.user_id,
             l.course_id,
             l.enrollment_id,
             l.session_id,
             l.source,
             u.full_name AS user_full_name,
             u.email AS user_email,
             c.title AS course_title,
             cs.session_name,
             cs.start_date,
             cs.start_time
      FROM course_checkin_logs l
      LEFT JOIN users u ON u.id = l.user_id
      LEFT JOIN courses c ON c.id = l.course_id
      LEFT JOIN course_sessions cs ON cs.id = l.session_id
      WHERE 1=1
    `;

    if (user_id) {
      queryParams.push(user_id);
      query += ` AND l.user_id = $${queryParams.length}`;
    }

    if (course_id) {
      queryParams.push(course_id);
      query += ` AND l.course_id = $${queryParams.length}`;
    }

    if (session_id) {
      queryParams.push(session_id);
      query += ` AND l.session_id = $${queryParams.length}`;
    }

    const parsedLimit = parseLimit(limit, 100);
    const parsedOffset = parseLimit(offset, 0);

    query += ' ORDER BY l.attended_at DESC';
    queryParams.push(parsedLimit);
    query += ` LIMIT $${queryParams.length}`;
    queryParams.push(parsedOffset);
    query += ` OFFSET $${queryParams.length}`;

    const result = await db.query(query, queryParams);

    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching check-in logs', err);
    res.status(500).json({ message: 'Error fetching check-in logs' });
  }
});

module.exports = router;
