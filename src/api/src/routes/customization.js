const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../db');
const { requireAdminAuth } = require('../middleware/adminAuth');

// Configure multer for logo uploads
const logoStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '..', '..', 'uploads', 'logos');
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Generate unique filename with timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'logo-' + uniqueSuffix + ext);
  }
});

// File filter to accept only images
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp|svg/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'));
  }
};

const bannerStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '..', '..', 'uploads', 'banners');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'banner-' + uniqueSuffix + ext);
  }
});

const uploadLogo = multer({
  storage: logoStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: fileFilter
});

const uploadBanner = multer({
  storage: bannerStorage,
  limits: { fileSize: 8 * 1024 * 1024 }, // 8MB limit
  fileFilter: fileFilter
});

// Upload logo image (admin only)
router.post('/upload-logo', requireAdminAuth(['super_admin']), uploadLogo.single('logo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Generate the URL for the uploaded file
    const logoUrl = `/uploads/logos/${req.file.filename}`;

    res.json({
      success: true,
      logo_url: logoUrl,
      message: 'Logo uploaded successfully'
    });
  } catch (err) {
    console.error('Error uploading logo:', err);
    res.status(500).json({ message: err.message || 'Error uploading logo' });
  }
});

// Upload banner image (admin only)
router.post('/upload-banner', requireAdminAuth(['super_admin']), uploadBanner.single('banner'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const bannerUrl = `/uploads/banners/${req.file.filename}`;

    res.json({
      success: true,
      banner_url: bannerUrl,
      message: 'Banner uploaded successfully'
    });
  } catch (err) {
    console.error('Error uploading banner:', err);
    res.status(500).json({ message: err.message || 'Error uploading banner' });
  }
});

const DEFAULT_CUSTOMIZATION = {
  app_name: 'Yoga Luxe',
  app_description: 'Boutique LIFF Studio',
  logo_url: null,
  banner_url: null,
  logo_initials: 'YL',
  primary_color: '#0b1a3c',
  secondary_color: '#4cafb9',
  background_color: '#f7f8fb',
};

const getLatestCustomization = async () => {
  const result = await db.query('SELECT * FROM app_customization ORDER BY id DESC LIMIT 1');
  if (result.rows.length === 0) {
    return DEFAULT_CUSTOMIZATION;
  }
  return result.rows[0];
};

// Get app customization settings (public - for LIFF app)
router.post('/get', async (_req, res) => {
  try {
    const customization = await getLatestCustomization();
    res.json(customization);
  } catch (err) {
    console.error('Error fetching customization:', err);
    res.status(500).json({ message: 'Error fetching customization settings' });
  }
});

// Stream customization updates (public - for LIFF app realtime updates)
router.get('/stream', async (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');

  const sendUpdate = async () => {
    try {
      const customization = await getLatestCustomization();
      res.write(`data: ${JSON.stringify(customization)}\n\n`);
    } catch (err) {
      console.error('Error streaming customization:', err);
      res.write(`event: error\ndata: {"message":"Error fetching customization"}\n\n`);
    }
  };

  const intervalId = setInterval(sendUpdate, 5000);

  // Send first payload immediately
  sendUpdate();

  req.on('close', () => {
    clearInterval(intervalId);
  });
});

// Update app customization (admin only)
router.post('/update', requireAdminAuth(['super_admin']), async (req, res) => {
  try {
    const {
      app_name,
      app_description,
      logo_url,
      banner_url,
      logo_initials,
      primary_color,
      secondary_color,
      background_color,
    } = req.body;

    // Check if customization exists
    const checkResult = await db.query('SELECT id FROM app_customization LIMIT 1');

    let result;
    if (checkResult.rows.length > 0) {
      // Update existing customization
      result = await db.query(
        `UPDATE app_customization
         SET app_name = COALESCE($1, app_name),
             app_description = COALESCE($2, app_description),
             logo_url = COALESCE($3, logo_url),
             banner_url = COALESCE($4, banner_url),
             logo_initials = COALESCE($5, logo_initials),
             primary_color = COALESCE($6, primary_color),
             secondary_color = COALESCE($7, secondary_color),
             background_color = COALESCE($8, background_color),
             updated_at = NOW()
         WHERE id = $9
         RETURNING *`,
        [
          app_name,
          app_description,
          logo_url,
          banner_url,
          logo_initials,
          primary_color,
          secondary_color,
          background_color,
          checkResult.rows[0].id,
        ]
      );
    } else {
      // Insert new customization
      result = await db.query(
        `INSERT INTO app_customization (app_name, app_description, logo_url, banner_url, logo_initials, primary_color, secondary_color, background_color)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING *`,
        [
          app_name || 'Yoga Luxe',
          app_description || 'Boutique LIFF Studio',
          logo_url,
          banner_url,
          logo_initials || 'YL',
          primary_color || '#0b1a3c',
          secondary_color || '#4cafb9',
          background_color || '#f7f8fb',
        ]
      );
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating customization:', err);
    res.status(500).json({ message: 'Error updating customization settings' });
  }
});

module.exports = router;
