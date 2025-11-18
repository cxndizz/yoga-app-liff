const db = require('../db');

const toNumber = (value) => Number(value) || 0;

const getKpis = async () => {
  const [totalSalesRes, totalOrdersRes, paidTodayRes, newMembersRes, avgOrderValueRes] = await Promise.all([
    db.query(
      `SELECT COALESCE(SUM(amount_cents), 0) AS total_sales_cents
       FROM payments
       WHERE status = 'successful'`
    ),
    db.query('SELECT COUNT(*) AS total_orders FROM orders'),
    db.query(
      `SELECT COUNT(*) AS paid_orders_today
       FROM orders
       WHERE status = 'paid'
         AND created_at >= date_trunc('day', NOW())`
    ),
    db.query(
      `SELECT COUNT(*) AS new_members_30d
       FROM users
       WHERE created_at >= NOW() - INTERVAL '30 days'`
    ),
    db.query(
      `SELECT COALESCE(AVG(total_price_cents), 0) AS average_order_value_cents
       FROM orders
       WHERE status = 'paid'`
    ),
  ]);

  return {
    totalSalesCents: toNumber(totalSalesRes.rows[0]?.total_sales_cents),
    totalOrders: toNumber(totalOrdersRes.rows[0]?.total_orders),
    paidOrdersToday: toNumber(paidTodayRes.rows[0]?.paid_orders_today),
    newMembers30d: toNumber(newMembersRes.rows[0]?.new_members_30d),
    averageOrderValueCents: toNumber(avgOrderValueRes.rows[0]?.average_order_value_cents),
  };
};

const getTopCourses = async (limit = 5) => {
  const result = await db.query(
    `SELECT c.id,
            c.title,
            COALESCE(COUNT(o.id), 0) AS orders_count,
            COALESCE(SUM(o.total_price_cents), 0) AS revenue_cents
     FROM courses c
     LEFT JOIN orders o ON o.course_id = c.id AND o.status = 'paid'
     GROUP BY c.id, c.title
     ORDER BY orders_count DESC, revenue_cents DESC, c.created_at DESC
     LIMIT $1`,
    [limit]
  );

  return result.rows.map((row) => ({
    courseId: row.id,
    title: row.title,
    ordersCount: toNumber(row.orders_count),
    revenueCents: toNumber(row.revenue_cents),
  }));
};

const getOrdersTrend = async (days = 7) => {
  const safeDays = Math.max(Number(days) || 1, 1);
  const result = await db.query(
    `WITH series AS (
       SELECT generate_series(
         date_trunc('day', NOW()) - (($1::int - 1) * INTERVAL '1 day'),
         date_trunc('day', NOW()),
         INTERVAL '1 day'
       ) AS day
     )
     SELECT to_char(series.day, 'YYYY-MM-DD') AS date,
            COALESCE(SUM(o.total_price_cents), 0) AS revenue_cents,
            COUNT(o.id) AS orders_count
     FROM series
     LEFT JOIN orders o
            ON date_trunc('day', o.created_at) = series.day
           AND o.status = 'paid'
     GROUP BY series.day
     ORDER BY series.day`,
    [safeDays]
  );

  return result.rows.map((row) => ({
    date: row.date,
    revenueCents: toNumber(row.revenue_cents),
    ordersCount: toNumber(row.orders_count),
  }));
};

const getNewMembersTrend = async (days = 7) => {
  const safeDays = Math.max(Number(days) || 1, 1);
  const result = await db.query(
    `WITH series AS (
       SELECT generate_series(
         date_trunc('day', NOW()) - (($1::int - 1) * INTERVAL '1 day'),
         date_trunc('day', NOW()),
         INTERVAL '1 day'
       ) AS day
     )
     SELECT to_char(series.day, 'YYYY-MM-DD') AS date,
            COUNT(u.id) AS new_members
     FROM series
     LEFT JOIN users u
            ON date_trunc('day', u.created_at) = series.day
     GROUP BY series.day
     ORDER BY series.day`,
    [safeDays]
  );

  return result.rows.map((row) => ({
    date: row.date,
    newMembers: toNumber(row.new_members),
  }));
};

const getCharts = async () => {
  const [ordersByDay, newMembersByDay, topCourses] = await Promise.all([
    getOrdersTrend(7),
    getNewMembersTrend(7),
    getTopCourses(5),
  ]);

  return { ordersByDay, newMembersByDay, topCourses };
};

module.exports = {
  getKpis,
  getCharts,
};
