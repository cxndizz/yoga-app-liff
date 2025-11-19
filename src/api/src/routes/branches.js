const express = require('express');
const router = express.Router();
const db = require('../db');
const { requireAdminAuth } = require('../middleware/adminAuth');

// List branches
router.post('/list', requireAdminAuth(['super_admin', 'branch_admin']), async (req, res) => {
  try {
    const { active_only } = req.body || {};
    let query = 'SELECT * FROM branches';

    if (active_only === true || active_only === 'true') {
      query += ' WHERE is_active = true';
    }

    query += ' ORDER BY created_at DESC';

    const result = await db.query(query);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching branches:', err);
    res.status(500).json({ message: 'Error fetching branches' });
  }
});

// Branch detail
router.post('/detail', requireAdminAuth(['super_admin', 'branch_admin']), async (req, res) => {
  try {
    const { id } = req.body || {};
    if (!id) {
      return res.status(400).json({ message: 'branch id is required' });
    }

    const result = await db.query('SELECT * FROM branches WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Branch not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching branch:', err);
    res.status(500).json({ message: 'Error fetching branch' });
  }
});

// Create new branch
router.post('/', requireAdminAuth(['super_admin']), async (req, res) => {
  try {
    const { name, address, phone, map_url, is_active = true } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Branch name is required' });
    }

    const result = await db.query(
      `INSERT INTO branches (name, address, phone, map_url, is_active)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [name, address || null, phone || null, map_url || null, is_active]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating branch:', err);
    res.status(500).json({ message: 'Error creating branch' });
  }
});

// Update branch
router.post('/update', requireAdminAuth(['super_admin']), async (req, res) => {
  try {
    const { id, name, address, phone, map_url, is_active } = req.body || {};

    if (!id) {
      return res.status(400).json({ message: 'branch id is required' });
    }

    const checkResult = await db.query('SELECT id FROM branches WHERE id = $1', [id]);
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ message: 'Branch not found' });
    }

    const result = await db.query(
      `UPDATE branches
       SET name = COALESCE($1, name),
           address = COALESCE($2, address),
           phone = COALESCE($3, phone),
           map_url = COALESCE($4, map_url),
           is_active = COALESCE($5, is_active),
           updated_at = NOW()
       WHERE id = $6
       RETURNING *`,
      [name, address, phone, map_url, is_active, id]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating branch:', err);
    res.status(500).json({ message: 'Error updating branch' });
  }
});

// Delete branch (soft delete by default)
router.post('/delete', requireAdminAuth(['super_admin']), async (req, res) => {
  try {
    const { id, hard_delete = false } = req.body || {};

    if (!id) {
      return res.status(400).json({ message: 'branch id is required' });
    }

    const coursesResult = await db.query(
      'SELECT COUNT(*) as count FROM courses WHERE branch_id = $1',
      [id]
    );

    if (parseInt(coursesResult.rows[0].count, 10) > 0) {
      return res.status(400).json({
        message: 'Cannot delete branch with associated courses. Please remove or reassign courses first.'
      });
    }

    if (hard_delete) {
      await db.query('DELETE FROM branches WHERE id = $1', [id]);
      res.json({ message: 'Branch deleted successfully' });
    } else {
      const result = await db.query(
        `UPDATE branches
         SET is_active = false, updated_at = NOW()
         WHERE id = $1
         RETURNING *`,
        [id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ message: 'Branch not found' });
      }

      res.json({ message: 'Branch deactivated successfully', branch: result.rows[0] });
    }
  } catch (err) {
    console.error('Error deleting branch:', err);
    res.status(500).json({ message: 'Error deleting branch' });
  }
});

// Branch statistics
router.post('/stats', requireAdminAuth(['super_admin', 'branch_admin']), async (req, res) => {
  try {
    const { id } = req.body || {};
    if (!id) {
      return res.status(400).json({ message: 'branch id is required' });
    }

    const result = await db.query(
      `SELECT
         b.*,
         COUNT(DISTINCT c.id) as total_courses,
         COUNT(DISTINCT cs.id) as total_sessions,
         COUNT(DISTINCT ce.id) as total_enrollments
       FROM branches b
       LEFT JOIN courses c ON b.id = c.branch_id
       LEFT JOIN course_sessions cs ON c.id = cs.course_id
       LEFT JOIN course_enrollments ce ON c.id = ce.course_id
       WHERE b.id = $1
       GROUP BY b.id`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Branch not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching branch stats:', err);
    res.status(500).json({ message: 'Error fetching branch statistics' });
  }
});

module.exports = router;
