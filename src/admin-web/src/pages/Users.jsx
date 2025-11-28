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

  if (loading) {
    return (
      <div className="page">
        <div className="grid grid--3" style={{ gap: '20px' }}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="card">
              <div className="skeleton skeleton--avatar" style={{ margin: '0 auto 16px' }} />
              <div className="skeleton skeleton--title" />
              <div className="skeleton skeleton--text" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page__header">
        <div>
          <h1 className="page__title">จัดการผู้ใช้งาน</h1>
          <p className="page__subtitle">ดูข้อมูลและจัดการสมาชิกทั้งหมดในระบบ ({filteredUsers.length} คน)</p>
        </div>
        <button
          onClick={fetchUsers}
          disabled={loading}
          className="btn btn--primary"
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          {loading && <span className="spinner" style={{ width: '14px', height: '14px', borderWidth: '2px' }} />}
          {loading ? 'กำลังโหลด...' : 'รีเฟรช'}
        </button>
      </div>

      {error && (
        <div className="page-alert page-alert--error" style={{ marginBottom: '24px' }}>
          {error}
        </div>
      )}

      {/* Search Bar */}
      <div className="card" style={{ marginBottom: '24px', background: 'var(--color-surface-muted)' }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <span style={{ fontSize: '20px' }}>🔍</span>
          <input
            type="text"
            placeholder="ค้นหาชื่อ, อีเมล, เบอร์โทร, LINE User ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input"
            style={{ flex: 1 }}
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="btn btn--ghost btn--small"
            >
              ล้าง
            </button>
          )}
        </div>
      </div>

      {/* Users Grid */}
      <div className="grid grid--auto-fit" style={{ gap: '20px', marginBottom: '24px' }}>
        {visibleUsers.length === 0 ? (
          <div className="card" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '60px 20px' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>👥</div>
            <h3 style={{ marginBottom: '8px' }}>
              {searchTerm ? 'ไม่พบผู้ใช้ที่ค้นหา' : 'ยังไม่มีสมาชิกในระบบ'}
            </h3>
            <p className="helper-text">
              {searchTerm ? 'ลองค้นหาด้วยคำอื่น หรือล้างการค้นหา' : 'สมาชิกที่ลงทะเบียนจะแสดงที่นี่'}
            </p>
          </div>
        ) : (
          visibleUsers.map((user) => (
            <div key={user.id} className="card" style={{ textAlign: 'center' }}>
              <div className="avatar avatar--large" style={{ margin: '0 auto 16px', fontSize: '32px' }}>
                👤
              </div>

              <h3 className="card__title" style={{ marginBottom: '8px' }}>
                {user.line_display_name || user.full_name || 'ไม่ระบุชื่อ'}
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px', textAlign: 'left' }}>
                {user.full_name && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
                    <span>👤</span>
                    <span>{user.full_name}</span>
                  </div>
                )}
                {user.email && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
                    <span>📧</span>
                    <span style={{ wordBreak: 'break-all' }}>{user.email}</span>
                  </div>
                )}
                {user.phone && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
                    <span>📞</span>
                    <span>{user.phone}</span>
                  </div>
                )}
                {user.line_user_id && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
                    <span>💬</span>
                    <span className="badge badge--primary" style={{ fontSize: '11px' }}>
                      {user.line_user_id.substring(0, 12)}...
                    </span>
                  </div>
                )}
              </div>

              <div style={{ marginBottom: '16px' }}>
                <p className="helper-text" style={{ fontSize: '12px' }}>
                  สมัครเมื่อ: {formatDate(user.created_at)}
                </p>
              </div>

              <div className="card__footer" style={{ paddingTop: '16px', borderTop: '1px solid var(--color-border)' }}>
                <button
                  className="btn btn--outline btn--small"
                  onClick={() => openUserPanel(user, 'view')}
                  style={{ flex: 1 }}
                >
                  ดูข้อมูล
                </button>
                <button
                  className="btn btn--primary btn--small"
                  onClick={() => openUserPanel(user, 'edit')}
                  style={{ flex: 1 }}
                >
                  จัดการคอร์ส
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {!loading && filteredUsers.length > 0 && (
        <TablePagination
          page={page}
          pageSize={pageSize}
          totalItems={totalFilteredUsers}
          onPageChange={goToPage}
          onPageSizeChange={changePageSize}
        />
      )}

      {/* User Detail Modal */}
      {selectedUser && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(17, 24, 39, 0.5)',
            backdropFilter: 'blur(4px)',
            zIndex: 50,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            overflowY: 'auto',
          }}
          onClick={closePanel}
        >
          <div
            className="card"
            style={{
              width: '100%',
              maxWidth: '1100px',
              maxHeight: 'calc(100vh - 48px)',
              overflow: 'auto',
              position: 'relative',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              marginBottom: '24px',
              paddingBottom: '16px',
              borderBottom: '2px solid var(--color-border)'
            }}>
              <div style={{ flex: 1 }}>
                <h2 className="card__title" style={{ marginBottom: '8px' }}>
                  👤 {selectedUser.line_display_name || selectedUser.full_name || 'สมาชิก'} (ID: #{selectedUser.id})
                </h2>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '12px' }}>
                  <span className="badge badge--primary">
                    LINE: {selectedUser.line_user_id || 'ไม่ระบุ'}
                  </span>
                  {userDetail?.email && <span className="badge">📧 {userDetail.email}</span>}
                  {userDetail?.phone && <span className="badge">📞 {userDetail.phone}</span>}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  className={`btn btn--small ${panelMode === 'view' ? 'btn--primary' : 'btn--ghost'}`}
                  onClick={() => setPanelMode('view')}
                  disabled={panelLoading}
                >
                  ดูข้อมูล
                </button>
                <button
                  className={`btn btn--small ${panelMode === 'edit' ? 'btn--primary' : 'btn--ghost'}`}
                  onClick={() => setPanelMode('edit')}
                  disabled={panelLoading}
                >
                  แก้ไข
                </button>
                <button className="btn btn--ghost btn--small" onClick={closePanel}>✕ ปิด</button>
              </div>
            </div>

            {panelError && (
              <div className="page-alert page-alert--error" style={{ marginBottom: '16px' }}>
                {panelError}
              </div>
            )}

            {panelLoading ? (
              <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                <div className="spinner" style={{ width: '48px', height: '48px', margin: '0 auto 16px' }} />
                <p className="helper-text">กำลังโหลดข้อมูลสมาชิก...</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {/* User Info Section */}
                <div className="card" style={{ background: 'var(--color-surface-muted)' }}>
                  <h3 className="card__title" style={{ marginBottom: '16px' }}>ข้อมูลส่วนตัว</h3>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '16px'
                  }}>
                    <div>
                      <p className="helper-text" style={{ marginBottom: '4px' }}>ชื่อ-นามสกุล</p>
                      <p style={{ fontWeight: '600', color: 'var(--color-heading)' }}>
                        {userDetail?.full_name || 'ไม่ระบุ'}
                      </p>
                    </div>
                    <div>
                      <p className="helper-text" style={{ marginBottom: '4px' }}>ชื่อใน LINE</p>
                      <p style={{ fontWeight: '600', color: 'var(--color-heading)' }}>
                        {userDetail?.line_display_name || 'ไม่ระบุ'}
                      </p>
                    </div>
                    <div>
                      <p className="helper-text" style={{ marginBottom: '4px' }}>อีเมล</p>
                      <p style={{ fontWeight: '600', color: 'var(--color-heading)' }}>
                        {userDetail?.email || 'ไม่ระบุ'}
                      </p>
                    </div>
                    <div>
                      <p className="helper-text" style={{ marginBottom: '4px' }}>เบอร์โทร</p>
                      <p style={{ fontWeight: '600', color: 'var(--color-heading)' }}>
                        {userDetail?.phone || 'ไม่ระบุ'}
                      </p>
                    </div>
                    <div>
                      <p className="helper-text" style={{ marginBottom: '4px' }}>สมัครเมื่อ</p>
                      <p style={{ fontWeight: '600', color: 'var(--color-heading)' }}>
                        {formatDate(userDetail?.created_at)}
                      </p>
                    </div>
                    <div>
                      <p className="helper-text" style={{ marginBottom: '4px' }}>จำนวนคำสั่งซื้อ</p>
                      <p style={{ fontWeight: '600', color: 'var(--color-heading)' }}>
                        {userDetail?.total_orders ?? '-'}
                      </p>
                    </div>
                    <div>
                      <p className="helper-text" style={{ marginBottom: '4px' }}>คอร์สที่ลงทะเบียน</p>
                      <p style={{ fontWeight: '600', color: 'var(--color-heading)' }}>
                        {userDetail?.total_enrollments ?? '-'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Enrollments Section */}
                <div className="card" style={{ background: 'white' }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '16px'
                  }}>
                    <div>
                      <h3 className="card__title">📚 คอร์สที่ถือครอง</h3>
                      <p className="helper-text" style={{ marginTop: '4px' }}>
                        ตรวจสอบและปรับจำนวนสิทธิ์การเข้าเรียนได้ทันที
                      </p>
                    </div>
                    <span className="badge badge--primary" style={{ fontSize: '14px' }}>
                      {userEnrollments.length} คอร์ส
                    </span>
                  </div>

                  {userEnrollments.length === 0 ? (
                    <div style={{
                      textAlign: 'center',
                      padding: '40px 20px',
                      border: '2px dashed var(--color-border)',
                      borderRadius: 'var(--radius-md)'
                    }}>
                      <div style={{ fontSize: '48px', marginBottom: '8px' }}>📚</div>
                      <p className="helper-text">ยังไม่มีการลงทะเบียนคอร์สสำหรับสมาชิกคนนี้</p>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {userEnrollments.map((enrollment) => (
                        <div
                          key={enrollment.id}
                          className="card"
                          style={{
                            background: 'var(--color-surface-muted)',
                            padding: '16px',
                          }}
                        >
                          <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                            {enrollment.course_image ? (
                              <img
                                src={enrollment.course_image}
                                alt={enrollment.course_title}
                                style={{
                                  width: '80px',
                                  height: '80px',
                                  borderRadius: 'var(--radius-md)',
                                  objectFit: 'cover',
                                  flexShrink: 0
                                }}
                              />
                            ) : (
                              <div style={{
                                width: '80px',
                                height: '80px',
                                borderRadius: 'var(--radius-md)',
                                background: 'var(--color-border)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '32px',
                                flexShrink: 0
                              }}>
                                📖
                              </div>
                            )}

                            <div style={{ flex: 1 }}>
                              <h4 style={{ margin: '0 0 8px', fontWeight: '700' }}>
                                {enrollment.course_title || 'คอร์สไม่ระบุชื่อ'}
                              </h4>
                              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '8px' }}>
                                <span className="badge">{enrollment.status}</span>
                                {enrollment.session_name && (
                                  <span className="badge badge--primary">
                                    รอบ: {enrollment.session_name}
                                  </span>
                                )}
                              </div>
                              {enrollment.session_name && (
                                <p className="helper-text" style={{ fontSize: '12px', margin: '4px 0' }}>
                                  วันเรียน: {formatDate(enrollment.start_date)}
                                </p>
                              )}
                              {enrollment.notes && (
                                <p className="helper-text" style={{ fontSize: '12px', margin: '4px 0' }}>
                                  บันทึก: {enrollment.notes}
                                </p>
                              )}
                            </div>

                            <div style={{
                              textAlign: 'right',
                              minWidth: '200px',
                              flexShrink: 0
                            }}>
                              <p className="helper-text" style={{ marginBottom: '4px' }}>
                                สิทธิ์เข้าเรียนคงเหลือ
                              </p>
                              <p style={{ fontWeight: '700', fontSize: '18px', color: 'var(--color-accent)' }}>
                                {enrollment.remaining_access === null
                                  ? '∞ ไม่จำกัด'
                                  : `${enrollment.remaining_access} ครั้ง`}
                                {typeof enrollment.course_access_times === 'number' &&
                                  enrollment.remaining_access !== null && (
                                    <span style={{ fontSize: '14px', color: 'var(--color-muted)', marginLeft: '6px' }}>
                                      / {enrollment.course_access_times}
                                    </span>
                                  )}
                              </p>

                              {panelMode === 'edit' && (
                                <div style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
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
                                    style={{ width: '100px' }}
                                    placeholder="ใหม่"
                                  />
                                  <button
                                    className="btn btn--primary btn--small"
                                    onClick={() => updateEnrollmentAccess(enrollment)}
                                    disabled={savingEnrollmentId === enrollment.id}
                                  >
                                    {savingEnrollmentId === enrollment.id ? (
                                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <span className="spinner" style={{ width: '12px', height: '12px', borderWidth: '2px' }} />
                                        บันทึก...
                                      </span>
                                    ) : 'บันทึก'}
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Add Course Section (Edit Mode Only) */}
                {panelMode === 'edit' && (
                  <div className="card" style={{ background: 'linear-gradient(135deg, #eff6ff, #dbeafe)' }}>
                    <h3 className="card__title" style={{ marginBottom: '16px' }}>➕ เพิ่มคอร์สให้สมาชิก</h3>
                    <div style={{
                      display: 'grid',
                      gap: '12px',
                      gridTemplateColumns: '2fr 1fr auto',
                      alignItems: 'end'
                    }}>
                      <div className="field">
                        <label className="field__label">เลือกคอร์ส</label>
                        <select
                          className="input"
                          value={addCourseForm.course_id}
                          onChange={(e) => setAddCourseForm({ ...addCourseForm, course_id: e.target.value })}
                        >
                          <option value="">-- เลือกคอร์ส --</option>
                          {availableCourses.map((course) => (
                            <option key={course.id} value={course.id}>
                              #{course.id} - {course.title}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="field">
                        <label className="field__label">จำนวนสิทธิ์</label>
                        <input
                          type="number"
                          className="input"
                          placeholder="ค่าเริ่มต้น"
                          value={addCourseForm.remaining_access}
                          onChange={(e) => setAddCourseForm({ ...addCourseForm, remaining_access: e.target.value })}
                        />
                      </div>
                      <button
                        className="btn btn--primary"
                        onClick={handleAddCourse}
                        disabled={addCourseStatus.state === 'saving'}
                        style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                      >
                        {addCourseStatus.state === 'saving' && (
                          <span className="spinner" style={{ width: '14px', height: '14px', borderWidth: '2px' }} />
                        )}
                        {addCourseStatus.state === 'saving' ? 'กำลังเพิ่ม...' : 'เพิ่มคอร์ส'}
                      </button>
                    </div>
                    {addCourseStatus.message && (
                      <div
                        className={`page-alert ${addCourseStatus.state === 'error' ? 'page-alert--error' : 'page-alert--success'}`}
                        style={{ marginTop: '12px' }}
                      >
                        {addCourseStatus.message}
                      </div>
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
