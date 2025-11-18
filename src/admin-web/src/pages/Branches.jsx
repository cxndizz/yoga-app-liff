import React, { useState, useEffect } from 'react';
import axios from 'axios';

const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

function Branches() {
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingBranch, setEditingBranch] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone: '',
    map_url: '',
    is_active: true
  });

  useEffect(() => {
    fetchBranches();
  }, []);

  const fetchBranches = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${apiBase}/api/admin/branches`);
      setBranches(response.data);
    } catch (error) {
      console.error('Error fetching branches:', error);
      alert('ไม่สามารถโหลดข้อมูลสาขาได้');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingBranch) {
        await axios.put(`${apiBase}/api/admin/branches/${editingBranch.id}`, formData);
        alert('อัพเดทสาขาสำเร็จ');
      } else {
        await axios.post(`${apiBase}/api/admin/branches`, formData);
        alert('สร้างสาขาสำเร็จ');
      }
      setShowForm(false);
      setEditingBranch(null);
      resetForm();
      fetchBranches();
    } catch (error) {
      console.error('Error saving branch:', error);
      alert('เกิดข้อผิดพลาดในการบันทึก');
    }
  };

  const handleEdit = (branch) => {
    setEditingBranch(branch);
    setFormData({
      name: branch.name,
      address: branch.address || '',
      phone: branch.phone || '',
      map_url: branch.map_url || '',
      is_active: branch.is_active
    });
    setShowForm(true);
  };

  const handleDelete = async (branchId) => {
    if (!confirm('คุณแน่ใจหรือไม่ที่จะปิดการใช้งานสาขานี้?')) {
      return;
    }
    try {
      await axios.delete(`${apiBase}/api/admin/branches/${branchId}`);
      alert('ปิดการใช้งานสาขาสำเร็จ');
      fetchBranches();
    } catch (error) {
      console.error('Error deleting branch:', error);
      alert(error.response?.data?.message || 'เกิดข้อผิดพลาดในการลบ');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      address: '',
      phone: '',
      map_url: '',
      is_active: true
    });
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingBranch(null);
    resetForm();
  };

  if (loading) {
    return <div style={{ padding: '20px' }}>กำลังโหลด...</div>;
  }

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1 style={{ margin: 0 }}>จัดการสาขา</h1>
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
          เพิ่มสาขาใหม่
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
          <h2 style={{ marginTop: 0 }}>{editingBranch ? 'แก้ไขสาขา' : 'เพิ่มสาขาใหม่'}</h2>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>ชื่อสาขา *</label>
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
              <label style={{ display: 'block', marginBottom: '5px' }}>ที่อยู่</label>
              <textarea
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
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
              <label style={{ display: 'block', marginBottom: '5px' }}>ลิงก์แผนที่</label>
              <input
                type="url"
                value={formData.map_url}
                onChange={(e) => setFormData({ ...formData, map_url: e.target.value })}
                placeholder="https://maps.google.com/..."
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
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>ชื่อสาขา</th>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>ที่อยู่</th>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>เบอร์โทร</th>
              <th style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #e5e7eb' }}>สถานะ</th>
              <th style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #e5e7eb' }}>จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {branches.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: '20px', textAlign: 'center', color: '#6b7280' }}>
                  ไม่มีข้อมูลสาขา
                </td>
              </tr>
            ) : (
              branches.map((branch) => (
                <tr key={branch.id}>
                  <td style={{ padding: '12px', borderBottom: '1px solid #e5e7eb' }}>{branch.name}</td>
                  <td style={{ padding: '12px', borderBottom: '1px solid #e5e7eb' }}>
                    {branch.address || '-'}
                  </td>
                  <td style={{ padding: '12px', borderBottom: '1px solid #e5e7eb' }}>
                    {branch.phone || '-'}
                  </td>
                  <td style={{ padding: '12px', borderBottom: '1px solid #e5e7eb', textAlign: 'center' }}>
                    <span style={{
                      padding: '4px 12px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      background: branch.is_active ? '#dcfce7' : '#fee2e2',
                      color: branch.is_active ? '#166534' : '#991b1b'
                    }}>
                      {branch.is_active ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}
                    </span>
                  </td>
                  <td style={{ padding: '12px', borderBottom: '1px solid #e5e7eb', textAlign: 'center' }}>
                    <button
                      onClick={() => handleEdit(branch)}
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
                      onClick={() => handleDelete(branch.id)}
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

export default Branches;
