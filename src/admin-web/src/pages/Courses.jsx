import React, { useEffect, useState } from 'react';
import axios from 'axios';
import TablePagination from '../components/common/TablePagination';
import usePagination from '../hooks/usePagination';
import { convertImageFileToWebP } from '../utils/image';
import { apiBase } from '../config';

const defaultFormValues = {
  title: '',
  description: '',
  branch_id: '',
  instructor_id: '',
  capacity: 10,
  is_free: false,
  price_cents: 0,
  access_times: 1,
  cover_image_url: '',
  course_type: 'scheduled',
  max_students: 20,
  enrollment_deadline: '',
  unlimited_capacity: false,
};

function Courses() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [form, setForm] = useState(() => ({ ...defaultFormValues }));
  const [branches, setBranches] = useState([]);
  const [instructors, setInstructors] = useState([]);
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
    fetchBranches();
    fetchInstructors();
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
      const res = await axios.post(`${apiBase}/api/admin/courses/list`, {});
      setCourses(res.data || []);
      setError('');
    } catch (err) {
      console.error('Error fetching courses:', err);
      setError('ไม่สามารถโหลดข้อมูลคอร์สได้');
    } finally {
      setLoading(false);
    }
  };

  const fetchBranches = async () => {
    try {
      const res = await axios.post(`${apiBase}/api/admin/branches/list`, {});
      setBranches(res.data || []);
    } catch (err) {
      console.error('Error fetching branches:', err);
    }
  };

  const fetchInstructors = async () => {
    try {
      const res = await axios.post(`${apiBase}/api/admin/instructors/list`, {});
      // API already returns the full instructors array
      setInstructors(res.data || []);
    } catch (err) {
      console.error('Error fetching instructors:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.title.trim()) {
      setError('กรุณากรอกชื่อคอร์ส');
      return;
    }

    // Validation for capacity
    if (form.course_type === 'standalone' && !form.unlimited_capacity && !form.max_students) {
      setError('กรุณาระบุจำนวนผู้เรียนสูงสุด หรือเลือก "ไม่จำกัดจำนวนคนซื้อ"');
      return;
    }
    if (form.course_type === 'scheduled' && !form.unlimited_capacity && !form.capacity) {
      setError('กรุณาระบุจำนวนที่รับ (Capacity) หรือเลือก "ไม่จำกัดจำนวนคนซื้อ"');
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
        branch_id: form.branch_id ? Number(form.branch_id) : null,
        instructor_id: form.instructor_id ? Number(form.instructor_id) : null,
        capacity: form.course_type === 'scheduled' && !form.unlimited_capacity ? Number(form.capacity) : null,
        price_cents: form.is_free ? 0 : Number(form.price_cents),
        access_times: Number(form.access_times),
        cover_image_url: form.cover_image_url || null,
        course_type: form.course_type,
        max_students: form.course_type === 'standalone' && !form.unlimited_capacity ? Number(form.max_students) : null,
        enrollment_deadline: form.course_type === 'standalone' && form.enrollment_deadline ? form.enrollment_deadline : null,
        unlimited_capacity: form.unlimited_capacity,
      };

      if (editingCourse) {
        await axios.post(`${apiBase}/api/admin/courses/update`, {
          id: editingCourse.id,
          ...payload,
        });
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
      branch_id: course.branch_id || '',
      instructor_id: course.instructor_id || '',
      capacity: typeof course.capacity === 'number' ? course.capacity : defaultFormValues.capacity,
      is_free: !!course.is_free,
      price_cents: course.price_cents || 0,
      access_times: typeof course.access_times === 'number' ? course.access_times : defaultFormValues.access_times,
      cover_image_url: course.cover_image_url || '',
      course_type: course.course_type || 'scheduled',
      max_students: course.max_students || defaultFormValues.max_students,
      enrollment_deadline: course.enrollment_deadline || '',
      unlimited_capacity: !!course.unlimited_capacity,
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
      await axios.post(`${apiBase}/api/admin/courses/delete`, { id: course.id });
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
              <label className="field__label">จำนวนที่รับ (Capacity) {form.course_type === 'scheduled' && !form.unlimited_capacity && '*'}</label>
              <input
                type="number"
                className="input"
                min="0"
                value={form.capacity}
                onChange={handleInputChange('capacity')}
                disabled={submitting || form.unlimited_capacity}
                placeholder={form.unlimited_capacity ? 'ไม่จำกัด' : ''}
                required={form.course_type === 'scheduled' && !form.unlimited_capacity}
                style={{
                  background: form.unlimited_capacity ? '#f3f4f6' : '#fff',
                  cursor: form.unlimited_capacity ? 'not-allowed' : 'text'
                }}
              />
              {form.unlimited_capacity && (
                <p style={{ marginTop: '6px', fontSize: '12px', color: '#6b7280' }}>
                  ไม่จำกัดจำนวนที่รับ - ปิดการใช้งานเนื่องจากเปิดใช้ Unlimited Capacity
                </p>
              )}
            </div>
          </div>

          <div className="form-grid form-grid--two">
            <div className="field">
              <label className="field__label">สาขา</label>
              <select
                className="input"
                value={form.branch_id}
                onChange={handleInputChange('branch_id')}
                disabled={submitting || branches.length === 0}
              >
                <option value="">เลือกสาขา (ถ้ามี)</option>
                {branches.map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.name}
                  </option>
                ))}
              </select>
              {branches.length === 0 && (
                <p style={{ marginTop: '6px', fontSize: '12px', color: '#6b7280' }}>
                  ยังไม่มีข้อมูลสาขาในระบบ
                </p>
              )}
            </div>

            <div className="field">
              <label className="field__label">ผู้สอน</label>
              <select
                className="input"
                value={form.instructor_id}
                onChange={handleInputChange('instructor_id')}
                disabled={submitting || instructors.length === 0}
              >
                <option value="">เลือกผู้สอน (ถ้ามี)</option>
                {instructors.map((instructor) => (
                  <option key={instructor.id} value={instructor.id}>
                    {instructor.name}
                  </option>
                ))}
              </select>
              {instructors.length === 0 && (
                <p style={{ marginTop: '6px', fontSize: '12px', color: '#6b7280' }}>
                  ยังไม่มีข้อมูลผู้สอนในระบบ
                </p>
              )}
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

          {/* Course Type Selection */}
          <div className="field">
            <label className="field__label" style={{ marginBottom: '12px' }}>
              ประเภทคอร์ส *
            </label>
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              <label style={{
                flex: '1 1 240px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                padding: '16px',
                border: `2px solid ${form.course_type === 'scheduled' ? '#6366f1' : '#e5e7eb'}`,
                borderRadius: '12px',
                background: form.course_type === 'scheduled' ? '#eef2ff' : '#fff',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="radio"
                    name="course_type"
                    value="scheduled"
                    checked={form.course_type === 'scheduled'}
                    onChange={handleInputChange('course_type')}
                    disabled={submitting}
                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                  />
                  <span style={{ fontWeight: '600', fontSize: '15px', color: form.course_type === 'scheduled' ? '#4f46e5' : '#111827' }}>
                    Scheduled Course (มีรอบเรียน)
                  </span>
                </div>
                <p style={{ marginLeft: '26px', fontSize: '13px', color: '#6b7280', marginTop: '4px' }}>
                  เหมาะสำหรับ: คอร์สที่ต้องจองรอบเรียน, Workshop ที่มีกำหนดการ
                </p>
              </label>

              <label style={{
                flex: '1 1 240px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                padding: '16px',
                border: `2px solid ${form.course_type === 'standalone' ? '#6366f1' : '#e5e7eb'}`,
                borderRadius: '12px',
                background: form.course_type === 'standalone' ? '#eef2ff' : '#fff',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="radio"
                    name="course_type"
                    value="standalone"
                    checked={form.course_type === 'standalone'}
                    onChange={handleInputChange('course_type')}
                    disabled={submitting}
                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                  />
                  <span style={{ fontWeight: '600', fontSize: '15px', color: form.course_type === 'standalone' ? '#4f46e5' : '#111827' }}>
                    Standalone Course (ไม่มีรอบเรียน)
                  </span>
                </div>
                <p style={{ marginLeft: '26px', fontSize: '13px', color: '#6b7280', marginTop: '4px' }}>
                  เหมาะสำหรับ: Online Course, Video Course, Drop-in Class, Package
                </p>
              </label>
            </div>
          </div>

          {/* Unlimited Capacity Option - Available for all course types */}
          <div className="field">
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '14px',
              background: form.unlimited_capacity ? '#f0fdf4' : '#f9fafb',
              border: `2px solid ${form.unlimited_capacity ? '#10b981' : '#e5e7eb'}`,
              borderRadius: '10px',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}>
              <input
                type="checkbox"
                checked={form.unlimited_capacity}
                onChange={handleInputChange('unlimited_capacity')}
                disabled={submitting}
                style={{ width: '20px', height: '20px', cursor: 'pointer' }}
              />
              <div style={{ flex: 1 }}>
                <span style={{ fontWeight: '600', fontSize: '15px', color: form.unlimited_capacity ? '#059669' : '#111827' }}>
                  ไม่จำกัดจำนวนคนซื้อ (Unlimited Capacity)
                </span>
                <p style={{ marginTop: '4px', fontSize: '13px', color: '#6b7280' }}>
                  {form.course_type === 'standalone'
                    ? 'คอร์สจะเปิดให้ซื้อได้ตลอด ไม่มี Limit (ยังคงป้องกันการซื้อซ้ำต่อผู้ใช้)'
                    : 'รอบเรียนสามารถรับผู้เรียนได้ไม่จำกัด (ยังคงป้องกันการซื้อซ้ำต่อผู้ใช้)'
                  }
                </p>
              </div>
            </label>
          </div>

          {/* Conditional Fields Based on Course Type */}
          {form.course_type === 'standalone' ? (
            // Standalone Course Fields
            <div className="form-grid form-grid--two">
              <div className="field">
                <label className="field__label">
                  จำนวนผู้เรียนสูงสุด (ทั้งหมด) {!form.unlimited_capacity && '*'}
                </label>
                <input
                  type="number"
                  className="input"
                  min="1"
                  value={form.max_students}
                  onChange={handleInputChange('max_students')}
                  disabled={submitting || form.unlimited_capacity}
                  placeholder={form.unlimited_capacity ? 'ไม่จำกัด' : 'เช่น 50'}
                  required={!form.unlimited_capacity}
                  style={{
                    background: form.unlimited_capacity ? '#f3f4f6' : '#fff',
                    cursor: form.unlimited_capacity ? 'not-allowed' : 'text'
                  }}
                />
                <p style={{ marginTop: '6px', fontSize: '12px', color: '#6b7280' }}>
                  {form.unlimited_capacity
                    ? 'ไม่จำกัดจำนวนผู้เรียน - ปิดการใช้งานเนื่องจากเปิดใช้ Unlimited Capacity'
                    : 'จำกัดจำนวนผู้เรียนทั้งหมดที่สามารถลงทะเบียนได้'
                  }
                </p>
              </div>

              <div className="field">
                <label className="field__label">วันปิดรับสมัคร (ถ้ามี)</label>
                <input
                  type="datetime-local"
                  className="input"
                  value={form.enrollment_deadline}
                  onChange={handleInputChange('enrollment_deadline')}
                  disabled={submitting}
                />
                <p style={{ marginTop: '6px', fontSize: '12px', color: '#6b7280' }}>
                  ไม่บังคับ - หากไม่ระบุจะเปิดรับสมัครตลอด
                </p>
              </div>
            </div>
          ) : (
            // Scheduled Course Fields
            null
          )}

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
                  <th>สาขา</th>
                  <th>ผู้สอน</th>
                  <th>ประเภทคอร์ส</th>
                  <th style={{ textAlign: 'center' }}>รอบเรียน</th>
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
                      {course.branch_name || '-'}
                    </td>
                    <td style={{ padding: '12px 8px' }}>
                      {course.instructor_name || '-'}
                    </td>
                    <td style={{ padding: '12px 8px' }}>
                      <span style={{
                        padding: '4px 10px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: '500',
                        background: (course.course_type || 'scheduled') === 'standalone' ? '#fef3c7' : '#dbeafe',
                        color: (course.course_type || 'scheduled') === 'standalone' ? '#92400e' : '#1e40af',
                      }}>
                        {(course.course_type || 'scheduled') === 'standalone' ? 'Standalone' : 'Scheduled'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 8px', textAlign: 'center', color: '#6b7280' }}>
                      {(course.course_type || 'scheduled') === 'scheduled'
                        ? `${course.session_count || 0} รอบ`
                        : '-'
                      }
                    </td>
                    <td style={{ padding: '12px 8px', textAlign: 'right', fontWeight: '500' }}>
                      {course.is_free ? (
                        <span style={{ color: '#059669', fontWeight: '600' }}>ฟรี</span>
                      ) : (
                        formatPrice(course.price_cents || 0)
                      )}
                    </td>
                    <td style={{ padding: '12px 8px', textAlign: 'center' }}>
                      {course.unlimited_capacity
                        ? <span style={{ color: '#059669', fontWeight: '600' }}>ไม่จำกัด</span>
                        : ((course.course_type || 'scheduled') === 'standalone'
                            ? `${course.max_students || 0}`
                            : course.capacity
                          )
                      }
                    </td>
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