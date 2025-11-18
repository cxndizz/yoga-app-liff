import React, { useState, useEffect } from 'react';
import axios from 'axios';

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
    is_active: true
  });

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
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
      is_active: instructor.is_active
    });
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
      is_active: true
    });
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
                style={{
                  background: '#2563eb',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '10px 20px',
                  cursor: 'pointer'
                }}
              >
                บันทึก
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
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>ชื่อผู้สอน</th>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>อีเมล</th>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>เบอร์โทร</th>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>ความเชี่ยวชาญ</th>
              <th style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #e5e7eb' }}>สถานะ</th>
              <th style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #e5e7eb' }}>จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {instructors.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: '20px', textAlign: 'center', color: '#6b7280' }}>
                  ไม่มีข้อมูลผู้สอน
                </td>
              </tr>
            ) : (
              instructors.map((instructor) => (
                <tr key={instructor.id}>
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
    </div>
  );
}

export default Instructors;
