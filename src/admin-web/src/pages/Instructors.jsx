import React, { useState, useEffect } from 'react';
import axios from 'axios';
import TablePagination from '../components/common/TablePagination';
import usePagination from '../hooks/usePagination';
import { convertImageFileToWebP } from '../utils/image';
import { apiBase } from '../config';

function Instructors() {
  const [instructors, setInstructors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingInstructor, setEditingInstructor] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    bio: '',
    email: '',
    phone: '',
    specialties: '',
    is_active: true,
    avatar_url: ''
  });
  const [avatarPreview, setAvatarPreview] = useState('');
  const [avatarProcessing, setAvatarProcessing] = useState(false);
  const [avatarInputKey, setAvatarInputKey] = useState(0);

  const {
    page,
    pageSize,
    totalItems: totalInstructors,
    paginatedItems: visibleInstructors,
    setPage: goToPage,
    setPageSize: changePageSize,
  } = usePagination(instructors);

  useEffect(() => {
    fetchInstructors();
  }, []);

  const fetchInstructors = async () => {
    try {
      setLoading(true);
      const response = await axios.post(`${apiBase}/api/admin/instructors/list`, {});
      setInstructors(response.data);
    } catch (error) {
      console.error('Error fetching instructors:', error);
      alert('ไม่สามารถโหลดข้อมูลผู้สอนได้');
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarChange = async (event) => {
    const inputEl = event.target;
    const file = inputEl.files?.[0];
    if (!file) {
      return;
    }
    inputEl.value = '';
    setAvatarProcessing(true);
    try {
      const { dataUrl } = await convertImageFileToWebP(file, { maxSizeMB: 5, quality: 0.9 });
      setFormData((prev) => ({ ...prev, avatar_url: dataUrl }));
      setAvatarPreview(dataUrl);
      setAvatarInputKey((prev) => prev + 1);
    } catch (error) {
      console.error('Error converting avatar:', error);
      alert(error.message || 'ไม่สามารถแปลงรูปผู้สอนได้');
    } finally {
      setAvatarProcessing(false);
    }
  };

  const handleRemoveAvatar = () => {
    setFormData((prev) => ({ ...prev, avatar_url: '' }));
    setAvatarPreview('');
    setAvatarInputKey((prev) => prev + 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        avatar_url: formData.avatar_url || null,
        specialties: formData.specialties ? formData.specialties.split(',').map(s => s.trim()) : []
      };

      if (editingInstructor) {
        await axios.post(`${apiBase}/api/admin/instructors/update`, {
          id: editingInstructor.id,
          ...payload,
        });
        alert('อัพเดทผู้สอนสำเร็จ');
      } else {
        await axios.post(`${apiBase}/api/admin/instructors`, payload);
        alert('สร้างผู้สอนสำเร็จ');
      }
      setShowForm(false);
      setEditingInstructor(null);
      resetForm();
      fetchInstructors();
    } catch (error) {
      console.error('Error saving instructor:', error);
      alert('เกิดข้อผิดพลาดในการบันทึก');
    }
  };

  const handleEdit = (instructor) => {
    setEditingInstructor(instructor);
    setFormData({
      name: instructor.name,
      bio: instructor.bio || '',
      email: instructor.email || '',
      phone: instructor.phone || '',
      specialties: instructor.specialties ? instructor.specialties.join(', ') : '',
      is_active: instructor.is_active,
      avatar_url: instructor.avatar_url || ''
    });
    setAvatarPreview(instructor.avatar_url || '');
    setAvatarInputKey((prev) => prev + 1);
    setShowForm(true);
  };

  const handleDelete = async (instructorId) => {
    if (!confirm('คุณแน่ใจหรือไม่ที่จะปิดการใช้งานผู้สอนนี้?')) {
      return;
    }
    try {
      await axios.post(`${apiBase}/api/admin/instructors/delete`, { id: instructorId });
      alert('ปิดการใช้งานผู้สอนสำเร็จ');
      fetchInstructors();
    } catch (error) {
      console.error('Error deleting instructor:', error);
      alert(error.response?.data?.message || 'เกิดข้อผิดพลาดในการลบ');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      bio: '',
      email: '',
      phone: '',
      specialties: '',
      is_active: true,
      avatar_url: ''
    });
    setAvatarPreview('');
    setAvatarInputKey((prev) => prev + 1);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingInstructor(null);
    resetForm();
  };

  if (loading) {
    return (
      <div className="page">
        <div className="grid grid--3" style={{ gap: '20px' }}>
          {[1, 2, 3].map((i) => (
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
          <h1 className="page__title">จัดการผู้สอน</h1>
          <p className="page__subtitle">ข้อมูลผู้สอนและครูโยคะทั้งหมด</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="btn btn--primary"
        >
          + เพิ่มผู้สอนใหม่
        </button>
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: '32px', background: 'var(--color-surface-muted)' }}>
          <div className="card__header">
            <h2 className="card__title">{editingInstructor ? 'แก้ไขผู้สอน' : 'เพิ่มผู้สอนใหม่'}</h2>
          </div>
          <form onSubmit={handleSubmit} className="form-grid" style={{ gap: '20px' }}>
            {/* Avatar Upload */}
            <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', alignItems: 'flex-start' }}>
              <div style={{ flex: '1 1 300px' }}>
                <label className="field__label">รูปผู้สอน</label>
                <div style={{
                  border: '2px dashed var(--color-border)',
                  borderRadius: 'var(--radius-md)',
                  padding: '16px',
                  background: 'white',
                  marginTop: '8px',
                }}>
                  <input
                    key={avatarInputKey}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    disabled={avatarProcessing}
                    style={{
                      width: '100%',
                      padding: '8px',
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--radius-sm)',
                      background: 'white',
                    }}
                  />
                  <p className="helper-text" style={{ marginTop: '8px' }}>
                    ระบบจะบีบอัดและแปลงเป็น .webp ให้อัตโนมัติ (สูงสุด 5MB)
                  </p>
                  {avatarProcessing && (
                    <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-accent)' }}>
                      <span className="spinner" style={{ width: '16px', height: '16px', borderWidth: '2px' }} />
                      <span style={{ fontSize: '13px' }}>กำลังแปลงรูป...</span>
                    </div>
                  )}
                </div>
              </div>

              {avatarPreview && (
                <div style={{ flex: '0 0 180px' }}>
                  <label className="field__label">ตัวอย่าง</label>
                  <div style={{
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-md)',
                    padding: '12px',
                    background: 'white',
                    marginTop: '8px',
                  }}>
                    <img
                      src={avatarPreview}
                      alt="ตัวอย่างรูปผู้สอน"
                      style={{
                        width: '100%',
                        height: '180px',
                        objectFit: 'cover',
                        borderRadius: 'var(--radius-md)',
                        marginBottom: '12px',
                      }}
                    />
                    <button
                      type="button"
                      onClick={handleRemoveAvatar}
                      className="btn btn--danger btn--small"
                      style={{ width: '100%' }}
                    >
                      ลบรูป
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="field">
              <label className="field__label">ชื่อผู้สอน *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="input"
                placeholder="เช่น คุณสมชาย ใจดี"
              />
            </div>

            <div className="field">
              <label className="field__label">ประวัติ/ความเชี่ยวชาญ</label>
              <textarea
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                rows={3}
                className="textarea"
                placeholder="ประสบการณ์และความเชี่ยวชาญของผู้สอน"
              />
            </div>

            <div className="form-grid form-grid--two">
              <div className="field">
                <label className="field__label">อีเมล</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="input"
                  placeholder="instructor@example.com"
                />
              </div>

              <div className="field">
                <label className="field__label">เบอร์โทร</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="input"
                  placeholder="08X-XXX-XXXX"
                />
              </div>
            </div>

            <div className="field">
              <label className="field__label">ความเชี่ยวชาญ (คั่นด้วยเครื่องหมายจุลภาค)</label>
              <input
                type="text"
                value={formData.specialties}
                onChange={(e) => setFormData({ ...formData, specialties: e.target.value })}
                placeholder="Hatha Yoga, Vinyasa, Meditation"
                className="input"
              />
            </div>

            <div className="field">
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
                <span>เปิดใช้งาน</span>
              </label>
            </div>

            <div className="page__actions">
              <button
                type="submit"
                disabled={avatarProcessing}
                className="btn btn--primary"
                style={avatarProcessing ? { opacity: 0.6, cursor: 'not-allowed' } : {}}
              >
                {avatarProcessing ? 'กำลังแปลงรูป...' : 'บันทึก'}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="btn btn--ghost"
              >
                ยกเลิก
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid--auto-fit" style={{ gap: '20px', marginBottom: '24px' }}>
        {visibleInstructors.length === 0 ? (
          <div className="card" style={{ gridColumn: '1 / -1' }}>
            <p className="helper-text" style={{ textAlign: 'center', padding: '40px 0', margin: 0 }}>
              ไม่มีข้อมูลผู้สอน
            </p>
          </div>
        ) : (
          visibleInstructors.map((instructor) => (
            <div
              key={instructor.id}
              className="card"
              style={{
                borderColor: instructor.is_active ? 'var(--color-border)' : '#fee2e2',
                background: instructor.is_active ? 'white' : '#fef2f2',
                textAlign: 'center',
              }}
            >
              {instructor.avatar_url ? (
                <img
                  src={instructor.avatar_url}
                  alt={instructor.name}
                  className="avatar avatar--large"
                  style={{ margin: '0 auto 16px', width: '96px', height: '96px' }}
                />
              ) : (
                <div
                  className="avatar avatar--large"
                  style={{
                    margin: '0 auto 16px',
                    width: '96px',
                    height: '96px',
                    fontSize: '32px',
                  }}
                >
                  👤
                </div>
              )}

              <h3 className="card__title" style={{ marginBottom: '8px' }}>
                {instructor.name}
              </h3>

              <span className={`badge ${instructor.is_active ? 'badge--success' : 'badge--danger'}`} style={{ marginBottom: '16px' }}>
                {instructor.is_active ? '🟢 เปิดใช้งาน' : '🔴 ปิดใช้งาน'}
              </span>

              {instructor.bio && (
                <p className="helper-text" style={{ margin: '16px 0', textAlign: 'left' }}>
                  {instructor.bio}
                </p>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', margin: '16px 0', textAlign: 'left' }}>
                {instructor.email && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
                    <span>📧</span>
                    <span>{instructor.email}</span>
                  </div>
                )}
                {instructor.phone && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
                    <span>📞</span>
                    <span>{instructor.phone}</span>
                  </div>
                )}
              </div>

              {instructor.specialties && instructor.specialties.length > 0 && (
                <div style={{ margin: '16px 0', display: 'flex', flexWrap: 'wrap', gap: '6px', justifyContent: 'center' }}>
                  {instructor.specialties.map((specialty, idx) => (
                    <span key={idx} className="chip" style={{ fontSize: '11px' }}>
                      {specialty}
                    </span>
                  ))}
                </div>
              )}

              <div className="card__footer" style={{ paddingTop: '16px', borderTop: '1px solid var(--color-border)', marginTop: '16px' }}>
                <button
                  onClick={() => handleEdit(instructor)}
                  className="btn btn--outline btn--small"
                  style={{ flex: 1 }}
                >
                  แก้ไข
                </button>
                <button
                  onClick={() => handleDelete(instructor.id)}
                  className="btn btn--danger btn--small"
                  style={{ flex: 1 }}
                >
                  ปิดใช้งาน
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {!loading && instructors.length > 0 && (
        <TablePagination
          page={page}
          pageSize={pageSize}
          totalItems={totalInstructors}
          onPageChange={goToPage}
          onPageSizeChange={changePageSize}
        />
      )}
    </div>
  );
}

export default Instructors;
