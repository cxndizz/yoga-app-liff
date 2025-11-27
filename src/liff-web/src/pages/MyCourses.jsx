import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { fetchOrdersForUser } from '../lib/orderApi';
import { useAutoTranslate } from '../lib/autoTranslate';
import { formatAccessTimes, placeholderImage } from '../lib/formatters';
import useLiffUser from '../hooks/useLiffUser';
import { getCachedLiffUser } from '../lib/liffAuth';
import { useSocket } from '../contexts/SocketContext';

const normalizeStatus = (value) => String(value ?? '').toLowerCase().trim();

const statusClass = (paymentStatus) => {
  const normalized = normalizeStatus(paymentStatus);
  if (['completed', 'paid', 'success', 'paysuccess'].includes(normalized)) return 'pill success';
  if (['failed', 'cancelled'].includes(normalized)) return 'pill';
  return 'pill warning';
};

const isPaidStatus = (value, isFree = false) => {
  if (isFree) return true;
  const normalized = normalizeStatus(value);
  return ['completed', 'paid', 'success', 'paysuccess'].includes(normalized);
};

const hasActiveEnrollment = (order = {}) => {
  const status = normalizeStatus(order?.enrollment_status);
  const remaining = order?.remaining_access;
  const hasRemaining = remaining === null || Number(remaining) > 0;
  return order?.enrollment_id && !['cancelled', 'expired'].includes(status) && hasRemaining;
};

const derivePaymentStatus = (order = {}) =>
  normalizeStatus(order?.resolved_payment_status || order?.payment_status || order?.status);

function MyCourses() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { formatDate, formatPrice, language } = useAutoTranslate();
  const { user: liveUser } = useLiffUser();
  const { on: onSocketEvent } = useSocket();

  const cachedUser = getCachedLiffUser()?.user || null;
  const [user, setUser] = useState(cachedUser);
  const [orders, setOrders] = useState([]);
  const [status, setStatus] = useState('idle');

  useEffect(() => {
    if (liveUser) setUser(liveUser);
  }, [liveUser]);

  const refreshOrders = React.useCallback(() => {
    if (!user?.id) {
      setStatus('no-user');
      return;
    }
    setStatus('loading');
    fetchOrdersForUser(user.id)
      .then((data) => {
        setOrders(data);
        setStatus('ready');
      })
      .catch(() => {
        setStatus('error');
      });
  }, [user]);

  useEffect(() => {
    refreshOrders();
  }, [refreshOrders]);

  // WebSocket real-time updates
  useEffect(() => {
    if (!onSocketEvent || !user?.id) return undefined;

    console.log('[MyCourses] Setting up WebSocket listeners for user:', user.id);

    // Listen for order updates
    const unsubscribeOrder = onSocketEvent('order:updated', (data) => {
      if (data?.user_id === user.id) {
        console.log('[MyCourses] Received order update - refreshing');
        refreshOrders();
      }
    });

    // Listen for enrollment updates
    const unsubscribeEnrollment = onSocketEvent('enrollment:updated', (data) => {
      if (data?.user_id === user.id) {
        console.log('[MyCourses] Received enrollment update - refreshing');
        refreshOrders();
      }
    });

    // Listen for payment updates
    const unsubscribePayment = onSocketEvent('payment:updated', (data) => {
      if (data?.user_id === user.id) {
        console.log('[MyCourses] Received payment update - refreshing');
        refreshOrders();
      }
    });

    return () => {
      unsubscribeOrder();
      unsubscribeEnrollment();
      unsubscribePayment();
    };
  }, [onSocketEvent, user, refreshOrders]);

  const visibleOrders = useMemo(() => {
    const result = [];

    for (const order of orders) {
      const normalizedStatus = normalizeStatus(order?.status);
      const normalizedPayment = derivePaymentStatus(order);
      const priceCents = Number(order?.total_price_cents ?? order?.price_cents ?? 0);
      const isFree = order?.is_free || priceCents === 0;

      const cancelled = normalizedStatus === 'cancelled' || normalizedPayment === 'cancelled';
      const paid =
        isPaidStatus(normalizedPayment, isFree) ||
        isPaidStatus(normalizedStatus, isFree) ||
        hasActiveEnrollment(order);

      if (!cancelled && paid) {
        result.push(order);
      }
    }

    return result;
  }, [orders]);

  const mappedOrders = useMemo(
    () =>
      visibleOrders.map((order) => {
        const normalizedPayment = derivePaymentStatus(order);
        const priceCents = Number(order?.total_price_cents ?? order?.price_cents ?? 0);
        const isFree = order?.is_free || priceCents === 0;
        const enrollmentActive = hasActiveEnrollment(order);

        return {
          id: order.id,
          courseId: order.course_id,
          title: order.course_title || t('course.course'),
          branchName: order.branch_name || t('branch.unspecified'),
          channel: order.channel || t('course.course'),
          status: order.status,
          paymentStatus:
            normalizedPayment ||
            (enrollmentActive || isFree ? 'completed' : 'pending'),
          coverImage: order.cover_image_url || placeholderImage,
          priceCents,
          isFree,
          accessTimes: order.access_times,
          remainingAccess: order.remaining_access,
          enrollmentStatus: order.enrollment_status,
          createdAt: order.created_at,
        };
      }),
    [visibleOrders, t]
  );

  const renderAccess = (order) => {
    const hasUnlimited = order.remainingAccess === null;
    const hasRemaining = order.remainingAccess !== undefined && order.remainingAccess !== null;
    const accessBaseline = order.accessTimes ?? null;

    if (hasUnlimited) {
      return formatAccessTimes(-1, {
        language,
        singleLabel: t('access.single'),
        unlimitedLabel: t('access.unlimited'),
        multipleTemplate: t('access.multiple', { count: '{count}' }),
      });
    }

    if (hasRemaining) {
      const remaining = Number(order.remainingAccess || 0);
      const baselineLabel = accessBaseline
        ? formatAccessTimes(accessBaseline, {
            language,
            singleLabel: t('access.single'),
            unlimitedLabel: t('access.unlimited'),
            multipleTemplate: t('access.multiple', { count: '{count}' }),
          })
        : '';
      return `${t('myCourses.remaining')}: ${remaining}${baselineLabel ? ` / ${baselineLabel}` : ''}`;
    }

    const normalizedAccess = accessBaseline ?? 1;
    if (normalizedAccess === 0 && order.isFree) return t('access.free');
    return formatAccessTimes(normalizedAccess, {
      language,
      singleLabel: t('access.single'),
      unlimitedLabel: t('access.unlimited'),
      multipleTemplate: t('access.multiple', { count: '{count}' }),
    });
  };

  return (
    <div style={{ display: 'grid', gap: 24 }}>
      {/* Header */}
      <div className="section-heading">
        <div>
          <h2>{t('myCourses.title')}</h2>
          <div className="helper-text">{t('myCourses.subtitle')}</div>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button type="button" className="btn btn-outline" onClick={() => navigate('/courses')}>
            {t('common.viewAll')}
          </button>
        </div>
      </div>

      {status === 'no-user' && (
        <div className="card-surface" style={{ padding: 40, textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', marginBottom: 8 }}>🔐</div>
          <div style={{ fontWeight: 700, color: '#fff', marginBottom: 8 }}>{t('checkout.loginRequired')}</div>
          <div className="helper-text">{t('myCourses.loginHint')}</div>
        </div>
      )}

      {status === 'loading' && (
        <div className="helper-text loading-shimmer" style={{ padding: 40, borderRadius: 16, textAlign: 'center' }}>
          {t('common.loading')}
        </div>
      )}

      {status === 'error' && (
        <div className="card-surface" style={{ padding: 40, textAlign: 'center', border: '1px solid rgba(239, 68, 68, 0.4)', background: 'rgba(239, 68, 68, 0.1)' }}>
          <div style={{ fontSize: '2rem', marginBottom: 8 }}>⚠️</div>
          <div style={{ color: '#fca5a5', fontWeight: 700 }}>{t('common.error')}</div>
        </div>
      )}

      {/* Courses Grid */}
      <div className="grid">
        {mappedOrders.map((course, index) => (
          <div
            key={course.id}
            className="card-surface mycourse-card"
            style={{
              animation: `fadeIn 0.4s ease-out ${index * 0.1}s both`,
            }}
          >
            {/* Cover Image */}
            <div className="mycourse-cover" aria-hidden>
              <img src={course.coverImage} alt={course.title} />
              {/* Status Overlay */}
              <div
                style={{
                  position: 'absolute',
                  top: 12,
                  right: 12,
                  zIndex: 3,
                }}
              >
                <div
                  className={statusClass(course.paymentStatus)}
                  style={{
                    background: ['completed', 'paid', 'paysuccess', 'success'].includes(course.paymentStatus)
                      ? 'rgba(16, 185, 129, 0.9)'
                      : ['failed', 'cancelled'].includes(course.paymentStatus)
                        ? 'rgba(239, 68, 68, 0.9)'
                        : 'rgba(245, 158, 11, 0.9)',
                    backdropFilter: 'blur(8px)',
                    border: 'none',
                    color: '#fff',
                    fontWeight: 700,
                  }}
                >
                  {['completed', 'paid', 'paysuccess', 'success'].includes(course.paymentStatus)
                    ? `✓ ${t('myCourses.statusPaid')}`
                    : ['failed', 'cancelled'].includes(course.paymentStatus)
                      ? `⚠️ ${t('myCourses.statusFailed')}`
                      : `⏳ ${t('myCourses.statusPending')}`}
                </div>
              </div>
            </div>

            {/* Body Content */}
            <div className="mycourse-body">
              {/* Header Info */}
              <div className="mycourse-header">
                <div>
                  <div
                    className="badge"
                    style={{
                      background: 'rgba(251, 191, 36, 0.15)',
                      borderColor: 'rgba(251, 191, 36, 0.4)',
                      color: '#fbbf24',
                    }}
                  >
                    {course.channel}
                  </div>
                  <h3 style={{ color: '#fff' }}>{course.title}</h3>
                  <div className="helper-text">📍 {course.branchName}</div>
                  <div className="helper-text">#{course.id}</div>
                </div>
              </div>

              {/* Meta Information */}
              <div className="mycourse-meta">
                <div
                  style={{
                    padding: '12px',
                    background: 'rgba(196, 181, 253, 0.05)',
                    borderRadius: '12px',
                    border: '1px solid rgba(196, 181, 253, 0.1)',
                  }}
                >
                  <div className="helper-text" style={{ marginBottom: 4 }}>
                    📅 {t('myCourses.createdAt')}
                  </div>
                  <div style={{ fontWeight: 700, color: '#fff' }}>
                    {course.createdAt ? formatDate(course.createdAt) : t('common.loading')}
                  </div>
                  <div className="helper-text" style={{ marginTop: 4 }}>
                    {renderAccess(course)}
                  </div>
                </div>

                <div
                  style={{
                    padding: '12px',
                    background: 'rgba(251, 191, 36, 0.05)',
                    borderRadius: '12px',
                    border: '1px solid rgba(251, 191, 36, 0.1)',
                  }}
                >
                  <div className="helper-text" style={{ marginBottom: 4 }}>
                    🎫 {t('myCourses.amount')}
                  </div>
                  <div style={{
                    fontWeight: 800,
                    fontSize: '1.1rem',
                    color: course.isFree ? '#34d399' : '#fbbf24',
                  }}>
                    {formatPrice(course.priceCents, course.isFree)}
                  </div>
                  <div className="helper-text" style={{ marginTop: 4 }}>
                    {t('myCourses.reference', { ref: course.id })}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="mycourse-actions">
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                  {course.paymentStatus !== 'completed' && course.paymentStatus !== 'paid' && (
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={() => navigate(`/courses/${course.courseId || course.id}/checkout`)}
                    >
                      💳 {t('myCourses.payNow')}
                    </button>
                  )}
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={() => navigate(`/courses/${course.courseId || course.id}`)}
                  >
                    {t('myCourses.goToCourse')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {status === 'ready' && mappedOrders.length === 0 && (
        <div
          className="card-surface"
          style={{
            padding: 60,
            textAlign: 'center',
            background: 'linear-gradient(135deg, rgba(76, 29, 149, 0.15) 0%, rgba(196, 181, 253, 0.05) 100%)',
          }}
        >
          <div style={{ fontSize: '3rem', marginBottom: 16, opacity: 0.6 }}>📚</div>
          <div style={{
            color: 'var(--secondary-200)',
            fontWeight: 600,
            fontSize: '1.1rem',
            marginBottom: 8,
          }}>
            {t('myCourses.empty')}
          </div>
          <div className="helper-text" style={{ marginBottom: 20 }}>
            {t('myCourses.homeHint')}
          </div>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => navigate('/courses')}
          >
            {t('hero.startBrowsing')}
          </button>
        </div>
      )}
    </div>
  );
}

export default MyCourses;
