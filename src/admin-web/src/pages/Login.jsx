import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getSessionSnapshot } from '../auth/session';
import { useAdminAuth } from '../auth/AdminAuthContext';
import { apiBase } from '../config';

const initialForm = {
  email: '',
  password: '',
};

const emailRegex = /[^\s@]+@[^\s@]+\.[^\s@]+/;

function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setSession, accessToken: existingToken } = useAdminAuth();
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const { accessToken } = getSessionSnapshot();
    if (accessToken || existingToken) {
      navigate('/dashboard', { replace: true });
    }
  }, [existingToken, navigate]);

  const validate = () => {
    const nextErrors = {};
    if (!form.email.trim()) {
      nextErrors.email = 'กรุณากรอกอีเมล';
    } else if (!emailRegex.test(form.email.trim())) {
      nextErrors.email = 'รูปแบบอีเมลไม่ถูกต้อง';
    }
    if (!form.password) {
      nextErrors.password = 'กรุณากรอกรหัสผ่าน';
    } else if (form.password.length < 6) {
      nextErrors.password = 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร';
    }
    return nextErrors;
  };

  const handleChange = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const validationErrors = validate();
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);
    setServerError('');

    try {
      const response = await axios.post(`${apiBase}/admin/auth/login`, {
        email: form.email.trim(),
        password: form.password,
      });
      const { accessToken, refreshToken, user } = response.data || {};
      setSession({ accessToken, refreshToken, user });
      if (accessToken) {
        axios.defaults.headers.common.Authorization = `Bearer ${accessToken}`;
      }
      const redirectParam = searchParams.get('redirect');
      const redirectTarget = redirectParam ? decodeURIComponent(redirectParam) : '/dashboard';
      navigate(redirectTarget, { replace: true });
    } catch (error) {
      const message = error.response?.data?.message || 'ไม่สามารถเข้าสู่ระบบได้ กรุณาลองใหม่อีกครั้ง';
      setServerError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="login-screen">
      <div className="login-panel">
        <div style={{ marginBottom: '32px', textAlign: 'center' }}>
          <p className="page__eyebrow" style={{ marginBottom: '8px', letterSpacing: '0.15em' }}>Namaste Yoga</p>
          <h1 style={{ margin: 0, fontSize: '32px', fontWeight: '800', background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Admin Center
          </h1>
          <p style={{ margin: '12px 0 0', color: 'var(--color-muted)', fontSize: '15px' }}>
            เข้าสู่ระบบเพื่อจัดการคอร์สและสมาชิก
          </p>
        </div>

        <form onSubmit={handleSubmit} className="form-grid" style={{ gap: '20px' }}>
          <div className="field">
            <label className="field__label">อีเมล</label>
            <input
              type="email"
              value={form.email}
              onChange={handleChange('email')}
              placeholder="admin@example.com"
              className="input"
              style={{
                borderColor: errors.email ? '#dc2626' : undefined,
                fontSize: '15px',
                padding: '12px 16px'
              }}
              disabled={isSubmitting}
            />
            {errors.email && (
              <span style={{ color: '#dc2626', fontSize: '13px', marginTop: '6px', display: 'block' }}>
                {errors.email}
              </span>
            )}
          </div>

          <div className="field">
            <label className="field__label">รหัสผ่าน</label>
            <input
              type="password"
              value={form.password}
              onChange={handleChange('password')}
              placeholder="••••••••"
              className="input"
              style={{
                borderColor: errors.password ? '#dc2626' : undefined,
                fontSize: '15px',
                padding: '12px 16px'
              }}
              disabled={isSubmitting}
            />
            {errors.password && (
              <span style={{ color: '#dc2626', fontSize: '13px', marginTop: '6px', display: 'block' }}>
                {errors.password}
              </span>
            )}
          </div>

          {serverError && (
            <div className="page-alert page-alert--error" style={{ marginTop: '8px' }}>
              {serverError}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="btn btn--primary"
            style={{
              width: '100%',
              padding: '14px',
              fontSize: '16px',
              fontWeight: '700',
              marginTop: '8px',
              background: isSubmitting
                ? '#94a3b8'
                : 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px'
            }}
          >
            {isSubmitting && <span className="spinner" style={{ width: '16px', height: '16px', borderWidth: '2px' }} />}
            {isSubmitting ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
          </button>
        </form>

        <div className="divider" style={{ margin: '28px 0' }} />

        <div className="info-box info-box--info" style={{ borderRadius: '14px' }}>
          <p style={{ margin: '0 0 8px', fontSize: '13px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            บัญชีทดสอบ (Demo Account)
          </p>
          <div style={{ display: 'grid', gap: '6px' }}>
            <p style={{ margin: 0, fontSize: '14px', fontFamily: 'monospace', fontWeight: '600' }}>
              📧 <strong>admin@yoga.local</strong>
            </p>
            <p style={{ margin: 0, fontSize: '14px', fontFamily: 'monospace', fontWeight: '600' }}>
              🔑 <strong>Admin123!</strong>
            </p>
          </div>
        </div>

        <p style={{ marginTop: '24px', textAlign: 'center', fontSize: '13px', color: 'var(--color-muted)' }}>
          © 2025 Namaste Yoga. All rights reserved.
        </p>
      </div>
    </div>
  );
}

export default Login;
