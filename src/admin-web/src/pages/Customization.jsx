import React, { useState, useEffect } from 'react';
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
  const [message, setMessage] = useState({ text: '', type: '' });

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
          <div className="form-group">
            <label htmlFor="app_name">
              ชื่อแอป <span style={{ color: 'red' }}>*</span>
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

          <div className="form-group">
            <label htmlFor="app_description">รายละเอียดแอป</label>
            <input
              type="text"
              id="app_description"
              name="app_description"
              value={formData.app_description}
              onChange={handleChange}
              className="form-control"
              placeholder="เช่น Boutique LIFF Studio"
            />
          </div>

          <div className="form-group">
            <label htmlFor="logo_initials">
              ตัวย่อโลโก้ <span style={{ color: 'red' }}>*</span>
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
              ตัวอักษรสั้นๆ ที่จะแสดงในโลโก้ (สูงสุด 10 ตัวอักษร)
            </small>
          </div>

          <div className="form-group">
            <label htmlFor="logo_url">URL รูปโลโก้</label>
            <input
              type="url"
              id="logo_url"
              name="logo_url"
              value={formData.logo_url}
              onChange={handleChange}
              className="form-control"
              placeholder="https://example.com/logo.png"
            />
            <small className="form-text">
              ถ้ามี URL รูปโลโก้ ระบบจะใช้รูปนี้แทนตัวย่อโลโก้
            </small>
          </div>

          <div className="form-group">
            <label htmlFor="primary_color">สีหลัก</label>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <input
                type="color"
                id="primary_color"
                name="primary_color"
                value={formData.primary_color}
                onChange={handleChange}
                style={{ width: '60px', height: '40px', cursor: 'pointer' }}
              />
              <input
                type="text"
                value={formData.primary_color}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, primary_color: e.target.value }))
                }
                className="form-control"
                placeholder="#0b1a3c"
                style={{ maxWidth: '150px' }}
              />
            </div>
            <small className="form-text">
              สีหลักที่ใช้ในโลโก้ (รูปแบบ HEX เช่น #0b1a3c)
            </small>
          </div>

          {/* Preview Section */}
          <div className="form-group" style={{ marginTop: '30px' }}>
            <label>ตัวอย่าง</label>
            <div
              style={{
                padding: '20px',
                backgroundColor: 'var(--navy-900, #0f172a)',
                borderRadius: '12px',
                border: '1px solid var(--border, #334155)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: '50%',
                    border: '1px solid var(--border)',
                    display: 'grid',
                    placeItems: 'center',
                    background: formData.logo_url
                      ? `url(${formData.logo_url}) center/cover`
                      : 'linear-gradient(135deg, rgba(231, 177, 160, 0.35), rgba(231, 177, 160, 0.05))',
                    color: formData.primary_color,
                    fontWeight: 800,
                    letterSpacing: '-0.02em',
                    fontSize: '0.95rem',
                  }}
                >
                  {!formData.logo_url && formData.logo_initials}
                </div>
                <div>
                  <div
                    style={{
                      fontFamily: 'var(--font-heading)',
                      fontSize: '1.25rem',
                      letterSpacing: '0.01em',
                      color: '#fff',
                    }}
                  >
                    {formData.app_name || 'ชื่อแอป'}
                  </div>
                  <div style={{ color: 'var(--muted, #94a3b8)', fontSize: '0.9rem' }}>
                    {formData.app_description || 'รายละเอียดแอป'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {message.text && (
            <div
              style={{
                padding: '12px',
                marginBottom: '16px',
                borderRadius: '8px',
                backgroundColor: message.type === 'success' ? '#10b981' : '#ef4444',
                color: 'white',
              }}
            >
              {message.text}
            </div>
          )}

          <div className="form-actions">
            <button type="submit" className="btn btn--primary" disabled={saving}>
              {saving ? 'กำลังบันทึก...' : 'บันทึกการตั้งค่า'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Customization;
