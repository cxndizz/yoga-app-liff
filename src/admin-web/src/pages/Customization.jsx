import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { apiBase } from '../config';
import AssetDropzone from '../components/AssetDropzone';

const normalizeData = (data = {}) => ({
  app_name: data.app_name || '',
  app_description: data.app_description || '',
  logo_url: data.logo_url || '',
  banner_url: data.banner_url || '',
  logo_initials: data.logo_initials || '',
  primary_color: data.primary_color || '#0b1a3c',
  secondary_color: data.secondary_color || '#4cafb9',
  background_color: data.background_color || '#f7f8fb',
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

  const showToast = (nextToast) => {
    setToast(nextToast);
    if (nextToast.text) {
      setTimeout(() => setToast({ text: '', type: '' }), 3200);
    }
  };

  const hexToRgb = (value) => {
    if (!value) return '';
    const normalized = value.startsWith('#') ? value.slice(1) : value;
    if (![3, 6].includes(normalized.length)) return '';

    const hex = normalized.length === 3
      ? normalized
          .split('')
          .map((char) => char + char)
          .join('')
      : normalized;

    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    if ([r, g, b].some((num) => Number.isNaN(num))) return '';
    return `rgb(${r}, ${g}, ${b})`;
  };

  const handleCopy = async (text, label) => {
    try {
      await navigator.clipboard.writeText(text);
      showToast({ text: `${label} คัดลอกแล้ว`, type: 'success' });
    } catch (error) {
      console.error('Error copying text:', error);
      showToast({ text: 'คัดลอกไม่สำเร็จ', type: 'error' });
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

  const uploadAsset = async (file, type) => {
    setUploading(true);
    setMessage({ text: '', type: '' });

    const endpoint = type === 'logo' ? 'upload-logo' : 'upload-banner';
    const fieldName = type === 'logo' ? 'logo' : 'banner';
    const urlKey = type === 'logo' ? 'logo_url' : 'banner_url';

    try {
      const formDataToUpload = new FormData();
      formDataToUpload.append(fieldName, file);

      const response = await axios.post(`${apiBase}/api/customization/${endpoint}`, formDataToUpload, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const uploadedUrl = response.data?.[urlKey];
      if (response.data.success && uploadedUrl) {
        const absoluteUrl = `${apiBase}${uploadedUrl}`;
        setFormData((prev) => ({
          ...prev,
          [urlKey]: absoluteUrl,
        }));
        const successText = type === 'logo' ? 'อัปโหลดโลโก้สำเร็จ' : 'อัปโหลดแบนเนอร์สำเร็จ';
        setMessage({ text: successText, type: 'success' });
        showToast({ text: successText, type: 'success' });
        return absoluteUrl;
      }

      throw new Error(response.data?.message || 'ไม่สามารถอัปโหลดไฟล์ได้');
    } catch (error) {
      console.error('Error uploading asset:', error);
      const errorMessage = error.response?.data?.message || error.message || 'เกิดข้อผิดพลาดในการอัปโหลด';
      setMessage({ text: errorMessage, type: 'error' });
      showToast({ text: errorMessage, type: 'error' });
      throw new Error(errorMessage);
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveAsset = (key) => {
    setFormData((prev) => ({
      ...prev,
      [key]: '',
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

  const previewHeroStyle = formData.banner_url
    ? {
        backgroundImage: `linear-gradient(0deg, rgba(0,0,0,0.55), rgba(0,0,0,0.55)), url(${formData.banner_url})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        color: '#fff',
      }
    : {
        background: formData.primary_color || '#0b1a3c',
        color: '#fff',
      };

  const previewThemeBlock = (
    <div
      className="theme-preview"
      style={{ backgroundColor: formData.background_color }}
      aria-label="ตัวอย่างสีธีม"
    >
      <div
        className="theme-preview__card"
        style={{
          borderColor: formData.secondary_color,
          boxShadow: `0 8px 20px ${formData.primary_color}1a`,
        }}
      >
        <div className="theme-preview__badge" style={{ backgroundColor: formData.secondary_color }}>
          ตัวอย่างการ์ด
        </div>
        <p className="theme-preview__title" style={{ color: formData.primary_color }}>
          Yoga Luxe Card
        </p>
        <p className="theme-preview__subtitle">สีจะอัปเดตตามที่เลือกทันที</p>
        <div className="theme-preview__actions">
          <button
            type="button"
            className="btn"
            style={{
              backgroundColor: formData.primary_color,
              color: '#fff',
              borderColor: formData.primary_color,
              boxShadow: `0 6px 16px ${formData.primary_color}29`,
            }}
          >
            Primary CTA
          </button>
          <button
            type="button"
            className="btn btn--ghost"
            style={{
              color: formData.secondary_color,
              borderColor: formData.secondary_color,
            }}
          >
            Secondary CTA
          </button>
        </div>
      </div>
    </div>
  );

  const ColorField = ({ label, name }) => {
    const hexValue = formData[name];
    const rgbValue = hexToRgb(hexValue);

    return (
      <div className="field">
        <label className="field__label" htmlFor={name}>
          {label}
        </label>
        <div className="theme-color-picker">
          <input
            type="color"
            id={name}
            name={name}
            value={hexValue}
            onChange={handleChange}
            className="theme-color-picker__swatch"
          />
          <div className="theme-color-picker__inputs">
            <div className="copyable-input">
              <input
                type="text"
                value={hexValue}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    [name]: e.target.value,
                  }))
                }
                className="input"
                placeholder="#0b1a3c"
              />
              <button
                type="button"
                className="btn btn--ghost"
                onClick={() => handleCopy(hexValue, 'ค่า HEX')}
              >
                คัดลอก HEX
              </button>
            </div>
            <div className="copyable-input">
              <input type="text" value={rgbValue} readOnly className="input" placeholder="rgb(0, 0, 0)" />
              <button
                type="button"
                className="btn btn--ghost"
                onClick={() => handleCopy(rgbValue || '', 'ค่า RGB')}
                disabled={!rgbValue}
              >
                คัดลอก RGB
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const formContent = (
    <div className="page-card page-card--wide">
      {alertMessage}
      <form id="customization-form" onSubmit={handleSubmit} className="form-grid form-grid--balanced">
        <section className="page-card__section">
          <div className="section-heading">
            <h2 className="section-heading__title">Brand Assets</h2>
            <p className="section-heading__muted">
              อัปโหลดโลโก้และแบนเนอร์พร้อมคำแนะนำเรื่องไฟล์ เพื่อให้การแสดงผลใน LIFF คมชัดและถูกต้อง
            </p>
          </div>

          <AssetDropzone
            label="โลโก้แบรนด์"
            description="รองรับ PNG, JPEG, WEBP สูงสุด 5MB แนะนำพื้นหลังโปร่งใส"
            value={formData.logo_url}
            maxSizeMB={5}
            allowedTypes={['image/png', 'image/jpeg', 'image/jpg', 'image/webp']}
            recommendedRatio={{ width: 1, height: 1 }}
            recommendedText="สัดส่วน 1:1 แนะนำ 512x512px"
            onUpload={(file) => uploadAsset(file, 'logo')}
            onRemove={() => handleRemoveAsset('logo_url')}
          />

          <AssetDropzone
            label="แบนเนอร์หน้าแรก"
            description="รองรับ PNG, JPEG, WEBP สูงสุด 8MB สำหรับ Hero/Banner"
            value={formData.banner_url}
            maxSizeMB={8}
            allowedTypes={['image/png', 'image/jpeg', 'image/jpg', 'image/webp']}
            recommendedRatio={{ width: 16, height: 9 }}
            recommendedText="สัดส่วน 16:9 แนะนำ 1600x900px"
            onUpload={(file) => uploadAsset(file, 'banner')}
            onRemove={() => handleRemoveAsset('banner_url')}
          />

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

          <div className="theme-colors">
            <div className="section-heading" style={{ marginBottom: 8 }}>
              <h3 className="section-heading__title" style={{ marginBottom: 4 }}>
                Theme Colors
              </h3>
              <p className="section-heading__muted">กำหนดสีหลัก สีรอง และพื้นหลัง พร้อมคัดลอกค่าสีได้ทันที</p>
            </div>
            <ColorField label="สีหลัก (Primary)" name="primary_color" />
            <ColorField label="สีรอง (Secondary)" name="secondary_color" />
            <ColorField label="สีพื้นหลัง (Background)" name="background_color" />
            <div className="field">
              <label className="field__label">ตัวอย่างสีธีม</label>
              {previewThemeBlock}
            </div>
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
              <div style={{ marginTop: 12 }}>
                <div
                  style={{
                    width: '100%',
                    height: 140,
                    borderRadius: '12px',
                    border: '1px solid var(--color-border)',
                    backgroundColor: formData.banner_url ? 'transparent' : '#f7f8fb',
                    backgroundImage: formData.banner_url
                      ? `linear-gradient(0deg, rgba(0,0,0,0.35), rgba(0,0,0,0.35)), url(${formData.banner_url})`
                      : undefined,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: formData.banner_url ? '#fff' : 'var(--color-text-muted)',
                    textAlign: 'center',
                    padding: '0 12px',
                  }}
                  aria-label="ตัวอย่างแบนเนอร์"
                >
                  {formData.banner_url ? 'ตัวอย่างแบนเนอร์ที่อัปโหลด' : 'แบนเนอร์ที่อัปโหลดจะแสดงในพื้นที่นี้'}
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
            <div className="preview-modal__hero" style={previewHeroStyle}>
              <div className="preview-modal__logo">{previewAvatar}</div>
              <div className="preview-modal__copy">
                <h4>{formData.app_name || 'ชื่อแอป'}</h4>
                <p>{formData.app_description || 'รายละเอียดแอป'}</p>
              </div>
            </div>
            <div className="preview-modal__footer">
              <div className="preview-badge">สีหลัก: {formData.primary_color}</div>
              <div className="preview-badge">โลโก้: {formData.logo_url ? 'อัปโหลดแล้ว' : 'ใช้ตัวย่อ'}</div>
              <div className="preview-badge">แบนเนอร์: {formData.banner_url ? 'อัปโหลดแล้ว' : 'ยังไม่ได้เพิ่ม'}</div>
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
