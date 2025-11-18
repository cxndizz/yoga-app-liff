const express = require('express');
const router = express.Router();
const db = require('../db');
const { requireAdminAuth } = require('../middleware/adminAuth');

// Get all courses
router.get('/', async (req, res) => {
  try {
    const { status, branch_id, instructor_id, is_free, search, limit = 50 } = req.query;
    let query = `
      SELECT c.*,
             b.name AS branch_name,
             i.name AS instructor_name,
             (SELECT COUNT(*) FROM course_enrollments ce WHERE ce.course_id = c.id) as total_enrollments
      FROM courses c
      LEFT JOIN branches b ON c.branch_id = b.id
      LEFT JOIN instructors i ON c.instructor_id = i.id
      WHERE 1=1
    `;
    const params = [];

    if (status) {
      params.push(status);
      query += ` AND c.status = $${params.length}`;
    }

    if (branch_id) {
      params.push(branch_id);
      query += ` AND c.branch_id = $${params.length}`;
    }

    if (instructor_id) {
      params.push(instructor_id);
      query += ` AND c.instructor_id = $${params.length}`;
    }

    if (is_free !== undefined) {
      params.push(is_free === 'true');
      query += ` AND c.is_free = $${params.length}`;
    }

    if (search) {
      params.push(`%${search}%`);
      query += ` AND (c.title ILIKE $${params.length} OR c.description ILIKE $${params.length})`;
    }

    query += ' ORDER BY c.created_at DESC';

    if (limit) {
      params.push(parseInt(limit));
      query += ` LIMIT $${params.length}`;
    }

    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching courses:', err);
    res.status(500).json({ message: 'Error fetching courses' });
  }
});

// Get single course by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query(
      `SELECT c.*,
              b.name AS branch_name,
              b.address AS branch_address,
              i.name AS instructor_name,
              i.bio AS instructor_bio,
              i.avatar_url AS instructor_avatar,
              (SELECT COUNT(*) FROM course_enrollments ce WHERE ce.course_id = c.id) as total_enrollments
       FROM courses c
       LEFT JOIN branches b ON c.branch_id = b.id
       LEFT JOIN instructors i ON c.instructor_id = i.id
       WHERE c.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Course not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching course:', err);
    res.status(500).json({ message: 'Error fetching course' });
  }
});

// Create new course
router.post('/', requireAdminAuth(['super_admin', 'branch_admin']), async (req, res) => {
  try {
    const {
      title,
      description,
      branch_id,
      instructor_id,
      capacity = 0,
      is_free = false,
      price_cents = 0,
      cover_image_url,
      access_times = 1,
      channel = 'offline',
      status = 'published',
      duration_minutes,
      level,
      tags = [],
      is_featured = false
    } = req.body;

    if (!title) {
      return res.status(400).json({ message: 'Course title is required' });
    }

    const result = await db.query(
      `INSERT INTO courses (
         title, description, branch_id, instructor_id, capacity,
         is_free, price_cents, cover_image_url, access_times, channel,
         status, duration_minutes, level, tags, is_featured
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
       RETURNING *`,
      [
        title,
        description || null,
        branch_id || null,
        instructor_id || null,
        capacity,
        is_free,
        is_free ? 0 : price_cents,
        cover_image_url || null,
        access_times,
        channel,
        status,
        duration_minutes || null,
        level || null,
        tags,
        is_featured
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating course:', err);
    res.status(500).json({ message: 'Error creating course' });
  }
});

// Update course
router.put('/:id', requireAdminAuth(['super_admin', 'branch_admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      branch_id,
      instructor_id,
      capacity,
      is_free,
      price_cents,
      cover_image_url,
      access_times,
      channel,
      status,
      duration_minutes,
      level,
      tags,
      is_featured
    } = req.body;

    // Check if course exists
    const checkResult = await db.query('SELECT id FROM courses WHERE id = $1', [id]);
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ message: 'Course not found' });
    }

    const result = await db.query(
      `UPDATE courses
       SET title = COALESCE($1, title),
           description = COALESCE($2, description),
           branch_id = COALESCE($3, branch_id),
           instructor_id = COALESCE($4, instructor_id),
           capacity = COALESCE($5, capacity),
           is_free = COALESCE($6, is_free),
           price_cents = COALESCE($7, price_cents),
           cover_image_url = COALESCE($8, cover_image_url),
           access_times = COALESCE($9, access_times),
           channel = COALESCE($10, channel),
           status = COALESCE($11, status),
           duration_minutes = COALESCE($12, duration_minutes),
           level = COALESCE($13, level),
           tags = COALESCE($14, tags),
           is_featured = COALESCE($15, is_featured),
           updated_at = NOW()
       WHERE id = $16
       RETURNING *`,
      [
        title, description, branch_id, instructor_id, capacity,
        is_free, price_cents, cover_image_url, access_times, channel,
        status, duration_minutes, level, tags, is_featured, id
      ]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating course:', err);
    res.status(500).json({ message: 'Error updating course' });
  }
});

// Delete course
router.delete('/:id', requireAdminAuth(['super_admin']), async (req, res) => {
  try {
    const { id } = req.params;

    // Check if course has enrollments
    const enrollmentsResult = await db.query(
      'SELECT COUNT(*) as count FROM course_enrollments WHERE course_id = $1',
      [id]
    );

    if (parseInt(enrollmentsResult.rows[0].count) > 0) {
      return res.status(400).json({
        message: 'Cannot delete course with existing enrollments. Consider changing the status to "hidden" instead.'
      });
    }

    // Delete course (this will cascade delete sessions and enrollments if any)
    await db.query('DELETE FROM courses WHERE id = $1', [id]);
    res.json({ message: 'Course deleted successfully' });
  } catch (err) {
    console.error('Error deleting course:', err);
    res.status(500).json({ message: 'Error deleting course' });
  }
});

// Get course statistics
router.get('/:id/stats', requireAdminAuth(['super_admin', 'branch_admin']), async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.query(
      `SELECT
         c.*,
         COUNT(DISTINCT ce.id) as total_enrollments,
         COUNT(DISTINCT cs.id) as total_sessions,
         COUNT(DISTINCT o.id) as total_orders,
         SUM(CASE WHEN o.status = 'completed' THEN o.total_price_cents ELSE 0 END) as total_revenue_cents
       FROM courses c
       LEFT JOIN course_enrollments ce ON c.id = ce.course_id
       LEFT JOIN course_sessions cs ON c.id = cs.course_id
       LEFT JOIN orders o ON c.id = o.course_id
       WHERE c.id = $1
       GROUP BY c.id`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Course not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching course stats:', err);
    res.status(500).json({ message: 'Error fetching course statistics' });
  }
});

// Get course enrollments
router.get('/:id/enrollments', requireAdminAuth(['super_admin', 'branch_admin']), async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.query(
      `SELECT
         ce.*,
         u.full_name as user_name,
         u.email as user_email,
         u.phone as user_phone,
         cs.session_name,
         cs.start_date,
         cs.start_time
       FROM course_enrollments ce
       LEFT JOIN users u ON ce.user_id = u.id
       LEFT JOIN course_sessions cs ON ce.session_id = cs.id
       WHERE ce.course_id = $1
       ORDER BY ce.enrolled_at DESC`,
      [id]
    );

    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching course enrollments:', err);
    res.status(500).json({ message: 'Error fetching course enrollments' });
  }
});

module.exports = router;
