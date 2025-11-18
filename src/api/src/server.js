const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const dotenv = require('dotenv');
const db = require('./db');

dotenv.config();

const adminAuthRoutes = require('./admin/auth.routes');

const app = express();
const port = process.env.PORT || 4000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const allowedOrigins = [process.env.CORS_ORIGIN_LIFF, process.env.CORS_ORIGIN_ADMIN].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      console.warn('Blocked by CORS:', origin);
      return callback(null, false);
    },
    credentials: true,
  })
);

app.get('/health', async (_req, res) => {
  try {
    await db.query('SELECT 1');
    res.json({ status: 'ok', db: 'connected' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: 'DB connection failed' });
  }
});

app.use('/admin/auth', adminAuthRoutes);

app.get('/courses', async (_req, res) => {
  try {
    const result = await db.query(`
      SELECT c.*,
             b.name AS branch_name,
             i.name AS instructor_name
      FROM courses c
      LEFT JOIN branches b ON c.branch_id = b.id
      LEFT JOIN instructors i ON c.instructor_id = i.id
      ORDER BY c.created_at DESC
      LIMIT 50
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching courses', err);
    res.status(500).json({ message: 'Error fetching courses' });
  }
});

app.post('/courses', async (req, res) => {
  const { title, description, capacity, is_free, price_cents, access_times } = req.body;
  try {
    const result = await db.query(
      `INSERT INTO courses (title, description, capacity, is_free, price_cents, access_times)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [title, description, capacity || 0, !!is_free, price_cents || 0, access_times || 1]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating course', err);
    res.status(500).json({ message: 'Error creating course' });
  }
});

app.get('/admin/users', async (_req, res) => {
  try {
    const result = await db.query('SELECT * FROM users ORDER BY created_at DESC LIMIT 100');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching users', err);
    res.status(500).json({ message: 'Error fetching users' });
  }
});

app.post('/auth/line-login', async (req, res) => {
  const { line_user_id, full_name, email, phone } = req.body;
  if (!line_user_id) {
    return res.status(400).json({ message: 'line_user_id is required' });
  }
  try {
    let result = await db.query('SELECT * FROM users WHERE line_user_id = $1', [line_user_id]);
    let user = result.rows[0];
    if (!user) {
      result = await db.query(
        `INSERT INTO users (line_user_id, full_name, email, phone)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [line_user_id, full_name || null, email || null, phone || null]
      );
      user = result.rows[0];
    }
    res.json({ user });
  } catch (err) {
    console.error('Error in line-login', err);
    res.status(500).json({ message: 'Error in line login' });
  }
});

app.post('/orders', async (req, res) => {
  const { user_id, course_id } = req.body;
  if (!user_id || !course_id) {
    return res.status(400).json({ message: 'user_id and course_id are required' });
  }
  try {
    const courseRes = await db.query('SELECT * FROM courses WHERE id = $1', [course_id]);
    if (courseRes.rows.length === 0) {
      return res.status(404).json({ message: 'Course not found' });
    }
    const course = courseRes.rows[0];
    const total_price_cents = course.is_free ? 0 : course.price_cents || 0;

    const result = await db.query(
      `INSERT INTO orders (user_id, course_id, status, total_price_cents)
       VALUES ($1, $2, 'pending', $3)
       RETURNING *`,
      [user_id, course_id, total_price_cents]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating order', err);
    res.status(500).json({ message: 'Error creating order' });
  }
});

app.get('/users/:userId/orders', async (req, res) => {
  const userId = req.params.userId;
  try {
    const result = await db.query(
      `SELECT o.*, c.title AS course_title
       FROM orders o
       LEFT JOIN courses c ON o.course_id = c.id
       WHERE o.user_id = $1
       ORDER BY o.created_at DESC`,
      [userId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching orders', err);
    res.status(500).json({ message: 'Error fetching orders' });
  }
});

app.post('/payments/omise-webhook', async (req, res) => {
  console.log('Received Omise webhook mock:', req.body);
  res.json({ received: true });
});

app.listen(port, () => {
  console.log(`API server is running on port ${port}`);
});
