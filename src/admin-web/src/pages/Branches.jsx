import React, { useState, useEffect } from 'react';
import axios from 'axios';
import TablePagination from '../components/common/TablePagination';
import usePagination from '../hooks/usePagination';
import { apiBase } from '../config';

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
      const response = await axios.post(`${apiBase}/api/admin/branches/list`, {});
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
        await axios.post(`${apiBase}/api/admin/branches/update`, {
          id: editingBranch.id,
          ...formData,
        });
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
      await axios.post(`${apiBase}/api/admin/branches/delete`, { id: branchId });
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
    return (
      <div className="page">
        <div className="grid grid--3" style={{ gap: '20px' }}>
          {[1, 2, 3].map((i) => (
            <div key={i} className="card">
              <div className="skeleton skeleton--title" />
              <div className="skeleton skeleton--text" />
              <div className="skeleton skeleton--text" style={{ width: '70%' }} />
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
          <h1 className="page__title">จัดการสาขา</h1>
          <p className="page__subtitle">ข้อมูลสาขาทั้งหมดของ Namaste Yoga</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="btn btn--primary"
        >
          + เพิ่มสาขาใหม่
        </button>
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: '32px', background: 'var(--color-surface-muted)' }}>
          <div className="card__header">
            <h2 className="card__title">{editingBranch ? 'แก้ไขสาขา' : 'เพิ่มสาขาใหม่'}</h2>
          </div>
          <form onSubmit={handleSubmit} className="form-grid" style={{ gap: '20px' }}>
            <div className="field">
              <label className="field__label">ชื่อสาขา *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="input"
                placeholder="เช่น Namaste Yoga Silom"
              />
            </div>

            <div className="field">
              <label className="field__label">ที่อยู่</label>
              <textarea
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                rows={3}
                className="textarea"
                placeholder="ที่อยู่สาขา"
              />
            </div>

            <div className="form-grid form-grid--two">
              <div className="field">
                <label className="field__label">เบอร์โทร</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="input"
                  placeholder="02-123-4567"
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

      <div className="grid grid--auto-fit" style={{ gap: '20px', marginBottom: '24px' }}>
        {visibleBranches.length === 0 ? (
          <div className="card" style={{ gridColumn: '1 / -1' }}>
            <p className="helper-text" style={{ textAlign: 'center', padding: '40px 0', margin: 0 }}>
              ไม่มีข้อมูลสาขา
            </p>
          </div>
        ) : (
          visibleBranches.map((branch) => (
            <div
              key={branch.id}
              className="card"
              style={{
                borderColor: branch.is_active ? 'var(--color-border)' : '#fee2e2',
                background: branch.is_active ? 'white' : '#fef2f2',
              }}
            >
              <div className="card__header" style={{ marginBottom: '16px' }}>
                <div style={{ flex: 1 }}>
                  <h3 className="card__title" style={{ marginBottom: '8px' }}>
                    {branch.name}
                  </h3>
                  <span className={`badge ${branch.is_active ? 'badge--success' : 'badge--danger'}`}>
                    {branch.is_active ? '🟢 เปิดใช้งาน' : '🔴 ปิดใช้งาน'}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>
                {branch.address && (
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                    <span style={{ fontSize: '18px' }}>📍</span>
                    <div style={{ flex: 1 }}>
                      <p className="helper-text" style={{ margin: 0 }}>ที่อยู่</p>
                      <p style={{ margin: '4px 0 0', fontSize: '14px', color: 'var(--color-heading)' }}>
                        {branch.address}
                      </p>
                    </div>
                  </div>
                )}

                {branch.phone && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '18px' }}>📞</span>
                    <div style={{ flex: 1 }}>
                      <p className="helper-text" style={{ margin: 0 }}>เบอร์โทร</p>
                      <p style={{ margin: '4px 0 0', fontSize: '14px', color: 'var(--color-heading)', fontWeight: '600' }}>
                        {branch.phone}
                      </p>
                    </div>
                  </div>
                )}

                {branch.map_url && (
                  <a
                    href={branch.map_url}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn--outline btn--small"
                    style={{ textDecoration: 'none', textAlign: 'center' }}
                  >
                    🗺️ ดูแผนที่
                  </a>
                )}
              </div>

              <div className="card__footer" style={{ paddingTop: '16px', borderTop: '1px solid var(--color-border)' }}>
                <button
                  onClick={() => handleEdit(branch)}
                  className="btn btn--outline btn--small"
                  style={{ flex: 1 }}
                >
                  แก้ไข
                </button>
                <button
                  onClick={() => handleDelete(branch.id)}
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

      {!loading && branches.length > 0 && (
        <TablePagination
          page={page}
          pageSize={pageSize}
          totalItems={totalBranches}
          onPageChange={goToPage}
          onPageSizeChange={changePageSize}
        />
      )}
    </div>
  );
}

export default Branches;
