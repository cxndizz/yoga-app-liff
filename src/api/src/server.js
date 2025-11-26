const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const dotenv = require('dotenv');
const db = require('./db');
const { requireAdminAuth } = require('./middleware/adminAuth');

dotenv.config();

const adminAuthRoutes = require('./admin/auth.routes');
const adminDashboardRoutes = require('./routes/adminDashboard');
const branchesRoutes = require('./routes/branches');
const instructorsRoutes = require('./routes/instructors');
const coursesRoutes = require('./routes/courses');
const courseSessionsRoutes = require('./routes/courseSessions');
const enrollmentsRoutes = require('./routes/enrollments');
const customersRoutes = require('./routes/customers');
const contentRoutes = require('./routes/content');
const settingsRoutes = require('./routes/settings');
const paymentsRoutes = require('./routes/payments');
const moneyspaceService = require('./services/moneyspace');

const app = express();
const port = process.env.PORT || 4000;

const parseLimit = (value, fallback) => {
  if (value === undefined || value === null) return fallback;
  const parsed = parseInt(value, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
};

app.use(bodyParser.json({ limit: '15mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '15mb' }));

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

app.post('/health', async (_req, res) => {
  try {
    await db.query('SELECT 1');
    res.json({ status: 'ok', db: 'connected' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: 'DB connection failed' });
  }
});

app.use('/admin/auth', adminAuthRoutes);
app.use('/api/admin/dashboard', adminDashboardRoutes);
app.use('/api/admin/branches', branchesRoutes);
app.use('/api/admin/instructors', instructorsRoutes);
app.use('/api/admin/courses', coursesRoutes);
app.use('/api/admin/course-sessions', courseSessionsRoutes);
app.use('/api/admin/enrollments', enrollmentsRoutes);
app.use('/api/admin/customers', customersRoutes);
app.use('/api/admin/content', contentRoutes);
app.use('/api/admin/settings', settingsRoutes);
app.use('/payments', paymentsRoutes);

app.post('/courses/list', async (req, res) => {
  try {
    const { limit = 50, course_type } = req.body || {};
    let query = `
      SELECT c.*,
             b.name AS branch_name,
             i.name AS instructor_name,
             i.avatar_url AS instructor_avatar,
             (SELECT COUNT(*) FROM course_sessions cs WHERE cs.course_id = c.id) as session_count,
             CASE
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

    if (course_type) {
      params.push(course_type);
      query += ` AND c.course_type = $${params.length}`;
    }

    params.push(limit);
    query += ` ORDER BY c.created_at DESC LIMIT $${params.length}`;

    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching courses', err);
    res.status(500).json({ message: 'Error fetching courses' });
  }
});

app.post('/courses/sessions', async (req, res) => {
  try {
    const {
      course_id,
      course_ids,
      status = 'open',
      start_date_from,
      start_date_to,
      limit = 200,
      offset = 0,
      paginate = false,
    } = req.body || {};

    const filters = ['1=1'];
    const params = [];

    if (course_id) {
      params.push(course_id);
      filters.push(`AND cs.course_id = $${params.length}`);
    } else if (Array.isArray(course_ids) && course_ids.length > 0) {
      params.push(course_ids);
      filters.push(`AND cs.course_id = ANY($${params.length})`);
    }

    if (status) {
      params.push(status);
      filters.push(`AND cs.status = $${params.length}`);
    }

    if (start_date_from) {
      params.push(start_date_from);
      filters.push(`AND cs.start_date >= $${params.length}`);
    }

    if (start_date_to) {
      params.push(start_date_to);
      filters.push(`AND cs.start_date <= $${params.length}`);
    }

    const baseQuery = `
      FROM course_sessions cs
      LEFT JOIN courses c ON cs.course_id = c.id
      LEFT JOIN branches b ON COALESCE(cs.branch_id, c.branch_id) = b.id
      LEFT JOIN instructors i ON COALESCE(cs.instructor_id, c.instructor_id) = i.id
      WHERE ${filters.join(' ')}
      AND (c.course_type IS NULL OR c.course_type = 'scheduled')
    `;

    let selectQuery = `
      SELECT cs.id,
             cs.course_id,
             cs.session_name,
             cs.start_date,
             cs.start_time,
             cs.end_time,
             cs.day_of_week,
             cs.max_capacity,
             cs.current_enrollments,
             cs.status,
             (cs.max_capacity - cs.current_enrollments) AS available_spots,
             c.title AS course_title,
             c.course_type,
             c.channel,
             COALESCE(cs.branch_id, c.branch_id) AS branch_id,
             b.name AS branch_name,
             COALESCE(cs.instructor_id, c.instructor_id) AS instructor_id,
             i.name AS instructor_name
      ${baseQuery}
      ORDER BY cs.start_date ASC, cs.start_time ASC
    `;

    const queryParams = [...params];
    const limitValue = parseLimit(limit, 200);
    const offsetValue = parseLimit(offset, 0);

    if (limitValue) {
      queryParams.push(limitValue);
      selectQuery += ` LIMIT $${queryParams.length}`;
    }

    if (offsetValue) {
      queryParams.push(offsetValue);
      selectQuery += ` OFFSET $${queryParams.length}`;
    }

    const result = await db.query(selectQuery, queryParams);

    if (paginate) {
      const countQuery = `SELECT COUNT(*) ${baseQuery}`;
      const countResult = await db.query(countQuery, params);
      const total = parseInt(countResult.rows[0]?.count, 10) || 0;
      return res.json({ items: result.rows, total });
    }

    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching course sessions', err);
    res.status(500).json({ message: 'Error fetching course sessions' });
  }
});

app.post('/courses', requireAdminAuth(['super_admin', 'branch_admin']), async (req, res) => {
  const { title, description, capacity, is_free, price_cents, access_times, cover_image_url } = req.body;
  try {
    const result = await db.query(
      `INSERT INTO courses (title, description, capacity, is_free, price_cents, access_times, cover_image_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        title,
        description,
        capacity || 0,
        !!is_free,
        price_cents || 0,
        access_times || 1,
        cover_image_url || null,
      ]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating course', err);
    res.status(500).json({ message: 'Error creating course' });
  }
});

app.post('/admin/users/list', requireAdminAuth(['super_admin']), async (req, res) => {
  try {
    const { limit = 100 } = req.body || {};
    const result = await db.query('SELECT * FROM users ORDER BY created_at DESC LIMIT $1', [limit]);
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

app.post('/users/orders', async (req, res) => {
  const { user_id } = req.body || {};
  if (!user_id) {
    return res.status(400).json({ message: 'user_id is required' });
  }
  try {
    const result = await db.query(
      `SELECT o.*, c.title AS course_title, c.cover_image_url, c.channel, c.is_free, c.price_cents, c.access_times,
              c.course_type, c.max_students, b.name AS branch_name, c.capacity
       FROM orders o
       LEFT JOIN courses c ON o.course_id = c.id
       LEFT JOIN branches b ON c.branch_id = b.id
       WHERE o.user_id = $1
       ORDER BY o.created_at DESC`,
      [user_id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching orders', err);
    res.status(500).json({ message: 'Error fetching orders' });
  }
});

app.post('/orders/status', async (req, res) => {
  const { order_id, user_id } = req.body || {};

  if (!order_id) {
    return res.status(400).json({ message: 'order_id is required' });
  }

  try {
    const result = await db.query('SELECT * FROM orders WHERE id = $1', [order_id]);
    const order = result.rows[0];

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (user_id && Number(order.user_id) !== Number(user_id)) {
      return res.status(403).json({ message: 'Not authorized to view this order' });
    }

    return res.json(order);
  } catch (err) {
    console.error('Error fetching order status', err);
    return res.status(500).json({ message: 'Error fetching order status' });
  }
});

app.post('/payments/omise-webhook', async (req, res) => {
  console.log('Received Omise webhook mock:', req.body);
  res.json({ received: true });
});

app.post('/payments/moneyspace-webhook', async (req, res) => {
  try {
    const result = await moneyspaceService.handleWebhook(req.body);
    console.log('Money Space webhook received', { ...req.body, ...result });
    res.json({ received: true, ...result });
  } catch (err) {
    console.error('Money Space webhook error', err);
    res.status(500).json({ message: 'Error handling webhook' });
  }
});

app.listen(port, () => {
  console.log(`API server is running on port ${port}`);
});
