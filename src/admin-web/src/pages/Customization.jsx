import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { apiBase } from '../config';

const normalizeData = (data = {}) => ({
  app_name: data.app_name || '',
  app_description: data.app_description || '',
  logo_url: data.logo_url || '',
  logo_initials: data.logo_initials || '',
  primary_color: data.primary_color || '#0b1a3c',
});

function Customization() {
  const [formData, setFormData] = useState(normalizeData());
  const [initialData, setInitialData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [toast, setToast] = useState({ text: '', type: '' });
  const [showPreview, setShowPreview] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  const showToast = (nextToast) => {
    setToast(nextToast);
    if (nextToast.text) {
      setTimeout(() => setToast({ text: '', type: '' }), 3200);
    }
  };

  useEffect(() => {
    fetchCustomization();
  }, []);

  const fetchCustomization = async () => {
    setLoading(true);
    try {
      const response = await axios.post(`${apiBase}/api/customization/get`);
      const normalized = normalizeData(response.data || {});
      setFormData(normalized);
      setInitialData(normalized);
    } catch (error) {
      console.error('Error fetching customization:', error);
      const errorMessage = 'ไม่สามารถโหลดข้อมูลได้';
      setMessage({ text: errorMessage, type: 'error' });
      showToast({ text: errorMessage, type: 'error' });
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
      showToast({ text: 'บันทึกการตั้งค่าเรียบร้อยแล้ว', type: 'success' });
      setInitialData({ ...formData });
    } catch (error) {
      console.error('Error saving customization:', error);
      const errorMessage = 'เกิดข้อผิดพลาดในการบันทึก';
      setMessage({ text: errorMessage, type: 'error' });
      showToast({ text: errorMessage, type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    const confirmed = window.confirm('ยืนยันการรีเซ็ตค่า? การกระทำนี้จะคืนค่าตามข้อมูลล่าสุดที่บันทึกไว้');
    if (!confirmed) return;

    if (initialData) {
      setFormData({ ...initialData });
      setMessage({ text: 'คืนค่าตามข้อมูลล่าสุดที่บันทึกไว้แล้ว', type: 'success' });
      showToast({ text: 'คืนค่าตามข้อมูลล่าสุดที่บันทึกไว้แล้ว', type: 'success' });
    } else {
      fetchCustomization();
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

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
    if (!allowedTypes.includes(file.type)) {
      setMessage({ text: 'กรุณาเลือกไฟล์รูปภาพเท่านั้น (JPG, PNG, GIF, WEBP, SVG)', type: 'error' });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setMessage({ text: 'ขนาดไฟล์ต้องไม่เกิน 5MB', type: 'error' });
      return;
    }

    setUploading(true);
    setMessage({ text: '', type: '' });

    try {
      const formDataToUpload = new FormData();
      formDataToUpload.append('logo', file);

      const response = await axios.post(`${apiBase}/api/customization/upload-logo`, formDataToUpload, {
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
        showToast({ text: 'อัปโหลดรูปภาพสำเร็จ', type: 'success' });
      }
    } catch (error) {
      console.error('Error uploading logo:', error);
      setMessage({
        text: error.response?.data?.message || 'เกิดข้อผิดพลาดในการอัปโหลด',
        type: 'error',
      });
      showToast({
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

  const header = (
    <div className="page__header">
      <div>
        <p className="page__eyebrow">Appearance</p>
        <h1 className="page__title">ตั้งค่าหน้าจอแอป</h1>
        <p className="page__subtitle">ปรับแต่งโลโก้ ชื่อแอป และรายละเอียดที่แสดงในหน้าแอป LIFF</p>
        <nav className="page__breadcrumb" aria-label="Breadcrumb">
          <span>การตั้งค่า</span>
          <span className="page__breadcrumb-separator">/</span>
          <span>หน้าจอแอป</span>
        </nav>
      </div>
      <div className="page__actions">
        <button
          type="button"
          className="btn btn--ghost"
          onClick={() => setShowPreview(true)}
          disabled={loading || saving || uploading}
        >
          ดูตัวอย่างเต็ม
        </button>
        <button
          type="button"
          className="btn btn--ghost"
          onClick={handleReset}
          disabled={loading || saving || uploading}
        >
          รีเซ็ตค่า
        </button>
        <button
          type="submit"
          form="customization-form"
          className="btn btn--primary"
          disabled={loading || saving || uploading}
        >
          {saving ? 'กำลังบันทึก...' : 'บันทึกการตั้งค่า'}
        </button>
      </div>
    </div>
  );

  const alertMessage =
    message.text && (
      <div
        className={`page-alert ${message.type === 'success' ? 'page-alert--success' : 'page-alert--error'}`}
        role="status"
      >
        {message.text}
      </div>
    );

  const previewAvatar = formData.logo_url ? (
    <div
      className="avatar-circle"
      style={{
        backgroundImage: `url(${formData.logo_url})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        color: 'transparent',
      }}
      aria-label="ตัวอย่างโลโก้"
    />
  ) : (
    <div className="avatar-circle" style={{ color: formData.primary_color }} aria-label="ตัวอย่างตัวย่อ">
      {formData.logo_initials || 'YL'}
    </div>
  );

  const formContent = (
    <div className="page-card page-card--wide">
      {alertMessage}
      <form id="customization-form" onSubmit={handleSubmit} className="form-grid form-grid--balanced">
        <section className="page-card__section">
          <div className="section-heading">
            <h2 className="section-heading__title">โลโก้และสีแบรนด์</h2>
            <p className="section-heading__muted">อัปโหลดโลโก้และตั้งค่าสีหลักให้ตรงกับแบรนด์ของคุณ</p>
          </div>

          <div className="field">
            <label className="field__label" htmlFor="logo_upload">อัปโหลดรูปโลโก้</label>
            <div
              id="logo_upload"
              className={`upload-dropzone${dragActive ? ' is-active' : ''}`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              role="button"
              tabIndex={0}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
              />

              {formData.logo_url ? (
                <div style={{ position: 'relative', display: 'inline-block' }}>
                  <img
                    src={formData.logo_url}
                    alt="Logo Preview"
                    style={{ maxWidth: '100%', maxHeight: '220px', borderRadius: '10px', objectFit: 'contain' }}
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveLogo();
                    }}
                    className="btn btn--ghost btn--small"
                    style={{ position: 'absolute', top: 8, right: 8 }}
                  >
                    ลบรูป
                  </button>
                </div>
              ) : (
                <div>
                  <div className="upload-dropzone__icon">{uploading ? '⏳' : '📁'}</div>
                  <p className="upload-dropzone__title">
                    {uploading ? 'กำลังอัปโหลด...' : 'คลิกหรือลากไฟล์มาวางที่นี่'}
                  </p>
                  <p className="upload-dropzone__hint">รองรับ JPG, PNG, GIF, WEBP, SVG (สูงสุด 5MB)</p>
                </div>
              )}
            </div>
          </div>

          <div className="field">
            <label className="field__label" htmlFor="logo_initials">
              ตัวย่อโลโก้ <span style={{ color: 'var(--color-danger)' }}>*</span>
            </label>
            <input
              type="text"
              id="logo_initials"
              name="logo_initials"
              value={formData.logo_initials}
              onChange={handleChange}
              className="input"
              required
              maxLength={10}
              placeholder="เช่น YL"
            />
            <p className="field__hint">ตัวอักษรสั้นๆ ที่จะแสดงในโลโก้เมื่อไม่มีรูปภาพ (สูงสุด 10 ตัวอักษร)</p>
          </div>

          <div className="field">
            <label className="field__label" htmlFor="primary_color">สีหลัก</label>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
              <input
                type="color"
                id="primary_color"
                name="primary_color"
                value={formData.primary_color}
                onChange={handleChange}
                style={{ width: '72px', height: '44px', cursor: 'pointer', borderRadius: '10px', border: '1px solid var(--color-border)' }}
              />
              <input
                type="text"
                value={formData.primary_color}
                onChange={(e) => setFormData((prev) => ({ ...prev, primary_color: e.target.value }))}
                className="input"
                placeholder="#0b1a3c"
                style={{ flex: 1, minWidth: 160 }}
              />
            </div>
            <p className="field__hint">สีหลักที่ใช้ในโลโก้ (รูปแบบ HEX เช่น #0b1a3c)</p>
          </div>
        </section>

        <section className="page-card__section">
          <div className="section-heading">
            <h2 className="section-heading__title">ข้อมูลที่จะแสดงในแอป</h2>
            <p className="section-heading__muted">กำหนดชื่อและคำอธิบายที่ใช้กับหน้าจอหน้าแรกของ LIFF</p>
          </div>

          <div className="field">
            <label className="field__label" htmlFor="app_name">
              ชื่อแอป <span style={{ color: 'var(--color-danger)' }}>*</span>
            </label>
            <input
              type="text"
              id="app_name"
              name="app_name"
              value={formData.app_name}
              onChange={handleChange}
              className="input"
              required
              placeholder="เช่น Yoga Luxe"
            />
          </div>

          <div className="field">
            <label className="field__label" htmlFor="app_description">รายละเอียดแอป</label>
            <textarea
              id="app_description"
              name="app_description"
              value={formData.app_description}
              onChange={handleChange}
              className="textarea"
              placeholder="เช่น Boutique LIFF Studio"
              rows="4"
            />
            <p className="field__hint">แนะนำบริการของคุณสั้นๆ เพื่อให้ผู้ใช้เข้าใจในทันที</p>
          </div>

          <div className="field">
            <label className="field__label">ตัวอย่าง</label>
            <div className="preview-card">
              <div className="preview-card__header">
                {previewAvatar}
                <div>
                  <p className="preview-card__title">{formData.app_name || 'ชื่อแอป'}</p>
                  <p className="preview-card__subtitle">{formData.app_description || 'รายละเอียดแอป'}</p>
                </div>
              </div>
              <p className="field__hint">ตัวอย่างการจัดวางโลโก้ ชื่อ และข้อความย่อยที่ผู้ใช้จะเห็น</p>
            </div>
          </div>
        </section>

        <div className="form-actions">
          <button
            type="button"
            className="btn btn--ghost"
            onClick={handleReset}
            disabled={saving || uploading}
          >
            รีเซ็ตค่า
          </button>
          <button type="submit" className="btn btn--primary" disabled={saving || uploading}>
            {saving ? 'กำลังบันทึก...' : 'บันทึกการตั้งค่า'}
          </button>
        </div>
      </form>
    </div>
  );

  return (
    <div className="page page--narrow">
      {header}
      {(saving || uploading) && (
        <div className="page-status" aria-live="polite">
          <span className="page-status__dot" aria-hidden="true" />
          {saving ? 'กำลังบันทึกการตั้งค่า...' : 'กำลังอัปโหลดไฟล์...'}
        </div>
      )}
      {loading ? (
        <div className="page-card page-card--wide page-card--muted" aria-busy="true">
          <div className="loading-state">
            <div className="spinner" aria-hidden="true" />
            <div>
              <p className="loading-state__title">กำลังโหลดการตั้งค่า</p>
              <p className="loading-state__hint">ดึงข้อมูลล่าสุดเพื่อใช้เป็นค่าเริ่มต้น</p>
            </div>
          </div>
        </div>
      ) : (
        formContent
      )}

      {showPreview && (
        <div className="preview-modal" role="dialog" aria-modal="true" aria-label="แสดงตัวอย่างการตั้งค่า">
          <div className="preview-modal__backdrop" onClick={() => setShowPreview(false)} />
          <div className="preview-modal__content" style={{ borderColor: formData.primary_color }}>
            <div className="preview-modal__header">
              <div>
                <p className="page__eyebrow" style={{ marginBottom: 4 }}>
                  Preview
                </p>
                <h3 className="preview-modal__title">ตัวอย่างหน้าจอ</h3>
                <p className="preview-modal__subtitle">ตรวจสอบสี โลโก้ และข้อความก่อนบันทึกจริง</p>
              </div>
              <button className="btn btn--ghost" type="button" onClick={() => setShowPreview(false)}>
                ปิด
              </button>
            </div>
            <div className="preview-modal__hero" style={{ background: formData.primary_color || '#0b1a3c' }}>
              <div className="preview-modal__logo">{previewAvatar}</div>
              <div className="preview-modal__copy">
                <h4>{formData.app_name || 'ชื่อแอป'}</h4>
                <p>{formData.app_description || 'รายละเอียดแอป'}</p>
              </div>
            </div>
            <div className="preview-modal__footer">
              <div className="preview-badge">สีหลัก: {formData.primary_color}</div>
              <div className="preview-badge">โลโก้: {formData.logo_url ? 'อัปโหลดแล้ว' : 'ใช้ตัวย่อ'}</div>
              <div className="preview-badge">ข้อความพร้อมแสดง</div>
            </div>
          </div>
        </div>
      )}

      {toast.text && (
        <div className={`toast toast--${toast.type}`} role="status" aria-live="polite">
          {toast.text}
        </div>
      )}
    </div>
  );
}

export default Customization;
