import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchCheckinHistory } from '../lib/checkinApi';
import useLiffUser from '../hooks/useLiffUser';
import { getCachedLiffUser } from '../lib/liffAuth';

const formatDateTime = (value) => {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleString('th-TH', { hour12: false });
  } catch (err) {
    return '—';
  }
};

const formatSession = (item) => {
  if (item.session_name) return item.session_name;
  if (item.session_start_date) {
    const date = new Date(item.session_start_date);
    const formattedDate = date.toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' });
    const start = item.session_start_time || '';
    const end = item.session_end_time || '';
    return `${formattedDate}${start ? ` ${start}` : ''}${end ? ` - ${end}` : ''}`.trim();
  }
  return 'ไม่ระบุรอบเรียน';
};

function CheckinHistory() {
  const navigate = useNavigate();
  const { user: liveUser } = useLiffUser();
  const cachedUser = useMemo(() => getCachedLiffUser()?.user || null, []);
  const [user, setUser] = useState(liveUser || cachedUser);
  const [history, setHistory] = useState([]);
  const [status, setStatus] = useState('idle');

  useEffect(() => {
    if (liveUser) setUser(liveUser);
  }, [liveUser]);

  useEffect(() => {
    if (!user?.id) {
      setStatus('no-user');
      return;
    }

    setStatus('loading');
    fetchCheckinHistory(user.id, { limit: 100 })
      .then((items) => {
        setHistory(items);
        setStatus('ready');
      })
      .catch(() => setStatus('error'));
  }, [user]);

  const header = (
    <div className="section-heading" style={{ alignItems: 'flex-start' }}>
      <div>
        <h2>ประวัติการเข้าเรียน</h2>
        <div className="helper-text">สรุปรายการสแกน QR ทั้งหมด พร้อมชื่อคอร์สและรอบเรียน</div>
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
        <button type="button" className="btn btn-outline" onClick={() => navigate('/')}>🏠 กลับหน้าแรก</button>
        <button type="button" className="btn btn-primary" onClick={() => navigate('/my-courses')}>
          🎫 คอร์สของฉัน
        </button>
      </div>
    </div>
  );

  if (status === 'no-user') {
    return (
      <div className="card-surface" style={{ padding: 32, display: 'grid', gap: 10 }}>
        {header}
        <div className="helper-text">กรุณาเข้าสู่ระบบ LINE เพื่อดูประวัติการสแกน</div>
      </div>
    );
  }

  if (status === 'loading') {
    return (
      <div className="card-surface" style={{ padding: 32, display: 'grid', gap: 16 }}>
        {header}
        <div className="loading-shimmer" style={{ height: 120, borderRadius: 16 }} />
        <div className="loading-shimmer" style={{ height: 120, borderRadius: 16 }} />
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="card-surface" style={{ padding: 32, display: 'grid', gap: 10 }}>
        {header}
        <div className="scanner-modal__error">ไม่สามารถโหลดประวัติการสแกนได้ กรุณาลองใหม่</div>
      </div>
    );
  }

  return (
    <div className="card-surface" style={{ padding: 24, display: 'grid', gap: 18 }}>
      {header}

      {history.length === 0 ? (
        <div className="helper-text">ยังไม่มีประวัติการสแกนเข้าเรียน</div>
      ) : (
        <div className="checkin-grid">
          {history.map((item) => (
            <div key={item.id} className="card-surface checkin-card">
              <div className="checkin-card__header">
                <div className="checkin-card__chip">#{item.id}</div>
                <div className="checkin-card__time">{formatDateTime(item.attended_at)}</div>
              </div>
              <div className="checkin-card__title">{item.course_title || 'ไม่พบชื่อคอร์ส'}</div>
              <div className="checkin-card__meta">{formatSession(item)}</div>
              <div className="checkin-card__footer">
                <span className="pill pill--soft">สิทธิ์ #{item.enrollment_id}</span>
                <span className="pill pill--soft">ที่มา: {item.source || 'liff'}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default CheckinHistory;
