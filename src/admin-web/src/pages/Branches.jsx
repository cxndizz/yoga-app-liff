import React, { useState, useEffect } from 'react';
import axios from 'axios';
import TablePagination from '../components/common/TablePagination';
import usePagination from '../hooks/usePagination';

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

  const {
    page,
    pageSize,
    totalItems: totalBranches,
    paginatedItems: visibleBranches,
    setPage: goToPage,
    setPageSize: changePageSize,
  } = usePagination(branches);

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
    return <div className="page">กำลังโหลด...</div>;
  }

  return (
    <div className="page">
      <div className="page__header">
        <h1 className="page__title">จัดการสาขา</h1>
        <button
          onClick={() => setShowForm(true)}
          className="btn btn--primary"
        >
          เพิ่มสาขาใหม่
        </button>
      </div>

      {showForm && (
        <div className="page-card">
          <h2 className="page-card__title">{editingBranch ? 'แก้ไขสาขา' : 'เพิ่มสาขาใหม่'}</h2>
          <form onSubmit={handleSubmit}>
            <div className="field">
              <label className="field__label">ชื่อสาขา *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="input"
              />
            </div>

            <div className="field">
              <label className="field__label">ที่อยู่</label>
              <textarea
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                rows={3}
                className="textarea"
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
              <label className="field__label">ลิงก์แผนที่</label>
              <input
                type="url"
                value={formData.map_url}
                onChange={(e) => setFormData({ ...formData, map_url: e.target.value })}
                placeholder="https://maps.google.com/..."
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
                className="btn btn--primary"
              >
                บันทึก
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
              <th>ชื่อสาขา</th>
              <th>ที่อยู่</th>
              <th>เบอร์โทร</th>
              <th>สถานะ</th>
              <th>จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {visibleBranches.length === 0 ? (
              <tr>
                <td colSpan={5}>
                  <div className="empty-state">ไม่มีข้อมูลสาขา</div>
                </td>
              </tr>
            ) : (
              visibleBranches.map((branch) => (
                <tr key={branch.id}>
                  <td>{branch.name}</td>
                  <td>
                    {branch.address || '-'}
                  </td>
                  <td>
                    {branch.phone || '-'}
                  </td>
                  <td>
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
                  <td>
                    <button
                      onClick={() => handleEdit(branch)}
                      className="btn btn--small"
                    >
                      แก้ไข
                    </button>
                    <button
                      onClick={() => handleDelete(branch.id)}
                      className="btn btn--small btn--danger"
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
        totalItems={totalBranches}
        onPageChange={goToPage}
        onPageSizeChange={changePageSize}
      />
    </div>
  );
}

export default Branches;
