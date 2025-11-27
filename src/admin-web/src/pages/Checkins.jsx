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

  return (
    <div className="page">
      <div className="page__header">
        <div>
          <h1 className="page__title">ประวัติการเข้าเรียน (Check-in)</h1>
          <p className="page__subtitle">รวมทุกการสแกน QR ของสมาชิก สามารถกรองตามผู้ใช้/คอร์สได้</p>
        </div>
        <div className="page__actions" style={{ gap: 8, flexWrap: 'wrap' }}>
          <input
            type="number"
            className="input"
            placeholder="User ID"
            value={filters.userId}
            onChange={(e) => setFilters((prev) => ({ ...prev, userId: e.target.value }))}
          />
          <input
            type="number"
            className="input"
            placeholder="Course ID"
            value={filters.courseId}
            onChange={(e) => setFilters((prev) => ({ ...prev, courseId: e.target.value }))}
          />
          <input
            type="number"
            className="input"
            placeholder="Session ID"
            value={filters.sessionId}
            onChange={(e) => setFilters((prev) => ({ ...prev, sessionId: e.target.value }))}
          />
          <button type="button" className="btn" onClick={fetchLogs} disabled={loading}>
            {loading ? 'กำลังโหลด...' : 'รีเฟรช'}
          </button>
        </div>
      </div>

      <div className="table-wrapper">
        <table className="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>ผู้ใช้</th>
              <th>คอร์ส</th>
              <th>รอบเรียน</th>
              <th>เวลาสแกน</th>
              <th>ที่มา</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="empty-state">
                  กำลังโหลด...
                </td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={6} className="empty-state">
                  ยังไม่มีข้อมูลการเข้าเรียน
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id}>
                  <td>#{log.id}</td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{log.user_full_name || 'ไม่ระบุ'}</div>
                    <div style={{ fontSize: 12, color: '#6b7280' }}>{log.user_email || '-'}</div>
                    <div style={{ fontSize: 12, color: '#6b7280' }}>User ID: {log.user_id}</div>
                  </td>
                  <td>
                    <div>{log.course_title || '-'}</div>
                    <div style={{ fontSize: 12, color: '#6b7280' }}>Course ID: {log.course_id}</div>
                  </td>
                  <td>{renderSession(log)}</td>
                  <td>{log.attended_at ? new Date(log.attended_at).toLocaleString('th-TH', { hour12: false }) : '-'}</td>
                  <td>{log.source || 'liff'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Checkins;
