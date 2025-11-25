import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { apiBase } from '../config';

function Customization() {
  const [formData, setFormData] = useState({
    app_name: '',
    app_description: '',
    logo_url: '',
    logo_initials: '',
    primary_color: '#0b1a3c',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchCustomization();
  }, []);

  const fetchCustomization = async () => {
    setLoading(true);
    try {
      const response = await axios.post(`${apiBase}/api/customization/get`);
      if (response.data) {
        setFormData({
          app_name: response.data.app_name || '',
          app_description: response.data.app_description || '',
          logo_url: response.data.logo_url || '',
          logo_initials: response.data.logo_initials || '',
          primary_color: response.data.primary_color || '#0b1a3c',
        });
      }
    } catch (error) {
      console.error('Error fetching customization:', error);
      setMessage({ text: 'ไม่สามารถโหลดข้อมูลได้', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ text: '', type: '' });

    try {
      await axios.post(`${apiBase}/api/customization/update`, formData);
      setMessage({ text: 'บันทึกการตั้งค่าเรียบร้อยแล้ว', type: 'success' });
    } catch (error) {
      console.error('Error saving customization:', error);
      setMessage({ text: 'เกิดข้อผิดพลาดในการบันทึก', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFileUpload = async (file) => {
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
    if (!allowedTypes.includes(file.type)) {
      setMessage({ text: 'กรุณาเลือกไฟล์รูปภาพเท่านั้น (JPG, PNG, GIF, WEBP, SVG)', type: 'error' });
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setMessage({ text: 'ขนาดไฟล์ต้องไม่เกิน 5MB', type: 'error' });
      return;
    }

    setUploading(true);
    setMessage({ text: '', type: '' });

    try {
      const formData = new FormData();
      formData.append('logo', file);

      const response = await axios.post(`${apiBase}/api/customization/upload-logo`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        setFormData((prev) => ({
          ...prev,
          logo_url: `${apiBase}${response.data.logo_url}`,
        }));
        setMessage({ text: 'อัปโหลดรูปภาพสำเร็จ', type: 'success' });
      }
    } catch (error) {
      console.error('Error uploading logo:', error);
      setMessage({
        text: error.response?.data?.message || 'เกิดข้อผิดพลาดในการอัปโหลด',
        type: 'error',
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0]);
    }
  };

  const handleRemoveLogo = () => {
    setFormData((prev) => ({
      ...prev,
      logo_url: '',
    }));
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="page-header">
          <h1>ตั้งค่าหน้าจอแอป</h1>
        </div>
        <div style={{ padding: '20px', textAlign: 'center' }}>กำลังโหลด...</div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>ตั้งค่าหน้าจอแอป</h1>
        <p className="page-subtext">
          ปรับแต่งโลโก้ ชื่อแอป และรายละเอียดที่แสดงในหน้าแอป LIFF
        </p>
      </div>

      <div className="card">
        <form onSubmit={handleSubmit}>
          {/* Message Display */}
          {message.text && (
            <div
              style={{
                padding: '12px 16px',
                marginBottom: '24px',
                borderRadius: '8px',
                backgroundColor: message.type === 'success' ? '#10b981' : '#ef4444',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <span>{message.type === 'success' ? '✓' : '⚠'}</span>
              <span>{message.text}</span>
            </div>
          )}

          {/* Responsive Grid Layout */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '24px',
              marginBottom: '24px',
            }}
          >
            {/* Left Column - Logo Upload */}
            <div>
              <h3 style={{ marginBottom: '16px', fontSize: '1.1rem', fontWeight: '600' }}>
                โลโก้แอป
              </h3>

              {/* Logo Upload Area */}
              <div className="form-group">
                <label>อัปโหลดรูปโลโก้</label>
                <div
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    border: dragActive ? '2px dashed #3b82f6' : '2px dashed #334155',
                    borderRadius: '12px',
                    padding: '32px 20px',
                    textAlign: 'center',
                    cursor: 'pointer',
                    backgroundColor: dragActive ? 'rgba(59, 130, 246, 0.05)' : '#1e293b',
                    transition: 'all 0.2s ease',
                    position: 'relative',
                  }}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    style={{ display: 'none' }}
                  />

                  {formData.logo_url ? (
                    <div style={{ position: 'relative' }}>
                      <img
                        src={formData.logo_url}
                        alt="Logo Preview"
                        style={{
                          maxWidth: '100%',
                          maxHeight: '200px',
                          borderRadius: '8px',
                          objectFit: 'contain',
                        }}
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveLogo();
                        }}
                        style={{
                          position: 'absolute',
                          top: '8px',
                          right: '8px',
                          backgroundColor: '#ef4444',
                          color: 'white',
                          border: 'none',
                          borderRadius: '50%',
                          width: '32px',
                          height: '32px',
                          cursor: 'pointer',
                          fontSize: '18px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        ×
                      </button>
                    </div>
                  ) : (
                    <div>
                      <div style={{ fontSize: '48px', marginBottom: '12px' }}>
                        {uploading ? '⏳' : '📁'}
                      </div>
                      <div style={{ color: '#94a3b8', marginBottom: '8px' }}>
                        {uploading ? 'กำลังอัปโหลด...' : 'คลิกหรือลากไฟล์มาวางที่นี่'}
                      </div>
                      <div style={{ fontSize: '0.875rem', color: '#64748b' }}>
                        รองรับ JPG, PNG, GIF, WEBP, SVG (สูงสุด 5MB)
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Logo Initials */}
              <div className="form-group">
                <label htmlFor="logo_initials">
                  ตัวย่อโลโก้ <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  id="logo_initials"
                  name="logo_initials"
                  value={formData.logo_initials}
                  onChange={handleChange}
                  className="form-control"
                  required
                  maxLength={10}
                  placeholder="เช่น YL"
                />
                <small className="form-text">
                  ตัวอักษรสั้นๆ ที่จะแสดงในโลโก้เมื่อไม่มีรูปภาพ (สูงสุด 10 ตัวอักษร)
                </small>
              </div>

              {/* Primary Color */}
              <div className="form-group">
                <label htmlFor="primary_color">สีหลัก</label>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <input
                    type="color"
                    id="primary_color"
                    name="primary_color"
                    value={formData.primary_color}
                    onChange={handleChange}
                    style={{
                      width: '60px',
                      height: '44px',
                      cursor: 'pointer',
                      border: '1px solid #334155',
                      borderRadius: '8px',
                    }}
                  />
                  <input
                    type="text"
                    value={formData.primary_color}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, primary_color: e.target.value }))
                    }
                    className="form-control"
                    placeholder="#0b1a3c"
                    style={{ flex: 1 }}
                  />
                </div>
                <small className="form-text">
                  สีหลักที่ใช้ในโลโก้ (รูปแบบ HEX เช่น #0b1a3c)
                </small>
              </div>
            </div>

            {/* Right Column - App Information */}
            <div>
              <h3 style={{ marginBottom: '16px', fontSize: '1.1rem', fontWeight: '600' }}>
                ข้อมูลแอป
              </h3>

              {/* App Name */}
              <div className="form-group">
                <label htmlFor="app_name">
                  ชื่อแอป <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  id="app_name"
                  name="app_name"
                  value={formData.app_name}
                  onChange={handleChange}
                  className="form-control"
                  required
                  placeholder="เช่น Yoga Luxe"
                />
              </div>

              {/* App Description */}
              <div className="form-group">
                <label htmlFor="app_description">รายละเอียดแอป</label>
                <textarea
                  id="app_description"
                  name="app_description"
                  value={formData.app_description}
                  onChange={handleChange}
                  className="form-control"
                  placeholder="เช่น Boutique LIFF Studio"
                  rows="4"
                  style={{ resize: 'vertical', minHeight: '100px' }}
                />
              </div>

              {/* Preview Section */}
              <div className="form-group">
                <label>ตัวอย่าง</label>
                <div
                  style={{
                    padding: '24px',
                    backgroundColor: '#0f172a',
                    borderRadius: '12px',
                    border: '1px solid #334155',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div
                      style={{
                        width: 56,
                        height: 56,
                        borderRadius: '50%',
                        border: '2px solid #334155',
                        display: 'grid',
                        placeItems: 'center',
                        background: formData.logo_url
                          ? `url(${formData.logo_url}) center/cover`
                          : 'linear-gradient(135deg, rgba(231, 177, 160, 0.35), rgba(231, 177, 160, 0.05))',
                        color: formData.primary_color,
                        fontWeight: 800,
                        letterSpacing: '-0.02em',
                        fontSize: '1.1rem',
                        flexShrink: 0,
                      }}
                    >
                      {!formData.logo_url && formData.logo_initials}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontFamily: 'var(--font-heading)',
                          fontSize: '1.35rem',
                          letterSpacing: '0.01em',
                          color: '#fff',
                          marginBottom: '4px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {formData.app_name || 'ชื่อแอป'}
                      </div>
                      <div
                        style={{
                          color: '#94a3b8',
                          fontSize: '0.95rem',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                        }}
                      >
                        {formData.app_description || 'รายละเอียดแอป'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div
            className="form-actions"
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '12px',
              paddingTop: '24px',
              borderTop: '1px solid #334155',
            }}
          >
            <button type="submit" className="btn btn--primary" disabled={saving || uploading}>
              {saving ? 'กำลังบันทึก...' : 'บันทึกการตั้งค่า'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Customization;
