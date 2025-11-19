import React, { useState, useEffect } from 'react';
import axios from 'axios';
import TablePagination from '../components/common/TablePagination';
import usePagination from '../hooks/usePagination';
import { convertImageFileToWebP } from '../utils/image';

const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

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
    return <div className="page">กำลังโหลด...</div>;
  }

  return (
    <div className="page">
      <div className="page__header">
        <h1 className="page__title">จัดการผู้สอน</h1>
        <button
          onClick={() => setShowForm(true)}
          className="btn btn--primary"
        >
          เพิ่มผู้สอนใหม่
        </button>
      </div>

      {showForm && (
        <div className="page-card">
          <div className="page-card__header">
            <h2 className="page-card__title">{editingInstructor ? 'แก้ไขผู้สอน' : 'เพิ่มผู้สอนใหม่'}</h2>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="field">
              <label className="field__label">ชื่อผู้สอน *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="input"
              />
            </div>

            <div style={{ display: 'flex', gap: '16px', marginBottom: '15px', flexWrap: 'wrap' }}>
              <label style={{ flex: '1 1 220px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <span>รูปผู้สอน</span>
                <div style={{
                  border: '1px dashed #cbd5f5',
                  borderRadius: '10px',
                  padding: '12px',
                  background: '#f9fafb',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px'
                }}>
                  <input
                    key={avatarInputKey}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    disabled={avatarProcessing}
                    style={{ border: '1px solid #d1d5db', borderRadius: '6px', padding: '8px', background: '#fff' }}
                  />
                  <span style={{ fontSize: '12px', color: '#6b7280' }}>
                    ระบบจะบีบอัดและแปลงเป็น .webp ให้อัตโนมัติ (สูงสุด 5MB)
                  </span>
                  {avatarProcessing && (
                    <span style={{ fontSize: '12px', color: '#2563eb' }}>กำลังแปลงรูป...</span>
                  )}
                </div>
              </label>

              {avatarPreview && (
                <div style={{
                  flex: '0 0 160px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '10px',
                  padding: '10px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}>
                  <img
                    src={avatarPreview}
                    alt="ตัวอย่างรูปผู้สอน"
                    style={{ width: '100%', height: '160px', objectFit: 'cover', borderRadius: '8px' }}
                  />
                  <button
                    type="button"
                    onClick={handleRemoveAvatar}
                    className="btn btn--danger btn--small"
                  >
                    ลบรูป
                  </button>
                </div>
              )}
            </div>

            <div className="field">
              <label className="field__label">ประวัติ/ความเชี่ยวชาญ</label>
              <textarea
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                rows={3}
                className="textarea"
              />
            </div>

            <div className="field">
              <label className="field__label">อีเมล</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="input"
              />
            </div>

            <div className="field">
              <label className="field__label">เบอร์โทร</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="input"
              />
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
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                />
                เปิดใช้งาน
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

      <div className="table-wrapper">
        <table className="table">
          <thead>
            <tr>
              <th>รูป</th>
              <th>ชื่อผู้สอน</th>
              <th>อีเมล</th>
              <th>เบอร์โทร</th>
              <th>ความเชี่ยวชาญ</th>
              <th style={{ textAlign: 'center' }}>สถานะ</th>
              <th style={{ textAlign: 'center' }}>จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {visibleInstructors.length === 0 ? (
              <tr>
                <td colSpan={7}>
                  <div className="empty-state">ไม่มีข้อมูลผู้สอน</div>
                </td>
              </tr>
            ) : (
              visibleInstructors.map((instructor) => (
                <tr key={instructor.id}>
                  <td>
                    {instructor.avatar_url ? (
                      <img
                        src={instructor.avatar_url}
                        alt={instructor.name}
                        style={{ width: '48px', height: '48px', borderRadius: '999px', objectFit: 'cover', border: '1px solid #e5e7eb' }}
                      />
                    ) : (
                      <div style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '999px',
                        background: '#f3f4f6',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#9ca3af'
                      }}>
                        N/A
                      </div>
                    )}
                  </td>
                  <td>{instructor.name}</td>
                  <td>
                    {instructor.email || '-'}
                  </td>
                  <td>
                    {instructor.phone || '-'}
                  </td>
                  <td>
                    {instructor.specialties && instructor.specialties.length > 0
                      ? instructor.specialties.join(', ')
                      : '-'}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <span style={{
                      padding: '4px 12px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      background: instructor.is_active ? '#dcfce7' : '#fee2e2',
                      color: instructor.is_active ? '#166534' : '#991b1b'
                    }}>
                      {instructor.is_active ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}
                    </span>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <button
                      onClick={() => handleEdit(instructor)}
                      className="btn btn--primary btn--small"
                      style={{ marginRight: '8px' }}
                    >
                      แก้ไข
                    </button>
                    <button
                      onClick={() => handleDelete(instructor.id)}
                      className="btn btn--danger btn--small"
                    >
                      ปิดใช้งาน
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <TablePagination
        page={page}
        pageSize={pageSize}
        totalItems={totalInstructors}
        onPageChange={goToPage}
        onPageSizeChange={changePageSize}
      />
    </div>
  );
}

export default Instructors;
