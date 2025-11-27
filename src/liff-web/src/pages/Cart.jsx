import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { fetchOrdersForUser } from '../lib/orderApi';
import { useAutoTranslate } from '../lib/autoTranslate';
import { placeholderImage } from '../lib/formatters';
import useLiffUser from '../hooks/useLiffUser';
import { getCachedLiffUser } from '../lib/liffAuth';

const normalizeStatus = (value) => String(value ?? '').toLowerCase().trim();

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

function Cart() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { formatDate, formatPrice } = useAutoTranslate();
  const { user: liveUser } = useLiffUser();

  const cachedUser = getCachedLiffUser()?.user || null;
  const [user, setUser] = useState(cachedUser);
  const [orders, setOrders] = useState([]);
  const [status, setStatus] = useState('idle');

  useEffect(() => {
    if (liveUser) setUser(liveUser);
  }, [liveUser]);

  useEffect(() => {
    if (!user?.id) {
      setStatus('no-user');
      return;
    }

    let active = true;
    setStatus('loading');
    fetchOrdersForUser(user.id)
      .then((data) => {
        if (!active) return;
        setOrders(Array.isArray(data) ? data : []);
        setStatus('ready');
      })
      .catch(() => {
        if (!active) return;
        setStatus('error');
      });

    return () => {
      active = false;
    };
  }, [user]);

  const pendingOrders = useMemo(() => {
    const seen = new Set();

    return orders.filter((order) => {
      const normalizedStatus = normalizeStatus(order?.status);
      const normalizedPayment = derivePaymentStatus(order);
      const priceCents = Number(order?.total_price_cents ?? order?.price_cents ?? 0);
      const isFree = order?.is_free || priceCents === 0;

      const cancelled = normalizedStatus === 'cancelled' || normalizedPayment === 'cancelled';
      const paid =
        isPaidStatus(normalizedPayment, isFree) ||
        isPaidStatus(normalizedStatus, isFree) ||
        hasActiveEnrollment(order);

      if (paid || cancelled) return false;
      if (seen.has(order?.course_id)) return false;

      seen.add(order.course_id);
      return true;
    });
  }, [orders]);

  return (
    <div style={{ display: 'grid', gap: 24 }}>
      <div className="section-heading">
        <div>
          <h2>{t('cart.title')}</h2>
          <div className="helper-text">{t('cart.subtitle')}</div>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button type="button" className="btn btn-outline" onClick={() => navigate('/courses')}>
            {t('cart.backToCourses')}
          </button>
          <button type="button" className="btn btn-primary" onClick={() => navigate('/my-courses')}>
            {t('myCourses.title')}
          </button>
        </div>
      </div>

      {status === 'no-user' && (
        <div className="card-surface" style={{ padding: 40, textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', marginBottom: 8 }}>🔐</div>
          <div style={{ fontWeight: 700, color: '#fff', marginBottom: 8 }}>{t('cart.loginRequired')}</div>
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

      <div className="grid">
        {pendingOrders.map((order, index) => {
          const coverImage = order.cover_image_url || placeholderImage;
          const priceCents = Number(order?.total_price_cents ?? order?.price_cents ?? 0);

          return (
            <div
              key={order.id}
              className="card-surface"
              style={{ animation: `fadeIn 0.4s ease-out ${index * 0.1}s both` }}
            >
              <div className="mycourse-cover" aria-hidden>
                <img src={coverImage} alt={order.course_title || t('course.course')} />
                <div style={{ position: 'absolute', top: 12, right: 12 }}>
                  <div
                    className="pill warning"
                    style={{
                      background: 'rgba(245, 158, 11, 0.9)',
                      color: '#fff',
                      fontWeight: 700,
                      border: 'none',
                      backdropFilter: 'blur(8px)',
                    }}
                  >
                    ⏳ {t('cart.pendingStatus')}
                  </div>
                </div>
              </div>

              <div className="mycourse-body">
                <div className="mycourse-header">
                  <div>
                    <h3 style={{ color: '#fff' }}>{order.course_title || t('course.course')}</h3>
                    <div className="helper-text">📍 {order.branch_name || t('branch.unspecified')}</div>
                    <div className="helper-text">{t('cart.reference', { ref: order.id })}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 800, color: '#fbbf24', fontSize: '1.1rem' }}>
                      {formatPrice(priceCents, order.is_free)}
                    </div>
                    <div className="helper-text" style={{ marginTop: 4 }}>
                      {t('cart.lastUpdated', { date: formatDate(order.updated_at || order.created_at) })}
                    </div>
                  </div>
                </div>

                <div className="mycourse-actions" style={{ marginTop: 14 }}>
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={() => navigate(`/courses/${order.course_id}/checkout`)}
                    >
                      💳 {t('cart.resume')}
                    </button>
                    <button
                      type="button"
                      className="btn btn-outline"
                      onClick={() => navigate(`/courses/${order.course_id}`)}
                    >
                      {t('common.viewDetails')}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {status === 'ready' && pendingOrders.length === 0 && (
        <div
          className="card-surface"
          style={{
            padding: 60,
            textAlign: 'center',
            background: 'linear-gradient(135deg, rgba(76, 29, 149, 0.15) 0%, rgba(196, 181, 253, 0.05) 100%)',
          }}
        >
          <div style={{ fontSize: '3rem', marginBottom: 16, opacity: 0.6 }}>🛍️</div>
          <div style={{
            color: 'var(--secondary-200)',
            fontWeight: 600,
            fontSize: '1.1rem',
            marginBottom: 8,
          }}>
            {t('cart.empty')}
          </div>
          <div className="helper-text" style={{ marginBottom: 20 }}>
            {t('cart.emptyHint')}
          </div>
          <button type="button" className="btn btn-primary" onClick={() => navigate('/courses')}>
            {t('hero.startBrowsing')}
          </button>
        </div>
      )}
    </div>
  );
}

export default Cart;
