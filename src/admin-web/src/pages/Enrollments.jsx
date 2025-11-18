import React, { useState, useEffect } from 'react';
import axios from 'axios';

const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

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
      const response = await axios.get(`${apiBase}/api/admin/enrollments`);
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
      await axios.patch(`${apiBase}/api/admin/enrollments/${enrollmentId}`, { status: newStatus });
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

  if (loading) {
    return <div style={{ padding: '20px' }}>กำลังโหลด...</div>;
  }

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1 style={{ margin: 0 }}>การลงทะเบียนเรียน (Enrollments)</h1>
        <div style={{ display: 'flex', gap: '10px' }}>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            style={{
              padding: '8px 12px',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              cursor: 'pointer'
            }}
          >
            <option value="all">ทั้งหมด</option>
            <option value="active">ใช้งานอยู่</option>
            <option value="expired">หมดอายุ</option>
            <option value="cancelled">ยกเลิก</option>
          </select>
        </div>
      </div>

      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', overflow: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
          <thead style={{ background: '#f9fafb' }}>
            <tr>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>ผู้ใช้</th>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>คอร์ส</th>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>รอบเรียน</th>
              <th style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #e5e7eb' }}>วันที่ลงทะเบียน</th>
              <th style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #e5e7eb' }}>สิทธิ์เหลือ</th>
              <th style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #e5e7eb' }}>เข้าร่วมล่าสุด</th>
              <th style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #e5e7eb' }}>สถานะ</th>
              <th style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #e5e7eb' }}>จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {filteredEnrollments.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ padding: '20px', textAlign: 'center', color: '#6b7280' }}>
                  ไม่มีข้อมูลการลงทะเบียน
                </td>
              </tr>
            ) : (
              filteredEnrollments.map((enrollment) => (
                <tr key={enrollment.id}>
                  <td style={{ padding: '12px', borderBottom: '1px solid #e5e7eb' }}>
                    <div>
                      <div style={{ fontWeight: '500' }}>{enrollment.user_name || 'N/A'}</div>
                      <div style={{ fontSize: '12px', color: '#6b7280' }}>{enrollment.user_email || '-'}</div>
                    </div>
                  </td>
                  <td style={{ padding: '12px', borderBottom: '1px solid #e5e7eb' }}>
                    {enrollment.course_title || '-'}
                  </td>
                  <td style={{ padding: '12px', borderBottom: '1px solid #e5e7eb' }}>
                    {enrollment.session_name || '-'}
                  </td>
                  <td style={{ padding: '12px', borderBottom: '1px solid #e5e7eb', textAlign: 'center' }}>
                    {enrollment.enrolled_at
                      ? new Date(enrollment.enrolled_at).toLocaleDateString('th-TH')
                      : '-'}
                  </td>
                  <td style={{ padding: '12px', borderBottom: '1px solid #e5e7eb', textAlign: 'center' }}>
                    {enrollment.remaining_access !== null && enrollment.remaining_access !== undefined
                      ? enrollment.remaining_access
                      : '∞'}
                  </td>
                  <td style={{ padding: '12px', borderBottom: '1px solid #e5e7eb', textAlign: 'center' }}>
                    {enrollment.last_attended_at
                      ? new Date(enrollment.last_attended_at).toLocaleDateString('th-TH')
                      : '-'}
                  </td>
                  <td style={{ padding: '12px', borderBottom: '1px solid #e5e7eb', textAlign: 'center' }}>
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
                  <td style={{ padding: '12px', borderBottom: '1px solid #e5e7eb', textAlign: 'center' }}>
                    <select
                      value={enrollment.status}
                      onChange={(e) => handleStatusChange(enrollment.id, e.target.value)}
                      style={{
                        padding: '6px 8px',
                        border: '1px solid #e5e7eb',
                        borderRadius: '4px',
                        fontSize: '12px',
                        cursor: 'pointer',
                      }}
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

      <div style={{ marginTop: '20px', padding: '15px', background: '#f9fafb', borderRadius: '8px' }}>
        <h3 style={{ margin: '0 0 10px 0', fontSize: '16px' }}>สรุปข้อมูล</h3>
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
