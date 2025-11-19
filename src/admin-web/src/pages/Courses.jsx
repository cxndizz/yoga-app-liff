import React, { useEffect, useState } from 'react';
import axios from 'axios';
import TablePagination from '../components/common/TablePagination';
import usePagination from '../hooks/usePagination';
import { convertImageFileToWebP } from '../utils/image';

const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

const defaultFormValues = {
  title: '',
  description: '',
  capacity: 10,
  is_free: false,
  price_cents: 0,
  access_times: 1,
  cover_image_url: '',
};

function Courses() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [form, setForm] = useState(() => ({ ...defaultFormValues }));
  const [coverPreview, setCoverPreview] = useState('');
  const [coverMeta, setCoverMeta] = useState(null);
  const [imageProcessing, setImageProcessing] = useState(false);
  const [coverInputKey, setCoverInputKey] = useState(0);
  const [editingCourse, setEditingCourse] = useState(null);
  const [deletingCourseId, setDeletingCourseId] = useState(null);

  const {
    page,
    pageSize,
    totalItems: totalCourses,
    paginatedItems: visibleCourses,
    setPage: goToPage,
    setPageSize: changePageSize,
  } = usePagination(courses);

  useEffect(() => {
    fetchCourses();
  }, []);

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${apiBase}/api/admin/courses`);
      setCourses(res.data || []);
      setError('');
    } catch (err) {
      console.error('Error fetching courses:', err);
      setError('ไม่สามารถโหลดข้อมูลคอร์สได้');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!form.title.trim()) {
      setError('กรุณากรอกชื่อคอร์ส');
      return;
    }

    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const payload = {
        ...form,
        title: form.title.trim(),
        description: form.description.trim(),
        capacity: Number(form.capacity),
        price_cents: form.is_free ? 0 : Number(form.price_cents),
        access_times: Number(form.access_times),
        cover_image_url: form.cover_image_url || null,
      };

      if (editingCourse) {
        await axios.put(`${apiBase}/api/admin/courses/${editingCourse.id}`, payload);
        setSuccess('อัปเดตคอร์สสำเร็จ');
      } else {
        await axios.post(`${apiBase}/api/admin/courses`, payload);
        setSuccess('สร้างคอร์สสำเร็จ');
      }

      resetForm();
      await fetchCourses();
    } catch (err) {
      console.error('Error creating course:', err);
      setError(err.response?.data?.message || 'ไม่สามารถบันทึกคอร์สได้');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setForm({ ...defaultFormValues });
    setCoverPreview('');
    setCoverMeta(null);
    setCoverInputKey((prev) => prev + 1);
    setEditingCourse(null);
  };

  const handleEditCourse = (course) => {
    setEditingCourse(course);
    setForm({
      title: course.title || '',
      description: course.description || '',
      capacity: typeof course.capacity === 'number' ? course.capacity : defaultFormValues.capacity,
      is_free: !!course.is_free,
      price_cents: course.price_cents || 0,
      access_times: typeof course.access_times === 'number' ? course.access_times : defaultFormValues.access_times,
      cover_image_url: course.cover_image_url || '',
    });
    setCoverPreview(course.cover_image_url || '');
    setCoverMeta(null);
    setSuccess('');
    setError('');
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleCancelEdit = () => {
    resetForm();
  };

  const handleDeleteCourse = async (course) => {
    if (!confirm(`ยืนยันการลบคอร์ส "${course.title}" ?`)) {
      return;
    }
    setDeletingCourseId(course.id);
    setError('');
    setSuccess('');
    try {
      await axios.delete(`${apiBase}/api/admin/courses/${course.id}`);
      setSuccess('ลบคอร์สสำเร็จ');
      if (editingCourse?.id === course.id) {
        resetForm();
      }
      await fetchCourses();
    } catch (err) {
      console.error('Error deleting course:', err);
      setError(err.response?.data?.message || 'ไม่สามารถลบคอร์สได้');
    } finally {
      setDeletingCourseId(null);
    }
  };

  const handleInputChange = (field) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleCoverChange = async (event) => {
    const inputEl = event.target;
    const file = inputEl.files?.[0];
    if (!file) {
      return;
    }
    inputEl.value = '';
    setImageProcessing(true);
    try {
      const { dataUrl, size } = await convertImageFileToWebP(file, { maxSizeMB: 6, quality: 0.9 });
      setForm((prev) => ({ ...prev, cover_image_url: dataUrl }));
      setCoverPreview(dataUrl);
      setCoverMeta({ size });
      setError('');
      setCoverInputKey((prev) => prev + 1);
    } catch (err) {
      console.error('Error converting cover image:', err);
      setError(err.message || 'ไม่สามารถแปลงรูปภาพได้');
    } finally {
      setImageProcessing(false);
    }
  };

  const handleRemoveCover = () => {
    setForm((prev) => ({ ...prev, cover_image_url: '' }));
    setCoverPreview('');
    setCoverMeta(null);
    setCoverInputKey((prev) => prev + 1);
  };

  const formatPrice = (cents) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB',
      minimumFractionDigits: 0,
    }).format(cents / 100);
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '';
    if (bytes < 1024) {
      return `${bytes} B`;
    }
    if (bytes < 1024 * 1024) {
      return `${Math.round(bytes / 1024)} KB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="page">
      <div className="page__header">
        <div>
          <h1 className="page__title">จัดการคอร์ส</h1>
          <p className="page__subtitle">สร้างและจัดการคอร์สเรียนทั้งหมด</p>
        </div>
      </div>

      {error && (
        <div className="page-alert page-alert--error">
          {error}
        </div>
      )}

      {success && (
        <div className="page-alert page-alert--success">
          {success}
        </div>
      )}

      <div className="page-card">
        <div className="page-card__header">
          <h2 className="page-card__title">
            {editingCourse ? 'แก้ไขคอร์ส' : 'สร้างคอร์สใหม่'}
          </h2>
        </div>
        {editingCourse && (
          <div style={{
            marginTop: '12px',
            marginBottom: '8px',
            background: '#eef2ff',
            border: '1px solid #c7d2fe',
            color: '#3730a3',
            padding: '10px 14px',
            borderRadius: '10px',
            fontSize: '14px'
          }}>
            กำลังแก้ไขคอร์ส: <strong>{editingCourse.title}</strong> (#{editingCourse.id})
          </div>
        )}
        <form onSubmit={handleSubmit} className="form-grid" style={{ marginTop: '16px' }}>
          <div className="form-grid form-grid--two">
            <div className="field">
              <label className="field__label">ชื่อคอร์ส *</label>
              <input
                type="text"
                className="input"
                placeholder="เช่น Yoga for Beginners"
                value={form.title}
                onChange={handleInputChange('title')}
                disabled={submitting}
                required
              />
            </div>

            <div className="field">
              <label className="field__label">จำนวนที่รับ (Capacity)</label>
              <input
                type="number"
                className="input"
                min="0"
                value={form.capacity}
                onChange={handleInputChange('capacity')}
                disabled={submitting}
              />
            </div>
          </div>

          <div className="field">
            <label className="field__label">รายละเอียด</label>
            <textarea
              className="textarea"
              placeholder="อธิบายเกี่ยวกับคอร์สนี้..."
              value={form.description}
              onChange={handleInputChange('description')}
              disabled={submitting}
              rows="4"
            />
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'stretch' }}>
            <label style={{
              flex: '1 1 240px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px'
            }}>
              <span style={{ fontWeight: '500', fontSize: '14px' }}>รูปคอร์ส</span>
              <div style={{
                border: '1px dashed #cbd5f5',
                borderRadius: '12px',
                padding: '16px',
                background: '#f9fafb',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}>
                <input
                  key={coverInputKey}
                  type="file"
                  accept="image/*"
                  onChange={handleCoverChange}
                  disabled={submitting}
                  style={{
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    padding: '8px',
                    background: '#fff'
                  }}
                />
                <span style={{ fontSize: '12px', color: '#6b7280' }}>
                  รองรับไฟล์ JPG/PNG และระบบจะแปลงเป็น .webp ให้อัตโนมัติ (สูงสุด 6MB)
                </span>
                {imageProcessing && (
                  <span style={{ fontSize: '12px', color: '#2563eb' }}>กำลังแปลงรูป...</span>
                )}
              </div>
            </label>

            {coverPreview && (
              <div style={{
                flex: '0 0 220px',
                border: '1px solid #e5e7eb',
                borderRadius: '12px',
                padding: '12px',
                background: '#fff',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}>
                <img
                  src={coverPreview}
                  alt="ตัวอย่างรูปคอร์ส"
                  style={{ width: '100%', height: '140px', objectFit: 'cover', borderRadius: '8px' }}
                />
                <div style={{ fontSize: '12px', color: '#6b7280' }}>
                  บันทึกเป็น WebP · {coverMeta?.size ? formatFileSize(coverMeta.size) : 'ขนาดไม่ระบุ'}
                </div>
                <button
                  type="button"
                  onClick={handleRemoveCover}
                  style={{
                    border: 'none',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    background: '#fee2e2',
                    color: '#b91c1c',
                    cursor: 'pointer'
                  }}
                >
                  ลบรูปนี้
                </button>
              </div>
            )}
          </div>

          <div className="form-grid form-grid--two">
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px',
              background: '#f9fafb',
              borderRadius: '8px',
              cursor: 'pointer',
            }}>
              <input
                type="checkbox"
                checked={form.is_free}
                onChange={handleInputChange('is_free')}
                disabled={submitting}
                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
              />
              <span style={{ fontWeight: '500', fontSize: '14px' }}>คอร์สฟรี</span>
            </label>

            {!form.is_free && (
              <div className="field">
                <label className="field__label">ราคา (บาท)</label>
                <input
                  type="number"
                  className="input"
                  min="0"
                  step="1"
                  value={form.price_cents / 100}
                  onChange={(e) => setForm(prev => ({ ...prev, price_cents: Number(e.target.value) * 100 }))}
                  disabled={submitting}
                />
              </div>
            )}

            <div className="field">
              <label className="field__label">เข้าได้กี่ครั้ง</label>
              <input
                type="number"
                className="input"
                min="1"
                value={form.access_times}
                onChange={handleInputChange('access_times')}
                disabled={submitting}
              />
            </div>
          </div>

          <div className="page__actions">
            <button
              type="submit"
              className="btn btn--primary"
              disabled={submitting || imageProcessing}
            >
              {submitting
                ? (editingCourse ? 'กำลังบันทึก...' : 'กำลังสร้าง...')
                : imageProcessing
                  ? 'กำลังแปลงรูป...'
                  : editingCourse
                    ? 'บันทึกการแก้ไข'
                    : 'สร้างคอร์ส'}
            </button>
            {editingCourse && (
              <button
                type="button"
                className="btn btn--ghost"
                onClick={handleCancelEdit}
                disabled={submitting}
              >
                ยกเลิกการแก้ไข
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="page-card">
        <h2 className="page-card__title" style={{ marginBottom: '16px' }}>รายการคอร์สทั้งหมด</h2>

        {loading ? (
          <div className="empty-state">
            กำลังโหลด...
          </div>
        ) : courses.length === 0 ? (
          <div className="empty-state">
            ยังไม่มีคอร์สในระบบ
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>รูป</th>
                  <th>ชื่อคอร์ส</th>
                  <th>รายละเอียด</th>
                  <th>ประเภท</th>
                  <th style={{ textAlign: 'right' }}>ราคา</th>
                  <th style={{ textAlign: 'center' }}>ที่รับ</th>
                  <th style={{ textAlign: 'center' }}>เข้าได้</th>
                  <th style={{ textAlign: 'center' }}>จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {visibleCourses.map((course) => (
                  <tr key={course.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '12px 8px', color: '#6b7280' }}>#{course.id}</td>
                    <td style={{ padding: '12px 8px' }}>
                      {course.cover_image_url ? (
                        <img
                          src={course.cover_image_url}
                          alt={course.title}
                          style={{ width: '72px', height: '72px', objectFit: 'cover', borderRadius: '10px', border: '1px solid #e5e7eb' }}
                        />
                      ) : (
                        <div style={{
                          width: '72px',
                          height: '72px',
                          borderRadius: '10px',
                          background: '#f3f4f6',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#9ca3af',
                          fontSize: '12px'
                        }}>
                          ไม่มีรูป
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '12px 8px', fontWeight: '500' }}>{course.title}</td>
                    <td style={{ padding: '12px 8px', color: '#6b7280', maxWidth: '220px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {course.description || '-'}
                    </td>
                    <td style={{ padding: '12px 8px' }}>
                      <span style={{
                        padding: '4px 10px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: '500',
                        background: course.is_free ? '#d1fae5' : '#dbeafe',
                        color: course.is_free ? '#065f46' : '#1e40af',
                      }}>
                        {course.is_free ? 'ฟรี' : 'เสียเงิน'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 8px', textAlign: 'right', fontWeight: '500' }}>
                      {course.is_free ? '-' : formatPrice(course.price_cents || 0)}
                    </td>
                    <td style={{ padding: '12px 8px', textAlign: 'center' }}>{course.capacity}</td>
                    <td style={{ padding: '12px 8px', textAlign: 'center' }}>{course.access_times} ครั้ง</td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
                        <button
                          type="button"
                          className="btn btn--ghost btn--small"
                          onClick={() => handleEditCourse(course)}
                        >
                          แก้ไข
                        </button>
                        <button
                          type="button"
                          className="btn btn--danger btn--small"
                          onClick={() => handleDeleteCourse(course)}
                          disabled={deletingCourseId === course.id}
                        >
                          {deletingCourseId === course.id ? 'กำลังลบ...' : 'ลบ'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {!loading && (
          <TablePagination
            page={page}
            pageSize={pageSize}
            totalItems={totalCourses}
            onPageChange={goToPage}
            onPageSizeChange={changePageSize}
          />
        )}
      </div>
    </div>
  );
}

export default Courses;