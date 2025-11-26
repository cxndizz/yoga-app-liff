const db = require('../db');

const COMPLETED_ORDER_STATUSES = ['completed', 'success', 'paid'];
const NON_ACTIVE_ENROLLMENT_STATUSES = ['expired', 'cancelled'];
const REUSABLE_ORDER_STATUSES = ['pending', 'processing'];

const findReusableOrder = async (userId, courseId) => {
  const existingOrder = await db.query(
    `SELECT * FROM orders
     WHERE user_id = $1 AND course_id = $2 AND status = ANY($3)
     ORDER BY created_at DESC
     LIMIT 1`,
    [userId, courseId, REUSABLE_ORDER_STATUSES]
  );

  return existingOrder.rows[0] || null;
};

const hasCompletedOrder = async (userId, courseId) => {
  const completed = await db.query(
    `SELECT id, status FROM orders
     WHERE user_id = $1 AND course_id = $2 AND status = ANY($3)
     ORDER BY created_at DESC
     LIMIT 1`,
    [userId, courseId, COMPLETED_ORDER_STATUSES]
  );
  return completed.rows[0] || null;
};

const hasValidEnrollment = async (userId, courseId) => {
  const enrollments = await db.query(
    `SELECT id, status, remaining_access
     FROM course_enrollments
     WHERE user_id = $1 AND course_id = $2
     ORDER BY enrolled_at DESC
     LIMIT 1`,
    [userId, courseId]
  );

  const enrollment = enrollments.rows[0];
  if (!enrollment) return null;

  const statusActive = !NON_ACTIVE_ENROLLMENT_STATUSES.includes(enrollment.status);
  const hasAccessLeft =
    enrollment.remaining_access === null || Number(enrollment.remaining_access) > 0;

  return statusActive || hasAccessLeft ? enrollment : null;
};

const assertPurchasable = async (userId, courseId) => {
  const enrollment = await hasValidEnrollment(userId, courseId);
  if (enrollment) {
    return {
      allowed: false,
      reason: 'already_enrolled',
      details: enrollment,
      message: 'You already own this course and still have access remaining.',
    };
  }

  const completedOrder = await hasCompletedOrder(userId, courseId);
  if (completedOrder) {
    return {
      allowed: false,
      reason: 'order_completed',
      details: completedOrder,
      message: 'This course has already been paid for and is still active.',
    };
  }

  return { allowed: true };
};

module.exports = {
  assertPurchasable,
  findReusableOrder,
  hasCompletedOrder,
};
