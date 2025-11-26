import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { fetchOrdersForUser } from '../lib/orderApi';
import { getCachedLiffUser } from '../lib/liffAuth';
import CheckInScanner from './CheckInScanner';

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
  const [scannerOpen, setScannerOpen] = useState(false);

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
    <div className="card-surface welcome-card">
      <div className="welcome-header">
        {profile?.pictureUrl && (
          <img
            src={profile.pictureUrl}
            alt={displayName}
            className="welcome-avatar"
          />
        )}
        <div className="welcome-text">
          <div className="welcome-title">
            ยินดีต้อนรับ คุณ {displayName}
          </div>
          <div className="helper-text welcome-subtitle">
            โปรไฟล์ LINE ของคุณพร้อมใช้งานสำหรับการชำระเงินและรับคอร์สเรียน
          </div>
        </div>
      </div>

      <div className="welcome-actions">
        <button
          type="button"
          className="btn btn-outline"
          onClick={() => setScannerOpen(true)}
          disabled={!user?.id}
        >
          📷 สแกนเข้าเรียน
        </button>
        <button
          type="button"
          className="btn btn-outline"
          onClick={() => navigate('/cart')}
        >
          🛒 {t('cart.viewCart', { count: pendingOrders.length })}
        </button>
      </div>

      <CheckInScanner
        userId={user?.id}
        open={scannerOpen}
        onClose={() => setScannerOpen(false)}
      />
    </div>
  );
}

export default WelcomeBar;
