const express = require('express');
const router = express.Router();
const db = require('../db');
const { requireAdminAuth } = require('../middleware/adminAuth');

// Get all enrollments with filters
router.get('/', requireAdminAuth(['super_admin', 'branch_admin']), async (req, res) => {
  try {
    const { status, course_id, user_id, session_id } = req.query;

    let query = `
      SELECT
        ce.*,
        u.full_name as user_name,
        u.email as user_email,
        u.phone as user_phone,
        c.title as course_title,
        cs.session_name,
        cs.start_date as session_start_date,
        b.name as branch_name,
        i.name as instructor_name
      FROM course_enrollments ce
      LEFT JOIN users u ON ce.user_id = u.id
      LEFT JOIN courses c ON ce.course_id = c.id
      LEFT JOIN course_sessions cs ON ce.session_id = cs.id
      LEFT JOIN branches b ON c.branch_id = b.id
      LEFT JOIN instructors i ON c.instructor_id = i.id
      WHERE 1=1
    `;
    const params = [];

    if (status) {
      params.push(status);
      query += ` AND ce.status = $${params.length}`;
    }

    if (course_id) {
      params.push(course_id);
      query += ` AND ce.course_id = $${params.length}`;
    }

    if (user_id) {
      params.push(user_id);
      query += ` AND ce.user_id = $${params.length}`;
    }

    if (session_id) {
      params.push(session_id);
      query += ` AND ce.session_id = $${params.length}`;
    }

    query += ' ORDER BY ce.enrolled_at DESC LIMIT 500';

    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching enrollments:', err);
    res.status(500).json({ message: 'Error fetching enrollments' });
  }
});

// Get single enrollment by ID
router.get('/:id', requireAdminAuth(['super_admin', 'branch_admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query(
      `SELECT
         ce.*,
         u.full_name as user_name,
         u.email as user_email,
         u.phone as user_phone,
         c.title as course_title,
         c.description as course_description,
         cs.session_name,
         cs.start_date as session_start_date,
         cs.start_time as session_start_time,
         b.name as branch_name,
         i.name as instructor_name,
         o.status as order_status
       FROM course_enrollments ce
       LEFT JOIN users u ON ce.user_id = u.id
       LEFT JOIN courses c ON ce.course_id = c.id
       LEFT JOIN course_sessions cs ON ce.session_id = cs.id
       LEFT JOIN branches b ON c.branch_id = b.id
       LEFT JOIN instructors i ON c.instructor_id = i.id
       LEFT JOIN orders o ON ce.order_id = o.id
       WHERE ce.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Enrollment not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching enrollment:', err);
    res.status(500).json({ message: 'Error fetching enrollment' });
  }
});

// Create new enrollment
router.post('/', requireAdminAuth(['super_admin', 'branch_admin']), async (req, res) => {
  try {
    const {
      user_id,
      course_id,
      session_id,
      order_id,
      status = 'active',
      remaining_access,
      notes
    } = req.body;

    if (!user_id || !course_id) {
      return res.status(400).json({ message: 'user_id and course_id are required' });
    }

    // Check if user exists
    const userCheck = await db.query('SELECT id FROM users WHERE id = $1', [user_id]);
    if (userCheck.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if course exists and get access_times
    const courseCheck = await db.query('SELECT id, access_times FROM courses WHERE id = $1', [course_id]);
    if (courseCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Course not found' });
    }

    const courseAccessTimes = courseCheck.rows[0].access_times;
    const enrollmentAccessTimes = remaining_access !== undefined ? remaining_access : courseAccessTimes;

    // Check if enrollment already exists
    const existingEnrollment = await db.query(
      `SELECT id FROM course_enrollments
       WHERE user_id = $1 AND course_id = $2 AND session_id = $3`,
      [user_id, course_id, session_id || null]
    );

    if (existingEnrollment.rows.length > 0) {
      return res.status(400).json({ message: 'Enrollment already exists for this user, course, and session' });
    }

    const result = await db.query(
      `INSERT INTO course_enrollments (
         user_id, course_id, session_id, order_id, status, remaining_access, notes
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [user_id, course_id, session_id || null, order_id || null, status, enrollmentAccessTimes, notes || null]
    );

    // Update session enrollment count if session_id is provided
    if (session_id) {
      await db.query(
        `UPDATE course_sessions
         SET current_enrollments = current_enrollments + 1,
             updated_at = NOW()
         WHERE id = $1`,
        [session_id]
      );
    }

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating enrollment:', err);
    res.status(500).json({ message: 'Error creating enrollment' });
  }
});

// Update enrollment status
router.patch('/:id', requireAdminAuth(['super_admin', 'branch_admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const { status, remaining_access, notes } = req.body;

    // Check if enrollment exists
    const checkResult = await db.query('SELECT * FROM course_enrollments WHERE id = $1', [id]);
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ message: 'Enrollment not found' });
    }

    const currentEnrollment = checkResult.rows[0];
    const oldStatus = currentEnrollment.status;
    const sessionId = currentEnrollment.session_id;

    const result = await db.query(
      `UPDATE course_enrollments
       SET status = COALESCE($1, status),
           remaining_access = COALESCE($2, remaining_access),
           notes = COALESCE($3, notes),
           updated_at = NOW()
       WHERE id = $4
       RETURNING *`,
      [status, remaining_access, notes, id]
    );

    // Update session enrollment count if status changed and session exists
    if (status && status !== oldStatus && sessionId) {
      if (oldStatus === 'active' && status !== 'active') {
        // Decreased active enrollment
        await db.query(
          `UPDATE course_sessions
           SET current_enrollments = GREATEST(current_enrollments - 1, 0),
               updated_at = NOW()
           WHERE id = $1`,
          [sessionId]
        );
      } else if (oldStatus !== 'active' && status === 'active') {
        // Increased active enrollment
        await db.query(
          `UPDATE course_sessions
           SET current_enrollments = current_enrollments + 1,
               updated_at = NOW()
           WHERE id = $1`,
          [sessionId]
        );
      }
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating enrollment:', err);
    res.status(500).json({ message: 'Error updating enrollment' });
  }
});

// Record attendance
router.post('/:id/attend', requireAdminAuth(['super_admin', 'branch_admin', 'instructor']), async (req, res) => {
  try {
    const { id } = req.params;

    // Check if enrollment exists and is active
    const checkResult = await db.query(
      'SELECT * FROM course_enrollments WHERE id = $1 AND status = $2',
      [id, 'active']
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ message: 'Active enrollment not found' });
    }

    const enrollment = checkResult.rows[0];

    // Check if remaining access > 0
    if (enrollment.remaining_access !== null && enrollment.remaining_access <= 0) {
      return res.status(400).json({ message: 'No remaining access for this enrollment' });
    }

    // Decrease remaining access
    const newRemainingAccess = enrollment.remaining_access !== null ? enrollment.remaining_access - 1 : null;
    const newStatus = newRemainingAccess === 0 ? 'expired' : 'active';

    const result = await db.query(
      `UPDATE course_enrollments
       SET last_attended_at = NOW(),
           remaining_access = $1,
           status = $2,
           updated_at = NOW()
       WHERE id = $3
       RETURNING *`,
      [newRemainingAccess, newStatus, id]
    );

    res.json({
      message: 'Attendance recorded successfully',
      enrollment: result.rows[0]
    });
  } catch (err) {
    console.error('Error recording attendance:', err);
    res.status(500).json({ message: 'Error recording attendance' });
  }
});

// Delete enrollment
router.delete('/:id', requireAdminAuth(['super_admin']), async (req, res) => {
  try {
    const { id } = req.params;

    // Get enrollment info before deleting
    const checkResult = await db.query('SELECT * FROM course_enrollments WHERE id = $1', [id]);
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ message: 'Enrollment not found' });
    }

    const enrollment = checkResult.rows[0];
    const sessionId = enrollment.session_id;
    const wasActive = enrollment.status === 'active';

    // Delete enrollment
    await db.query('DELETE FROM course_enrollments WHERE id = $1', [id]);

    // Update session enrollment count if was active and session exists
    if (wasActive && sessionId) {
      await db.query(
        `UPDATE course_sessions
         SET current_enrollments = GREATEST(current_enrollments - 1, 0),
             updated_at = NOW()
         WHERE id = $1`,
        [sessionId]
      );
    }

    res.json({ message: 'Enrollment deleted successfully' });
  } catch (err) {
    console.error('Error deleting enrollment:', err);
    res.status(500).json({ message: 'Error deleting enrollment' });
  }
});

// Get enrollment statistics
router.get('/stats/summary', requireAdminAuth(['super_admin', 'branch_admin']), async (req, res) => {
  try {
    const result = await db.query(`
      SELECT
        COUNT(*) as total_enrollments,
        COUNT(*) FILTER (WHERE status = 'active') as active_enrollments,
        COUNT(*) FILTER (WHERE status = 'expired') as expired_enrollments,
        COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled_enrollments,
        COUNT(DISTINCT user_id) as unique_users,
        COUNT(DISTINCT course_id) as unique_courses
      FROM course_enrollments
    `);

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching enrollment stats:', err);
    res.status(500).json({ message: 'Error fetching enrollment statistics' });
  }
});

module.exports = router;
