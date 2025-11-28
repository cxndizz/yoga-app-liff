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
  const [qrModal, setQrModal] = useState({ open: false, course: null, image: '', loading: false, error: '' });
  const [showForm, setShowForm] = useState(false);

  const CHECKIN_PREFIX = 'yoga-checkin:';

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
        capacity: form.course_type === 'scheduled' && !form.unlimited_capacity ? Number(form.capacity) : 0,
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
    setShowForm(false);
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
    setShowForm(true);
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

  const buildQrPayload = (course) => {
    if (!course?.qr_checkin_code) return '';
    return `${CHECKIN_PREFIX}${course.qr_checkin_code}`;
  };

  const openQrForCourse = (course) => {
    if (!course?.qr_checkin_code) return;
    const payload = buildQrPayload(course);
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=520x520&data=${encodeURIComponent(payload)}`;
    setQrModal({ open: true, course, image: qrUrl, loading: false, error: '' });
  };

  const closeQrModal = () => setQrModal({ open: false, course: null, image: '', loading: false, error: '' });

  const handleDownloadQr = () => {
    if (!qrModal.image || !qrModal.course) return;
    const link = document.createElement('a');
    link.href = qrModal.image;
    link.download = `${qrModal.course.title || 'course'}-checkin-qr.png`;
    link.click();
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

  if (loading) {
    return (
      <div className="page">
        <div className="grid grid--3" style={{ gap: '20px' }}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="card">
              <div className="skeleton skeleton--title" />
              <div className="skeleton skeleton--text" />
              <div className="skeleton skeleton--text" style={{ width: '60%' }} />
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
          <h1 className="page__title">จัดการคอร์ส</h1>
          <p className="page__subtitle">สร้างและจัดการคอร์สเรียนทั้งหมด ({courses.length} คอร์ส)</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn btn--primary"
        >
          {showForm ? '✕ ปิดฟอร์ม' : '+ สร้างคอร์สใหม่'}
        </button>
      </div>

      {error && (
        <div className="page-alert page-alert--error" style={{ marginBottom: '24px' }}>
          {error}
        </div>
      )}

      {success && (
        <div className="page-alert page-alert--success" style={{ marginBottom: '24px' }}>
          {success}
        </div>
      )}

      {/* Course Form */}
      {showForm && (
        <div className="card" style={{ marginBottom: '32px', background: 'var(--color-surface-muted)' }}>
          <div className="card__header">
            <h2 className="card__title">
              {editingCourse ? `แก้ไขคอร์ส: ${editingCourse.title}` : 'สร้างคอร์สใหม่'}
            </h2>
          </div>
          {editingCourse && (
            <div className="page-alert page-alert--info" style={{ marginBottom: '16px' }}>
              กำลังแก้ไขคอร์ส: <strong>{editingCourse.title}</strong> (#{editingCourse.id})
            </div>
          )}
          <form onSubmit={handleSubmit} className="form-grid" style={{ gap: '20px' }}>
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
                <label className="field__label">
                  ประเภทคอร์ส *
                </label>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <label className="radio-label">
                    <input
                      type="radio"
                      name="course_type"
                      value="scheduled"
                      checked={form.course_type === 'scheduled'}
                      onChange={handleInputChange('course_type')}
                      disabled={submitting}
                    />
                    <span>Scheduled (มีรอบเรียน)</span>
                  </label>
                  <label className="radio-label">
                    <input
                      type="radio"
                      name="course_type"
                      value="standalone"
                      checked={form.course_type === 'standalone'}
                      onChange={handleInputChange('course_type')}
                      disabled={submitting}
                    />
                    <span>Standalone (ไม่มีรอบ)</span>
                  </label>
                </div>
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
                rows="3"
              />
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
                  <option value="">-- เลือกสาขา --</option>
                  {branches.map((branch) => (
                    <option key={branch.id} value={branch.id}>
                      {branch.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="field">
                <label className="field__label">ผู้สอน</label>
                <select
                  className="input"
                  value={form.instructor_id}
                  onChange={handleInputChange('instructor_id')}
                  disabled={submitting || instructors.length === 0}
                >
                  <option value="">-- เลือกผู้สอน --</option>
                  {instructors.map((instructor) => (
                    <option key={instructor.id} value={instructor.id}>
                      {instructor.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Capacity Fields */}
            <div className="form-grid form-grid--two">
              <div className="field">
                <label className="field__label">
                  {form.course_type === 'standalone' ? 'จำนวนผู้เรียนสูงสุด' : 'จำนวนที่รับ (Capacity)'}
                  {!form.unlimited_capacity && ' *'}
                </label>
                <input
                  type="number"
                  className="input"
                  min="0"
                  value={form.course_type === 'standalone' ? form.max_students : form.capacity}
                  onChange={handleInputChange(form.course_type === 'standalone' ? 'max_students' : 'capacity')}
                  disabled={submitting || form.unlimited_capacity}
                  placeholder={form.unlimited_capacity ? 'ไม่จำกัด' : ''}
                  required={!form.unlimited_capacity}
                />
              </div>

              <div className="field">
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={form.unlimited_capacity}
                    onChange={handleInputChange('unlimited_capacity')}
                    disabled={submitting}
                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                  />
                  <span className="field__label" style={{ marginBottom: 0 }}>ไม่จำกัดจำนวนคนซื้อ</span>
                </label>
              </div>
            </div>

            {form.course_type === 'standalone' && (
              <div className="field">
                <label className="field__label">วันปิดรับสมัคร (ถ้ามี)</label>
                <input
                  type="datetime-local"
                  className="input"
                  value={form.enrollment_deadline}
                  onChange={handleInputChange('enrollment_deadline')}
                  disabled={submitting}
                />
              </div>
            )}

            {/* Cover Image Upload */}
            <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', alignItems: 'flex-start' }}>
              <div style={{ flex: '1 1 300px' }}>
                <label className="field__label">รูปคอร์ส</label>
                <div style={{
                  border: '2px dashed var(--color-border)',
                  borderRadius: 'var(--radius-md)',
                  padding: '16px',
                  background: 'white',
                  marginTop: '8px',
                }}>
                  <input
                    key={coverInputKey}
                    type="file"
                    accept="image/*"
                    onChange={handleCoverChange}
                    disabled={submitting}
                    style={{
                      width: '100%',
                      padding: '8px',
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--radius-sm)',
                      background: 'white',
                    }}
                  />
                  <p className="helper-text" style={{ marginTop: '8px' }}>
                    ระบบจะบีบอัดและแปลงเป็น .webp ให้อัตโนมัติ (สูงสุด 6MB)
                  </p>
                  {imageProcessing && (
                    <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-accent)' }}>
                      <span className="spinner" style={{ width: '16px', height: '16px', borderWidth: '2px' }} />
                      <span style={{ fontSize: '13px' }}>กำลังแปลงรูป...</span>
                    </div>
                  )}
                </div>
              </div>

              {coverPreview && (
                <div style={{ flex: '0 0 200px' }}>
                  <label className="field__label">ตัวอย่าง</label>
                  <div style={{
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-md)',
                    padding: '12px',
                    background: 'white',
                    marginTop: '8px',
                  }}>
                    <img
                      src={coverPreview}
                      alt="ตัวอย่างรูปคอร์ส"
                      style={{
                        width: '100%',
                        height: '160px',
                        objectFit: 'cover',
                        borderRadius: 'var(--radius-md)',
                        marginBottom: '12px',
                      }}
                    />
                    <p className="helper-text" style={{ fontSize: '11px', marginBottom: '8px' }}>
                      {coverMeta?.size ? formatFileSize(coverMeta.size) : ''}
                    </p>
                    <button
                      type="button"
                      onClick={handleRemoveCover}
                      className="btn btn--danger btn--small"
                      style={{ width: '100%' }}
                    >
                      ลบรูป
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Price and Access */}
            <div className="form-grid form-grid--two">
              <div className="field">
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={form.is_free}
                    onChange={handleInputChange('is_free')}
                    disabled={submitting}
                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                  />
                  <span className="field__label" style={{ marginBottom: 0 }}>คอร์สฟรี</span>
                </label>
                {!form.is_free && (
                  <input
                    type="number"
                    className="input"
                    min="0"
                    step="1"
                    value={form.price_cents / 100}
                    onChange={(e) => setForm(prev => ({ ...prev, price_cents: Number(e.target.value) * 100 }))}
                    disabled={submitting}
                    placeholder="ราคา (บาท)"
                    style={{ marginTop: '12px' }}
                  />
                )}
              </div>

              <div className="field">
                <label className="field__label">เข้าได้กี่ครั้ง *</label>
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
                style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                {submitting && <span className="spinner" style={{ width: '14px', height: '14px', borderWidth: '2px' }} />}
                {submitting
                  ? (editingCourse ? 'กำลังบันทึก...' : 'กำลังสร้าง...')
                  : imageProcessing
                    ? 'กำลังแปลงรูป...'
                    : editingCourse
                      ? 'บันทึกการแก้ไข'
                      : 'สร้างคอร์ส'}
              </button>
              <button
                type="button"
                className="btn btn--ghost"
                onClick={handleCancelEdit}
                disabled={submitting}
              >
                ยกเลิก
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Courses Grid */}
      <div className="grid grid--auto-fit" style={{ gap: '20px', marginBottom: '24px' }}>
        {courses.length === 0 ? (
          <div className="card" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '60px 20px' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📚</div>
            <h3 style={{ marginBottom: '8px' }}>ยังไม่มีคอร์สในระบบ</h3>
            <p className="helper-text">คลิกปุ่ม "สร้างคอร์สใหม่" เพื่อเพิ่มคอร์สแรก</p>
          </div>
        ) : (
          visibleCourses.map((course) => (
            <div key={course.id} className="card" style={{ position: 'relative' }}>
              {course.cover_image_url ? (
                <img
                  src={course.cover_image_url}
                  alt={course.title}
                  style={{
                    width: '100%',
                    height: '180px',
                    objectFit: 'cover',
                    borderRadius: 'var(--radius-md)',
                    marginBottom: '16px',
                  }}
                />
              ) : (
                <div style={{
                  width: '100%',
                  height: '180px',
                  borderRadius: 'var(--radius-md)',
                  background: 'linear-gradient(135deg, #f3f4f6, #e5e7eb)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '48px',
                  marginBottom: '16px',
                }}>
                  📖
                </div>
              )}

              <div style={{
                position: 'absolute',
                top: '12px',
                right: '12px',
                display: 'flex',
                gap: '6px',
              }}>
                <span className={`badge ${(course.course_type || 'scheduled') === 'standalone' ? 'badge--warning' : 'badge--primary'}`}>
                  {(course.course_type || 'scheduled') === 'standalone' ? 'Standalone' : 'Scheduled'}
                </span>
                {course.is_free && <span className="badge badge--success">ฟรี</span>}
              </div>

              <h3 className="card__title" style={{ marginBottom: '8px' }}>
                {course.title}
              </h3>

              {course.description && (
                <p className="helper-text" style={{
                  marginBottom: '12px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                }}>
                  {course.description}
                </p>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                {course.branch_name && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
                    <span>🏢</span>
                    <span>{course.branch_name}</span>
                  </div>
                )}
                {course.instructor_name && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
                    <span>👨‍🏫</span>
                    <span>{course.instructor_name}</span>
                  </div>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
                  <span>💰</span>
                  <span style={{ fontWeight: '700', color: course.is_free ? '#059669' : 'var(--color-heading)' }}>
                    {course.is_free ? 'ฟรี' : formatPrice(course.price_cents || 0)}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
                  <span>🎫</span>
                  <span>
                    เข้าได้ {course.access_times} ครั้ง •{' '}
                    {course.unlimited_capacity
                      ? 'ไม่จำกัดที่นั่ง'
                      : `${(course.course_type || 'scheduled') === 'standalone'
                        ? `สูงสุด ${course.max_students || 0} คน`
                        : `รับ ${course.capacity || 0} คน/รอบ`
                      }`
                    }
                  </span>
                </div>
                {(course.course_type || 'scheduled') === 'scheduled' && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
                    <span>📅</span>
                    <span>{course.session_count || 0} รอบเรียน</span>
                  </div>
                )}
              </div>

              <div className="card__footer" style={{
                paddingTop: '16px',
                borderTop: '1px solid var(--color-border)',
                display: 'flex',
                gap: '8px',
                flexWrap: 'wrap',
              }}>
                <button
                  onClick={() => openQrForCourse(course)}
                  className="btn btn--outline btn--small"
                  style={{ flex: 1 }}
                >
                  QR Code
                </button>
                <button
                  onClick={() => handleEditCourse(course)}
                  className="btn btn--ghost btn--small"
                  style={{ flex: 1 }}
                >
                  แก้ไข
                </button>
                <button
                  onClick={() => handleDeleteCourse(course)}
                  className="btn btn--danger btn--small"
                  disabled={deletingCourseId === course.id}
                  style={{ flex: 1 }}
                >
                  {deletingCourseId === course.id ? 'ลบ...' : 'ลบ'}
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {!loading && courses.length > 0 && (
        <TablePagination
          page={page}
          pageSize={pageSize}
          totalItems={totalCourses}
          onPageChange={goToPage}
          onPageSizeChange={changePageSize}
        />
      )}

      {/* QR Modal */}
      {qrModal.open && (
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
          }}
          onClick={closeQrModal}
        >
          <div
            className="card"
            style={{
              maxWidth: '520px',
              width: '100%',
              position: 'relative',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={closeQrModal}
              className="btn btn--ghost btn--small"
              style={{
                position: 'absolute',
                top: '12px',
                right: '12px',
              }}
            >
              ✕
            </button>

            <h3 className="card__title" style={{ marginBottom: '8px' }}>
              QR Code สำหรับเช็คอินคอร์ส
            </h3>
            <p className="helper-text" style={{ marginBottom: '16px' }}>
              ใช้สำหรับติดที่หน้างาน ผู้เรียนสแกนเพื่อตัดสิทธิ์เข้าเรียนอัตโนมัติ
            </p>

            {qrModal.course && (
              <div style={{ marginBottom: '16px' }}>
                <span className="badge badge--primary">
                  {qrModal.course.title} (#{qrModal.course.id})
                </span>
              </div>
            )}

            <div style={{
              background: 'var(--color-surface-muted)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              padding: '20px',
              marginBottom: '16px',
              display: 'flex',
              justifyContent: 'center',
            }}>
              {qrModal.image ? (
                <img
                  src={qrModal.image}
                  alt="QR Code"
                  style={{
                    width: '100%',
                    maxWidth: '360px',
                    borderRadius: 'var(--radius-sm)',
                  }}
                />
              ) : (
                <div className="helper-text">ไม่สามารถสร้าง QR ได้</div>
              )}
            </div>

            {qrModal.error && (
              <div className="page-alert page-alert--error" style={{ marginBottom: '16px' }}>
                {qrModal.error}
              </div>
            )}

            <div className="page__actions">
              <button
                type="button"
                className="btn btn--ghost"
                onClick={closeQrModal}
              >
                ปิด
              </button>
              <button
                type="button"
                className="btn btn--primary"
                disabled={!qrModal.image}
                onClick={handleDownloadQr}
              >
                ดาวน์โหลด QR
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Courses;
