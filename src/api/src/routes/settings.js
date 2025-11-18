const express = require('express');
const router = express.Router();
const db = require('../db');
const { requireAdminAuth } = require('../middleware/adminAuth');

// Get all settings (admin only)
router.get('/', requireAdminAuth(['super_admin']), async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM settings ORDER BY setting_key ASC');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching settings:', err);
    res.status(500).json({ message: 'Error fetching settings' });
  }
});

// Get public settings (no auth required)
router.get('/public', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM settings WHERE is_public = true ORDER BY setting_key ASC');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching public settings:', err);
    res.status(500).json({ message: 'Error fetching public settings' });
  }
});

// Get single setting by key
router.get('/:key', requireAdminAuth(['super_admin']), async (req, res) => {
  try {
    const { key } = req.params;
    const result = await db.query('SELECT * FROM settings WHERE setting_key = $1', [key]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Setting not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching setting:', err);
    res.status(500).json({ message: 'Error fetching setting' });
  }
});

// Create or update setting
router.post('/', requireAdminAuth(['super_admin']), async (req, res) => {
  try {
    const {
      setting_key,
      setting_value,
      setting_type = 'string',
      description,
      is_public = false
    } = req.body;

    if (!setting_key) {
      return res.status(400).json({ message: 'Setting key is required' });
    }

    // Check if setting exists
    const checkResult = await db.query('SELECT id FROM settings WHERE setting_key = $1', [setting_key]);

    let result;
    if (checkResult.rows.length > 0) {
      // Update existing setting
      result = await db.query(
        `UPDATE settings
         SET setting_value = $1,
             setting_type = $2,
             description = $3,
             is_public = $4,
             updated_at = NOW()
         WHERE setting_key = $5
         RETURNING *`,
        [setting_value, setting_type, description, is_public, setting_key]
      );
    } else {
      // Create new setting
      result = await db.query(
        `INSERT INTO settings (setting_key, setting_value, setting_type, description, is_public)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [setting_key, setting_value, setting_type, description, is_public]
      );
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error saving setting:', err);
    res.status(500).json({ message: 'Error saving setting' });
  }
});

// Update setting
router.put('/:key', requireAdminAuth(['super_admin']), async (req, res) => {
  try {
    const { key } = req.params;
    const { setting_value, setting_type, description, is_public } = req.body;

    const result = await db.query(
      `UPDATE settings
       SET setting_value = COALESCE($1, setting_value),
           setting_type = COALESCE($2, setting_type),
           description = COALESCE($3, description),
           is_public = COALESCE($4, is_public),
           updated_at = NOW()
       WHERE setting_key = $5
       RETURNING *`,
      [setting_value, setting_type, description, is_public, key]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Setting not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating setting:', err);
    res.status(500).json({ message: 'Error updating setting' });
  }
});

// Delete setting
router.delete('/:key', requireAdminAuth(['super_admin']), async (req, res) => {
  try {
    const { key } = req.params;

    const result = await db.query('DELETE FROM settings WHERE setting_key = $1 RETURNING *', [key]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Setting not found' });
    }

    res.json({ message: 'Setting deleted successfully' });
  } catch (err) {
    console.error('Error deleting setting:', err);
    res.status(500).json({ message: 'Error deleting setting' });
  }
});

// Bulk update settings
router.post('/bulk-update', requireAdminAuth(['super_admin']), async (req, res) => {
  try {
    const { settings } = req.body;

    if (!Array.isArray(settings) || settings.length === 0) {
      return res.status(400).json({ message: 'Settings array is required' });
    }

    const client = await db.pool.connect();
    try {
      await client.query('BEGIN');

      const updatedSettings = [];
      for (const setting of settings) {
        const { setting_key, setting_value, setting_type, description, is_public } = setting;

        if (!setting_key) {
          continue;
        }

        // Check if setting exists
        const checkResult = await client.query(
          'SELECT id FROM settings WHERE setting_key = $1',
          [setting_key]
        );

        let result;
        if (checkResult.rows.length > 0) {
          // Update
          result = await client.query(
            `UPDATE settings
             SET setting_value = $1,
                 setting_type = COALESCE($2, setting_type),
                 description = COALESCE($3, description),
                 is_public = COALESCE($4, is_public),
                 updated_at = NOW()
             WHERE setting_key = $5
             RETURNING *`,
            [setting_value, setting_type, description, is_public, setting_key]
          );
        } else {
          // Insert
          result = await client.query(
            `INSERT INTO settings (setting_key, setting_value, setting_type, description, is_public)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING *`,
            [setting_key, setting_value, setting_type || 'string', description, is_public || false]
          );
        }

        updatedSettings.push(result.rows[0]);
      }

      await client.query('COMMIT');
      res.json({ message: 'Settings updated successfully', settings: updatedSettings });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Error bulk updating settings:', err);
    res.status(500).json({ message: 'Error bulk updating settings' });
  }
});

module.exports = router;
