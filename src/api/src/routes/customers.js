const express = require('express');
const router = express.Router();
const db = require('../db');
const { requireAdminAuth } = require('../middleware/adminAuth');

const parseNumber = (value, fallback = 0) => {
  const parsed = parseInt(value, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
};

// List customers
router.post('/list', requireAdminAuth(['super_admin', 'branch_admin']), async (req, res) => {
  try {
    const { search, limit = 100, offset = 0 } = req.body || {};

    let query = `
      SELECT u.*,
             COUNT(DISTINCT o.id) as total_orders,
             COUNT(DISTINCT ce.id) as total_enrollments,
             SUM(CASE WHEN o.status = 'completed' THEN o.total_price_cents ELSE 0 END) as total_spent_cents
      FROM users u
      LEFT JOIN orders o ON u.id = o.user_id
      LEFT JOIN course_enrollments ce ON u.id = ce.user_id
      WHERE 1=1
    `;
    const params = [];

    if (search) {
      params.push(`%${search}%`);
      query += ` AND (u.full_name ILIKE $${params.length} OR u.line_display_name ILIKE $${params.length} OR u.email ILIKE $${params.length} OR u.phone ILIKE $${params.length})`;
    }

    query += ' GROUP BY u.id ORDER BY u.created_at DESC';

    if (limit) {
      params.push(parseNumber(limit, 100));
      query += ` LIMIT $${params.length}`;
    }

    if (offset) {
      params.push(parseNumber(offset, 0));
      query += ` OFFSET $${params.length}`;
    }

    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching customers:', err);
    res.status(500).json({ message: 'Error fetching customers' });
  }
});

// Customer detail
router.post('/detail', requireAdminAuth(['super_admin', 'branch_admin']), async (req, res) => {
  try {
    const { id } = req.body || {};
    if (!id) {
      return res.status(400).json({ message: 'customer id is required' });
    }

    const result = await db.query(
      `SELECT u.*,
              COUNT(DISTINCT o.id) as total_orders,
              COUNT(DISTINCT ce.id) as total_enrollments,
              SUM(CASE WHEN o.status = 'completed' THEN o.total_price_cents ELSE 0 END) as total_spent_cents
       FROM users u
       LEFT JOIN orders o ON u.id = o.user_id
       LEFT JOIN course_enrollments ce ON u.id = ce.user_id
       WHERE u.id = $1
       GROUP BY u.id`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching customer:', err);
    res.status(500).json({ message: 'Error fetching customer' });
  }
});

// Orders for customer
router.post('/orders', requireAdminAuth(['super_admin', 'branch_admin']), async (req, res) => {
  try {
    const { id } = req.body || {};
    if (!id) {
      return res.status(400).json({ message: 'customer id is required' });
    }

    const result = await db.query(
      `SELECT o.*,
              c.title as course_title,
              c.cover_image_url as course_image,
              p.status as payment_status,
              p.omise_charge_id
       FROM orders o
       LEFT JOIN courses c ON o.course_id = c.id
       LEFT JOIN payments p ON o.id = p.order_id
       WHERE o.user_id = $1
       ORDER BY o.created_at DESC`,
      [id]
    );

    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching customer orders:', err);
    res.status(500).json({ message: 'Error fetching customer orders' });
  }
});

// Enrollments for customer
router.post('/enrollments', requireAdminAuth(['super_admin', 'branch_admin']), async (req, res) => {
  try {
    const { id } = req.body || {};
    if (!id) {
      return res.status(400).json({ message: 'customer id is required' });
    }

    const result = await db.query(
      `SELECT ce.*,
              c.title as course_title,
              c.cover_image_url as course_image,
              c.access_times as course_access_times,
              cs.session_name,
              cs.start_date,
              cs.start_time,
              b.name as branch_name,
              i.name as instructor_name
       FROM course_enrollments ce
       LEFT JOIN courses c ON ce.course_id = c.id
       LEFT JOIN course_sessions cs ON ce.session_id = cs.id
       LEFT JOIN branches b ON c.branch_id = b.id
       LEFT JOIN instructors i ON c.instructor_id = i.id
       WHERE ce.user_id = $1
       ORDER BY ce.enrolled_at DESC`,
      [id]
    );

    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching customer enrollments:', err);
    res.status(500).json({ message: 'Error fetching customer enrollments' });
  }
});

// Update customer info
router.post('/update', requireAdminAuth(['super_admin', 'branch_admin']), async (req, res) => {
  try {
    const { id, full_name, email, phone } = req.body || {};
    if (!id) {
      return res.status(400).json({ message: 'customer id is required' });
    }

    const result = await db.query(
      `UPDATE users
       SET full_name = COALESCE($1, full_name),
           email = COALESCE($2, email),
           phone = COALESCE($3, phone)
       WHERE id = $4
       RETURNING *`,
      [full_name, email, phone, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating customer:', err);
    res.status(500).json({ message: 'Error updating customer' });
  }
});

// List orders (all customers)
router.post('/orders/list', requireAdminAuth(['super_admin', 'branch_admin']), async (req, res) => {
  try {
    const { status, limit = 100, offset = 0 } = req.body || {};

    let query = `
      SELECT o.*,
             u.full_name as customer_name,
             u.email as customer_email,
             c.title as course_title,
             p.status as payment_status,
             p.omise_charge_id
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      LEFT JOIN courses c ON o.course_id = c.id
      LEFT JOIN payments p ON o.id = p.order_id
      WHERE 1=1
    `;
    const params = [];

    if (status) {
      params.push(status);
      query += ` AND o.status = $${params.length}`;
    }

    query += ' ORDER BY o.created_at DESC';

    if (limit) {
      params.push(parseNumber(limit, 100));
      query += ` LIMIT $${params.length}`;
    }

    if (offset) {
      params.push(parseNumber(offset, 0));
      query += ` OFFSET $${params.length}`;
    }

    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching orders:', err);
    res.status(500).json({ message: 'Error fetching orders' });
  }
});

// Order detail
router.post('/orders/detail', requireAdminAuth(['super_admin', 'branch_admin']), async (req, res) => {
  try {
    const { order_id } = req.body || {};
    if (!order_id) {
      return res.status(400).json({ message: 'order_id is required' });
    }

    const result = await db.query(
      `SELECT o.*,
              u.full_name as customer_name,
              u.email as customer_email,
              u.phone as customer_phone,
              c.title as course_title,
              c.description as course_description,
              p.status as payment_status,
              p.omise_charge_id,
              p.raw_payload as payment_details
       FROM orders o
       LEFT JOIN users u ON o.user_id = u.id
       LEFT JOIN courses c ON o.course_id = c.id
       LEFT JOIN payments p ON o.id = p.order_id
       WHERE o.id = $1`,
      [order_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching order:', err);
    res.status(500).json({ message: 'Error fetching order' });
  }
});

// Update order status
router.post('/orders/update-status', requireAdminAuth(['super_admin', 'branch_admin']), async (req, res) => {
  try {
    const { order_id, status } = req.body || {};
    if (!order_id || !status) {
      return res.status(400).json({ message: 'order_id and status are required' });
    }

    const validStatuses = ['pending', 'completed', 'cancelled', 'refunded'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status value' });
    }

    const result = await db.query(
      `UPDATE orders
       SET status = $1
       WHERE id = $2
       RETURNING *`,
      [status, order_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating order status:', err);
    res.status(500).json({ message: 'Error updating order status' });
  }
});

// List payments
router.post('/payments/list', requireAdminAuth(['super_admin', 'branch_admin']), async (req, res) => {
  try {
    const { status, limit = 100, offset = 0 } = req.body || {};

    let query = `
      SELECT p.*,
             o.id as order_id,
             o.status as order_status,
             u.full_name as customer_name,
             u.email as customer_email,
             c.title as course_title
      FROM payments p
      LEFT JOIN orders o ON p.order_id = o.id
      LEFT JOIN users u ON o.user_id = u.id
      LEFT JOIN courses c ON o.course_id = c.id
      WHERE 1=1
    `;
    const params = [];

    if (status) {
      params.push(status);
      query += ` AND p.status = $${params.length}`;
    }

    query += ' ORDER BY p.created_at DESC';

    if (limit) {
      params.push(parseNumber(limit, 100));
      query += ` LIMIT $${params.length}`;
    }

    if (offset) {
      params.push(parseNumber(offset, 0));
      query += ` OFFSET $${params.length}`;
    }

    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching payments:', err);
    res.status(500).json({ message: 'Error fetching payments' });
  }
});

module.exports = router;
