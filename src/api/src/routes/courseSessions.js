const express = require('express');
const router = express.Router();
const db = require('../db');
const { requireAdminAuth } = require('../middleware/adminAuth');

const parseLimit = (value, fallback) => {
  if (value === undefined || value === null) return fallback;
  const parsed = parseInt(value, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
};

// Sessions for a course
router.post('/by-course', requireAdminAuth(['super_admin', 'branch_admin']), async (req, res) => {
  try {
    const { course_id, status, start_date_from, start_date_to } = req.body || {};
    if (!course_id) {
      return res.status(400).json({ message: 'course_id is required' });
    }

    let query = `
      SELECT cs.*,
             c.title as course_title,
             b.name as branch_name,
             i.name as instructor_name,
             (cs.max_capacity - cs.current_enrollments) as available_spots
      FROM course_sessions cs
      LEFT JOIN courses c ON cs.course_id = c.id
      LEFT JOIN branches b ON COALESCE(cs.branch_id, c.branch_id) = b.id
      LEFT JOIN instructors i ON COALESCE(cs.instructor_id, c.instructor_id) = i.id
      WHERE cs.course_id = $1
    `;
    const params = [course_id];

    if (status) {
      params.push(status);
      query += ` AND cs.status = $${params.length}`;
    }

    if (start_date_from) {
      params.push(start_date_from);
      query += ` AND cs.start_date >= $${params.length}`;
    }

    if (start_date_to) {
      params.push(start_date_to);
      query += ` AND cs.start_date <= $${params.length}`;
    }

    query += ' ORDER BY cs.start_date ASC, cs.start_time ASC';

    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching course sessions:', err);
    res.status(500).json({ message: 'Error fetching course sessions' });
  }
});

// All sessions
router.post('/list', requireAdminAuth(['super_admin', 'branch_admin']), async (req, res) => {
  try {
    const { status, start_date_from, start_date_to, limit = 100 } = req.body || {};

    let query = `
      SELECT cs.*,
             c.title as course_title,
             b.name as branch_name,
             i.name as instructor_name,
             (cs.max_capacity - cs.current_enrollments) as available_spots
      FROM course_sessions cs
      LEFT JOIN courses c ON cs.course_id = c.id
      LEFT JOIN branches b ON COALESCE(cs.branch_id, c.branch_id) = b.id
      LEFT JOIN instructors i ON COALESCE(cs.instructor_id, c.instructor_id) = i.id
      WHERE 1=1
    `;
    const params = [];

    if (status) {
      params.push(status);
      query += ` AND cs.status = $${params.length}`;
    }

    if (start_date_from) {
      params.push(start_date_from);
      query += ` AND cs.start_date >= $${params.length}`;
    }

    if (start_date_to) {
      params.push(start_date_to);
      query += ` AND cs.start_date <= $${params.length}`;
    }

    query += ' ORDER BY cs.start_date ASC, cs.start_time ASC';

    const limitValue = parseLimit(limit, 100);
    if (limitValue) {
      params.push(limitValue);
      query += ` LIMIT $${params.length}`;
    }

    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching sessions:', err);
    res.status(500).json({ message: 'Error fetching sessions' });
  }
});

// Session detail
router.post('/detail', requireAdminAuth(['super_admin', 'branch_admin']), async (req, res) => {
  try {
    const { id } = req.body || {};
    if (!id) {
      return res.status(400).json({ message: 'session id is required' });
    }

    const result = await db.query(
      `SELECT cs.*,
              c.title as course_title,
              c.description as course_description,
              b.name as branch_name,
              i.name as instructor_name,
              (cs.max_capacity - cs.current_enrollments) as available_spots
       FROM course_sessions cs
       LEFT JOIN courses c ON cs.course_id = c.id
       LEFT JOIN branches b ON COALESCE(cs.branch_id, c.branch_id) = b.id
       LEFT JOIN instructors i ON COALESCE(cs.instructor_id, c.instructor_id) = i.id
       WHERE cs.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Session not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching session:', err);
    res.status(500).json({ message: 'Error fetching session' });
  }
});

// Create session
router.post('/', requireAdminAuth(['super_admin', 'branch_admin']), async (req, res) => {
  try {
    const {
      course_id,
      session_name,
      start_date,
      start_time,
      end_time,
      day_of_week,
      max_capacity,
      status = 'open',
      notes,
      branch_id,
      instructor_id
    } = req.body;

    if (!course_id || !start_date || !start_time) {
      return res.status(400).json({ message: 'course_id, start_date, and start_time are required' });
    }

    const courseCheck = await db.query(
      'SELECT id, capacity, branch_id as course_branch_id, instructor_id as course_instructor_id FROM courses WHERE id = $1',
      [course_id]
    );
    if (courseCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Course not found' });
    }

    const courseCapacity = courseCheck.rows[0].capacity;
    const resolvedBranchId = branch_id || courseCheck.rows[0].course_branch_id;
    const resolvedInstructorId = instructor_id || courseCheck.rows[0].course_instructor_id;

    if (!resolvedBranchId || !resolvedInstructorId) {
      return res.status(400).json({ message: 'branch_id and instructor_id are required' });
    }

    const sessionCapacity = max_capacity || courseCapacity;

    const result = await db.query(
      `INSERT INTO course_sessions (
         course_id, session_name, start_date, start_time, end_time,
         day_of_week, max_capacity, status, notes, branch_id, instructor_id
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [
        course_id,
        session_name || null,
        start_date,
        start_time,
        end_time || null,
        day_of_week || null,
        sessionCapacity,
        status,
        notes || null,
        resolvedBranchId,
        resolvedInstructorId
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating session:', err);
    res.status(500).json({ message: 'Error creating session' });
  }
});

// Update session
router.post('/update', requireAdminAuth(['super_admin', 'branch_admin']), async (req, res) => {
  try {
    const {
      id,
      session_name,
      start_date,
      start_time,
      end_time,
      day_of_week,
      max_capacity,
      status,
      notes,
      branch_id,
      instructor_id
    } = req.body || {};

    if (!id) {
      return res.status(400).json({ message: 'session id is required' });
    }

    const checkResult = await db.query('SELECT id FROM course_sessions WHERE id = $1', [id]);
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ message: 'Session not found' });
    }

    const result = await db.query(
      `UPDATE course_sessions
       SET session_name = COALESCE($1, session_name),
           start_date = COALESCE($2, start_date),
           start_time = COALESCE($3, start_time),
           end_time = COALESCE($4, end_time),
           day_of_week = COALESCE($5, day_of_week),
           max_capacity = COALESCE($6, max_capacity),
           status = COALESCE($7, status),
           notes = COALESCE($8, notes),
           branch_id = COALESCE($9, branch_id),
           instructor_id = COALESCE($10, instructor_id),
           updated_at = NOW()
       WHERE id = $11
       RETURNING *`,
      [
        session_name,
        start_date,
        start_time,
        end_time,
        day_of_week,
        max_capacity,
        status,
        notes,
        branch_id,
        instructor_id,
        id
      ]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating session:', err);
    res.status(500).json({ message: 'Error updating session' });
  }
});

// Delete session
router.post('/delete', requireAdminAuth(['super_admin']), async (req, res) => {
  try {
    const { id } = req.body || {};
    if (!id) {
      return res.status(400).json({ message: 'session id is required' });
    }

    const enrollmentsResult = await db.query(
      'SELECT COUNT(*) as count FROM course_enrollments WHERE session_id = $1',
      [id]
    );

    if (parseInt(enrollmentsResult.rows[0].count, 10) > 0) {
      return res.status(400).json({
        message: 'Cannot delete session with existing enrollments. Consider changing the status to "cancelled" instead.'
      });
    }

    await db.query('DELETE FROM course_sessions WHERE id = $1', [id]);
    res.json({ message: 'Session deleted successfully' });
  } catch (err) {
    console.error('Error deleting session:', err);
    res.status(500).json({ message: 'Error deleting session' });
  }
});

// Session enrollments
router.post('/enrollments', requireAdminAuth(['super_admin', 'branch_admin']), async (req, res) => {
  try {
    const { id } = req.body || {};
    if (!id) {
      return res.status(400).json({ message: 'session id is required' });
    }

    const result = await db.query(
      `SELECT
         ce.*,
         u.full_name as user_name,
         u.email as user_email,
         u.phone as user_phone
       FROM course_enrollments ce
       LEFT JOIN users u ON ce.user_id = u.id
       WHERE ce.session_id = $1
       ORDER BY ce.enrolled_at DESC`,
      [id]
    );

    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching session enrollments:', err);
    res.status(500).json({ message: 'Error fetching session enrollments' });
  }
});

// Update enrollment count
router.post('/update-count', requireAdminAuth(['super_admin', 'branch_admin']), async (req, res) => {
  try {
    const { id } = req.body || {};
    if (!id) {
      return res.status(400).json({ message: 'session id is required' });
    }

    const countResult = await db.query(
      `SELECT COUNT(*) as count
       FROM course_enrollments
       WHERE session_id = $1 AND status = 'active'`,
      [id]
    );

    const count = parseInt(countResult.rows[0].count, 10);

    await db.query(
      `UPDATE course_sessions
       SET current_enrollments = $1,
           updated_at = NOW()
       WHERE id = $2`,
      [count, id]
    );

    res.json({ message: 'Enrollment count updated', count });
  } catch (err) {
    console.error('Error updating enrollment count:', err);
    res.status(500).json({ message: 'Error updating enrollment count' });
  }
});

module.exports = router;
