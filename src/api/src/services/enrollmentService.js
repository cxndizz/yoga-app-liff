const db = require('../db');

/**
 * Ensure an enrollment exists for a paid/confirmed order.
 * This is idempotent – if an enrollment already exists for the order
 * (or for the same user/course) it will simply return the existing record.
 *
 * @param {number} orderId
 * @returns {Promise<{created: boolean, enrollment: object|null, reason?: string}>}
 */
const ensureEnrollmentForOrder = async (orderId) => {
  if (!orderId) return { created: false, enrollment: null, reason: 'missing_order_id' };

  const orderResult = await db.query(
    `SELECT o.id, o.user_id, o.course_id, c.access_times AS course_access_times
     FROM orders o
     JOIN courses c ON o.course_id = c.id
     WHERE o.id = $1`,
    [orderId]
  );

  const order = orderResult.rows[0];
  if (!order) return { created: false, enrollment: null, reason: 'order_not_found' };

  const existingResult = await db.query(
    `SELECT *
     FROM course_enrollments
     WHERE order_id = $1
        OR (user_id = $2 AND course_id = $3 AND status != 'cancelled')
     ORDER BY enrolled_at DESC
     LIMIT 1`,
    [order.id, order.user_id, order.course_id]
  );

  const existingEnrollment = existingResult.rows[0];
  if (existingEnrollment) {
    return { created: false, enrollment: existingEnrollment, reason: 'already_exists' };
  }

  const accessValue = Number(order.course_access_times);
  const resolvedAccess = Number.isFinite(accessValue) ? accessValue : null;

  const insertResult = await db.query(
    `INSERT INTO course_enrollments (user_id, course_id, order_id, status, remaining_access)
     VALUES ($1, $2, $3, 'active', $4)
     RETURNING *`,
    [order.user_id, order.course_id, order.id, resolvedAccess]
  );

  return { created: true, enrollment: insertResult.rows[0] };
};

module.exports = {
  ensureEnrollmentForOrder,
};
