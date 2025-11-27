const express = require('express');
const http = require('http');
const bodyParser = require('body-parser');
const cors = require('cors');
const dotenv = require('dotenv');
const db = require('./db');
const { requireAdminAuth } = require('./middleware/adminAuth');
const { initSocketServer } = require('./websocket/socketServer');

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
const adminDebugRoutes = require('./routes/adminDebug');
const checkinsRoutes = require('./routes/checkins');
const moneyspaceService = require('./services/moneyspace');
const { assertPurchasable, findReusableOrder } = require('./utils/purchaseGuards');
const { startOrderExpiryWatcher } = require('./services/orderScheduler');

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
app.use('/api/admin/debug', adminDebugRoutes);
app.use('/api/admin/checkins', checkinsRoutes);
app.use('/payments', paymentsRoutes);

app.post('/courses/list', async (req, res) => {
  try {
    const { limit = 50, course_type } = req.body || {};
    let query = `
      SELECT
        c.id,
        c.title,
        c.description,
        c.branch_id,
        c.instructor_id,
        c.capacity,
        c.is_free,
        c.price_cents,
        c.cover_image_url,
        c.access_times,
        c.channel,
        c.status,
        c.duration_minutes,
        c.level,
        c.tags,
        c.is_featured,
        c.course_type,
        c.max_students,
        c.enrollment_deadline,
        c.unlimited_capacity,
        c.created_at,
        c.updated_at,
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

// Member self-check-in via QR code
app.post('/courses/checkin', async (req, res) => {
  try {
    const { user_id, code, course_id, enrollment_id } = req.body || {};
    if (!user_id || !code) {
      return res.status(400).json({ message: 'user_id and code are required' });
    }

    const normalizedCode = String(code || '')
      .replace(/^yoga-checkin:/i, '')
      .trim();

    if (!normalizedCode) {
      return res.status(400).json({ message: 'Invalid QR code' });
    }

    const courseResult = await db.query(
      'SELECT id, title FROM courses WHERE qr_checkin_code = $1',
      [normalizedCode]
    );

    if (courseResult.rows.length === 0) {
      return res.status(404).json({ message: 'ไม่พบคอร์สสำหรับ QR นี้' });
    }

    const course = courseResult.rows[0];

    if (course_id && Number(course_id) !== Number(course.id)) {
      return res.status(400).json({ message: 'คอร์สที่เลือกไม่ตรงกับ QR ที่สแกน' });
    }

    let enrollmentQuery =
      `SELECT *
       FROM course_enrollments
       WHERE user_id = $1 AND course_id = $2 AND status = 'active'
       ORDER BY enrolled_at DESC
       LIMIT 1`;
    const queryParams = [user_id, course.id];

    if (enrollment_id) {
      enrollmentQuery =
        `SELECT *
         FROM course_enrollments
         WHERE id = $1 AND user_id = $2 AND course_id = $3 AND status = 'active'
         LIMIT 1`;
      queryParams.unshift(enrollment_id);
    }

    const enrollmentResult = await db.query(enrollmentQuery, queryParams);

    if (enrollmentResult.rows.length === 0) {
      return res.status(404).json({
        message: 'ยังไม่มีสิทธิ์เข้าเรียนคอร์สนี้',
        course_id: course.id,
      });
    }

    const enrollment = enrollmentResult.rows[0];
    const now = new Date();

    const hasExpiredByDate =
      enrollment.expires_at && new Date(enrollment.expires_at).getTime() <= now.getTime();

    if (hasExpiredByDate) {
      await db.query(
        `UPDATE course_enrollments
         SET status = 'expired', updated_at = NOW()
         WHERE id = $1`,
        [enrollment.id]
      );
      return res.status(400).json({ message: 'สิทธิ์เข้าเรียนของคุณหมดแล้ว' });
    }

    if (enrollment.remaining_access !== null && enrollment.remaining_access <= 0) {
      return res.status(400).json({ message: 'สิทธิ์เข้าเรียนของคุณหมดแล้ว' });
    }

    const baseStart = enrollment.first_attended_at
      ? new Date(enrollment.first_attended_at)
      : now;
    const resolvedExpiresAt =
      enrollment.expires_at || new Date(baseStart.getTime() + 30 * 24 * 60 * 60 * 1000);

    const newRemaining =
      enrollment.remaining_access !== null ? enrollment.remaining_access - 1 : null;
    const newStatus = newRemaining === 0 ? 'expired' : 'active';

    const updateResult = await db.query(
      `UPDATE course_enrollments
       SET remaining_access = $1,
           status = $2,
           last_attended_at = NOW(),
           first_attended_at = COALESCE(first_attended_at, $4),
           expires_at = COALESCE(expires_at, $5),
           updated_at = NOW()
       WHERE id = $3
       RETURNING *`,
      [newRemaining, newStatus, enrollment.id, baseStart, resolvedExpiresAt]
    );

    await db.query(
      `INSERT INTO course_checkin_logs (user_id, course_id, enrollment_id, session_id, source, raw_code)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [user_id, course.id, enrollment.id, enrollment.session_id || null, 'liff', normalizedCode]
    );

    res.json({
      message: 'บันทึกการเข้าเรียนเรียบร้อย',
      course,
      enrollment: updateResult.rows[0],
    });
  } catch (err) {
    console.error('Error in course check-in:', err);
    res.status(500).json({ message: 'ไม่สามารถบันทึกการเข้าเรียนได้' });
  }
});

app.post('/users/checkin/enrollments', async (req, res) => {
  const { user_id } = req.body || {};
  if (!user_id) {
    return res.status(400).json({ message: 'user_id is required' });
  }

  try {
    const result = await db.query(
      `SELECT ce.*, c.title, c.cover_image_url, c.access_times, c.qr_checkin_code
       FROM course_enrollments ce
       JOIN courses c ON c.id = ce.course_id
       WHERE ce.user_id = $1
         AND ce.status = 'active'
         AND (ce.remaining_access IS NULL OR ce.remaining_access > 0)
         AND (ce.expires_at IS NULL OR ce.expires_at > NOW())
       ORDER BY ce.enrolled_at DESC`,
      [user_id]
    );

    const mapped = result.rows.map((row) => ({
      enrollment_id: row.id,
      course_id: row.course_id,
      title: row.title,
      cover_image_url: row.cover_image_url,
      remaining_access: row.remaining_access,
      total_access: row.access_times,
      last_attended_at: row.last_attended_at,
      first_attended_at: row.first_attended_at,
      expires_at: row.expires_at,
      qr_checkin_code: row.qr_checkin_code,
      enrolled_at: row.enrolled_at,
    }));

    res.json(mapped);
  } catch (err) {
    console.error('Error fetching check-in enrollments', err);
    res.status(500).json({ message: 'Error fetching enrollments for check-in' });
  }
});

app.get('/users/:userId/checkins', async (req, res) => {
  const { userId } = req.params;
  if (!userId) {
    return res.status(400).json({ message: 'userId is required' });
  }

  const limit = parseLimit(req.query.limit, 50);
  const offset = parseLimit(req.query.offset, 0);

  try {
    const result = await db.query(
      `SELECT l.id,
              l.attended_at,
              l.course_id,
              l.enrollment_id,
              l.session_id,
              l.source,
              l.raw_code,
              c.title AS course_title,
              cs.session_name,
              cs.start_date,
              cs.start_time,
              cs.end_time
       FROM course_checkin_logs l
       LEFT JOIN courses c ON c.id = l.course_id
       LEFT JOIN course_sessions cs ON cs.id = l.session_id
       WHERE l.user_id = $1
       ORDER BY l.attended_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );

    const mapped = result.rows.map((row) => ({
      id: row.id,
      attended_at: row.attended_at,
      course_id: row.course_id,
      enrollment_id: row.enrollment_id,
      session_id: row.session_id,
      session_name: row.session_name,
      session_start_date: row.start_date,
      session_start_time: row.start_time,
      session_end_time: row.end_time,
      source: row.source,
      raw_code: row.raw_code,
      course_title: row.course_title,
    }));

    res.json(mapped);
  } catch (err) {
    console.error('Error fetching check-in history', err);
    res.status(500).json({ message: 'Error fetching check-in history' });
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
  const { line_user_id, line_display_name, full_name, email, phone } = req.body;
  if (!line_user_id) {
    return res.status(400).json({ message: 'line_user_id is required' });
  }
  try {
    const displayName = line_display_name || full_name || null;

    let result = await db.query('SELECT * FROM users WHERE line_user_id = $1', [line_user_id]);
    let user = result.rows[0];
    if (!user) {
      result = await db.query(
        `INSERT INTO users (line_user_id, line_display_name, full_name, email, phone)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [line_user_id, displayName, full_name || null, email || null, phone || null]
      );
      user = result.rows[0];
    } else {
      const updates = [];
      const params = [];

      if (displayName) {
        params.push(displayName);
        updates.push(`line_display_name = $${params.length}`);
      }

      if (full_name) {
        params.push(full_name);
        updates.push(`full_name = $${params.length}`);
      }

      if (email) {
        params.push(email);
        updates.push(`email = $${params.length}`);
      }

      if (phone) {
        params.push(phone);
        updates.push(`phone = $${params.length}`);
      }

      if (updates.length > 0) {
        params.push(line_user_id);
        const updateQuery = `
          UPDATE users
          SET ${updates.join(', ')}
          WHERE line_user_id = $${params.length}
          RETURNING *`;

        const updated = await db.query(updateQuery, params);
        user = updated.rows[0] || user;
      }
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

    const guard = await assertPurchasable(user_id, course_id);
    if (!guard.allowed) {
      return res.status(400).json({
        message: guard.message,
        reason: guard.reason,
        details: guard.details,
      });
    }

    const existingOrder = await findReusableOrder(user_id, course_id);
    if (existingOrder) {
      return res.json(existingOrder);
    }

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
    const normalizeStatus = (value) => String(value || '').trim().toLowerCase();
    const paidStatuses = [
      'completed',
      'paid',
      'success',
      'paysuccess',
      'succeeded',
      'successed',
      'authorized',
      'authorised',
      'ok',
    ];
    const cancelledStatuses = ['cancelled', 'canceled', 'failed'];

    const isPaidStatus = (value, isFree = false) => {
      if (isFree) return true;
      return paidStatuses.includes(normalizeStatus(value));
    };

    const isEnrollmentExpired = (row) => {
      const expiresAt = row?.enrollment_expires_at || row?.expires_at;
      if (!expiresAt) return false;
      return new Date(expiresAt).getTime() <= Date.now();
    };

    const isEnrollmentActive = (row) => {
      const status = normalizeStatus(row?.enrollment_status);
      const remaining = row?.remaining_access;
      const hasRemaining = remaining === null || Number(remaining) > 0;
      if (isEnrollmentExpired(row)) return false;
      return row?.enrollment_id && !['cancelled', 'expired'].includes(status) && hasRemaining;
    };

    const isOrderOwned = (row) => {
      const normalizedPayment = normalizeStatus(row?.payment_status || row?.status);
      const normalizedOrder = normalizeStatus(row?.status);
      const priceCents = Number(row?.total_price_cents ?? row?.price_cents ?? 0);
      const isFree = row?.is_free || priceCents === 0;
      const cancelled = cancelledStatuses.includes(normalizedPayment) || cancelledStatuses.includes(normalizedOrder);
      return (
        !cancelled &&
        (isEnrollmentActive(row) || isPaidStatus(normalizedPayment, isFree) || isPaidStatus(normalizedOrder, isFree))
      );
    };

    const withResolvedStatuses = (row) => {
      const normalizedPayment = normalizeStatus(row?.payment_status || row?.status);
      const normalizedOrder = normalizeStatus(row?.status);
      const enrollmentActive = isEnrollmentActive(row);
      const enrollmentExpired = isEnrollmentExpired(row);
      const resolvedPaymentStatus = enrollmentActive
        ? paidStatuses.includes(normalizedPayment)
          ? normalizedPayment || 'completed'
          : 'completed'
        : normalizedPayment || (row?.is_free ? 'completed' : 'pending');

      const resolvedOrderStatus = paidStatuses.includes(resolvedPaymentStatus)
        ? 'completed'
        : normalizedOrder || 'pending';

      return {
        ...row,
        enrollment_status: enrollmentExpired ? 'expired' : row.enrollment_status,
        enrollment_active: enrollmentActive,
        enrollment_expired: enrollmentExpired,
        resolved_payment_status: resolvedPaymentStatus,
        resolved_order_status: resolvedOrderStatus,
        is_owned: isOrderOwned(row),
      };
    };

    const result = await db.query(
      `SELECT o.*, c.title AS course_title, c.cover_image_url, c.channel, c.is_free, c.price_cents, c.access_times,
              c.course_type, c.max_students, b.name AS branch_name, c.capacity,
              TRIM(BOTH FROM COALESCE(p.status, o.status)) AS payment_status,
              ce.id AS enrollment_id,
              ce.status AS enrollment_status,
              ce.remaining_access,
              ce.last_attended_at AS enrollment_last_attended,
              ce.first_attended_at AS enrollment_first_attended,
              ce.expires_at AS enrollment_expires_at,
              ce.notes AS enrollment_notes
       FROM orders o
       LEFT JOIN courses c ON o.course_id = c.id
       LEFT JOIN branches b ON c.branch_id = b.id
       LEFT JOIN LATERAL (
         SELECT status
         FROM payments
         WHERE order_id = o.id
         ORDER BY created_at DESC
         LIMIT 1
       ) p ON TRUE
       LEFT JOIN LATERAL (
          SELECT id, status, remaining_access, last_attended_at, first_attended_at, expires_at, notes
         FROM course_enrollments
         WHERE order_id = o.id
            OR (user_id = o.user_id AND course_id = o.course_id)
         ORDER BY enrolled_at DESC
         LIMIT 1
       ) ce ON TRUE
       WHERE o.user_id = $1
       ORDER BY o.created_at DESC
       LIMIT 100`,
      [user_id]
    );

    const orphanEnrollments = await db.query(
      `SELECT ce.*, c.title AS course_title, c.cover_image_url, c.channel, c.is_free, c.price_cents,
              c.access_times as course_access_times, c.course_type, c.max_students, b.name AS branch_name, c.capacity
       FROM course_enrollments ce
       LEFT JOIN courses c ON ce.course_id = c.id
       LEFT JOIN branches b ON c.branch_id = b.id
       WHERE ce.user_id = $1
         AND NOT EXISTS (
           SELECT 1 FROM orders o WHERE o.user_id = ce.user_id AND o.course_id = ce.course_id
         )
       ORDER BY ce.enrolled_at DESC
       LIMIT 50`,
      [user_id]
    );

    const mappedEnrollments = orphanEnrollments.rows.map((row) => ({
      ...row,
      id: `enrollment-${row.id}`,
      course_id: row.course_id,
      user_id: row.user_id,
      status: row.status || 'completed',
      total_price_cents: row.total_price_cents || 0,
      payment_status: row.status || 'completed',
      access_times: row.course_access_times ?? row.access_times,
      enrollment_id: row.id,
      enrollment_status: row.status,
      enrollment_last_attended: row.last_attended_at,
      enrollment_first_attended: row.first_attended_at,
      enrollment_expires_at: row.expires_at,
      enrollment_notes: row.notes,
      created_at: row.enrolled_at,
    }));

    const combined = [...result.rows, ...mappedEnrollments].sort((a, b) => {
      const aDate = a.created_at ? new Date(a.created_at).getTime() : 0;
      const bDate = b.created_at ? new Date(b.created_at).getTime() : 0;
      return bDate - aDate;
    });

    const normalized = combined.map(withResolvedStatuses);

    res.json(normalized);
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

// Create HTTP server for both Express and Socket.io
const httpServer = http.createServer(app);

// Initialize WebSocket server
const io = initSocketServer(httpServer);

// Make io available to routes via app.locals
app.locals.io = io;

// Start server
httpServer.listen(port, () => {
  console.log(`API server is running on port ${port}`);
  console.log(`WebSocket server is ready`);
});

// Start background watcher to cancel stale pending orders
startOrderExpiryWatcher();
