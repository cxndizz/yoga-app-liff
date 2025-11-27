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
    return <div className="page">กำลังโหลด...</div>;
  }

  return (
    <div className="page">
      <div className="page__header">
        <h1 className="page__title">การลงทะเบียนเรียน (Enrollments)</h1>
        <div className="page__actions">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="select"
          >
            <option value="all">ทั้งหมด</option>
            <option value="active">ใช้งานอยู่</option>
            <option value="expired">หมดอายุ</option>
            <option value="cancelled">ยกเลิก</option>
          </select>
        </div>
      </div>

      <div className="table-wrapper">
        <table className="table">
          <thead>
            <tr>
              <th>ผู้ใช้</th>
              <th>คอร์ส</th>
              <th>รอบเรียน</th>
              <th style={{ textAlign: 'center' }}>วันที่ลงทะเบียน</th>
              <th style={{ textAlign: 'center' }}>สิทธิ์เหลือ</th>
              <th style={{ textAlign: 'center' }}>เริ่มใช้งาน / หมดอายุ</th>
              <th style={{ textAlign: 'center' }}>เข้าร่วมล่าสุด</th>
              <th style={{ textAlign: 'center' }}>สถานะ</th>
              <th style={{ textAlign: 'center' }}>จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {visibleFilteredEnrollments.length === 0 ? (
              <tr>
                <td colSpan={8} className="empty-state">
                  ไม่มีข้อมูลการลงทะเบียน
                </td>
              </tr>
            ) : (
              visibleFilteredEnrollments.map((enrollment) => (
                <tr key={enrollment.id}>
                  <td>
                    <div>
                      <div style={{ fontWeight: '500' }}>{enrollment.user_name || 'N/A'}</div>
                      <div style={{ fontSize: '12px', color: '#6b7280' }}>{enrollment.user_email || '-'}</div>
                    </div>
                  </td>
                  <td>
                    {enrollment.course_title || '-'}
                  </td>
                  <td>
                    {enrollment.session_name || '-'}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    {enrollment.enrolled_at
                      ? new Date(enrollment.enrolled_at).toLocaleDateString('th-TH')
                      : '-'}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    {enrollment.remaining_access !== null && enrollment.remaining_access !== undefined
                      ? enrollment.remaining_access
                      : '∞'}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <div>{formatDateTime(enrollment.first_attended_at)}</div>
                    <div className="helper-text">
                      {formatCountdown(enrollment.expires_at)}
                    </div>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    {formatDateTime(enrollment.last_attended_at)}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <span
                      style={{
                        padding: '4px 12px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        background:
                          enrollment.status === 'active'
                            ? '#dcfce7'
                            : enrollment.status === 'expired'
                            ? '#fed7aa'
                            : '#fee2e2',
                        color:
                          enrollment.status === 'active'
                            ? '#166534'
                            : enrollment.status === 'expired'
                            ? '#9a3412'
                            : '#991b1b',
                      }}
                    >
                      {enrollment.status === 'active'
                        ? 'ใช้งาน'
                        : enrollment.status === 'expired'
                        ? 'หมดอายุ'
                        : 'ยกเลิก'}
                    </span>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <select
                      value={enrollment.status}
                      onChange={(e) => handleStatusChange(enrollment.id, e.target.value)}
                      className="select btn--small"
                    >
                      <option value="active">ใช้งาน</option>
                      <option value="expired">หมดอายุ</option>
                      <option value="cancelled">ยกเลิก</option>
                    </select>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {!loading && (
        <TablePagination
          page={page}
          pageSize={pageSize}
          totalItems={totalFilteredEnrollments}
          onPageChange={setFilteredPage}
          onPageSizeChange={setFilteredPageSize}
        />
      )}

      <div className="page-card" style={{ marginTop: '20px' }}>
        <h3 className="page-card__title">สรุปข้อมูล</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
          <div>
            <div style={{ fontSize: '12px', color: '#6b7280' }}>ทั้งหมด</div>
            <div style={{ fontSize: '24px', fontWeight: '600' }}>{enrollments.length}</div>
          </div>
          <div>
            <div style={{ fontSize: '12px', color: '#6b7280' }}>ใช้งานอยู่</div>
            <div style={{ fontSize: '24px', fontWeight: '600', color: '#166534' }}>
              {enrollments.filter((e) => e.status === 'active').length}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '12px', color: '#6b7280' }}>หมดอายุ</div>
            <div style={{ fontSize: '24px', fontWeight: '600', color: '#9a3412' }}>
              {enrollments.filter((e) => e.status === 'expired').length}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '12px', color: '#6b7280' }}>ยกเลิก</div>
            <div style={{ fontSize: '24px', fontWeight: '600', color: '#991b1b' }}>
              {enrollments.filter((e) => e.status === 'cancelled').length}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Enrollments;
