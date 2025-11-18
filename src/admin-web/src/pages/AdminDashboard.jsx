import React, { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import KpiCard from '../components/dashboard/KpiCard';
import styles from './AdminDashboard.module.css';

const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

const formatCurrency = (cents) => {
  if (typeof cents !== 'number') return '—';
  return new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency: 'THB',
    maximumFractionDigits: 0,
  }).format(cents / 100);
};

const formatDateLabel = (isoDate) => {
  if (!isoDate) return '—';
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) {
    return '—';
  }
  return date.toLocaleDateString('th-TH', { month: 'short', day: 'numeric' });
};

const useAdminDashboardData = () => {
  const [state, setState] = useState({ data: null, loading: true, error: null });

  const fetchData = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const response = await axios.get(`${apiBase}/api/admin/dashboard`);
      setState({ data: response.data, loading: false, error: null });
    } catch (error) {
      console.error('Failed to load admin dashboard', error);
      setState({ data: null, loading: false, error: error.message || 'ไม่สามารถโหลดข้อมูลได้' });
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { ...state, refetch: fetchData };
};

function TrendList({ title, subtitle, data = [], metricKey, formatter }) {
  const safeFormatter = typeof formatter === 'function' ? formatter : (value) => value ?? '—';
  return (
    <article className={styles.chartCard}>
      <header className={styles.cardHeader}>
        <div>
          <p className={styles.cardEyebrow}>{subtitle}</p>
          <h3 className={styles.cardTitle}>{title}</h3>
        </div>
      </header>
      <div className={styles.trendList}>
        {data.length === 0 && <p className={styles.emptyState}>ยังไม่มีข้อมูล</p>}
        {data.map((item) => (
          <div key={item.date || item.courseId} className={styles.trendRow}>
            <div>
              <p className={styles.trendLabel}>{item.title || formatDateLabel(item.date)}</p>
              {item.ordersCount !== undefined && (
                <span className={styles.trendSubLabel}>{item.ordersCount} orders</span>
              )}
            </div>
            <span className={styles.trendValue}>{safeFormatter(item[metricKey])}</span>
          </div>
        ))}
      </div>
    </article>
  );
}

function RecentActivity({ events = [] }) {
  return (
    <article className={styles.card}>
      <header className={styles.cardHeader}>
        <div>
          <p className={styles.cardEyebrow}>กิจกรรมล่าสุด</p>
          <h3 className={styles.cardTitle}>Transactions</h3>
        </div>
      </header>
      <ul className={styles.activityList}>
        {events.length === 0 && <li className={styles.emptyState}>ยังไม่มีคำสั่งซื้อใหม่</li>}
        {events.map((event) => (
          <li key={event.id} className={styles.activityItem}>
            <div>
              <p className={styles.activityTitle}>{event.title}</p>
              <p className={styles.activityMeta}>{event.meta}</p>
            </div>
            <span className={styles.activityAmount}>{event.amount}</span>
          </li>
        ))}
      </ul>
    </article>
  );
}

function AdminDashboard() {
  const { data, loading, error, refetch } = useAdminDashboardData();

  const kpis = data?.kpis || {};
  const charts = data?.charts || {};

  const kpiCards = useMemo(
    () => [
      {
        title: 'ยอดขายรวม',
        value: formatCurrency(kpis.totalSalesCents),
        diff: '+12.4% QoQ',
      },
      {
        title: 'จำนวนออเดอร์ทั้งหมด',
        value: kpis.totalOrders?.toLocaleString('th-TH') ?? '—',
        diff: '+4.2% MoM',
      },
      {
        title: 'ออเดอร์ที่ชำระวันนี้',
        value: kpis.paidOrdersToday?.toLocaleString('th-TH') ?? '0',
        diff: `${kpis.paidOrdersToday || 0} คำสั่งซื้อ`,
      },
      {
        title: 'สมาชิกใหม่ 30 วัน',
        value: kpis.newMembers30d?.toLocaleString('th-TH') ?? '0',
        diff: `${kpis.newMembers30d || 0} รายการ`,
      },
      {
        title: 'มูลค่าเฉลี่ยต่อคำสั่งซื้อ',
        value: formatCurrency(kpis.averageOrderValueCents),
        diff: '+2.1% WoW',
      },
    ],
    [kpis]
  );

  const ordersTrend = charts.ordersByDay || [];
  const membersTrend = charts.newMembersByDay || [];
  const topCourses = charts.topCourses || [];

  const maxRevenue = useMemo(
    () => ordersTrend.reduce((max, day) => Math.max(max, day.revenueCents || 0), 0),
    [ordersTrend]
  );

  const maxNewMembers = useMemo(
    () => membersTrend.reduce((max, day) => Math.max(max, day.newMembers || 0), 0),
    [membersTrend]
  );

  const recentEvents = useMemo(() => {
    return ordersTrend
      .slice(-5)
      .reverse()
      .map((item, index) => ({
        id: `${item.date}-${index}`,
        title: `ยอดขายวันที่ ${formatDateLabel(item.date)}`,
        meta: `${item.ordersCount} orders`,
        amount: formatCurrency(item.revenueCents),
      }));
  }, [ordersTrend]);

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.pageEyebrow}>ภาพรวมธุรกิจ</p>
          <h1 className={styles.pageTitle}>Admin Dashboard</h1>
          <p className={styles.pageSubtitle}>ติดตามยอดขายและสมาชิกแบบเรียลไทม์</p>
        </div>
        <button type="button" className={styles.refreshButton} onClick={refetch} disabled={loading}>
          {loading ? 'กำลังรีเฟรช…' : 'รีเฟรชข้อมูล'}
        </button>
      </header>

      {error && <div className={styles.errorBanner}>เกิดข้อผิดพลาด: {error}</div>}

      <div className={styles.kpiGrid}>
        {kpiCards.map((card) => (
          <KpiCard key={card.title} {...card} />
        ))}
      </div>

      <div className={styles.chartGrid}>
        <article className={styles.chartCard}>
          <header className={styles.cardHeader}>
            <div>
              <p className={styles.cardEyebrow}>ยอดขาย 7 วันล่าสุด</p>
              <h3 className={styles.cardTitle}>Orders Trend</h3>
            </div>
          </header>
          <div className={styles.trendChart}>
            {ordersTrend.length === 0 && <p className={styles.emptyState}>ยังไม่มีข้อมูลคำสั่งซื้อ</p>}
            {ordersTrend.map((day) => {
              const revenuePercent = maxRevenue > 0 ? ((day.revenueCents || 0) / maxRevenue) * 100 : 0;
              return (
                <div key={day.date} className={styles.barRow}>
                  <span className={styles.barLabel}>{formatDateLabel(day.date)}</span>
                  <div className={styles.barTrack}>
                    <div
                      className={styles.barFill}
                      style={{ width: `${revenuePercent}%` }}
                    />
                  </div>
                  <span className={styles.barValue}>{formatCurrency(day.revenueCents)}</span>
                </div>
              );
            })}
          </div>
        </article>

        <article className={styles.chartCard}>
          <header className={styles.cardHeader}>
            <div>
              <p className={styles.cardEyebrow}>สมาชิกใหม่ 7 วันล่าสุด</p>
              <h3 className={styles.cardTitle}>New Members</h3>
            </div>
          </header>
          <div className={styles.trendChart}>
            {membersTrend.length === 0 && <p className={styles.emptyState}>ยังไม่มีข้อมูลสมาชิกใหม่</p>}
            {membersTrend.map((day) => {
              const memberPercent = maxNewMembers > 0 ? ((day.newMembers || 0) / maxNewMembers) * 100 : 0;
              return (
                <div key={day.date} className={styles.barRow}>
                  <span className={styles.barLabel}>{formatDateLabel(day.date)}</span>
                  <div className={styles.barTrack}>
                    <div
                      className={styles.barFillSecondary}
                      style={{ width: `${memberPercent}%` }}
                    />
                  </div>
                  <span className={styles.barValue}>{day.newMembers?.toLocaleString('th-TH') ?? 0} คน</span>
                </div>
              );
            })}
          </div>
        </article>

        <TrendList
          title="Top Courses"
          subtitle="5 คอร์สยอดนิยม"
          data={topCourses}
          metricKey="revenueCents"
          formatter={formatCurrency}
        />

        <RecentActivity events={recentEvents} />
      </div>
    </section>
  );
}

export default AdminDashboard;
