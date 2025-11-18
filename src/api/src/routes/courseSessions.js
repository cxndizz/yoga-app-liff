const express = require('express');
const router = express.Router();
const db = require('../db');
const { requireAdminAuth } = require('../middleware/adminAuth');

// Get all sessions for a course
router.get('/course/:courseId', requireAdminAuth(['super_admin', 'branch_admin']), async (req, res) => {
  try {
    const { courseId } = req.params;
    const { status, start_date_from, start_date_to } = req.query;

    let query = `
      SELECT cs.*,
             c.title as course_title,
             (cs.max_capacity - cs.current_enrollments) as available_spots
      FROM course_sessions cs
      LEFT JOIN courses c ON cs.course_id = c.id
      WHERE cs.course_id = $1
    `;
    const params = [courseId];

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

// Get all sessions (with filters)
router.get('/', requireAdminAuth(['super_admin', 'branch_admin']), async (req, res) => {
  try {
    const { status, start_date_from, start_date_to, limit = 100 } = req.query;

    let query = `
      SELECT cs.*,
             c.title as course_title,
             b.name as branch_name,
             i.name as instructor_name,
             (cs.max_capacity - cs.current_enrollments) as available_spots
      FROM course_sessions cs
      LEFT JOIN courses c ON cs.course_id = c.id
      LEFT JOIN branches b ON c.branch_id = b.id
      LEFT JOIN instructors i ON c.instructor_id = i.id
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

    if (limit) {
      params.push(parseInt(limit));
      query += ` LIMIT $${params.length}`;
    }

    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching sessions:', err);
    res.status(500).json({ message: 'Error fetching sessions' });
  }
});

// Get single session by ID
router.get('/:id', requireAdminAuth(['super_admin', 'branch_admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query(
      `SELECT cs.*,
              c.title as course_title,
              c.description as course_description,
              b.name as branch_name,
              i.name as instructor_name,
              (cs.max_capacity - cs.current_enrollments) as available_spots
       FROM course_sessions cs
       LEFT JOIN courses c ON cs.course_id = c.id
       LEFT JOIN branches b ON c.branch_id = b.id
       LEFT JOIN instructors i ON c.instructor_id = i.id
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

// Create new session
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
      notes
    } = req.body;

    if (!course_id || !start_date || !start_time) {
      return res.status(400).json({ message: 'course_id, start_date, and start_time are required' });
    }

    // Check if course exists
    const courseCheck = await db.query('SELECT id, capacity FROM courses WHERE id = $1', [course_id]);
    if (courseCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Course not found' });
    }

    const courseCapacity = courseCheck.rows[0].capacity;
    const sessionCapacity = max_capacity || courseCapacity;

    const result = await db.query(
      `INSERT INTO course_sessions (
         course_id, session_name, start_date, start_time, end_time,
         day_of_week, max_capacity, status, notes
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
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
        notes || null
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating session:', err);
    res.status(500).json({ message: 'Error creating session' });
  }
});

// Update session
router.put('/:id', requireAdminAuth(['super_admin', 'branch_admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const {
      session_name,
      start_date,
      start_time,
      end_time,
      day_of_week,
      max_capacity,
      status,
      notes
    } = req.body;

    // Check if session exists
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
           updated_at = NOW()
       WHERE id = $9
       RETURNING *`,
      [session_name, start_date, start_time, end_time, day_of_week, max_capacity, status, notes, id]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating session:', err);
    res.status(500).json({ message: 'Error updating session' });
  }
});

// Delete session
router.delete('/:id', requireAdminAuth(['super_admin']), async (req, res) => {
  try {
    const { id } = req.params;

    // Check if session has enrollments
    const enrollmentsResult = await db.query(
      'SELECT COUNT(*) as count FROM course_enrollments WHERE session_id = $1',
      [id]
    );

    if (parseInt(enrollmentsResult.rows[0].count) > 0) {
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

// Get session enrollments
router.get('/:id/enrollments', requireAdminAuth(['super_admin', 'branch_admin']), async (req, res) => {
  try {
    const { id } = req.params;

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

// Update session enrollment count (internal use)
router.post('/:id/update-count', requireAdminAuth(['super_admin', 'branch_admin']), async (req, res) => {
  try {
    const { id } = req.params;

    // Recalculate enrollment count
    const countResult = await db.query(
      `SELECT COUNT(*) as count
       FROM course_enrollments
       WHERE session_id = $1 AND status = 'active'`,
      [id]
    );

    const count = parseInt(countResult.rows[0].count);

    // Update the session
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
