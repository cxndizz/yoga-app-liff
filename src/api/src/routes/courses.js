const express = require('express');
const { randomUUID } = require('crypto');
const router = express.Router();
const db = require('../db');
const { requireAdminAuth } = require('../middleware/adminAuth');

const normalizeBoolean = (value) => value === true || value === 'true';

const generateCheckinCode = () => {
  if (randomUUID) return randomUUID().replace(/-/g, '');
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
};

// List courses
router.post('/list', async (req, res) => {
  try {
    const {
      status,
      branch_id,
      instructor_id,
      is_free,
      course_type,
      search,
      limit = 50
    } = req.body || {};

    let query = `
      SELECT c.*,
             b.name AS branch_name,
             i.name AS instructor_name,
             i.avatar_url AS instructor_avatar,
             (SELECT COUNT(*) FROM course_enrollments ce WHERE ce.course_id = c.id) as total_enrollments,
             (SELECT COUNT(*) FROM course_sessions cs WHERE cs.course_id = c.id) as session_count,
             CASE
               WHEN c.course_type = 'standalone' AND c.unlimited_capacity = true THEN
                 NULL
               WHEN c.course_type = 'standalone' THEN
                 COALESCE(c.max_students, 0) - (SELECT COUNT(*) FROM course_enrollments ce WHERE ce.course_id = c.id AND ce.status = 'active')
               ELSE
                 NULL
             END as available_spots
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

    if (is_free !== undefined && is_free !== null) {
      params.push(normalizeBoolean(is_free));
      query += ` AND c.is_free = $${params.length}`;
    }

    if (course_type) {
      params.push(course_type);
      query += ` AND c.course_type = $${params.length}`;
    }

    if (search) {
      params.push(`%${search}%`);
      query += ` AND (c.title ILIKE $${params.length} OR c.description ILIKE $${params.length})`;
    }

    if (limit) {
      params.push(parseInt(limit, 10));
      query += ` ORDER BY c.created_at DESC LIMIT $${params.length}`;
    } else {
      query += ' ORDER BY c.created_at DESC';
    }

    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching courses:', err);
    res.status(500).json({ message: 'Error fetching courses' });
  }
});

// Course detail
router.post('/detail', async (req, res) => {
  try {
    const { id } = req.body || {};
    if (!id) {
      return res.status(400).json({ message: 'course id is required' });
    }

    const result = await db.query(
      `SELECT c.*,
              b.name AS branch_name,
              b.address AS branch_address,
              i.name AS instructor_name,
              i.bio AS instructor_bio,
              i.avatar_url AS instructor_avatar,
              (SELECT COUNT(*) FROM course_enrollments ce WHERE ce.course_id = c.id) as total_enrollments,
              (SELECT COUNT(*) FROM course_sessions cs WHERE cs.course_id = c.id) as session_count,
              CASE
                WHEN c.course_type = 'standalone' AND c.unlimited_capacity = true THEN
                  NULL
                WHEN c.course_type = 'standalone' THEN
                  COALESCE(c.max_students, 0) - (SELECT COUNT(*) FROM course_enrollments ce WHERE ce.course_id = c.id AND ce.status = 'active')
                ELSE
                  NULL
              END as available_spots
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
      is_featured = false,
      course_type = 'scheduled',
      max_students,
      enrollment_deadline,
      unlimited_capacity = false,
      qr_checkin_code
    } = req.body;

    // Normalize numeric fields to avoid NULL violations on required columns
    const normalizedCapacity =
      course_type === 'scheduled' && !unlimited_capacity
        ? Number(capacity) || 0
        : 0;
    const normalizedPriceCents = is_free ? 0 : Number(price_cents) || 0;
    const normalizedAccessTimes = Number(access_times) || 1;
    const normalizedMaxStudents =
      course_type === 'standalone' && !unlimited_capacity
        ? Number(max_students) || 0
        : null;

    if (!title) {
      return res.status(400).json({ message: 'Course title is required' });
    }

    // Validation for standalone courses
    if (course_type === 'standalone' && !unlimited_capacity && !max_students) {
      return res.status(400).json({
        message: 'max_students is required for standalone courses unless unlimited_capacity is enabled'
      });
    }

    const resolvedCheckinCode = (qr_checkin_code || '').trim() || generateCheckinCode();

    const result = await db.query(
      `INSERT INTO courses (
         title, description, branch_id, instructor_id, capacity,
         is_free, price_cents, cover_image_url, access_times, channel,
         status, duration_minutes, level, tags, is_featured,
         course_type, max_students, enrollment_deadline, unlimited_capacity,
         qr_checkin_code
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
       RETURNING *`,
      [
        title,
        description || null,
        branch_id || null,
        instructor_id || null,
        normalizedCapacity,
        !!is_free,
        normalizedPriceCents,
        cover_image_url || null,
        normalizedAccessTimes,
        channel,
        status,
        duration_minutes || null,
        level || null,
        Array.isArray(tags) ? tags : [],
        !!is_featured,
        course_type,
        normalizedMaxStudents,
        enrollment_deadline || null,
        normalizeBoolean(unlimited_capacity),
        resolvedCheckinCode
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating course:', err);
    res.status(500).json({ message: 'Error creating course' });
  }
});

// Update course
router.post('/update', requireAdminAuth(['super_admin', 'branch_admin']), async (req, res) => {
  try {
    const {
      id,
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
      is_featured,
      course_type,
      max_students,
      enrollment_deadline,
      unlimited_capacity,
      qr_checkin_code,
      regenerate_checkin_code
    } = req.body || {};

    if (!id) {
      return res.status(400).json({ message: 'course id is required' });
    }

    const checkResult = await db.query(
      'SELECT id, course_type, qr_checkin_code FROM courses WHERE id = $1',
      [id]
    );
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Validation when changing to standalone
    const newCourseType = course_type || checkResult.rows[0].course_type;
    if (newCourseType === 'standalone' && max_students !== undefined && !max_students) {
      return res.status(400).json({
        message: 'max_students is required for standalone courses'
      });
    }

    const normalizedCapacity =
      capacity !== undefined
        ? newCourseType === 'scheduled' && !normalizeBoolean(unlimited_capacity)
          ? Number(capacity) || 0
          : 0
        : undefined;
    const normalizedIsFree = is_free !== undefined ? normalizeBoolean(is_free) : undefined;
    const normalizedPriceCents =
      normalizedIsFree === true
        ? 0
        : price_cents !== undefined
          ? Number(price_cents) || 0
          : undefined;
    const normalizedAccessTimes = access_times !== undefined ? Number(access_times) || 1 : undefined;
    const normalizedMaxStudents =
      max_students !== undefined
        ? newCourseType === 'standalone' && !normalizeBoolean(unlimited_capacity)
          ? Number(max_students) || 0
          : null
        : undefined;
    const normalizedUnlimited =
      unlimited_capacity !== undefined ? normalizeBoolean(unlimited_capacity) : undefined;

    const resolvedCheckinCode = regenerate_checkin_code
      ? generateCheckinCode()
      : (qr_checkin_code || '').trim() || checkResult.rows[0].qr_checkin_code;

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
           course_type = COALESCE($16, course_type),
           max_students = COALESCE($17, max_students),
           enrollment_deadline = COALESCE($18, enrollment_deadline),
           unlimited_capacity = COALESCE($19, unlimited_capacity),
           qr_checkin_code = COALESCE($20, qr_checkin_code),
           updated_at = NOW()
       WHERE id = $21
       RETURNING *`,
      [
        title,
        description,
        branch_id,
        instructor_id,
        normalizedCapacity,
        normalizedIsFree,
        normalizedPriceCents,
        cover_image_url,
        normalizedAccessTimes,
        channel,
        status,
        duration_minutes,
        level,
        tags,
        is_featured,
        course_type,
        normalizedMaxStudents,
        enrollment_deadline,
        normalizedUnlimited,
        resolvedCheckinCode,
        id
      ]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating course:', err);
    res.status(500).json({ message: 'Error updating course' });
  }
});

// Delete course
router.post('/delete', requireAdminAuth(['super_admin']), async (req, res) => {
  try {
    const { id } = req.body || {};
    if (!id) {
      return res.status(400).json({ message: 'course id is required' });
    }

    const enrollmentsResult = await db.query(
      'SELECT COUNT(*) as count FROM course_enrollments WHERE course_id = $1',
      [id]
    );

    if (parseInt(enrollmentsResult.rows[0].count, 10) > 0) {
      return res.status(400).json({
        message: 'Cannot delete course with existing enrollments. Consider changing the status to "hidden" instead.'
      });
    }

    await db.query('DELETE FROM courses WHERE id = $1', [id]);
    res.json({ message: 'Course deleted successfully' });
  } catch (err) {
    console.error('Error deleting course:', err);
    res.status(500).json({ message: 'Error deleting course' });
  }
});

// Course statistics
router.post('/stats', requireAdminAuth(['super_admin', 'branch_admin']), async (req, res) => {
  try {
    const { id } = req.body || {};
    if (!id) {
      return res.status(400).json({ message: 'course id is required' });
    }

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

// Course enrollments
router.post('/enrollments', requireAdminAuth(['super_admin', 'branch_admin']), async (req, res) => {
  try {
    const { id } = req.body || {};
    if (!id) {
      return res.status(400).json({ message: 'course id is required' });
    }

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
