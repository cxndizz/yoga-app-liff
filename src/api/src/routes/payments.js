const express = require('express');
const router = express.Router();
const db = require('../db');
const moneyspace = require('../services/moneyspace');

const parseInteger = (value) => {
  const parsed = parseInt(value, 10);
  return Number.isNaN(parsed) ? 0 : parsed;
};

router.post('/moneyspace/create', async (req, res) => {
  try {
    const {
      user_id,
      course_id,
      payment_method = 'card',
      firstname,
      lastname,
      email,
      phone,
      note,
      success_url,
      fail_url,
      cancel_url,
    } = req.body || {};

    if (!user_id || !course_id) {
      return res.status(400).json({ message: 'user_id and course_id are required' });
    }

    const userResult = await db.query('SELECT * FROM users WHERE id = $1', [user_id]);
    const courseResult = await db.query(
      `SELECT c.*, b.name as branch_name
       FROM courses c
       LEFT JOIN branches b ON c.branch_id = b.id
       WHERE c.id = $1`,
      [course_id]
    );

    const user = userResult.rows[0];
    const course = courseResult.rows[0];

    if (!user) return res.status(404).json({ message: 'User not found' });
    if (!course) return res.status(404).json({ message: 'Course not found' });

    const priceCents = course.is_free ? 0 : parseInteger(course.price_cents);
    const amount = priceCents / 100;

    const existingOrder = await db.query(
      `SELECT * FROM orders
       WHERE user_id = $1 AND course_id = $2 AND status IN ('pending', 'processing')
       ORDER BY created_at DESC
       LIMIT 1`,
      [user_id, course_id]
    );

    let order = existingOrder.rows[0];

    if (!order) {
      const insert = await db.query(
        `INSERT INTO orders (user_id, course_id, status, total_price_cents)
         VALUES ($1, $2, 'pending', $3)
         RETURNING *`,
        [user_id, course_id, priceCents]
      );
      order = insert.rows[0];
    }

    if (priceCents <= 0) {
      await db.query(
        `UPDATE orders SET status = 'completed', updated_at = NOW() WHERE id = $1 RETURNING *`,
        [order.id]
      );
      await moneyspace.recordPaymentStatus({
        orderId: order.id,
        status: 'completed',
        transactionId: 'FREE-ORDER',
        payload: { note: 'Free course, payment bypassed' },
      });
      return res.json({ order, payment: { free: true, redirectUrl: null } });
    }

    const orderCode = String(order.id);
    const payment = await moneyspace.createTransaction({
      orderCode,
      amount,
      customer: {
        firstName: firstname || user.full_name || '',
        lastName: lastname || '',
        email: email || user.email || '',
        phone: phone || user.phone || '',
        message: note,
      },
      description: course.title,
      paymentMethod: payment_method,
      returnUrls: { success: success_url, fail: fail_url, cancel: cancel_url },
      branch: course.branch_name || course.channel || 'Yoga Luxe',
      references: { ref1: String(order.id), ref2: String(user_id), ref3: String(course_id) },
    });

    await moneyspace.recordPaymentStatus({
      orderId: order.id,
      status: 'pending',
      transactionId: payment.transactionId,
      payload: payment.raw,
    });

    res.json({
      order,
      payment: {
        transactionId: payment.transactionId,
        redirectUrl: payment.redirectUrl,
        paymentType: payment.paymentType,
      },
    });
  } catch (err) {
    console.error('Error creating Money Space payment', err);
    res.status(500).json({ message: 'Error creating Money Space payment' });
  }
});

module.exports = router;
