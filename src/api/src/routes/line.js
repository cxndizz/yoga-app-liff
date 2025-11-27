const express = require('express');
const router = express.Router();
const db = require('../db');
const { pushMessage, formatDateForThai } = require('../services/lineMessaging');

const normalizeStatus = (value) => String(value || '').trim().toLowerCase();

const isActiveEnrollment = (row) => {
  const status = normalizeStatus(row.status);
  const remaining = row.remaining_access;
  const hasRemaining = remaining === null || Number(remaining) > 0;
  const expired = row.expires_at ? new Date(row.expires_at).getTime() <= Date.now() : false;
  return !expired && !['cancelled', 'canceled', 'expired'].includes(status) && hasRemaining;
};

const formatRemaining = (row) => {
  if (row.remaining_access === null) return 'ไม่จำกัด';
  if (row.remaining_access === undefined) return '-';
  return `${row.remaining_access} ครั้ง`;
};

const formatExpiry = (row) => {
  if (row.expires_at) return formatDateForThai(row.expires_at);
  if (row.first_attended_at) return 'ยังไม่คำนวณวันหมดอายุ';
  return 'รอการเข้าใช้ครั้งแรก';
};

async function fetchMemberships(lineUserId) {
  const userResult = await db.query(
    'SELECT id, full_name, line_display_name FROM users WHERE line_user_id = $1 LIMIT 1',
    [lineUserId]
  );
  const user = userResult.rows[0];
  if (!user) return { user: null, memberships: [] };

  const enrollments = await db.query(
    `SELECT ce.id, ce.status, ce.remaining_access, ce.expires_at, ce.first_attended_at, ce.enrolled_at,
            c.title, c.access_times
     FROM course_enrollments ce
     JOIN courses c ON ce.course_id = c.id
     WHERE ce.user_id = $1
     ORDER BY ce.enrolled_at DESC
     LIMIT 50`,
    [user.id]
  );

  const memberships = enrollments.rows.filter(isActiveEnrollment);
  return { user, memberships };
}

async function handleMembershipPostback(userId) {
  if (!userId) return { skipped: true, reason: 'missing user id' };

  try {
    const { user, memberships } = await fetchMemberships(userId);

    if (!user) {
      await pushMessage(userId, {
        type: 'text',
        text: 'ไม่พบบัญชีสมาชิกจาก LINE นี้ กรุณาลงทะเบียน/เข้าสู่ระบบใน LIFF ก่อนนะครับ',
      });
      return { success: true, reason: 'user-not-found' };
    }

    if (!memberships.length) {
      await pushMessage(userId, {
        type: 'text',
        text: 'ยังไม่พบคอร์สที่ใช้งานอยู่ในบัญชีของคุณ หากเพิ่งชำระเงินโปรดรอสักครู่หรือติดต่อแอดมิน',
      });
      return { success: true, reason: 'no-active-memberships' };
    }

    const header = `สวัสดี ${user.full_name || user.line_display_name || ''}\nสรุปคอร์ส/สิทธิ์ที่ใช้งานอยู่:`;
    const lines = memberships.map((row) => {
      const remaining = formatRemaining(row);
      const expiry = formatExpiry(row);
      return `• ${row.title} / เหลือ ${remaining} / หมดอายุ: ${expiry}`;
    });

    await pushMessage(userId, { type: 'text', text: `${header}\n${lines.join('\n')}`.trim() });
    return { success: true, reason: 'sent' };
  } catch (err) {
    console.error('[line:webhook] Failed to handle membership postback', err);
    return { success: false, error: err.message };
  }
}

router.post('/webhook', async (req, res) => {
  const events = req.body?.events || [];
  const results = [];

  for (const event of events) {
    if (event.type === 'postback' && event.postback?.data === 'CHECK_MEMBERSHIP') {
      const userId = event.source?.userId;
      const result = await handleMembershipPostback(userId);
      results.push({ type: 'membership', userId, ...result });
    }
  }

  res.json({ received: true, handled: results });
});

module.exports = router;
