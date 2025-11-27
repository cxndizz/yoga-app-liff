const express = require('express');
const db = require('../db');
const { requireAdminAuth } = require('../middleware/adminAuth');

const router = express.Router();

const RESOURCE_CONFIG = {
  orders: {
    label: 'orders',
    delete: async (client, ids) => {
      const placeholders = ids.map((_, idx) => `$${idx + 1}`).join(',');

      const paymentResult = await client.query(
        `DELETE FROM payments WHERE order_id IN (${placeholders})`,
        ids,
      );

      const enrollmentResult = await client.query(
        `DELETE FROM course_enrollments WHERE order_id IN (${placeholders})`,
        ids,
      );

      const orderResult = await client.query(
        `DELETE FROM orders WHERE id IN (${placeholders})`,
        ids,
      );

      return {
        payments: paymentResult.rowCount,
        enrollments: enrollmentResult.rowCount,
        orders: orderResult.rowCount,
      };
    },
    confirmMessage: 'จะลบออเดอร์พร้อมการชำระเงินและข้อมูลการลงทะเบียนที่ผูกไว้',
  },
  payments: {
    label: 'payments',
    delete: async (client, ids) => {
      const placeholders = ids.map((_, idx) => `$${idx + 1}`).join(',');
      const result = await client.query(
        `DELETE FROM payments WHERE id IN (${placeholders})`,
        ids,
      );
      return { payments: result.rowCount };
    },
    confirmMessage: 'จะลบเฉพาะข้อมูลการชำระเงิน (ไม่กระทบออเดอร์)',
  },
  enrollments: {
    label: 'course_enrollments',
    delete: async (client, ids) => {
      const placeholders = ids.map((_, idx) => `$${idx + 1}`).join(',');
      const result = await client.query(
        `DELETE FROM course_enrollments WHERE id IN (${placeholders})`,
        ids,
      );
      return { enrollments: result.rowCount };
    },
    confirmMessage: 'จะลบเฉพาะข้อมูลการลงทะเบียนเรียน',
  },
};

router.post('/delete-records', requireAdminAuth(['super_admin']), async (req, res) => {
  const { resource, ids } = req.body || {};

  if (!resource || !RESOURCE_CONFIG[resource]) {
    return res.status(400).json({ message: 'resource is required and must be one of orders, payments, enrollments' });
  }

  const normalizedIds = (Array.isArray(ids) ? ids : [])
    .map((id) => Number(id))
    .filter((id) => Number.isInteger(id) && id > 0);

  if (normalizedIds.length === 0) {
    return res.status(400).json({ message: 'ids is required and must contain at least one numeric id' });
  }

  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');
    const removalResult = await RESOURCE_CONFIG[resource].delete(client, normalizedIds);
    await client.query('COMMIT');

    res.json({
      message: `Deleted ${normalizedIds.length} record(s) from ${RESOURCE_CONFIG[resource].label}`,
      removed: removalResult,
      processedIds: normalizedIds,
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error deleting records for resource', resource, err);
    res.status(500).json({ message: 'Failed to delete records', detail: err.message });
  } finally {
    client.release();
  }
});

module.exports = router;
