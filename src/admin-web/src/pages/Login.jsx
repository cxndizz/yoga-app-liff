import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
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
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
      <div style={{ width: '100%', maxWidth: '420px', background: '#fff', padding: '40px', borderRadius: '16px', boxShadow: '0 20px 60px rgba(15, 23, 42, 0.25)' }}>
        <div style={{ marginBottom: '32px', textAlign: 'center' }}>
          <h1 style={{ margin: '0 0 8px', fontSize: '28px', color: '#111827', fontWeight: '700' }}> Admin</h1>
          <p style={{ margin: 0, color: '#6b7280', fontSize: '15px' }}>เข้าสู่ระบบเพื่อจัดการคอร์สและสมาชิก</p>
        </div>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <span style={{ fontWeight: 600, fontSize: '14px', color: '#374151' }}>อีเมล</span>
            <input
              type="email"
              value={form.email}
              onChange={handleChange('email')}
              placeholder="admin@example.com"
              style={{
                border: errors.email ? '2px solid #dc2626' : '1px solid #d1d5db',
                borderRadius: '8px',
                padding: '12px 14px',
                fontSize: '15px',
                transition: 'border 0.2s',
                outline: 'none',
              }}
              onFocus={(e) => {
                if (!errors.email) {
                  e.target.style.border = '2px solid #667eea';
                }
              }}
              onBlur={(e) => {
                if (!errors.email) {
                  e.target.style.border = '1px solid #d1d5db';
                }
              }}
              disabled={isSubmitting}
            />
            {errors.email && <span style={{ color: '#dc2626', fontSize: '13px', marginTop: '-2px' }}>{errors.email}</span>}
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <span style={{ fontWeight: 600, fontSize: '14px', color: '#374151' }}>รหัสผ่าน</span>
            <input
              type="password"
              value={form.password}
              onChange={handleChange('password')}
              placeholder="••••••••"
              style={{
                border: errors.password ? '2px solid #dc2626' : '1px solid #d1d5db',
                borderRadius: '8px',
                padding: '12px 14px',
                fontSize: '15px',
                transition: 'border 0.2s',
                outline: 'none',
              }}
              onFocus={(e) => {
                if (!errors.password) {
                  e.target.style.border = '2px solid #667eea';
                }
              }}
              onBlur={(e) => {
                if (!errors.password) {
                  e.target.style.border = '1px solid #d1d5db';
                }
              }}
              disabled={isSubmitting}
            />
            {errors.password && <span style={{ color: '#dc2626', fontSize: '13px', marginTop: '-2px' }}>{errors.password}</span>}
          </label>
          {serverError && (
            <div style={{ background: '#fee2e2', color: '#991b1b', borderRadius: '8px', padding: '12px 14px', fontSize: '14px', border: '1px solid #fecaca' }}>
              {serverError}
            </div>
          )}
          <button
            type="submit"
            disabled={isSubmitting}
            style={{
              background: isSubmitting ? '#9ca3af' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              padding: '14px 16px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              transition: 'transform 0.2s, box-shadow 0.2s',
              boxShadow: isSubmitting ? 'none' : '0 4px 12px rgba(102, 126, 234, 0.4)',
            }}
            onMouseEnter={(e) => {
              if (!isSubmitting) {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 6px 16px rgba(102, 126, 234, 0.5)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isSubmitting) {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.4)';
              }
            }}
          >
            {isSubmitting ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
          </button>
        </form>
        <div style={{ marginTop: '20px', textAlign: 'center', padding: '16px', background: '#f9fafb', borderRadius: '8px' }}>
          <p style={{ margin: '0 0 8px', fontSize: '13px', color: '#6b7280' }}>บัญชีทดสอบ (Demo Account):</p>
          <p style={{ margin: 0, fontSize: '13px', color: '#111827', fontFamily: 'monospace' }}>
            <strong>admin@yoga.local</strong> / <strong>Admin123!</strong>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;