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

const fieldDefinitions = [
  {
    key: 'app_name',
    label: 'ชื่อแอป / App name',
    requirement: 'Required',
    helper: 'ใช้เป็นชื่อเพจและหัวข้อหลักที่ลูกค้าเห็น',
    example: 'โยคะยามเช้า (Morning Flow)',
  },
  {
    key: 'app_description',
    label: 'รายละเอียดสั้น / Short description',
    requirement: 'Optional',
    helper: 'ข้อความต้อนรับหรือสรุปบริการสั้นๆ',
    example: 'สตูดิโอโยคะบน LIFF จองง่าย จ่ายปลอดภัย',
  },
  {
    key: 'logo_url',
    label: 'โลโก้ / Logo',
    requirement: 'Optional (แนะนำ)',
    helper: 'ใช้ PNG พื้นใสเพื่อความคมชัด',
    example: 'อัปโหลด PNG พื้นใส 512x512',
  },
  {
    key: 'banner_url',
    label: 'ปก / Hero banner',
    requirement: 'Optional',
    helper: 'ภาพปกหน้าแรกหรือ Section Highlight',
    example: 'ภาพแนวนอน 1600x900px',
  },
  {
    key: 'logo_initials',
    label: 'ตัวย่อโลโก้ / Logo initials',
    requirement: 'Required',
    helper: 'ใช้เมื่อไม่มีโลโก้ไฟล์ภาพ',
    example: 'YL หรือ YO',
  },
  {
    key: 'primary_color',
    label: 'สีแบรนด์หลัก / Primary brand color',
    requirement: 'Required',
    helper: 'ใช้กับปุ่ม CTA หลักและหัวข้อสำคัญ',
    example: '#0B1A3C หรือ hsla(222, 65%, 15%, 1)',
  },
  {
    key: 'secondary_color',
    label: 'สีแบรนด์รอง / Secondary brand color',
    requirement: 'Required',
    helper: 'ใช้กับปุ่มรอง/เส้นขอบ เพื่อเสริมการเน้น',
    example: '#4CAF50 หรือ hsla(122, 39%, 49%, 1)',
  },
  {
    key: 'background_color',
    label: 'สีพื้นหลัง / Background',
    requirement: 'Required',
    helper: 'ควรรักษา contrast ให้อ่านง่ายกับตัวอักษร',
    example: '#F7F8FB หรือ hsla(225, 33%, 96%, 1)',
  },
];

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

  const hexToHsla = (value) => {
    if (!value) return '';
    const normalized = value.startsWith('#') ? value.slice(1) : value;
    if (![3, 6].includes(normalized.length)) return '';

    const hex = normalized.length === 3
      ? normalized
          .split('')
          .map((char) => char + char)
          .join('')
      : normalized;

    const r = parseInt(hex.substring(0, 2), 16) / 255;
    const g = parseInt(hex.substring(2, 4), 16) / 255;
    const b = parseInt(hex.substring(4, 6), 16) / 255;
    if ([r, g, b].some((num) => Number.isNaN(num))) return '';

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const delta = max - min;
    let h = 0;
    let s = 0;
    const l = (max + min) / 2;

    if (delta !== 0) {
      s = delta / (1 - Math.abs(2 * l - 1));
      switch (max) {
        case r:
          h = ((g - b) / delta) % 6;
          break;
        case g:
          h = (b - r) / delta + 2;
          break;
        default:
          h = (r - g) / delta + 4;
          break;
      }
      h = Math.round(h * 60);
      if (h < 0) h += 360;
    }

    const hue = Number.isNaN(h) ? 0 : h;
    const saturation = Math.max(0, Math.min(100, Math.round(s * 100)));
    const lightness = Math.max(0, Math.min(100, Math.round(l * 100)));
    return `hsla(${hue}, ${saturation}%, ${lightness}%, 1)`;
  };

  const hslaToHex = (value) => {
    if (!value) return null;
    const match = value.match(/hsla?\(\s*([\d.]+)\s*,\s*([\d.]+)%\s*,\s*([\d.]+)%\s*(?:,\s*([\d.]+)\s*)?\)/i);
    if (!match) return null;

    const h = parseFloat(match[1]);
    const s = parseFloat(match[2]) / 100;
    const l = parseFloat(match[3]) / 100;
    if ([h, s, l].some((num) => Number.isNaN(num))) return null;

    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = l - c / 2;
    let rPrime = 0;
    let gPrime = 0;
    let bPrime = 0;

    if (h >= 0 && h < 60) {
      rPrime = c;
      gPrime = x;
    } else if (h >= 60 && h < 120) {
      rPrime = x;
      gPrime = c;
    } else if (h >= 120 && h < 180) {
      gPrime = c;
      bPrime = x;
    } else if (h >= 180 && h < 240) {
      gPrime = x;
      bPrime = c;
    } else if (h >= 240 && h < 300) {
      rPrime = x;
      bPrime = c;
    } else {
      rPrime = c;
      bPrime = x;
    }

    const toHex = (component) => {
      const hex = Math.round((component + m) * 255)
        .toString(16)
        .padStart(2, '0');
      return hex;
    };

    const hex = `#${toHex(rPrime)}${toHex(gPrime)}${toHex(bPrime)}`;
    return hex;
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
          type="submit"
          form="customization-form"
          className="btn btn--primary"
          disabled={loading || saving || uploading}
          aria-busy={saving}
        >
          {saving ? '⏳ กำลังบันทึก...' : 'บันทึกการตั้งค่า'}
        </button>
        <button
          type="button"
          className="btn btn--ghost btn--icon"
          onClick={() => setShowPreview(true)}
          disabled={loading || saving || uploading}
        >
          <span aria-hidden="true">👁</span>
          ดูตัวอย่างเต็ม
        </button>
        <button
          type="button"
          className="btn btn--subtle"
          onClick={handleReset}
          disabled={loading || saving || uploading}
        >
          รีเซ็ตค่า
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
    const [hslaValue, setHslaValue] = useState(hexToHsla(hexValue));

    useEffect(() => {
      setHslaValue(hexToHsla(hexValue));
    }, [hexValue]);

    const handleHexInput = (value) => {
      if (!value) {
        setFormData((prev) => ({
          ...prev,
          [name]: '',
        }));
        return;
      }

      const normalized = value.startsWith('#') ? value : `#${value}`;
      setFormData((prev) => ({
        ...prev,
        [name]: normalized,
      }));
    };

    const handleHslaInput = (value) => {
      setHslaValue(value);
      if (!value) {
        setFormData((prev) => ({
          ...prev,
          [name]: '',
        }));
        return;
      }
      const nextHex = hslaToHex(value);
      if (nextHex) {
        setFormData((prev) => ({
          ...prev,
          [name]: nextHex,
        }));
      }
    };

    return (
      <div className="field">
        <div className="field__label" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span>{label}</span>
          <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>Required</span>
        </div>
        <div className="theme-color-picker">
          <input
            type="color"
            id={name}
            name={name}
            value={hexValue}
            onChange={handleChange}
            className="theme-color-picker__swatch"
            aria-label={`${label} color picker`}
          />
          <div className="theme-color-picker__inputs">
            <div className="copyable-input">
              <input
                type="text"
                value={hexValue}
                onChange={(e) => handleHexInput(e.target.value)}
                className="input"
                placeholder="#4CAF50"
                aria-label={`${label} hex`}
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
              <input
                type="text"
                value={hslaValue || ''}
                onChange={(e) => handleHslaInput(e.target.value)}
                className="input"
                placeholder="hsla(152, 68%, 51%, 1)"
                aria-label={`${label} hsla`}
              />
              <button
                type="button"
                className="btn btn--ghost"
                onClick={() => handleCopy(hslaValue || '', 'ค่า HSLA')}
                disabled={!hslaValue}
              >
                คัดลอก HSLA
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
            <p className="field__hint" style={{ marginTop: 4 }}>
              ใช้ color picker หรือกรอก #RRGGBB / HSLA (เช่น #4CAF50, hsla(152, 68%, 51%, 1)).
              แนะนำให้ตรวจสอบ contrast ของปุ่ม CTA กับพื้นหลังให้ผ่านมาตรฐาน WCAG 4.5:1
            </p>
          </div>
        </div>
      </div>
    );
  };

  const formContent = (
    <div className="page-card page-card--wide">
      {alertMessage}
      <form id="customization-form" onSubmit={handleSubmit} className="form-grid form-grid--balanced">
        <section className="page-card__section page-card__section--muted">
          <div className="section-heading">
            <h2 className="section-heading__title">Field overview / รายการฟิลด์</h2>
            <p className="section-heading__muted">
              ระบุทุกฟิลด์ที่มีอยู่ พร้อม Required/Optional, label ชัดเจน และตัวอย่าง placeholder ที่ใช้ในหน้า LIFF
            </p>
          </div>
          <div style={{ display: 'grid', gap: 12 }}>
            {fieldDefinitions.map((item) => (
              <div
                key={item.key}
                style={{
                  padding: 12,
                  border: '1px solid var(--color-border)',
                  borderRadius: 12,
                  background: 'var(--color-surface)',
                }}
                aria-label={`${item.label} metadata`}
              >
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                  <strong>{item.label}</strong>
                  <span
                    style={{
                      fontSize: 12,
                      padding: '2px 8px',
                      borderRadius: 999,
                      background: 'var(--color-background)',
                      border: '1px solid var(--color-border)',
                    }}
                  >
                    {item.requirement}
                  </span>
                </div>
                <p className="field__hint" style={{ margin: '6px 0' }}>
                  {item.helper}
                </p>
                <p className="field__hint" style={{ color: 'var(--color-text)' }}>
                  Placeholder: <span style={{ fontWeight: 600 }}>{item.example}</span>
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="page-card__section">
          <div className="section-heading">
            <h2 className="section-heading__title">Brand Assets</h2>
            <p className="section-heading__muted">
              อัปโหลดโลโก้และแบนเนอร์พร้อมคำแนะนำเรื่องไฟล์ เพื่อให้การแสดงผลใน LIFF คมชัดและถูกต้อง
            </p>
          </div>

          <AssetDropzone
            label="โลโก้แบรนด์ / Brand logo (Optional)"
            description="รองรับ PNG, JPEG, WEBP สูงสุด 5MB ตัวอย่าง: อัปโหลด PNG พื้นใส 512x512"
            value={formData.logo_url}
            maxSizeMB={5}
            allowedTypes={['image/png', 'image/jpeg', 'image/jpg', 'image/webp']}
            recommendedRatio={{ width: 1, height: 1 }}
            recommendedText="สัดส่วน 1:1 แนะนำ 512x512px"
            onUpload={(file) => uploadAsset(file, 'logo')}
            onRemove={() => handleRemoveAsset('logo_url')}
          />

          <AssetDropzone
            label="แบนเนอร์หน้าแรก / Hero banner (Optional)"
            description="รองรับ PNG, JPEG, WEBP สูงสุด 8MB ตัวอย่าง: ภาพแนวนอน 1600x900px"
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
              ตัวย่อโลโก้ / Logo initials <span style={{ color: 'var(--color-danger)' }}>* Required</span>
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
              placeholder="เช่น YL หรือ YO"
            />
            <p className="field__hint">
              ใช้เมื่อไม่มีโลโก้ภาพ ตัวอย่าง: "YL" หรือ "YO" (สูงสุด 10 ตัวอักษร ตัวพิมพ์ใหญ่/ไทยได้)
            </p>
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
              ชื่อแอป / App name <span style={{ color: 'var(--color-danger)' }}>* Required</span>
            </label>
            <input
              type="text"
              id="app_name"
              name="app_name"
              value={formData.app_name}
              onChange={handleChange}
              className="input"
              required
              placeholder="เช่น โยคะยามเช้า | Yoga Morning"
              maxLength={60}
            />
            <p className="field__hint">ใช้เป็นชื่อเพจ/Heading สูงสุด 60 ตัวอักษร แนะนำให้มีทั้งไทย/อังกฤษหากต้องการ</p>
          </div>

          <div className="field">
            <label className="field__label" htmlFor="app_description">
              รายละเอียดสั้น / Short description <span style={{ color: 'var(--color-text-muted)' }}>Optional</span>
            </label>
            <textarea
              id="app_description"
              name="app_description"
              value={formData.app_description}
              onChange={handleChange}
              className="textarea"
              placeholder="เช่น สตูดิโอโยคะบน LIFF พร้อมชำระเงิน Omise"
              rows="4"
              maxLength={180}
            />
            <p className="field__hint">
              ใช้เป็นข้อความต้อนรับ/คำอธิบายสั้น ความยาวไม่เกิน 180 ตัวอักษร เพื่อให้เข้าใจบริการในทันที
            </p>
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
          <button type="submit" className="btn btn--primary" disabled={saving || uploading} aria-busy={saving}>
            {saving ? '⏳ กำลังบันทึก...' : 'บันทึกการตั้งค่า'}
          </button>
          <button
            type="button"
            className="btn btn--ghost btn--icon"
            onClick={() => setShowPreview(true)}
            disabled={saving || uploading}
          >
            <span aria-hidden="true">👁</span>
            ดูตัวอย่าง
          </button>
          <button
            type="button"
            className="btn btn--subtle"
            onClick={handleReset}
            disabled={saving || uploading}
          >
            รีเซ็ตค่า
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
