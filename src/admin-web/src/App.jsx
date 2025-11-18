import React from 'react';
import axios from 'axios';
import { Routes, Route, Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Courses from './pages/Courses';
import Users from './pages/Users';
import Login from './pages/Login';

const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

const readStoredAdmin = () => {
  if (typeof window === 'undefined') {
    return null;
  }
  try {
    const raw = window.localStorage.getItem('adminUser');
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    console.warn('Failed to parse admin user from storage', error);
    return null;
  }
};

const AdminLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isCheckingSession, setIsCheckingSession] = React.useState(true);
  const [isLoggingOut, setIsLoggingOut] = React.useState(false);
  const [adminUser, setAdminUser] = React.useState(() => readStoredAdmin());

  React.useEffect(() => {
    const token = window.localStorage.getItem('adminAccessToken');
    if (!token) {
      const redirectTarget = encodeURIComponent(`${location.pathname}${location.search}` || '/');
      navigate(`/admin/login?redirect=${redirectTarget}`, { replace: true });
      return;
    }
    setAdminUser(readStoredAdmin());
    setIsCheckingSession(false);
  }, [navigate, location.pathname, location.search]);

  React.useEffect(() => {
    const handleStorageChange = () => {
      setAdminUser(readStoredAdmin());
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const handleLogout = async () => {
    if (isLoggingOut) {
      return;
    }
    setIsLoggingOut(true);
    const refreshToken = window.localStorage.getItem('adminRefreshToken');
    try {
      await axios.post(`${apiBase}/admin/auth/logout`, refreshToken ? { refreshToken } : {});
    } catch (error) {
      console.error('Failed to log out admin', error);
    } finally {
      window.localStorage.removeItem('adminAccessToken');
      window.localStorage.removeItem('adminRefreshToken');
      window.localStorage.removeItem('adminUser');
      setAdminUser(null);
      setIsLoggingOut(false);
      navigate('/admin/login', { replace: true });
    }
  };

  if (isCheckingSession) {
    return (
      <div style={{ display: 'flex', fontFamily: 'system-ui, sans-serif', minHeight: '100vh', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#111827' }}>กำลังตรวจสอบสิทธิ์การเข้าใช้งาน...</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', fontFamily: 'system-ui, sans-serif', minHeight: '100vh' }}>
      <aside style={{ width: '240px', background: '#111827', color: '#fff', padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <h2 style={{ marginBottom: '4px' }}>NeedHome Admin</h2>
          {adminUser && (
            <p style={{ margin: 0, fontSize: '14px', color: '#cbd5f5' }}>สวัสดี, {adminUser.fullName || adminUser.email}</p>
          )}
        </div>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <Link to="/" style={{ color: '#fff', textDecoration: 'none' }}>Dashboard</Link>
          <Link to="/courses" style={{ color: '#fff', textDecoration: 'none' }}>Courses</Link>
          <Link to="/users" style={{ color: '#fff', textDecoration: 'none' }}>Users</Link>
        </nav>
        <button
          type="button"
          onClick={handleLogout}
          disabled={isLoggingOut}
          style={{
            marginTop: 'auto',
            background: isLoggingOut ? '#6b7280' : '#dc2626',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            padding: '10px 12px',
            cursor: isLoggingOut ? 'not-allowed' : 'pointer',
          }}
        >
          {isLoggingOut ? 'กำลังออกจากระบบ...' : 'Logout'}
        </button>
      </aside>
      <main style={{ flex: 1, padding: '16px' }}>
        <Outlet />
      </main>
    </div>
  );
};

function App() {
  return (
    <Routes>
      <Route path="/admin/login" element={<Login />} />
      <Route element={<AdminLayout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/admin" element={<Dashboard />} />
        <Route path="/courses" element={<Courses />} />
        <Route path="/users" element={<Users />} />
      </Route>
    </Routes>
  );
}

export default App;
