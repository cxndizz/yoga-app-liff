const express = require('express');
const router = express.Router();
const db = require('../db');
const { requireAdminAuth } = require('../middleware/adminAuth');

// List enrollments
router.post('/list', requireAdminAuth(['super_admin', 'branch_admin']), async (req, res) => {
  try {
    const { status, course_id, user_id, session_id, course_type } = req.body || {};

    let query = `
      SELECT
        ce.*,
        u.full_name as user_name,
        u.email as user_email,
        u.phone as user_phone,
        c.title as course_title,
        c.course_type,
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

    if (course_type) {
      params.push(course_type);
      query += ` AND c.course_type = $${params.length}`;
    }

    query += ' ORDER BY ce.enrolled_at DESC LIMIT 500';

    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching enrollments:', err);
    res.status(500).json({ message: 'Error fetching enrollments' });
  }
});

// Enrollment detail
router.post('/detail', requireAdminAuth(['super_admin', 'branch_admin']), async (req, res) => {
  try {
    const { id } = req.body || {};
    if (!id) {
      return res.status(400).json({ message: 'enrollment id is required' });
    }

    const result = await db.query(
      `SELECT
         ce.*,
         u.full_name as user_name,
         u.email as user_email,
         u.phone as user_phone,
         c.title as course_title,
         c.description as course_description,
         c.course_type,
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

// Create enrollment
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

    const userCheck = await db.query('SELECT id FROM users WHERE id = $1', [user_id]);
    if (userCheck.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const courseCheck = await db.query(
      'SELECT id, access_times, course_type, max_students, unlimited_capacity FROM courses WHERE id = $1',
      [course_id]
    );
    if (courseCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Course not found' });
    }

    const course = courseCheck.rows[0];
    const courseType = course.course_type || 'scheduled';

    // Validation based on course type
    if (courseType === 'scheduled' && !session_id) {
      return res.status(400).json({
        message: 'session_id is required for scheduled courses. Please select a session.',
        course_type: 'scheduled'
      });
    }

    if (courseType === 'standalone' && session_id) {
      return res.status(400).json({
        message: 'Standalone courses cannot be enrolled with a session. Remove session_id.',
        course_type: 'standalone'
      });
    }

    // Check for duplicate purchase (prevent users from buying the same course twice)
    const duplicateCheck = await db.query(
      `SELECT id FROM course_enrollments
       WHERE user_id = $1 AND course_id = $2 AND status = 'active'
       LIMIT 1`,
      [user_id, course_id]
    );
    if (duplicateCheck.rows.length > 0) {
      return res.status(400).json({
        message: 'You have already purchased this course.',
        enrollment_id: duplicateCheck.rows[0].id
      });
    }

    // Check availability for standalone courses (skip if unlimited_capacity is enabled)
    if (courseType === 'standalone' && !course.unlimited_capacity && course.max_students) {
      const enrollmentCount = await db.query(
        `SELECT COUNT(*) as count FROM course_enrollments
         WHERE course_id = $1 AND status = 'active'`,
        [course_id]
      );
      const currentEnrollments = parseInt(enrollmentCount.rows[0].count, 10);
      if (currentEnrollments >= course.max_students) {
        return res.status(400).json({
          message: 'Course is full. No more spots available.',
          available_spots: 0,
          max_students: course.max_students
        });
      }
    }

    const sessionCheck = session_id
      ? await db.query('SELECT id FROM course_sessions WHERE id = $1', [session_id])
      : null;

    if (session_id && sessionCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Session not found' });
    }

    const courseAccessTimes = course.access_times;
    const resolvedAccess =
      typeof remaining_access === 'number' ? remaining_access : courseAccessTimes || null;

    const result = await db.query(
      `INSERT INTO course_enrollments (
         user_id, course_id, session_id, order_id, status, remaining_access, notes
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [user_id, course_id, session_id || null, order_id || null, status, resolvedAccess, notes || null]
    );

    if (session_id && status === 'active') {
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

// Update enrollment status/notes/access
router.post('/update-status', requireAdminAuth(['super_admin', 'branch_admin']), async (req, res) => {
  try {
    const { id, status, remaining_access, notes } = req.body || {};
    if (!id) {
      return res.status(400).json({ message: 'enrollment id is required' });
    }

    const enrollmentResult = await db.query('SELECT * FROM course_enrollments WHERE id = $1', [id]);
    if (enrollmentResult.rows.length === 0) {
      return res.status(404).json({ message: 'Enrollment not found' });
    }

    const enrollment = enrollmentResult.rows[0];
    const sessionId = enrollment.session_id;
    const oldStatus = enrollment.status;

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

    if (sessionId) {
      if (oldStatus === 'active' && status === 'cancelled') {
        await db.query(
          `UPDATE course_sessions
           SET current_enrollments = GREATEST(current_enrollments - 1, 0),
               updated_at = NOW()
           WHERE id = $1`,
          [sessionId]
        );
      } else if (oldStatus !== 'active' && status === 'active') {
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
router.post('/attend', requireAdminAuth(['super_admin', 'branch_admin', 'instructor']), async (req, res) => {
  try {
    const { id } = req.body || {};
    if (!id) {
      return res.status(400).json({ message: 'enrollment id is required' });
    }

    const checkResult = await db.query(
      'SELECT * FROM course_enrollments WHERE id = $1 AND status = $2',
      [id, 'active']
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ message: 'Active enrollment not found' });
    }

    const enrollment = checkResult.rows[0];

    if (enrollment.remaining_access !== null && enrollment.remaining_access <= 0) {
      return res.status(400).json({ message: 'No remaining access for this enrollment' });
    }

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
router.post('/delete', requireAdminAuth(['super_admin']), async (req, res) => {
  try {
    const { id } = req.body || {};
    if (!id) {
      return res.status(400).json({ message: 'enrollment id is required' });
    }

    const checkResult = await db.query('SELECT * FROM course_enrollments WHERE id = $1', [id]);
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ message: 'Enrollment not found' });
    }

    const enrollment = checkResult.rows[0];
    const sessionId = enrollment.session_id;
    const wasActive = enrollment.status === 'active';

    await db.query('DELETE FROM course_enrollments WHERE id = $1', [id]);

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

// Summary stats
router.post('/stats/summary', requireAdminAuth(['super_admin', 'branch_admin']), async (_req, res) => {
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
