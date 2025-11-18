const express = require('express');
const router = express.Router();
const db = require('../db');
const { requireAdminAuth } = require('../middleware/adminAuth');

// Get all customers/users
router.get('/', requireAdminAuth(['super_admin', 'branch_admin']), async (req, res) => {
  try {
    const { search, limit = 100, offset = 0 } = req.query;

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
      query += ` AND (u.full_name ILIKE $${params.length} OR u.email ILIKE $${params.length} OR u.phone ILIKE $${params.length})`;
    }

    query += ' GROUP BY u.id ORDER BY u.created_at DESC';

    if (limit) {
      params.push(parseInt(limit));
      query += ` LIMIT $${params.length}`;
    }

    if (offset) {
      params.push(parseInt(offset));
      query += ` OFFSET $${params.length}`;
    }

    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching customers:', err);
    res.status(500).json({ message: 'Error fetching customers' });
  }
});

// Get single customer by ID
router.get('/:id', requireAdminAuth(['super_admin', 'branch_admin']), async (req, res) => {
  try {
    const { id } = req.params;
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

// Get customer orders
router.get('/:id/orders', requireAdminAuth(['super_admin', 'branch_admin']), async (req, res) => {
  try {
    const { id } = req.params;

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

// Get customer enrollments
router.get('/:id/enrollments', requireAdminAuth(['super_admin', 'branch_admin']), async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.query(
      `SELECT ce.*,
              c.title as course_title,
              c.cover_image_url as course_image,
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
router.put('/:id', requireAdminAuth(['super_admin', 'branch_admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const { full_name, email, phone } = req.body;

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

// Get all orders
router.get('/orders/all', requireAdminAuth(['super_admin', 'branch_admin']), async (req, res) => {
  try {
    const { status, limit = 100, offset = 0 } = req.query;

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
      params.push(parseInt(limit));
      query += ` LIMIT $${params.length}`;
    }

    if (offset) {
      params.push(parseInt(offset));
      query += ` OFFSET $${params.length}`;
    }

    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching orders:', err);
    res.status(500).json({ message: 'Error fetching orders' });
  }
});

// Get single order
router.get('/orders/:orderId', requireAdminAuth(['super_admin', 'branch_admin']), async (req, res) => {
  try {
    const { orderId } = req.params;

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
      [orderId]
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
router.put('/orders/:orderId/status', requireAdminAuth(['super_admin', 'branch_admin']), async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ message: 'Status is required' });
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
      [status, orderId]
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

// Get all payments
router.get('/payments/all', requireAdminAuth(['super_admin', 'branch_admin']), async (req, res) => {
  try {
    const { status, limit = 100, offset = 0 } = req.query;

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
      params.push(parseInt(limit));
      query += ` LIMIT $${params.length}`;
    }

    if (offset) {
      params.push(parseInt(offset));
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
