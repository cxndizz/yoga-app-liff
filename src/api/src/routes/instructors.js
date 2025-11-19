const express = require('express');
const router = express.Router();
const db = require('../db');
const { requireAdminAuth } = require('../middleware/adminAuth');

const isTrue = (value) => value === true || value === 'true';

// List instructors
router.post('/list', requireAdminAuth(['super_admin', 'branch_admin']), async (req, res) => {
  try {
    const { active_only, search } = req.body || {};
    let query = 'SELECT * FROM instructors WHERE 1=1';
    const params = [];

    if (isTrue(active_only)) {
      query += ' AND is_active = true';
    }

    if (search) {
      params.push(`%${search}%`);
      query += ` AND (name ILIKE $${params.length} OR bio ILIKE $${params.length})`;
    }

    query += ' ORDER BY created_at DESC';

    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching instructors:', err);
    res.status(500).json({ message: 'Error fetching instructors' });
  }
});

// Instructor detail
router.post('/detail', requireAdminAuth(['super_admin', 'branch_admin']), async (req, res) => {
  try {
    const { id } = req.body || {};
    if (!id) {
      return res.status(400).json({ message: 'instructor id is required' });
    }

    const result = await db.query('SELECT * FROM instructors WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Instructor not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching instructor:', err);
    res.status(500).json({ message: 'Error fetching instructor' });
  }
});

// Create instructor
router.post('/', requireAdminAuth(['super_admin', 'branch_admin']), async (req, res) => {
  try {
    const { name, bio, avatar_url, email, phone, specialties, is_active = true } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Instructor name is required' });
    }

    const result = await db.query(
      `INSERT INTO instructors (name, bio, avatar_url, email, phone, specialties, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        name,
        bio || null,
        avatar_url || null,
        email || null,
        phone || null,
        specialties || [],
        is_active
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating instructor:', err);
    res.status(500).json({ message: 'Error creating instructor' });
  }
});

// Update instructor
router.post('/update', requireAdminAuth(['super_admin', 'branch_admin']), async (req, res) => {
  try {
    const { id, name, bio, avatar_url, email, phone, specialties, is_active } = req.body || {};

    if (!id) {
      return res.status(400).json({ message: 'instructor id is required' });
    }

    const checkResult = await db.query('SELECT id FROM instructors WHERE id = $1', [id]);
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ message: 'Instructor not found' });
    }

    const result = await db.query(
      `UPDATE instructors
       SET name = COALESCE($1, name),
           bio = COALESCE($2, bio),
           avatar_url = COALESCE($3, avatar_url),
           email = COALESCE($4, email),
           phone = COALESCE($5, phone),
           specialties = COALESCE($6, specialties),
           is_active = COALESCE($7, is_active),
           updated_at = NOW()
       WHERE id = $8
       RETURNING *`,
      [name, bio, avatar_url, email, phone, specialties, is_active, id]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating instructor:', err);
    res.status(500).json({ message: 'Error updating instructor' });
  }
});

// Delete instructor
router.post('/delete', requireAdminAuth(['super_admin']), async (req, res) => {
  try {
    const { id, hard_delete = false } = req.body || {};

    if (!id) {
      return res.status(400).json({ message: 'instructor id is required' });
    }

    const coursesResult = await db.query(
      'SELECT COUNT(*) as count FROM courses WHERE instructor_id = $1',
      [id]
    );

    if (parseInt(coursesResult.rows[0].count, 10) > 0) {
      return res.status(400).json({
        message: 'Cannot delete instructor with associated courses. Please remove or reassign courses first.'
      });
    }

    if (hard_delete) {
      await db.query('DELETE FROM instructors WHERE id = $1', [id]);
      res.json({ message: 'Instructor deleted successfully' });
    } else {
      const result = await db.query(
        `UPDATE instructors
         SET is_active = false, updated_at = NOW()
         WHERE id = $1
         RETURNING *`,
        [id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ message: 'Instructor not found' });
      }

      res.json({ message: 'Instructor deactivated successfully', instructor: result.rows[0] });
    }
  } catch (err) {
    console.error('Error deleting instructor:', err);
    res.status(500).json({ message: 'Error deleting instructor' });
  }
});

// Instructor statistics
router.post('/stats', requireAdminAuth(['super_admin', 'branch_admin']), async (req, res) => {
  try {
    const { id } = req.body || {};
    if (!id) {
      return res.status(400).json({ message: 'instructor id is required' });
    }

    const result = await db.query(
      `SELECT
         i.*,
         COUNT(DISTINCT c.id) as total_courses,
         COUNT(DISTINCT cs.id) as total_sessions,
         COUNT(DISTINCT ce.id) as total_enrollments
       FROM instructors i
       LEFT JOIN courses c ON i.id = c.instructor_id
       LEFT JOIN course_sessions cs ON c.id = cs.course_id
       LEFT JOIN course_enrollments ce ON c.id = ce.course_id
       WHERE i.id = $1
       GROUP BY i.id`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Instructor not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching instructor stats:', err);
    res.status(500).json({ message: 'Error fetching instructor statistics' });
  }
});

// Instructor courses
router.post('/courses', requireAdminAuth(['super_admin', 'branch_admin']), async (req, res) => {
  try {
    const { id } = req.body || {};
    if (!id) {
      return res.status(400).json({ message: 'instructor id is required' });
    }

    const result = await db.query(
      `SELECT c.*, b.name as branch_name
       FROM courses c
       LEFT JOIN branches b ON c.branch_id = b.id
       WHERE c.instructor_id = $1
       ORDER BY c.created_at DESC`,
      [id]
    );

    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching instructor courses:', err);
    res.status(500).json({ message: 'Error fetching instructor courses' });
  }
});

module.exports = router;
