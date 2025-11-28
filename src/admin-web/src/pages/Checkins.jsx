import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { apiBase } from '../config';

function Checkins() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ userId: '', courseId: '', sessionId: '' });

  const payload = useMemo(
    () => ({
      user_id: filters.userId || undefined,
      course_id: filters.courseId || undefined,
      session_id: filters.sessionId || undefined,
      limit: 200,
    }),
    [filters]
  );

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const response = await axios.post(`${apiBase}/api/admin/checkins/list`, payload);
      setLogs(response.data || []);
    } catch (error) {
      console.error('Error fetching check-in logs:', error);
      alert('โหลดประวัติการเข้าเรียนไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const renderSession = (item) => {
    if (item.session_name) return item.session_name;
    if (item.start_date) return item.start_date;
    return '—';
  };

  if (loading) {
    return (
      <div className="page">
        <div className="grid grid--2" style={{ gap: '20px' }}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="card">
              <div className="skeleton skeleton--title" />
              <div className="skeleton skeleton--text" />
              <div className="skeleton skeleton--text" style={{ width: '60%' }} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page__header" style={{ marginBottom: '32px' }}>
        <div>
          <h1 className="page__title">ประวัติการเข้าเรียน (Check-in)</h1>
          <p className="page__subtitle">รวมทุกการสแกน QR ของสมาชิก สามารถกรองตามผู้ใช้/คอร์สได้</p>
        </div>
        <button
          type="button"
          className="btn btn--primary"
          onClick={fetchLogs}
          disabled={loading}
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          {loading && <span className="spinner" style={{ width: '14px', height: '14px', borderWidth: '2px' }} />}
          {loading ? 'กำลังโหลด...' : 'รีเฟรช'}
        </button>
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: '24px', background: 'var(--color-surface-muted)' }}>
        <div className="card__header">
          <h3 className="card__title">🔍 ตัวกรอง</h3>
        </div>
        <div className="form-grid form-grid--two" style={{ gap: '16px' }}>
          <div className="field">
            <label className="field__label">User ID</label>
            <input
              type="number"
              className="input"
              placeholder="ใส่ User ID เพื่อกรอง"
              value={filters.userId}
              onChange={(e) => setFilters((prev) => ({ ...prev, userId: e.target.value }))}
            />
          </div>
          <div className="field">
            <label className="field__label">Course ID</label>
            <input
              type="number"
              className="input"
              placeholder="ใส่ Course ID เพื่อกรอง"
              value={filters.courseId}
              onChange={(e) => setFilters((prev) => ({ ...prev, courseId: e.target.value }))}
            />
          </div>
          <div className="field">
            <label className="field__label">Session ID</label>
            <input
              type="number"
              className="input"
              placeholder="ใส่ Session ID เพื่อกรอง"
              value={filters.sessionId}
              onChange={(e) => setFilters((prev) => ({ ...prev, sessionId: e.target.value }))}
            />
          </div>
          <div className="field" style={{ display: 'flex', alignItems: 'flex-end' }}>
            <button
              type="button"
              className="btn btn--primary"
              onClick={fetchLogs}
              disabled={loading}
              style={{ width: '100%' }}
            >
              ค้นหา
            </button>
          </div>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid--4" style={{ gap: '16px', marginBottom: '24px' }}>
        <div className="card" style={{ background: 'linear-gradient(135deg, #eff6ff, #dbeafe)' }}>
          <div className="metric">
            <span className="metric__label">ทั้งหมด</span>
            <div className="metric__value" style={{ color: '#2563eb' }}>
              {logs.length}
            </div>
          </div>
        </div>
        <div className="card" style={{ background: 'linear-gradient(135deg, #ecfdf5, #d1fae5)' }}>
          <div className="metric">
            <span className="metric__label">ผู้ใช้ที่เข้าร่วม</span>
            <div className="metric__value" style={{ color: '#059669' }}>
              {new Set(logs.map(l => l.user_id)).size}
            </div>
          </div>
        </div>
        <div className="card" style={{ background: 'linear-gradient(135deg, #fef3c7, #fde68a)' }}>
          <div className="metric">
            <span className="metric__label">คอร์สที่เข้าร่วม</span>
            <div className="metric__value" style={{ color: '#d97706' }}>
              {new Set(logs.map(l => l.course_id)).size}
            </div>
          </div>
        </div>
        <div className="card" style={{ background: 'linear-gradient(135deg, #fce7f3, #fbcfe8)' }}>
          <div className="metric">
            <span className="metric__label">รอบเรียนที่เข้าร่วม</span>
            <div className="metric__value" style={{ color: '#db2777' }}>
              {new Set(logs.map(l => l.session_id).filter(Boolean)).size}
            </div>
          </div>
        </div>
      </div>

      {/* Check-in Logs */}
      <div className="card">
        <div className="card__header">
          <h3 className="card__title">ประวัติการเข้าเรียน ({logs.length} รายการ)</h3>
        </div>
        {logs.length === 0 ? (
          <div className="helper-text" style={{ textAlign: 'center', padding: '60px 20px' }}>
            ยังไม่มีข้อมูลการเข้าเรียน
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {logs.map((log) => (
              <div
                key={log.id}
                className="card"
                style={{
                  padding: '20px',
                  background: 'var(--color-surface-muted)',
                  borderRadius: 'var(--radius-md)',
                }}
              >
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                  <div>
                    <p className="helper-text" style={{ margin: '0 0 4px' }}>ID</p>
                    <p style={{ margin: 0, fontWeight: '600', color: 'var(--color-heading)' }}>
                      #{log.id}
                    </p>
                  </div>
                  <div>
                    <p className="helper-text" style={{ margin: '0 0 4px' }}>ผู้ใช้</p>
                    <p style={{ margin: 0, fontWeight: '600', color: 'var(--color-heading)' }}>
                      {log.user_full_name || 'ไม่ระบุ'}
                    </p>
                    <p className="helper-text" style={{ margin: '4px 0 0', fontSize: '12px' }}>
                      {log.user_email || '-'}
                    </p>
                    <p className="helper-text" style={{ margin: '4px 0 0', fontSize: '12px' }}>
                      User ID: {log.user_id}
                    </p>
                  </div>
                  <div>
                    <p className="helper-text" style={{ margin: '0 0 4px' }}>คอร์ส</p>
                    <p style={{ margin: 0, fontWeight: '600', color: 'var(--color-heading)' }}>
                      {log.course_title || '-'}
                    </p>
                    <p className="helper-text" style={{ margin: '4px 0 0', fontSize: '12px' }}>
                      Course ID: {log.course_id}
                    </p>
                  </div>
                  <div>
                    <p className="helper-text" style={{ margin: '0 0 4px' }}>รอบเรียน</p>
                    <p style={{ margin: 0, fontWeight: '600', color: 'var(--color-heading)' }}>
                      {renderSession(log)}
                    </p>
                  </div>
                  <div>
                    <p className="helper-text" style={{ margin: '0 0 4px' }}>เวลาสแกน</p>
                    <p style={{ margin: 0, fontWeight: '600', color: 'var(--color-heading)' }}>
                      {log.attended_at
                        ? new Date(log.attended_at).toLocaleString('th-TH', { hour12: false })
                        : '-'}
                    </p>
                  </div>
                  <div>
                    <p className="helper-text" style={{ margin: '0 0 4px' }}>ที่มา</p>
                    <span className="badge badge--primary">
                      {log.source || 'liff'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Checkins;
