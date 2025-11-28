import React, { useEffect, useMemo, useState } from 'react';
import useDashboardData from '../hooks/useDashboardData';

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

function AdminDashboard() {
  const { data, loading, error, refresh, lastUpdated } = useDashboardData();
  const [trendRange, setTrendRange] = useState('weekly');
  const [showDetailedMetrics, setShowDetailedMetrics] = useState(false);
  const [showTopCourses, setShowTopCourses] = useState(false);
  const [showUpcomingSessions, setShowUpcomingSessions] = useState(true);
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
        icon: '💰',
        color: '#2563eb',
      },
      {
        title: 'จำนวนออเดอร์ทั้งหมด',
        value: kpis.totalOrders?.toLocaleString('th-TH') ?? '—',
        diff: '+4.2% MoM',
        icon: '📦',
        color: '#7c3aed',
      },
      {
        title: 'ออเดอร์ที่ชำระวันนี้',
        value: kpis.paidOrdersToday?.toLocaleString('th-TH') ?? '0',
        diff: `${kpis.paidOrdersToday || 0} คำสั่งซื้อ`,
        icon: '✅',
        color: '#059669',
      },
      {
        title: 'สมาชิกใหม่ 30 วัน',
        value: kpis.newMembers30d?.toLocaleString('th-TH') ?? '0',
        diff: `${kpis.newMembers30d || 0} รายการ`,
        icon: '👥',
        color: '#dc2626',
      },
      {
        title: 'มูลค่าเฉลี่ยต่อคำสั่งซื้อ',
        value: formatCurrency(kpis.averageOrderValueCents),
        diff: '+2.1% WoW',
        icon: '📊',
        color: '#ea580c',
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

  const maxRevenue = useMemo(
    () => activeTrendDataset.reduce((max, item) => Math.max(max, item.revenue || 0), 0),
    [activeTrendDataset]
  );

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

  if (loading && !data) {
    return (
      <div className="page">
        <div className="grid grid--4" style={{ gap: '20px' }}>
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="card">
              <div className="skeleton skeleton--title" />
              <div className="skeleton skeleton--text" style={{ width: '60%', height: '40px', marginTop: '12px' }} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      {/* Page Header */}
      <div className="page__header" style={{ marginBottom: '32px' }}>
        <div>
          <p className="page__eyebrow">ภาพรวมธุรกิจ</p>
          <h1 className="page__title" style={{ marginBottom: '8px' }}>Admin Dashboard</h1>
          <p className="page__subtitle">ติดตามยอดขายและสมาชิกแบบเรียลไทม์</p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
          <p className="helper-text" style={{ margin: 0 }}>
            อัปเดตล่าสุดเมื่อ {lastUpdatedLabel}
          </p>
          <button
            type="button"
            className="btn btn--primary"
            onClick={refresh}
            disabled={loading}
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            {loading && <span className="spinner" style={{ width: '14px', height: '14px', borderWidth: '2px' }} />}
            {loading ? 'กำลังรีเฟรช…' : 'Refresh now'}
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="info-box info-box--danger" style={{ marginBottom: '24px' }}>
          เกิดข้อผิดพลาด: {error}
        </div>
      )}

      {/* Notice Card */}
      <div className="card card--highlighted" style={{ marginBottom: '32px' }}>
        <div className="card__header">
          <div>
            <span className="badge badge--primary">PromptPay QR</span>
            <h3 className="card__title" style={{ marginTop: '8px', marginBottom: '4px' }}>
              ฝั่งลูกค้าแสดง QR แบบฝังตัวแล้ว
            </h3>
            <p className="card__subtitle" style={{ marginTop: '8px' }}>
              ตรวจสอบหน้า Checkout ใหม่ที่โชว์ QR พร้อมเพย์ฝังในหน้า โดยไม่ต้องเด้งออกจาก LIFF
              รองรับปุ่มบันทึกภาพและเปิดลิงก์สำรอง ช่วยลดปัญหาลูกค้ากดกลับกลางทางได้
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
          <a
            className="btn btn--outline"
            href="https://fortestonlyme.online/courses/3/checkout"
            target="_blank"
            rel="noreferrer"
            style={{ textDecoration: 'none' }}
          >
            เปิดหน้า Checkout
          </a>
          <button
            type="button"
            className="btn btn--primary"
            onClick={refresh}
            disabled={loading}
          >
            รีเฟรชข้อมูลแดชบอร์ด
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid--auto-fit" style={{ gap: '20px', marginBottom: '32px' }}>
        {kpiCards.map((card, index) => (
          <div
            key={index}
            className="card"
            style={{
              background: `linear-gradient(135deg, ${card.color}08, ${card.color}15)`,
              borderColor: `${card.color}30`,
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <div style={{
              position: 'absolute',
              top: '-30px',
              right: '-30px',
              fontSize: '120px',
              opacity: 0.06,
              userSelect: 'none',
            }}>
              {card.icon}
            </div>
            <div className="metric" style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                <span style={{ fontSize: '28px' }}>{card.icon}</span>
                <span className="metric__label" style={{ margin: 0, fontSize: '12px' }}>
                  {card.title}
                </span>
              </div>
              <div className="metric__value" style={{ color: card.color, fontSize: '36px', marginBottom: '8px' }}>
                {card.value}
              </div>
              <span className="badge badge--primary" style={{ fontSize: '11px' }}>
                {card.diff}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Orders Trend Chart */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <div className="card__header">
          <div>
            <p className="helper-text" style={{ margin: '0 0 4px' }}>{trendSubtitle}</p>
            <h3 className="card__title">Orders Trend</h3>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              className={trendRange === 'weekly' ? 'btn btn--primary btn--small' : 'btn btn--outline btn--small'}
              onClick={() => setTrendRange('weekly')}
              disabled={loading}
            >
              7 วัน
            </button>
            <button
              type="button"
              className={trendRange === 'monthly' ? 'btn btn--primary btn--small' : 'btn btn--outline btn--small'}
              onClick={() => setTrendRange('monthly')}
              disabled={loading}
            >
              6 เดือน
            </button>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {activeTrendDataset.length === 0 ? (
            <p className="helper-text" style={{ textAlign: 'center', padding: '40px 0' }}>
              ยังไม่มีข้อมูลคำสั่งซื้อ
            </p>
          ) : (
            activeTrendDataset.map((item, index) => {
              const revenuePercent = maxRevenue > 0 ? (item.revenue / maxRevenue) * 100 : 0;
              return (
                <div key={index} style={{ display: 'grid', gridTemplateColumns: '100px 1fr 120px', gap: '12px', alignItems: 'center' }}>
                  <span style={{ fontSize: '13px', color: 'var(--color-muted)' }}>{item.dateLabel}</span>
                  <div className="progress" style={{ height: '12px' }}>
                    <div
                      className="progress__bar"
                      style={{ width: `${revenuePercent}%` }}
                    />
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--color-heading)' }}>
                      {formatCurrency(item.revenue * 100)}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--color-muted)' }}>
                      {item.orders} orders
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* New Members Chart */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <div className="card__header">
          <div>
            <p className="helper-text" style={{ margin: '0 0 4px' }}>สมาชิกใหม่ 7 วันล่าสุด</p>
            <h3 className="card__title">New Members</h3>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {membersTrend.length === 0 ? (
            <p className="helper-text" style={{ textAlign: 'center', padding: '40px 0' }}>
              ยังไม่มีข้อมูลสมาชิกใหม่
            </p>
          ) : (
            membersTrend.map((day) => {
              const memberPercent = maxNewMembers > 0 ? ((day.newMembers || 0) / maxNewMembers) * 100 : 0;
              return (
                <div key={day.date} style={{ display: 'grid', gridTemplateColumns: '100px 1fr 80px', gap: '12px', alignItems: 'center' }}>
                  <span style={{ fontSize: '13px', color: 'var(--color-muted)' }}>{formatDateLabel(day.date)}</span>
                  <div className="progress" style={{ height: '12px' }}>
                    <div
                      className="progress__bar progress__bar--success"
                      style={{ width: `${memberPercent}%` }}
                    />
                  </div>
                  <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--color-heading)', textAlign: 'right' }}>
                    {day.newMembers?.toLocaleString('th-TH') ?? 0} คน
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Top Courses - Toggle Section */}
      <div className={`toggle-section ${showTopCourses ? 'is-open' : ''}`} style={{ marginBottom: '24px' }}>
        <div className="toggle-header" onClick={() => setShowTopCourses(!showTopCourses)}>
          <div>
            <h3 className="toggle-header__title">📚 Top Courses</h3>
            <p className="toggle-header__subtitle">5 คอร์สยอดนิยม</p>
          </div>
          <span className="toggle-icon">{showTopCourses ? '▼' : '▶'}</span>
        </div>
        <div className="toggle-content">
          <div className="toggle-content__inner">
            {topCourses.length === 0 ? (
              <p className="helper-text" style={{ textAlign: 'center', padding: '20px 0' }}>
                ยังไม่มีข้อมูลคอร์ส
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {topCourses.map((course) => (
                  <div
                    key={course.courseId}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '16px',
                      background: 'white',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--color-border)',
                    }}
                  >
                    <div>
                      <p style={{ margin: 0, fontWeight: '600', color: 'var(--color-heading)', fontSize: '15px' }}>
                        {course.title || 'ไม่ระบุชื่อ'}
                      </p>
                      {course.ordersCount !== undefined && (
                        <p className="helper-text" style={{ marginTop: '4px' }}>
                          {course.ordersCount} orders
                        </p>
                      )}
                    </div>
                    <span style={{ fontSize: '18px', fontWeight: '700', color: 'var(--color-accent)' }}>
                      {formatCurrency(course.revenueCents)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Upcoming Sessions - Toggle Section */}
      <div className={`toggle-section ${showUpcomingSessions ? 'is-open' : ''}`} style={{ marginBottom: '24px' }}>
        <div className="toggle-header" onClick={() => setShowUpcomingSessions(!showUpcomingSessions)}>
          <div>
            <h3 className="toggle-header__title">📅 Upcoming Sessions</h3>
            <p className="toggle-header__subtitle">รอบเรียนที่กำลังจะถึง</p>
          </div>
          <span className="toggle-icon">{showUpcomingSessions ? '▼' : '▶'}</span>
        </div>
        <div className="toggle-content">
          <div className="toggle-content__inner">
            {upcomingSessions.length === 0 ? (
              <p className="helper-text" style={{ textAlign: 'center', padding: '20px 0' }}>
                ยังไม่มีคลาสที่จะถึง
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {upcomingSessions.map((session) => {
                  const maxCapacity = session.maxCapacity || 0;
                  const enrolled = session.currentEnrollments || 0;
                  const rawAvailable = session.availableSpots ?? (maxCapacity ? maxCapacity - enrolled : 0);
                  const available = Math.max(rawAvailable ?? 0, 0);
                  const occupancyPercent = maxCapacity > 0
                    ? Math.min(100, Math.round((enrolled / maxCapacity) * 100))
                    : 0;
                  return (
                    <div
                      key={session.sessionId}
                      className="card"
                      style={{
                        padding: '20px',
                        background: 'white',
                        borderRadius: 'var(--radius-md)',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                        <div style={{ flex: 1 }}>
                          <h4 style={{ margin: '0 0 6px', fontSize: '16px', fontWeight: '700', color: 'var(--color-heading)' }}>
                            {session.courseTitle || 'ไม่ระบุคอร์ส'}
                          </h4>
                          <p className="helper-text" style={{ margin: '4px 0' }}>
                            {session.sessionName || 'รอบเรียน'} · {session.branchName || 'ไม่ระบุสาขา'}
                          </p>
                          <p className="helper-text" style={{ margin: '4px 0' }}>
                            {formatSessionDay(session.startDate)} · {formatSessionTimeRange(session.startTime, session.endTime)}
                          </p>
                          <p className="helper-text" style={{ margin: '4px 0' }}>
                            ผู้สอน: {session.instructorName || 'รอจัดสรร'} · เหลือ {available} ที่นั่ง
                          </p>
                        </div>
                        <span className="badge badge--primary">
                          {formatSessionDay(session.startDate)}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div className="progress" style={{ flex: 1 }}>
                          <div
                            className="progress__bar"
                            style={{
                              width: `${occupancyPercent}%`,
                              background: occupancyPercent >= 90 ? 'var(--color-danger)' : 'var(--color-accent)',
                            }}
                          />
                        </div>
                        <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--color-muted)', minWidth: '70px', textAlign: 'right' }}>
                          {enrolled}/{maxCapacity || '∞'} คน
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Activity - Toggle Section */}
      <div className={`toggle-section ${showDetailedMetrics ? 'is-open' : ''}`} style={{ marginBottom: '24px' }}>
        <div className="toggle-header" onClick={() => setShowDetailedMetrics(!showDetailedMetrics)}>
          <div>
            <h3 className="toggle-header__title">🔔 กิจกรรมล่าสุด</h3>
            <p className="toggle-header__subtitle">Transactions</p>
          </div>
          <span className="toggle-icon">{showDetailedMetrics ? '▼' : '▶'}</span>
        </div>
        <div className="toggle-content">
          <div className="toggle-content__inner">
            {recentEvents.length === 0 ? (
              <p className="helper-text" style={{ textAlign: 'center', padding: '20px 0' }}>
                ยังไม่มีคำสั่งซื้อใหม่
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {recentEvents.map((event) => (
                  <div
                    key={event.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '16px',
                      background: 'white',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--color-border)',
                    }}
                  >
                    <div>
                      <p style={{ margin: 0, fontWeight: '600', color: 'var(--color-heading)', fontSize: '14px' }}>
                        {event.title}
                      </p>
                      <p className="helper-text" style={{ marginTop: '4px' }}>
                        {event.meta}
                      </p>
                    </div>
                    <span style={{ fontSize: '16px', fontWeight: '700', color: 'var(--color-accent)' }}>
                      {event.amount}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            background: 'var(--color-heading)',
            color: 'white',
            padding: '16px 20px',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-card)',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            zIndex: 1000,
          }}
        >
          <span>{toastMessage}</span>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            style={{
              background: 'rgba(255, 255, 255, 0.2)',
              border: 'none',
              color: 'white',
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              cursor: 'pointer',
              fontSize: '18px',
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;
