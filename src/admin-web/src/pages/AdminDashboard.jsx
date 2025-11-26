import React, { useEffect, useMemo, useState } from 'react';
import KpiCard from '../components/dashboard/KpiCard';
import TrendChart from '../components/dashboard/TrendChart';
import useDashboardData from '../hooks/useDashboardData';
import styles from './AdminDashboard.module.css';

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

const formatSessionDay = (dateStr) => {
  if (!dateStr) return '—';
  const date = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    return '—';
  }
  return date.toLocaleDateString('th-TH', { weekday: 'short', day: 'numeric', month: 'short' });
};

const formatSessionTimeRange = (startTime, endTime) => {
  if (!startTime && !endTime) {
    return 'ไม่ระบุเวลา';
  }
  const start = startTime ? startTime.slice(0, 5) : '';
  const end = endTime ? endTime.slice(0, 5) : '';
  if (start && end) {
    return `${start} - ${end} น.`;
  }
  return `${start || end} น.`;
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

function UpcomingSessionsCard({ sessions = [] }) {
  return (
    <article className={styles.card}>
      <header className={styles.cardHeader}>
        <div>
          <p className={styles.cardEyebrow}>รอบเรียนที่กำลังจะถึง</p>
          <h3 className={styles.cardTitle}>Upcoming Sessions</h3>
        </div>
      </header>
      <ul className={styles.sessionList}>
        {sessions.length === 0 && <li className={styles.emptyState}>ยังไม่มีคลาสที่จะถึง</li>}
        {sessions.map((session) => {
          const maxCapacity = session.maxCapacity || 0;
          const enrolled = session.currentEnrollments || 0;
          const rawAvailable = session.availableSpots ?? (maxCapacity ? maxCapacity - enrolled : 0);
          const available = Math.max(rawAvailable ?? 0, 0);
          const occupancyPercent = maxCapacity > 0
            ? Math.min(100, Math.round((enrolled / maxCapacity) * 100))
            : 0;
          return (
            <li key={session.sessionId} className={styles.sessionItem}>
              <div className={styles.sessionInfo}>
                <p className={styles.sessionTitle}>{session.courseTitle || 'ไม่ระบุคอร์ส'}</p>
                <p className={styles.sessionMeta}>
                  {session.sessionName || 'รอบเรียน'} · {session.branchName || 'ไม่ระบุสาขา'}
                </p>
                <p className={styles.sessionMeta}>
                  {formatSessionDay(session.startDate)} · {formatSessionTimeRange(session.startTime, session.endTime)}
                </p>
                <p className={styles.sessionMeta}>
                  ผู้สอน: {session.instructorName || 'รอจัดสรร'} · เหลือ {available} ที่นั่ง
                </p>
                <div className={styles.sessionCapacityRow}>
                  <div className={styles.sessionCapacityTrack}>
                    <div
                      className={styles.sessionCapacityFill}
                      style={{ width: `${occupancyPercent}%` }}
                    />
                  </div>
                  <span className={styles.sessionCapacityLabel}>
                    {enrolled}/{maxCapacity || '∞'} คน
                  </span>
                </div>
              </div>
              <span className={styles.sessionTimeTag}>{formatSessionDay(session.startDate)}</span>
            </li>
          );
        })}
      </ul>
    </article>
  );
}

function AdminDashboard() {
  const { data, loading, error, refresh, lastUpdated } = useDashboardData();
  const [trendRange, setTrendRange] = useState('weekly');
  const [toastMessage, setToastMessage] = useState(null);

  useEffect(() => {
    if (!error) {
      return;
    }
    setToastMessage(`โหลดข้อมูลไม่สำเร็จ: ${error}`);
  }, [error]);

  useEffect(() => {
    if (!toastMessage) {
      return undefined;
    }
    const timer = setTimeout(() => setToastMessage(null), 6000);
    return () => clearTimeout(timer);
  }, [toastMessage]);

  const kpis = data?.kpis || {};
  const charts = data?.charts || {};

  const lastUpdatedLabel = lastUpdated
    ? lastUpdated.toLocaleString('th-TH', {
        dateStyle: 'medium',
        timeStyle: 'short',
      })
    : 'ยังไม่เคยอัปเดต';

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
  const upcomingSessions = charts.upcomingSessions || [];

  const sortedOrdersTrend = useMemo(() => {
    return [...ordersTrend].sort((a, b) => {
      const dateA = new Date(a?.date || 0).getTime();
      const dateB = new Date(b?.date || 0).getTime();
      return dateA - dateB;
    });
  }, [ordersTrend]);

  const weeklyTrend = useMemo(() => {
    return sortedOrdersTrend
      .slice(-7)
      .map((item) => {
        const date = item?.date ? new Date(item.date) : null;
        if (!date || Number.isNaN(date.getTime())) {
          return null;
        }
        return {
          timestamp: date.getTime(),
          dateLabel: date.toLocaleDateString('th-TH', { month: 'short', day: 'numeric' }),
          revenue: (item.revenueCents || 0) / 100,
          orders: Number(item.ordersCount ?? item.orders ?? 0) || 0,
        };
      })
      .filter(Boolean);
  }, [sortedOrdersTrend]);

  const monthlyTrend = useMemo(() => {
    const bucket = new Map();
    sortedOrdersTrend.forEach((item) => {
      const date = item?.date ? new Date(item.date) : null;
      if (!date || Number.isNaN(date.getTime())) {
        return;
      }
      const key = `${date.getFullYear()}-${date.getMonth()}`;
      if (!bucket.has(key)) {
        bucket.set(key, {
          timestamp: new Date(date.getFullYear(), date.getMonth(), 1).getTime(),
          dateLabel: date.toLocaleDateString('th-TH', { month: 'short', year: 'numeric' }),
          revenue: 0,
          orders: 0,
        });
      }
      const entry = bucket.get(key);
      entry.revenue += (item.revenueCents || 0) / 100;
      entry.orders += Number(item.ordersCount ?? item.orders ?? 0) || 0;
    });
    return Array.from(bucket.values())
      .sort((a, b) => a.timestamp - b.timestamp)
      .slice(-6);
  }, [sortedOrdersTrend]);

  const activeTrendDataset = trendRange === 'weekly' ? weeklyTrend : monthlyTrend;
  const trendSubtitle = trendRange === 'weekly' ? 'ยอดขาย 7 วันล่าสุด' : 'ยอดขาย 6 เดือนล่าสุด';

  const maxNewMembers = useMemo(
    () => membersTrend.reduce((max, day) => Math.max(max, day.newMembers || 0), 0),
    [membersTrend]
  );

  const recentEvents = useMemo(() => {
    return sortedOrdersTrend
      .slice(-5)
      .reverse()
      .map((item, index) => ({
        id: `${item.date}-${index}`,
        title: `ยอดขายวันที่ ${formatDateLabel(item.date)}`,
        meta: `${item.ordersCount ?? item.orders ?? 0} orders`,
        amount: formatCurrency(item.revenueCents),
      }));
  }, [sortedOrdersTrend]);

  const trendToggleClass = (value) =>
    [styles.toggleButton, trendRange === value ? styles.toggleButtonActive : '']
      .filter(Boolean)
      .join(' ');

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.pageEyebrow}>ภาพรวมธุรกิจ</p>
          <h1 className={styles.pageTitle}>Admin Dashboard</h1>
          <p className={styles.pageSubtitle}>ติดตามยอดขายและสมาชิกแบบเรียลไทม์</p>
        </div>
        <div className={styles.refreshMeta}>
          <p className={styles.lastUpdated}>อัปเดตล่าสุดเมื่อ {lastUpdatedLabel}</p>
          <button type="button" className={styles.refreshButton} onClick={refresh} disabled={loading}>
            {loading ? 'กำลังรีเฟรช…' : 'Refresh now'}
          </button>
        </div>
      </header>

      {error && <div className={styles.errorBanner}>เกิดข้อผิดพลาด: {error}</div>}

      <div className={styles.noticeCard}>
        <div>
          <p className={styles.noticeBadge}>PromptPay QR</p>
          <p className={styles.noticeTitle}>ฝั่งลูกค้าแสดง QR แบบฝังตัวแล้ว</p>
          <p className={styles.noticeText}>
            ตรวจสอบหน้า Checkout ใหม่ที่โชว์ QR พร้อมเพย์ฝังในหน้า โดยไม่ต้องเด้งออกจาก LIFF
            รองรับปุ่มบันทึกภาพและเปิดลิงก์สำรอง ช่วยลดปัญหาลูกค้ากดกลับกลางทางได้
          </p>
        </div>
        <div className={styles.noticeActions}>
          <a className="btn btn-outline" href="https://fortestonlyme.online/courses/3/checkout" target="_blank" rel="noreferrer">
            เปิดหน้า Checkout
          </a>
          <button type="button" className="btn btn-primary" onClick={refresh} disabled={loading}>
            รีเฟรชข้อมูลแดชบอร์ด
          </button>
        </div>
      </div>

      <div className={styles.kpiGrid}>
        {kpiCards.map((card) => (
          <KpiCard key={card.title} {...card} />
        ))}
      </div>

      <div className={styles.chartGrid}>
        <TrendChart
          title="Orders Trend"
          subtitle={trendSubtitle}
          dataset={activeTrendDataset}
          loading={loading}
          emptyText="ยังไม่มีข้อมูลคำสั่งซื้อ"
          actions={
            <div className={styles.toggleGroup} role="group" aria-label="ช่วงเวลา">
              <button
                type="button"
                className={trendToggleClass('weekly')}
                onClick={() => setTrendRange('weekly')}
                disabled={loading}
              >
                7 วัน
              </button>
              <button
                type="button"
                className={trendToggleClass('monthly')}
                onClick={() => setTrendRange('monthly')}
                disabled={loading}
              >
                6 เดือน
              </button>
            </div>
          }
        />

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

        <UpcomingSessionsCard sessions={upcomingSessions} />

        <RecentActivity events={recentEvents} />
      </div>

      {toastMessage && (
        <div className={styles.toast} role="status" aria-live="polite">
          <span>{toastMessage}</span>
          <button
            type="button"
            className={styles.toastDismiss}
            onClick={() => setToastMessage(null)}
            aria-label="ปิดการแจ้งเตือน"
          >
            ×
          </button>
        </div>
      )}
    </section>
  );
}

export default AdminDashboard;
