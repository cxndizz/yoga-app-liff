import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getSessionSnapshot } from '../auth/session';
import { useAdminAuth } from '../auth/AdminAuthContext';

const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

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
    // Clear error when user starts typing
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
        <div style={{ marginBottom: '24px', textAlign: 'center' }}>
          <p className="page__eyebrow" style={{ marginBottom: '6px' }}>Yoga Flow</p>
          <h1 style={{ margin: 0, fontSize: '28px' }}>Admin Center</h1>
          <p style={{ margin: '8px 0 0', color: 'var(--color-muted)' }}>เข้าสู่ระบบเพื่อจัดการคอร์สและสมาชิก</p>
        </div>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <span className="field__label">อีเมล</span>
            <input
              type="email"
              value={form.email}
              onChange={handleChange('email')}
              placeholder="admin@example.com"
              className="input"
              style={{ borderColor: errors.email ? '#dc2626' : undefined }}
              disabled={isSubmitting}
            />
            {errors.email && <span style={{ color: '#dc2626', fontSize: '13px' }}>{errors.email}</span>}
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <span className="field__label">รหัสผ่าน</span>
            <input
              type="password"
              value={form.password}
              onChange={handleChange('password')}
              placeholder="••••••••"
              className="input"
              style={{ borderColor: errors.password ? '#dc2626' : undefined }}
              disabled={isSubmitting}
            />
            {errors.password && <span style={{ color: '#dc2626', fontSize: '13px' }}>{errors.password}</span>}
          </label>
          {serverError && <div className="page-alert page-alert--error">{serverError}</div>}
          <button type="submit" disabled={isSubmitting} className="btn btn--primary" style={{ width: '100%' }}>
            {isSubmitting ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
          </button>
        </form>
        <div style={{ marginTop: '20px', textAlign: 'center', padding: '16px', background: 'var(--color-surface-muted)', borderRadius: '12px' }}>
          <p style={{ margin: '0 0 6px', fontSize: '13px', color: 'var(--color-muted)' }}>บัญชีทดสอบ (Demo Account)</p>
          <p style={{ margin: 0, fontSize: '13px', fontFamily: 'monospace', color: 'var(--color-heading)' }}>
            <strong>admin@yoga.local</strong> / <strong>Admin123!</strong>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;