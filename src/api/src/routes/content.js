const express = require('express');
const router = express.Router();
const db = require('../db');
const { requireAdminAuth } = require('../middleware/adminAuth');

// Get all content pages
router.get('/', async (req, res) => {
  try {
    const { page_type, is_published } = req.query;

    let query = 'SELECT * FROM content_pages WHERE 1=1';
    const params = [];

    if (page_type) {
      params.push(page_type);
      query += ` AND page_type = $${params.length}`;
    }

    if (is_published !== undefined) {
      params.push(is_published === 'true');
      query += ` AND is_published = $${params.length}`;
    }

    query += ' ORDER BY display_order ASC, created_at DESC';

    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching content pages:', err);
    res.status(500).json({ message: 'Error fetching content pages' });
  }
});

// Get single content page by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query('SELECT * FROM content_pages WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Content page not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching content page:', err);
    res.status(500).json({ message: 'Error fetching content page' });
  }
});

// Get content page by slug
router.get('/slug/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    const result = await db.query('SELECT * FROM content_pages WHERE slug = $1', [slug]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Content page not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching content page:', err);
    res.status(500).json({ message: 'Error fetching content page' });
  }
});

// Create new content page
router.post('/', requireAdminAuth(['super_admin']), async (req, res) => {
  try {
    const {
      slug,
      title,
      content,
      meta_description,
      page_type = 'general',
      is_published = true,
      display_order = 0
    } = req.body;

    if (!slug || !title) {
      return res.status(400).json({ message: 'Slug and title are required' });
    }

    // Check if slug already exists
    const slugCheck = await db.query('SELECT id FROM content_pages WHERE slug = $1', [slug]);
    if (slugCheck.rows.length > 0) {
      return res.status(400).json({ message: 'Slug already exists' });
    }

    const result = await db.query(
      `INSERT INTO content_pages (slug, title, content, meta_description, page_type, is_published, display_order)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [slug, title, content || null, meta_description || null, page_type, is_published, display_order]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating content page:', err);
    res.status(500).json({ message: 'Error creating content page' });
  }
});

// Update content page
router.put('/:id', requireAdminAuth(['super_admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const {
      slug,
      title,
      content,
      meta_description,
      page_type,
      is_published,
      display_order
    } = req.body;

    // Check if content page exists
    const checkResult = await db.query('SELECT id FROM content_pages WHERE id = $1', [id]);
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ message: 'Content page not found' });
    }

    // Check if slug is being changed and if it already exists
    if (slug) {
      const slugCheck = await db.query(
        'SELECT id FROM content_pages WHERE slug = $1 AND id != $2',
        [slug, id]
      );
      if (slugCheck.rows.length > 0) {
        return res.status(400).json({ message: 'Slug already exists' });
      }
    }

    const result = await db.query(
      `UPDATE content_pages
       SET slug = COALESCE($1, slug),
           title = COALESCE($2, title),
           content = COALESCE($3, content),
           meta_description = COALESCE($4, meta_description),
           page_type = COALESCE($5, page_type),
           is_published = COALESCE($6, is_published),
           display_order = COALESCE($7, display_order),
           updated_at = NOW()
       WHERE id = $8
       RETURNING *`,
      [slug, title, content, meta_description, page_type, is_published, display_order, id]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating content page:', err);
    res.status(500).json({ message: 'Error updating content page' });
  }
});

// Delete content page
router.delete('/:id', requireAdminAuth(['super_admin']), async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.query('DELETE FROM content_pages WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Content page not found' });
    }

    res.json({ message: 'Content page deleted successfully' });
  } catch (err) {
    console.error('Error deleting content page:', err);
    res.status(500).json({ message: 'Error deleting content page' });
  }
});

module.exports = router;
