import React from 'react';
import axios from 'axios';
import { Routes, Route, Link, Outlet, useNavigate, Navigate } from 'react-router-dom';
import AdminDashboard from './pages/AdminDashboard';
import Courses from './pages/Courses';
import Users from './pages/Users';
import Branches from './pages/Branches';
import Instructors from './pages/Instructors';
import CourseSessions from './pages/CourseSessions';
import Enrollments from './pages/Enrollments';
import Login from './pages/Login';
import { withAdminGuard } from './auth/AdminGuard';
import { useAdminAuth } from './auth/AdminAuthContext';

const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

const AdminLayout = () => {
  const navigate = useNavigate();
  const [isLoggingOut, setIsLoggingOut] = React.useState(false);
  const { user: adminUser, role, refreshToken, clearSession } = useAdminAuth();

  const handleLogout = async () => {
    if (isLoggingOut) {
      return;
    }
    setIsLoggingOut(true);
    try {
      await axios.post(`${apiBase}/admin/auth/logout`, refreshToken ? { refreshToken } : {});
    } catch (error) {
      console.error('Failed to log out admin', error);
    } finally {
      clearSession();
      delete axios.defaults.headers.common.Authorization;
      setIsLoggingOut(false);
      navigate('/login', { replace: true });
    }
  };

  const navItems = [
    { label: 'Dashboard', to: '/dashboard', roles: ['super_admin', 'branch_admin', 'instructor'] },
    { label: 'Courses', to: '/courses', roles: ['super_admin', 'branch_admin'] },
    { label: 'Sessions', to: '/sessions', roles: ['super_admin', 'branch_admin', 'instructor'] },
    { label: 'Enrollments', to: '/enrollments', roles: ['super_admin', 'branch_admin'] },
    { label: 'Branches', to: '/branches', roles: ['super_admin'] },
    { label: 'Instructors', to: '/instructors', roles: ['super_admin', 'branch_admin'] },
    { label: 'Users', to: '/users', roles: ['super_admin'] },
  ];

  const visibleNavItems = navItems.filter((item) => !item.roles || item.roles.includes(role));

  return (
    <div style={{ display: 'flex', fontFamily: 'system-ui, sans-serif', minHeight: '100vh' }}>
      <aside style={{ width: '240px', background: '#111827', color: '#fff', padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <h2 style={{ marginBottom: '4px' }}> Admin</h2>
          {adminUser && (
            <p style={{ margin: 0, fontSize: '14px', color: '#cbd5f5' }}>สวัสดี, {adminUser.fullName || adminUser.email}</p>
          )}
        </div>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {visibleNavItems.map((item) => (
            <Link key={item.to} to={item.to} style={{ color: '#fff', textDecoration: 'none' }}>
              {item.label}
            </Link>
          ))}
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

const GuardedAdminLayout = withAdminGuard(AdminLayout, {
  allowedRoles: ['super_admin', 'branch_admin', 'instructor'],
});

const GuardedCourses = withAdminGuard(Courses, {
  allowedRoles: ['super_admin', 'branch_admin'],
});

const GuardedSessions = withAdminGuard(CourseSessions, {
  allowedRoles: ['super_admin', 'branch_admin', 'instructor'],
});

const GuardedEnrollments = withAdminGuard(Enrollments, {
  allowedRoles: ['super_admin', 'branch_admin'],
});

const GuardedBranches = withAdminGuard(Branches, {
  allowedRoles: ['super_admin'],
});

const GuardedInstructors = withAdminGuard(Instructors, {
  allowedRoles: ['super_admin', 'branch_admin'],
});

const GuardedUsers = withAdminGuard(Users, {
  allowedRoles: ['super_admin'],
});

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<GuardedAdminLayout />}>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<AdminDashboard />} />
        <Route path="/courses" element={<GuardedCourses />} />
        <Route path="/sessions" element={<GuardedSessions />} />
        <Route path="/enrollments" element={<GuardedEnrollments />} />
        <Route path="/branches" element={<GuardedBranches />} />
        <Route path="/instructors" element={<GuardedInstructors />} />
        <Route path="/users" element={<GuardedUsers />} />
      </Route>
    </Routes>
  );
}

export default App;