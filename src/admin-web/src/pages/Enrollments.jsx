import React, { useState, useEffect } from 'react';
import axios from 'axios';
import TablePagination from '../components/common/TablePagination';
import usePagination from '../hooks/usePagination';
import { apiBase } from '../config';

const formatDateTime = (value) => (value ? new Date(value).toLocaleString('th-TH') : '-');
const formatCountdown = (expiresAt) => {
  if (!expiresAt) return 'เริ่มนับเมื่อสแกนครั้งแรก';
  const diffMs = new Date(expiresAt).getTime() - Date.now();
  if (diffMs <= 0) return 'หมดอายุแล้ว';
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  return `${days} วัน ${hours} ชม.`;
};

function Enrollments() {
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, active, expired, cancelled

  useEffect(() => {
    fetchEnrollments();
  }, []);

  const fetchEnrollments = async () => {
    try {
      setLoading(true);
      const response = await axios.post(`${apiBase}/api/admin/enrollments/list`, {});
      setEnrollments(response.data);
    } catch (error) {
      console.error('Error fetching enrollments:', error);
      alert('ไม่สามารถโหลดข้อมูลการลงทะเบียนได้');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (enrollmentId, newStatus) => {
    if (!confirm(`คุณแน่ใจหรือไม่ที่จะเปลี่ยนสถานะเป็น "${newStatus}"?`)) {
      return;
    }
    try {
      await axios.post(`${apiBase}/api/admin/enrollments/update-status`, {
        id: enrollmentId,
        status: newStatus,
      });
      alert('อัพเดทสถานะสำเร็จ');
      fetchEnrollments();
    } catch (error) {
      console.error('Error updating enrollment status:', error);
      alert('เกิดข้อผิดพลาดในการอัพเดทสถานะ');
    }
  };

  const filteredEnrollments = filter === 'all'
    ? enrollments
    : enrollments.filter((e) => e.status === filter);

  const {
    page,
    pageSize,
    totalItems: totalFilteredEnrollments,
    paginatedItems: visibleFilteredEnrollments,
    setPage: setFilteredPage,
    setPageSize: setFilteredPageSize,
    resetPage: resetFilteredPage,
  } = usePagination(filteredEnrollments, { initialPageSize: 15 });

  useEffect(() => {
    resetFilteredPage();
  }, [filter, resetFilteredPage]);

  if (loading) {
    return (
      <div className="page">
        <div className="grid grid--4" style={{ gap: '16px', marginBottom: '24px' }}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="card">
              <div className="skeleton skeleton--title" />
              <div className="skeleton skeleton--text" />
            </div>
          ))}
        </div>
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

  const activeCount = enrollments.filter((e) => e.status === 'active').length;
  const expiredCount = enrollments.filter((e) => e.status === 'expired').length;
  const cancelledCount = enrollments.filter((e) => e.status === 'cancelled').length;

  return (
    <div className="page">
      <div className="page__header">
        <div>
          <h1 className="page__title">การลงทะเบียนเรียน</h1>
          <p className="page__subtitle">จัดการและติดตามสถานะการลงทะเบียนของสมาชิกทั้งหมด</p>
        </div>
        <button
          onClick={fetchEnrollments}
          disabled={loading}
          className="btn btn--primary"
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          {loading && <span className="spinner" style={{ width: '14px', height: '14px', borderWidth: '2px' }} />}
          {loading ? 'กำลังโหลด...' : 'รีเฟรช'}
        </button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid--4" style={{ gap: '16px', marginBottom: '24px' }}>
        <div className="card" style={{ background: 'linear-gradient(135deg, #f3f4f6, #e5e7eb)' }}>
          <div className="metric">
            <span className="metric__label">ทั้งหมด</span>
            <div className="metric__value" style={{ color: '#374151' }}>
              {enrollments.length}
            </div>
          </div>
        </div>
        <div className="card" style={{ background: 'linear-gradient(135deg, #ecfdf5, #d1fae5)' }}>
          <div className="metric">
            <span className="metric__label">ใช้งานอยู่</span>
            <div className="metric__value" style={{ color: '#059669' }}>
              {activeCount}
            </div>
          </div>
        </div>
        <div className="card" style={{ background: 'linear-gradient(135deg, #fef3c7, #fde68a)' }}>
          <div className="metric">
            <span className="metric__label">หมดอายุ</span>
            <div className="metric__value" style={{ color: '#d97706' }}>
              {expiredCount}
            </div>
          </div>
        </div>
        <div className="card" style={{ background: 'linear-gradient(135deg, #fee2e2, #fecaca)' }}>
          <div className="metric">
            <span className="metric__label">ยกเลิก</span>
            <div className="metric__value" style={{ color: '#dc2626' }}>
              {cancelledCount}
            </div>
          </div>
        </div>
      </div>

      {/* Filter Section */}
      <div className="card" style={{ marginBottom: '24px', background: 'var(--color-surface-muted)' }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '16px', fontWeight: '600' }}>🔍 กรอง:</span>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              onClick={() => setFilter('all')}
              className={`btn btn--small ${filter === 'all' ? 'btn--primary' : 'btn--ghost'}`}
            >
              ทั้งหมด ({enrollments.length})
            </button>
            <button
              onClick={() => setFilter('active')}
              className={`btn btn--small ${filter === 'active' ? 'btn--primary' : 'btn--ghost'}`}
            >
              ใช้งานอยู่ ({activeCount})
            </button>
            <button
              onClick={() => setFilter('expired')}
              className={`btn btn--small ${filter === 'expired' ? 'btn--primary' : 'btn--ghost'}`}
            >
              หมดอายุ ({expiredCount})
            </button>
            <button
              onClick={() => setFilter('cancelled')}
              className={`btn btn--small ${filter === 'cancelled' ? 'btn--primary' : 'btn--ghost'}`}
            >
              ยกเลิก ({cancelledCount})
            </button>
          </div>
        </div>
      </div>

      {/* Enrollments Grid */}
      <div className="grid grid--2" style={{ gap: '20px', marginBottom: '24px' }}>
        {visibleFilteredEnrollments.length === 0 ? (
          <div className="card" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '60px 20px' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📝</div>
            <h3 style={{ marginBottom: '8px' }}>ไม่มีข้อมูลการลงทะเบียน</h3>
            <p className="helper-text">
              {filter === 'all' ? 'ยังไม่มีการลงทะเบียนในระบบ' : `ไม่มีการลงทะเบียนที่มีสถานะ "${filter}"`}
            </p>
          </div>
        ) : (
          visibleFilteredEnrollments.map((enrollment) => {
            const statusColors = {
              active: { bg: '#ecfdf5', border: '#059669', text: '#059669' },
              expired: { bg: '#fef3c7', border: '#d97706', text: '#d97706' },
              cancelled: { bg: '#fee2e2', border: '#dc2626', text: '#dc2626' },
            };
            const statusConfig = statusColors[enrollment.status] || statusColors.active;

            return (
              <div
                key={enrollment.id}
                className="card"
                style={{
                  borderLeft: `4px solid ${statusConfig.border}`,
                  background: statusConfig.bg,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                  <div style={{ flex: 1 }}>
                    <h3 className="card__title" style={{ marginBottom: '4px' }}>
                      {enrollment.user_name || 'ไม่ระบุชื่อ'}
                    </h3>
                    <p className="helper-text" style={{ fontSize: '12px' }}>
                      {enrollment.user_email || '-'}
                    </p>
                  </div>
                  <span
                    className="badge"
                    style={{
                      background: statusConfig.bg,
                      color: statusConfig.text,
                      border: `1px solid ${statusConfig.border}`,
                      fontWeight: '700',
                    }}
                  >
                    {enrollment.status === 'active'
                      ? '✓ ใช้งาน'
                      : enrollment.status === 'expired'
                      ? '⏱ หมดอายุ'
                      : '✕ ยกเลิก'}
                  </span>
                </div>

                <div style={{ display: 'grid', gap: '12px', marginBottom: '16px' }}>
                  <div>
                    <p className="helper-text" style={{ marginBottom: '4px' }}>คอร์ส</p>
                    <p style={{ fontWeight: '600', color: 'var(--color-heading)' }}>
                      {enrollment.course_title || '-'}
                    </p>
                  </div>

                  {enrollment.session_name && (
                    <div>
                      <p className="helper-text" style={{ marginBottom: '4px' }}>รอบเรียน</p>
                      <p style={{ fontWeight: '600', color: 'var(--color-heading)' }}>
                        {enrollment.session_name}
                      </p>
                    </div>
                  )}

                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: '12px'
                  }}>
                    <div>
                      <p className="helper-text" style={{ marginBottom: '4px' }}>วันที่ลงทะเบียน</p>
                      <p style={{ fontSize: '13px', fontWeight: '600' }}>
                        {enrollment.enrolled_at
                          ? new Date(enrollment.enrolled_at).toLocaleDateString('th-TH')
                          : '-'}
                      </p>
                    </div>
                    <div>
                      <p className="helper-text" style={{ marginBottom: '4px' }}>สิทธิ์เหลือ</p>
                      <p style={{ fontSize: '16px', fontWeight: '700', color: 'var(--color-accent)' }}>
                        {enrollment.remaining_access !== null && enrollment.remaining_access !== undefined
                          ? `${enrollment.remaining_access} ครั้ง`
                          : '∞ ไม่จำกัด'}
                      </p>
                    </div>
                  </div>

                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: '12px'
                  }}>
                    <div>
                      <p className="helper-text" style={{ marginBottom: '4px' }}>เริ่มใช้งาน</p>
                      <p style={{ fontSize: '12px' }}>
                        {formatDateTime(enrollment.first_attended_at)}
                      </p>
                    </div>
                    <div>
                      <p className="helper-text" style={{ marginBottom: '4px' }}>เข้าร่วมล่าสุด</p>
                      <p style={{ fontSize: '12px' }}>
                        {formatDateTime(enrollment.last_attended_at)}
                      </p>
                    </div>
                  </div>

                  <div>
                    <p className="helper-text" style={{ marginBottom: '4px' }}>สถานะหมดอายุ</p>
                    <p style={{
                      fontSize: '13px',
                      fontWeight: '600',
                      color: enrollment.expires_at && new Date(enrollment.expires_at) < new Date()
                        ? '#dc2626'
                        : '#059669'
                    }}>
                      {formatCountdown(enrollment.expires_at)}
                    </p>
                  </div>
                </div>

                <div style={{ paddingTop: '16px', borderTop: '1px solid var(--color-border)' }}>
                  <div className="field">
                    <label className="field__label">เปลี่ยนสถานะ</label>
                    <select
                      value={enrollment.status}
                      onChange={(e) => handleStatusChange(enrollment.id, e.target.value)}
                      className="input"
                      style={{ fontSize: '14px' }}
                    >
                      <option value="active">ใช้งาน</option>
                      <option value="expired">หมดอายุ</option>
                      <option value="cancelled">ยกเลิก</option>
                    </select>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {!loading && filteredEnrollments.length > 0 && (
        <TablePagination
          page={page}
          pageSize={pageSize}
          totalItems={totalFilteredEnrollments}
          onPageChange={setFilteredPage}
          onPageSizeChange={setFilteredPageSize}
        />
      )}
    </div>
  );
}

export default Enrollments;
