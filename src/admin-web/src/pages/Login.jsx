import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { getSessionSnapshot, persistSession } from '../auth/session';

const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

const initialForm = {
  email: '',
  password: '',
};

const emailRegex = /[^\s@]+@[^\s@]+\.[^\s@]+/;

function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const { accessToken } = getSessionSnapshot();
    if (accessToken) {
      navigate('/', { replace: true });
    }
  }, [navigate]);

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
      persistSession({ accessToken, refreshToken, user });
      if (accessToken) {
        axios.defaults.headers.common.Authorization = `Bearer ${accessToken}`;
      }
      const redirect = searchParams.get('redirect') || '/';
      navigate(redirect, { replace: true });
    } catch (error) {
      const message = error.response?.data?.message || 'ไม่สามารถเข้าสู่ระบบได้ กรุณาลองใหม่อีกครั้ง';
      setServerError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f3f4f6' }}>
      <div style={{ width: '100%', maxWidth: '420px', background: '#fff', padding: '32px', borderRadius: '12px', boxShadow: '0 20px 45px rgba(15, 23, 42, 0.15)' }}>
        <div style={{ marginBottom: '24px', textAlign: 'center' }}>
          <h1 style={{ marginBottom: '8px', fontSize: '24px', color: '#111827' }}>NeedHome Admin</h1>
          <p style={{ color: '#6b7280' }}>เข้าสู่ระบบเพื่อจัดการคอร์สและสมาชิก</p>
        </div>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontWeight: 600 }}>อีเมล</span>
            <input
              type="email"
              value={form.email}
              onChange={handleChange('email')}
              placeholder="admin@example.com"
              style={{
                border: errors.email ? '1px solid #dc2626' : '1px solid #d1d5db',
                borderRadius: '8px',
                padding: '10px 12px',
              }}
              disabled={isSubmitting}
            />
            {errors.email && <span style={{ color: '#dc2626', fontSize: '13px' }}>{errors.email}</span>}
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontWeight: 600 }}>รหัสผ่าน</span>
            <input
              type="password"
              value={form.password}
              onChange={handleChange('password')}
              placeholder="••••••••"
              style={{
                border: errors.password ? '1px solid #dc2626' : '1px solid #d1d5db',
                borderRadius: '8px',
                padding: '10px 12px',
              }}
              disabled={isSubmitting}
            />
            {errors.password && <span style={{ color: '#dc2626', fontSize: '13px' }}>{errors.password}</span>}
          </label>
          {serverError && (
            <div style={{ background: '#fee2e2', color: '#991b1b', borderRadius: '8px', padding: '10px 12px', fontSize: '14px' }}>
              {serverError}
            </div>
          )}
          <button
            type="submit"
            disabled={isSubmitting}
            style={{
              background: isSubmitting ? '#9ca3af' : '#111827',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              padding: '12px 16px',
              fontSize: '16px',
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
            }}
          >
            {isSubmitting ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
          </button>
        </form>
        <div style={{ marginTop: '16px', textAlign: 'center' }}>
          <Link to="/" style={{ color: '#2563eb', textDecoration: 'none', fontSize: '14px' }}>กลับสู่หน้าแดชบอร์ด</Link>
        </div>
      </div>
    </div>
  );
}

export default Login;
