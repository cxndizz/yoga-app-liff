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
      const response = await axios.get(`${apiBase}/api/admin/instructors`);
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
        await axios.put(`${apiBase}/api/admin/instructors/${editingInstructor.id}`, payload);
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
      await axios.delete(`${apiBase}/api/admin/instructors/${instructorId}`);
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
    return <div style={{ padding: '20px' }}>กำลังโหลด...</div>;
  }

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1 style={{ margin: 0 }}>จัดการผู้สอน</h1>
        <button
          onClick={() => setShowForm(true)}
          style={{
            background: '#2563eb',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            padding: '10px 20px',
            cursor: 'pointer'
          }}
        >
          เพิ่มผู้สอนใหม่
        </button>
      </div>

      {showForm && (
        <div style={{
          background: '#fff',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          padding: '20px',
          marginBottom: '20px'
        }}>
          <h2 style={{ marginTop: 0 }}>{editingInstructor ? 'แก้ไขผู้สอน' : 'เพิ่มผู้สอนใหม่'}</h2>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>ชื่อผู้สอน *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '4px'
                }}
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
                    style={{
                      border: 'none',
                      borderRadius: '6px',
                      padding: '6px 10px',
                      background: '#fee2e2',
                      color: '#b91c1c',
                      cursor: 'pointer'
                    }}
                  >
                    ลบรูป
                  </button>
                </div>
              )}
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>ประวัติ/ความเชี่ยวชาญ</label>
              <textarea
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                rows={3}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '4px'
                }}
              />
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>อีเมล</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '4px'
                }}
              />
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>เบอร์โทร</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '4px'
                }}
              />
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>ความเชี่ยวชาญ (คั่นด้วยเครื่องหมายจุลภาค)</label>
              <input
                type="text"
                value={formData.specialties}
                onChange={(e) => setFormData({ ...formData, specialties: e.target.value })}
                placeholder="Hatha Yoga, Vinyasa, Meditation"
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '4px'
                }}
              />
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                />
                เปิดใช้งาน
              </label>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="submit"
                disabled={avatarProcessing}
                style={{
                  background: avatarProcessing ? '#9ca3af' : '#2563eb',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '10px 20px',
                  cursor: avatarProcessing ? 'not-allowed' : 'pointer'
                }}
              >
                {avatarProcessing ? 'กำลังแปลงรูป...' : 'บันทึก'}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                style={{
                  background: '#6b7280',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '10px 20px',
                  cursor: 'pointer'
                }}
              >
                ยกเลิก
              </button>
            </div>
          </form>
        </div>
      )}

      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ background: '#f9fafb' }}>
            <tr>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>รูป</th>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>ชื่อผู้สอน</th>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>อีเมล</th>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>เบอร์โทร</th>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>ความเชี่ยวชาญ</th>
              <th style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #e5e7eb' }}>สถานะ</th>
              <th style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #e5e7eb' }}>จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {visibleInstructors.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: '20px', textAlign: 'center', color: '#6b7280' }}>
                  ไม่มีข้อมูลผู้สอน
                </td>
              </tr>
            ) : (
              visibleInstructors.map((instructor) => (
                <tr key={instructor.id}>
                  <td style={{ padding: '12px', borderBottom: '1px solid #e5e7eb' }}>
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
                  <td style={{ padding: '12px', borderBottom: '1px solid #e5e7eb' }}>{instructor.name}</td>
                  <td style={{ padding: '12px', borderBottom: '1px solid #e5e7eb' }}>
                    {instructor.email || '-'}
                  </td>
                  <td style={{ padding: '12px', borderBottom: '1px solid #e5e7eb' }}>
                    {instructor.phone || '-'}
                  </td>
                  <td style={{ padding: '12px', borderBottom: '1px solid #e5e7eb' }}>
                    {instructor.specialties && instructor.specialties.length > 0
                      ? instructor.specialties.join(', ')
                      : '-'}
                  </td>
                  <td style={{ padding: '12px', borderBottom: '1px solid #e5e7eb', textAlign: 'center' }}>
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
                  <td style={{ padding: '12px', borderBottom: '1px solid #e5e7eb', textAlign: 'center' }}>
                    <button
                      onClick={() => handleEdit(instructor)}
                      style={{
                        background: '#f59e0b',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '4px',
                        padding: '6px 12px',
                        cursor: 'pointer',
                        marginRight: '8px'
                      }}
                    >
                      แก้ไข
                    </button>
                    <button
                      onClick={() => handleDelete(instructor.id)}
                      style={{
                        background: '#dc2626',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '4px',
                        padding: '6px 12px',
                        cursor: 'pointer'
                      }}
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
