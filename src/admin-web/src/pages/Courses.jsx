import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { convertImageFileToWebP } from '../utils/image';

const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

function Courses() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [form, setForm] = useState({
    title: '',
    description: '',
    capacity: 10,
    is_free: false,
    price_cents: 0,
    access_times: 1,
    cover_image_url: '',
  });
  const [coverPreview, setCoverPreview] = useState('');
  const [coverMeta, setCoverMeta] = useState(null);
  const [imageProcessing, setImageProcessing] = useState(false);
  const [coverInputKey, setCoverInputKey] = useState(0);

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
      const res = await axios.get(`${apiBase}/courses`);
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
      await axios.post(`${apiBase}/courses`, {
        ...form,
        title: form.title.trim(),
        description: form.description.trim(),
        capacity: Number(form.capacity),
        price_cents: form.is_free ? 0 : Number(form.price_cents),
        access_times: Number(form.access_times),
        cover_image_url: form.cover_image_url || null,
      });

      setForm({
        title: '',
        description: '',
        capacity: 10,
        is_free: false,
        price_cents: 0,
        access_times: 1,
        cover_image_url: '',
      });
      setCoverPreview('');
      setCoverMeta(null);
      setCoverInputKey((prev) => prev + 1);

      setSuccess('สร้างคอร์สสำเร็จ');
      await fetchCourses();
    } catch (err) {
      console.error('Error creating course:', err);
      setError(err.response?.data?.message || 'ไม่สามารถสร้างคอร์สได้');
    } finally {
      setSubmitting(false);
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
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '700', marginBottom: '8px' }}>จัดการคอร์ส</h1>
        <p style={{ color: '#6b7280', margin: 0 }}>สร้างและจัดการคอร์สเรียนทั้งหมด</p>
      </div>

      {error && (
        <div style={{
          background: '#fee2e2',
          border: '1px solid #fecaca',
          color: '#991b1b',
          padding: '12px 16px',
          borderRadius: '8px',
          marginBottom: '16px',
        }}>
          {error}
        </div>
      )}

      {success && (
        <div style={{
          background: '#d1fae5',
          border: '1px solid #a7f3d0',
          color: '#065f46',
          padding: '12px 16px',
          borderRadius: '8px',
          marginBottom: '16px',
        }}>
          {success}
        </div>
      )}

      <div style={{
        background: '#fff',
        borderRadius: '12px',
        padding: '24px',
        marginBottom: '32px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      }}>
        <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '16px' }}>สร้างคอร์สใหม่</h2>
        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <span style={{ fontWeight: '500', fontSize: '14px' }}>ชื่อคอร์ส *</span>
              <input
                type="text"
                placeholder="เช่น Yoga for Beginners"
                value={form.title}
                onChange={handleInputChange('title')}
                disabled={submitting}
                required
                style={{
                  padding: '10px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '15px',
                }}
              />
            </label>

            <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <span style={{ fontWeight: '500', fontSize: '14px' }}>จำนวนที่รับ (Capacity)</span>
              <input
                type="number"
                min="0"
                value={form.capacity}
                onChange={handleInputChange('capacity')}
                disabled={submitting}
                style={{
                  padding: '10px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '15px',
                }}
              />
            </label>
          </div>

          <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <span style={{ fontWeight: '500', fontSize: '14px' }}>รายละเอียด</span>
            <textarea
              placeholder="อธิบายเกี่ยวกับคอร์สนี้..."
              value={form.description}
              onChange={handleInputChange('description')}
              disabled={submitting}
              rows="4"
              style={{
                padding: '10px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '15px',
                fontFamily: 'inherit',
                resize: 'vertical',
              }}
            />
          </label>

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

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
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
              <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <span style={{ fontWeight: '500', fontSize: '14px' }}>ราคา (บาท)</span>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={form.price_cents / 100}
                  onChange={(e) => setForm(prev => ({ ...prev, price_cents: Number(e.target.value) * 100 }))}
                  disabled={submitting}
                  style={{
                    padding: '10px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '15px',
                  }}
                />
              </label>
            )}

            <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <span style={{ fontWeight: '500', fontSize: '14px' }}>เข้าได้กี่ครั้ง</span>
              <input
                type="number"
                min="1"
                value={form.access_times}
                onChange={handleInputChange('access_times')}
                disabled={submitting}
                style={{
                  padding: '10px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '15px',
                }}
              />
            </label>
          </div>

          <button
            type="submit"
            disabled={submitting || imageProcessing}
            style={{
              background: submitting || imageProcessing ? '#9ca3af' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              padding: '12px 24px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: submitting || imageProcessing ? 'not-allowed' : 'pointer',
              width: 'fit-content',
            }}
          >
            {submitting ? 'กำลังสร้าง...' : imageProcessing ? 'กำลังแปลงรูป...' : 'สร้างคอร์ส'}
          </button>
        </form>
      </div>

      <div style={{
        background: '#fff',
        borderRadius: '12px',
        padding: '24px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      }}>
        <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '16px' }}>รายการคอร์สทั้งหมด</h2>
        
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
            กำลังโหลด...
          </div>
        ) : courses.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
            ยังไม่มีคอร์สในระบบ
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '14px',
            }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e5e7eb', textAlign: 'left' }}>
                  <th style={{ padding: '12px 8px', fontWeight: '600', color: '#374151' }}>ID</th>
                  <th style={{ padding: '12px 8px', fontWeight: '600', color: '#374151' }}>รูป</th>
                  <th style={{ padding: '12px 8px', fontWeight: '600', color: '#374151' }}>ชื่อคอร์ส</th>
                  <th style={{ padding: '12px 8px', fontWeight: '600', color: '#374151' }}>ผู้สอน</th>
                  <th style={{ padding: '12px 8px', fontWeight: '600', color: '#374151' }}>รายละเอียด</th>
                  <th style={{ padding: '12px 8px', fontWeight: '600', color: '#374151' }}>ประเภท</th>
                  <th style={{ padding: '12px 8px', fontWeight: '600', color: '#374151', textAlign: 'right' }}>ราคา</th>
                  <th style={{ padding: '12px 8px', fontWeight: '600', color: '#374151', textAlign: 'center' }}>ที่รับ</th>
                  <th style={{ padding: '12px 8px', fontWeight: '600', color: '#374151', textAlign: 'center' }}>เข้าได้</th>
                </tr>
              </thead>
              <tbody>
                {courses.map((course) => (
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
                    <td style={{ padding: '12px 8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {course.instructor_avatar && (
                          <img
                            src={course.instructor_avatar}
                            alt={course.instructor_name || 'instructor'}
                            style={{ width: '32px', height: '32px', borderRadius: '999px', objectFit: 'cover' }}
                          />
                        )}
                        <div>
                          <div style={{ fontWeight: 500 }}>{course.instructor_name || '-'}</div>
                          {course.branch_name && (
                            <span style={{ fontSize: '12px', color: '#6b7280' }}>{course.branch_name}</span>
                          )}
                        </div>
                      </div>
                    </td>
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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default Courses;