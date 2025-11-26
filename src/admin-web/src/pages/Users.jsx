import React, { useEffect, useState } from 'react';
import axios from 'axios';
import TablePagination from '../components/common/TablePagination';
import usePagination from '../hooks/usePagination';
import { apiBase } from '../config';

function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [userDetail, setUserDetail] = useState(null);
  const [userEnrollments, setUserEnrollments] = useState([]);
  const [availableCourses, setAvailableCourses] = useState([]);
  const [panelMode, setPanelMode] = useState('view');
  const [panelLoading, setPanelLoading] = useState(false);
  const [panelError, setPanelError] = useState('');
  const [editingAccess, setEditingAccess] = useState({});
  const [savingEnrollmentId, setSavingEnrollmentId] = useState(null);
  const [addCourseForm, setAddCourseForm] = useState({ course_id: '', remaining_access: '' });
  const [addCourseStatus, setAddCourseStatus] = useState({ state: 'idle', message: '' });

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await axios.post(`${apiBase}/admin/users/list`, {});
      setUsers(res.data || []);
      setError('');
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('ไม่สามารถโหลดข้อมูลผู้ใช้ได้');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const refreshEnrollments = async (userId) => {
    const targetId = userId || selectedUser?.id;
    if (!targetId) return;
    try {
      const res = await axios.post(`${apiBase}/api/admin/customers/enrollments`, { id: targetId });
      const enrollments = res.data || [];
      setUserEnrollments(enrollments);
      setEditingAccess(
        enrollments.reduce((acc, cur) => {
          acc[cur.id] = cur.remaining_access ?? '';
          return acc;
        }, {})
      );
    } catch (err) {
      console.error('Error fetching enrollments:', err);
      setPanelError('ไม่สามารถโหลดรายการคอร์สของสมาชิกได้');
    }
  };

  const openUserPanel = async (user, mode = 'view') => {
    setSelectedUser(user);
    setPanelMode(mode);
    setPanelLoading(true);
    setPanelError('');
    setUserDetail(null);
    setUserEnrollments([]);
    setAddCourseStatus({ state: 'idle', message: '' });

    try {
      const [detailRes] = await Promise.all([
        axios.post(`${apiBase}/api/admin/customers/detail`, { id: user.id }),
      ]);

      setUserDetail(detailRes.data || user);
      await refreshEnrollments(user.id);

      if (availableCourses.length === 0) {
        const courseRes = await axios.post(`${apiBase}/api/admin/courses/list`, {});
        setAvailableCourses(courseRes.data || []);
      }
    } catch (err) {
      console.error('Error loading customer data:', err);
      setPanelError('ไม่สามารถโหลดข้อมูลสมาชิกได้ กรุณาลองใหม่');
    } finally {
      setPanelLoading(false);
    }
  };

  const closePanel = () => {
    setSelectedUser(null);
    setUserDetail(null);
    setUserEnrollments([]);
    setPanelMode('view');
    setPanelError('');
    setEditingAccess({});
    setAddCourseForm({ course_id: '', remaining_access: '' });
    setAddCourseStatus({ state: 'idle', message: '' });
  };

  const updateEnrollmentAccess = async (enrollment) => {
    const rawValue = editingAccess[enrollment.id];
    const parsedValue = rawValue === '' || rawValue === null ? null : Number(rawValue);

    if (rawValue !== '' && Number.isNaN(parsedValue)) {
      setPanelError('กรุณากรอกจำนวนสิทธิ์เป็นตัวเลข');
      return;
    }

    setSavingEnrollmentId(enrollment.id);
    setPanelError('');
    try {
      await axios.post(`${apiBase}/api/admin/enrollments/update-status`, {
        id: enrollment.id,
        remaining_access: parsedValue,
      });
      await refreshEnrollments(enrollment.user_id || selectedUser?.id);
    } catch (err) {
      console.error('Error updating enrollment access:', err);
      setPanelError(err.response?.data?.message || 'ไม่สามารถอัปเดตสิทธิ์เข้าเรียนได้');
    } finally {
      setSavingEnrollmentId(null);
    }
  };

  const handleAddCourse = async () => {
    if (!selectedUser) return;
    const { course_id, remaining_access } = addCourseForm;
    if (!course_id) {
      setAddCourseStatus({ state: 'error', message: 'กรุณาเลือกคอร์สที่ต้องการเพิ่มให้สมาชิก' });
      return;
    }

    const parsedAccess = remaining_access === '' ? null : Number(remaining_access);
    if (remaining_access !== '' && Number.isNaN(parsedAccess)) {
      setAddCourseStatus({ state: 'error', message: 'จำนวนสิทธิ์ต้องเป็นตัวเลข' });
      return;
    }

    setAddCourseStatus({ state: 'saving', message: '' });
    try {
      await axios.post(`${apiBase}/api/admin/enrollments`, {
        user_id: selectedUser.id,
        course_id: Number(course_id),
        remaining_access: parsedAccess,
      });
      setAddCourseStatus({ state: 'success', message: 'เพิ่มคอร์สให้สมาชิกเรียบร้อยแล้ว' });
      setAddCourseForm({ course_id: '', remaining_access: '' });
      await refreshEnrollments(selectedUser.id);
    } catch (err) {
      console.error('Error creating enrollment:', err);
      setAddCourseStatus({
        state: 'error',
        message: err.response?.data?.message || 'ไม่สามารถเพิ่มคอร์สให้สมาชิกได้',
      });
    }
  };

  const filteredUsers = users.filter(user => {
    const term = searchTerm.toLowerCase();
    return (
      user.line_display_name?.toLowerCase().includes(term) ||
      user.full_name?.toLowerCase().includes(term) ||
      user.email?.toLowerCase().includes(term) ||
      user.phone?.includes(term) ||
      user.line_user_id?.toLowerCase().includes(term)
    );
  });

  const {
    page,
    pageSize,
    totalItems: totalFilteredUsers,
    paginatedItems: visibleUsers,
    setPage: goToPage,
    setPageSize: changePageSize,
    resetPage,
  } = usePagination(filteredUsers, { initialPageSize: 15 });

  useEffect(() => {
    resetPage();
  }, [searchTerm, resetPage]);

  return (
    <div className="page">
      <div className="page__header">
        <h1 className="page__title">จัดการผู้ใช้งาน</h1>
        <p className="page__subtitle">ดูข้อมูลและจัดการสมาชิกทั้งหมดในระบบ</p>
      </div>

      {error && (
        <div className="page-alert page-alert--error">
          {error}
        </div>
      )}

      <div className="page-card">
        <div className="page-card__header">
          <div>
            <h2 className="page-card__title">สมาชิกทั้งหมด</h2>
            <p style={{ color: '#6b7280', fontSize: '14px', margin: '4px 0 0' }}>
              ทั้งหมด {filteredUsers.length} รายการ
              {searchTerm && ` (จากทั้งหมด ${users.length} รายการ)`}
            </p>
          </div>
          <div className="page__actions">
            <input
              type="text"
              placeholder="ค้นหาชื่อ, อีเมล, เบอร์..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input"
              style={{ width: '280px' }}
            />
            <button
              onClick={fetchUsers}
              disabled={loading}
              className="btn btn--primary"
            >
              {loading ? 'กำลังโหลด...' : 'รีเฟรช'}
            </button>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#6b7280' }}>
            <div style={{
              width: '48px',
              height: '48px',
              border: '4px solid #e5e7eb',
              borderTopColor: '#667eea',
              borderRadius: '50%',
              margin: '0 auto 16px',
              animation: 'spin 1s linear infinite',
            }} />
            <p>กำลังโหลดข้อมูล...</p>
            <style>{`
              @keyframes spin {
                to { transform: rotate(360deg); }
              }
            `}</style>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="empty-state">
            <svg style={{ width: '64px', height: '64px', margin: '0 auto 16px', opacity: 0.3 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <p style={{ fontSize: '16px', marginBottom: '8px' }}>
              {searchTerm ? 'ไม่พบผู้ใช้ที่ค้นหา' : 'ยังไม่มีสมาชิกในระบบ'}
            </p>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="btn btn--ghost btn--small"
              >
                ล้างการค้นหา
              </button>
            )}
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Line User ID</th>
                  <th>ชื่อใน LINE</th>
                  <th>ชื่อ-นามสกุล</th>
                  <th>อีเมล</th>
                  <th>เบอร์โทร</th>
                  <th>สมัครเมื่อ</th>
                  <th style={{ textAlign: 'right' }}>จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {visibleUsers.map((user) => (
                  <tr key={user.id}>
                    <td style={{ color: '#6b7280' }}>#{user.id}</td>
                    <td>
                      <span style={{
                        fontFamily: 'monospace',
                        fontSize: '13px',
                        background: '#f3f4f6',
                        padding: '4px 8px',
                        borderRadius: '4px',
                      }}>
                        {user.line_user_id || '-'}
                      </span>
                    </td>
                    <td style={{ fontWeight: '500' }}>
                      {user.line_display_name || <span style={{ color: '#9ca3af' }}>ไม่ระบุ</span>}
                    </td>
                    <td style={{ fontWeight: '500' }}>
                      {user.full_name || <span style={{ color: '#9ca3af' }}>ไม่ระบุ</span>}
                    </td>
                    <td style={{ color: '#6b7280' }}>
                      {user.email || <span style={{ color: '#9ca3af' }}>ไม่ระบุ</span>}
                    </td>
                    <td style={{ color: '#6b7280' }}>
                      {user.phone || <span style={{ color: '#9ca3af' }}>ไม่ระบุ</span>}
                    </td>
                    <td style={{ color: '#6b7280', fontSize: '13px' }}>
                      {formatDate(user.created_at)}
                    </td>
                    <td style={{ textAlign: 'right', whiteSpace: 'nowrap', gap: 8, display: 'flex', justifyContent: 'flex-end' }}>
                      <button
                        className="btn btn--ghost btn--small"
                        onClick={() => openUserPanel(user, 'view')}
                      >
                        View
                      </button>
                      <button
                        className="btn btn--primary btn--small"
                        onClick={() => openUserPanel(user, 'edit')}
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {!loading && (
        <TablePagination
          page={page}
          pageSize={pageSize}
          totalItems={totalFilteredUsers}
          onPageChange={goToPage}
          onPageSizeChange={changePageSize}
        />
      )}

      {selectedUser && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(17, 24, 39, 0.45)',
            backdropFilter: 'blur(4px)',
            zIndex: 50,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
          }}
          onClick={closePanel}
        >
          <div
            className="page-card"
            style={{
              width: '100%',
              maxWidth: '1100px',
              maxHeight: 'calc(100vh - 80px)',
              overflow: 'auto',
              position: 'relative',
              padding: '24px',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="page-card__header" style={{ alignItems: 'flex-start' }}>
              <div>
                <h2 className="page-card__title">สมาชิก #{selectedUser.id}</h2>
                <p style={{ color: '#6b7280', marginTop: 4 }}>
                  ดูข้อมูลและคอร์สที่ {selectedUser.line_display_name || selectedUser.full_name || 'สมาชิก'} ถือครอง
                </p>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
                  <span className="badge">LINE: {selectedUser.line_user_id || 'ไม่ระบุ'}</span>
                  {userDetail?.email && <span className="badge">Email: {userDetail.email}</span>}
                  {userDetail?.phone && <span className="badge">Tel: {userDetail.phone}</span>}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  className={`btn btn--ghost ${panelMode === 'view' ? 'btn--primary' : ''}`}
                  onClick={() => setPanelMode('view')}
                  disabled={panelLoading}
                >
                  View
                </button>
                <button
                  className={`btn btn--primary ${panelMode === 'edit' ? '' : 'btn--ghost'}`}
                  onClick={() => setPanelMode('edit')}
                  disabled={panelLoading}
                >
                  Edit
                </button>
                <button className="btn btn--ghost" onClick={closePanel}>ปิด</button>
              </div>
            </div>

            {panelError && (
              <div className="page-alert page-alert--error" style={{ marginBottom: 16 }}>
                {panelError}
              </div>
            )}

            {panelLoading ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: '#6b7280' }}>
                <div style={{
                  width: '48px', height: '48px', border: '4px solid #e5e7eb', borderTopColor: '#667eea',
                  borderRadius: '50%', margin: '0 auto 16px', animation: 'spin 1s linear infinite',
                }} />
                <p>กำลังโหลดข้อมูลสมาชิก...</p>
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: 16 }}>
                <div className="page-card" style={{ boxShadow: 'none', border: '1px solid #e5e7eb' }}>
                  <h3 style={{ marginBottom: 8 }}>ข้อมูลสมาชิก</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
                    <div>
                      <div className="helper-text">ชื่อ-นามสกุล</div>
                      <div style={{ fontWeight: 600 }}>{userDetail?.full_name || 'ไม่ระบุ'}</div>
                    </div>
                    <div>
                      <div className="helper-text">ชื่อใน LINE</div>
                      <div style={{ fontWeight: 600 }}>{userDetail?.line_display_name || 'ไม่ระบุ'}</div>
                    </div>
                    <div>
                      <div className="helper-text">อีเมล</div>
                      <div style={{ fontWeight: 600 }}>{userDetail?.email || 'ไม่ระบุ'}</div>
                    </div>
                    <div>
                      <div className="helper-text">เบอร์โทร</div>
                      <div style={{ fontWeight: 600 }}>{userDetail?.phone || 'ไม่ระบุ'}</div>
                    </div>
                    <div>
                      <div className="helper-text">สมัครเมื่อ</div>
                      <div style={{ fontWeight: 600 }}>{formatDate(userDetail?.created_at)}</div>
                    </div>
                    <div>
                      <div className="helper-text">จำนวนคำสั่งซื้อ</div>
                      <div style={{ fontWeight: 600 }}>{userDetail?.total_orders ?? '-'}</div>
                    </div>
                    <div>
                      <div className="helper-text">คอร์สที่ลงทะเบียน</div>
                      <div style={{ fontWeight: 600 }}>{userDetail?.total_enrollments ?? '-'}</div>
                    </div>
                  </div>
                </div>

                <div className="page-card" style={{ boxShadow: 'none', border: '1px solid #e5e7eb' }}>
                  <div className="page-card__header" style={{ marginBottom: 12 }}>
                    <div>
                      <h3 style={{ margin: 0 }}>คอร์สที่ถือครอง</h3>
                      <p className="helper-text" style={{ marginTop: 4 }}>
                        ตรวจสอบสิทธิ์การเข้าเรียนและปรับจำนวนครั้งที่อนุญาตได้ทันที
                      </p>
                    </div>
                    <div style={{ fontSize: 14, color: '#6b7280' }}>
                      ทั้งหมด {userEnrollments.length} รายการ
                    </div>
                  </div>

                  {userEnrollments.length === 0 ? (
                    <div className="empty-state" style={{ border: '1px dashed #e5e7eb', padding: 24 }}>
                      <p>ยังไม่มีการซื้อคอร์สสำหรับสมาชิกคนนี้</p>
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gap: 12 }}>
                      {userEnrollments.map((enrollment) => (
                        <div
                          key={enrollment.id}
                          style={{
                            border: '1px solid #e5e7eb',
                            borderRadius: 12,
                            padding: 16,
                            display: 'grid',
                            gap: 8,
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start' }}>
                            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                              {enrollment.course_image ? (
                                <img
                                  src={enrollment.course_image}
                                  alt={enrollment.course_title}
                                  style={{ width: 64, height: 64, borderRadius: 8, objectFit: 'cover' }}
                                />
                              ) : (
                                <div style={{ width: 64, height: 64, borderRadius: 8, background: '#f3f4f6' }} />
                              )}
                              <div>
                                <div style={{ fontWeight: 700 }}>{enrollment.course_title || 'คอร์สไม่ระบุชื่อ'}</div>
                                <div className="helper-text">สถานะ: {enrollment.status}</div>
                                {enrollment.session_name && (
                                  <div className="helper-text">
                                    รอบเรียน: {enrollment.session_name} ({formatDate(enrollment.start_date)})
                                  </div>
                                )}
                              </div>
                            </div>
                            <div style={{ textAlign: 'right', minWidth: 200 }}>
                              <div className="helper-text">สิทธิ์เข้าเรียนคงเหลือ</div>
                              <div style={{ fontWeight: 700 }}>
                                {enrollment.remaining_access === null
                                  ? 'ไม่จำกัด'
                                  : `${enrollment.remaining_access} ครั้ง`}
                                {typeof enrollment.course_access_times === 'number' &&
                                  enrollment.remaining_access !== null && (
                                    <span style={{ color: '#6b7280', marginLeft: 6 }}>
                                      / {enrollment.course_access_times} ครั้ง
                                    </span>
                                  )}
                              </div>
                              {panelMode === 'edit' && (
                                <div style={{ marginTop: 8, display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                                  <input
                                    type="number"
                                    min="0"
                                    value={editingAccess[enrollment.id] ?? ''}
                                    onChange={(e) =>
                                      setEditingAccess({
                                        ...editingAccess,
                                        [enrollment.id]: e.target.value,
                                      })
                                    }
                                    className="input"
                                    style={{ width: 120 }}
                                    placeholder="ตั้งค่าใหม่"
                                  />
                                  <button
                                    className="btn btn--primary btn--small"
                                    onClick={() => updateEnrollmentAccess(enrollment)}
                                    disabled={savingEnrollmentId === enrollment.id}
                                  >
                                    {savingEnrollmentId === enrollment.id ? 'กำลังบันทึก...' : 'บันทึก'}
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                          {enrollment.notes && (
                            <div className="helper-text">บันทึก: {enrollment.notes}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {panelMode === 'edit' && (
                  <div className="page-card" style={{ boxShadow: 'none', border: '1px solid #e5e7eb' }}>
                    <h3 style={{ marginBottom: 12 }}>เพิ่มคอร์สให้สมาชิก</h3>
                    <div style={{ display: 'grid', gap: 12, gridTemplateColumns: '2fr 1fr auto' }}>
                      <select
                        className="input"
                        value={addCourseForm.course_id}
                        onChange={(e) => setAddCourseForm({ ...addCourseForm, course_id: e.target.value })}
                      >
                        <option value="">เลือกคอร์ส</option>
                        {availableCourses.map((course) => (
                          <option key={course.id} value={course.id}>
                            #{course.id} - {course.title}
                          </option>
                        ))}
                      </select>
                      <input
                        type="number"
                        className="input"
                        placeholder="จำนวนสิทธิ์ (เว้นว่าง=ตามค่าเริ่มต้น)"
                        value={addCourseForm.remaining_access}
                        onChange={(e) => setAddCourseForm({ ...addCourseForm, remaining_access: e.target.value })}
                      />
                      <button
                        className="btn btn--primary"
                        onClick={handleAddCourse}
                        disabled={addCourseStatus.state === 'saving'}
                      >
                        {addCourseStatus.state === 'saving' ? 'กำลังเพิ่ม...' : 'เพิ่มคอร์ส'}
                      </button>
                    </div>
                    {addCourseStatus.message && (
                      <p
                        className="helper-text"
                        style={{
                          color: addCourseStatus.state === 'error' ? '#ef4444' : '#10b981',
                          marginTop: 8,
                        }}
                      >
                        {addCourseStatus.message}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default Users;