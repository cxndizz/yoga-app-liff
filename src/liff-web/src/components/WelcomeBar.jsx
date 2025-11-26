import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { fetchOrdersForUser } from '../lib/orderApi';
import { getCachedLiffUser } from '../lib/liffAuth';

const isPaidStatus = (value) => {
  if (!value) return false;
  const normalized = String(value).toLowerCase().trim();
  return ['completed', 'paid', 'success', 'paysuccess'].includes(normalized);
};

function WelcomeBar({ liffState }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const cached = getCachedLiffUser() || {};
  const cachedUser = cached.user || null;
  const cachedProfile = cached.profile || {};

  const user = liffState?.user || cachedUser;
  const profile = liffState?.profile || cachedProfile;

  const [pendingOrders, setPendingOrders] = useState([]);

  useEffect(() => {
    if (!user?.id) {
      setPendingOrders([]);
      return;
    }

    let active = true;
    fetchOrdersForUser(user.id)
      .then((data) => {
        if (!active) return;
        const pending = (data || []).filter((order) => {
          const paid = isPaidStatus(order.payment_status) || isPaidStatus(order.status);
          const cancelled = String(order.status || '').toLowerCase() === 'cancelled';
          return !paid && !cancelled;
        });

        const uniqueByCourse = [];
        const seen = new Set();
        for (const order of pending) {
          if (seen.has(order.course_id)) continue;
          seen.add(order.course_id);
          uniqueByCourse.push(order);
        }

        setPendingOrders(uniqueByCourse);
      })
      .catch(() => {
        if (!active) return;
        setPendingOrders([]);
      });

    return () => {
      active = false;
    };
  }, [user?.id]);

  const displayName = useMemo(
    () => profile?.displayName || user?.full_name || user?.line_display_name || t('nav.brand'),
    [profile?.displayName, user?.full_name, user?.line_display_name, t]
  );

  if (!user) return null;

  return (
    <div
      className="card-surface"
      style={{
        margin: '12px auto 0',
        padding: '12px 16px',
        width: 'min(1200px, 92vw)',
        display: 'grid',
        gap: 10,
        alignItems: 'center',
        gridTemplateColumns: '1fr auto',
        background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.45), rgba(59, 7, 100, 0.55))',
        border: '1px solid rgba(148, 163, 184, 0.25)',
        backdropFilter: 'blur(12px)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
        {profile?.pictureUrl && (
          <img
            src={profile.pictureUrl}
            alt={displayName}
            style={{ width: 52, height: 52, borderRadius: '50%', border: '2px solid rgba(251, 191, 36, 0.4)' }}
          />
        )}
        <div style={{ minWidth: 0 }}>
          <div style={{ color: '#e5e7eb', fontWeight: 700, marginBottom: 2 }}>
            ยินดีต้อนรับ คุณ {displayName}
          </div>
          <div className="helper-text" style={{ color: '#cbd5e1' }}>
            โปรไฟล์ LINE ของคุณพร้อมใช้งานสำหรับการชำระเงินและรับคอร์สเรียน
          </div>
        </div>
      </div>

      <div style={{ justifySelf: 'end' }}>
        <button
          type="button"
          className="btn btn-outline"
          onClick={() => navigate('/cart')}
          style={{ paddingInline: 16 }}
        >
          🛒 {t('cart.viewCart', { count: pendingOrders.length })}
        </button>
      </div>
    </div>
  );
}

export default WelcomeBar;
