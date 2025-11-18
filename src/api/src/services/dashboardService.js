const db = require('../db');

const toNumber = (value) => Number(value) || 0;

const getKpis = async () => {
  const [
    totalSalesRes,
    salesTodayRes,
    salesThisMonthRes,
    totalOrdersRes,
    paidTodayRes,
    totalMembersRes,
    newMembersRes,
    newMembersTodayRes,
    totalCoursesRes,
    totalEnrollmentsRes,
    avgOrderValueRes
  ] = await Promise.all([
    // Total sales all time
    db.query(
      `SELECT COALESCE(SUM(amount_cents), 0) AS total_sales_cents
       FROM payments
       WHERE status IN ('successful', 'paid')`
    ),
    // Sales today
    db.query(
      `SELECT COALESCE(SUM(o.total_price_cents), 0) AS sales_today_cents
       FROM orders o
       WHERE o.status IN ('completed', 'paid')
         AND o.created_at >= date_trunc('day', NOW())`
    ),
    // Sales this month
    db.query(
      `SELECT COALESCE(SUM(o.total_price_cents), 0) AS sales_month_cents
       FROM orders o
       WHERE o.status IN ('completed', 'paid')
         AND o.created_at >= date_trunc('month', NOW())`
    ),
    // Total orders
    db.query('SELECT COUNT(*) AS total_orders FROM orders'),
    // Orders today
    db.query(
      `SELECT COUNT(*) AS paid_orders_today
       FROM orders
       WHERE status IN ('completed', 'paid')
         AND created_at >= date_trunc('day', NOW())`
    ),
    // Total members
    db.query('SELECT COUNT(*) AS total_members FROM users'),
    // New members last 30 days
    db.query(
      `SELECT COUNT(*) AS new_members_30d
       FROM users
       WHERE created_at >= NOW() - INTERVAL '30 days'`
    ),
    // New members today
    db.query(
      `SELECT COUNT(*) AS new_members_today
       FROM users
       WHERE created_at >= date_trunc('day', NOW())`
    ),
    // Total courses
    db.query('SELECT COUNT(*) AS total_courses FROM courses WHERE status = \'published\''),
    // Total enrollments
    db.query('SELECT COUNT(*) AS total_enrollments FROM course_enrollments WHERE status = \'active\''),
    // Average order value
    db.query(
      `SELECT COALESCE(AVG(total_price_cents), 0) AS average_order_value_cents
       FROM orders
       WHERE status IN ('completed', 'paid')`
    ),
  ]);

  return {
    totalSalesCents: toNumber(totalSalesRes.rows[0]?.total_sales_cents),
    salesTodayCents: toNumber(salesTodayRes.rows[0]?.sales_today_cents),
    salesThisMonthCents: toNumber(salesThisMonthRes.rows[0]?.sales_month_cents),
    totalOrders: toNumber(totalOrdersRes.rows[0]?.total_orders),
    paidOrdersToday: toNumber(paidTodayRes.rows[0]?.paid_orders_today),
    totalMembers: toNumber(totalMembersRes.rows[0]?.total_members),
    newMembers30d: toNumber(newMembersRes.rows[0]?.new_members_30d),
    newMembersToday: toNumber(newMembersTodayRes.rows[0]?.new_members_today),
    totalCourses: toNumber(totalCoursesRes.rows[0]?.total_courses),
    totalEnrollments: toNumber(totalEnrollmentsRes.rows[0]?.total_enrollments),
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

const getCoursesCapacity = async () => {
  const result = await db.query(
    `SELECT c.id,
            c.title,
            c.capacity,
            COALESCE(COUNT(ce.id), 0) AS current_enrollments,
            c.capacity - COALESCE(COUNT(ce.id), 0) AS available_spots,
            CASE
              WHEN c.capacity > 0 THEN
                ROUND((COALESCE(COUNT(ce.id), 0)::numeric / c.capacity::numeric) * 100, 2)
              ELSE 0
            END AS capacity_percentage,
            b.name AS branch_name,
            i.name AS instructor_name
     FROM courses c
     LEFT JOIN course_enrollments ce ON c.id = ce.course_id AND ce.status = 'active'
     LEFT JOIN branches b ON c.branch_id = b.id
     LEFT JOIN instructors i ON c.instructor_id = i.id
     WHERE c.status = 'published' AND c.capacity > 0
     GROUP BY c.id, c.title, c.capacity, b.name, i.name
     HAVING c.capacity - COALESCE(COUNT(ce.id), 0) <= 5 OR COALESCE(COUNT(ce.id), 0) >= c.capacity
     ORDER BY capacity_percentage DESC, current_enrollments DESC
     LIMIT 10`
  );

  return result.rows.map((row) => ({
    courseId: row.id,
    title: row.title,
    capacity: toNumber(row.capacity),
    currentEnrollments: toNumber(row.current_enrollments),
    availableSpots: toNumber(row.available_spots),
    capacityPercentage: toNumber(row.capacity_percentage),
    branchName: row.branch_name,
    instructorName: row.instructor_name,
    isFull: toNumber(row.available_spots) <= 0,
    isNearlyFull: toNumber(row.available_spots) > 0 && toNumber(row.available_spots) <= 5,
  }));
};

const getUpcomingSessions = async (limit = 10) => {
  const result = await db.query(
    `SELECT cs.id,
            cs.session_name,
            cs.start_date,
            cs.start_time,
            cs.end_time,
            cs.max_capacity,
            cs.current_enrollments,
            cs.max_capacity - cs.current_enrollments AS available_spots,
            c.title AS course_title,
            b.name AS branch_name,
            i.name AS instructor_name
     FROM course_sessions cs
     LEFT JOIN courses c ON cs.course_id = c.id
     LEFT JOIN branches b ON c.branch_id = b.id
     LEFT JOIN instructors i ON c.instructor_id = i.id
     WHERE cs.status = 'open'
       AND cs.start_date >= CURRENT_DATE
     ORDER BY cs.start_date ASC, cs.start_time ASC
     LIMIT $1`,
    [limit]
  );

  return result.rows.map((row) => ({
    sessionId: row.id,
    sessionName: row.session_name,
    startDate: row.start_date,
    startTime: row.start_time,
    endTime: row.end_time,
    maxCapacity: toNumber(row.max_capacity),
    currentEnrollments: toNumber(row.current_enrollments),
    availableSpots: toNumber(row.available_spots),
    courseTitle: row.course_title,
    branchName: row.branch_name,
    instructorName: row.instructor_name,
  }));
};

const getCharts = async () => {
  const [ordersByDay, newMembersByDay, topCourses, coursesCapacity, upcomingSessions] = await Promise.all([
    getOrdersTrend(7),
    getNewMembersTrend(7),
    getTopCourses(5),
    getCoursesCapacity(),
    getUpcomingSessions(10),
  ]);

  return { ordersByDay, newMembersByDay, topCourses, coursesCapacity, upcomingSessions };
};

module.exports = {
  getKpis,
  getCharts,
  getCoursesCapacity,
  getUpcomingSessions,
};
