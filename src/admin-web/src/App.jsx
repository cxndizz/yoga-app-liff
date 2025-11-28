import React from 'react';
import axios from 'axios';
import { Routes, Route, NavLink, Outlet, useNavigate, Navigate, useLocation } from 'react-router-dom';
import AdminDashboard from './pages/AdminDashboard';
import Courses from './pages/Courses';
import Users from './pages/Users';
import Branches from './pages/Branches';
import Instructors from './pages/Instructors';
import CourseSessions from './pages/CourseSessions';
import Enrollments from './pages/Enrollments';
import Login from './pages/Login';
import AdminDebug from './pages/AdminDebug';
import Checkins from './pages/Checkins';
import { withAdminGuard } from './auth/AdminGuard';
import { useAdminAuth } from './auth/AdminAuthContext';
import { apiBase } from './config';

const AdminLayout = () => {
  const navigate = useNavigate();
  const [isLoggingOut, setIsLoggingOut] = React.useState(false);
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const { user: adminUser, role, refreshToken, clearSession } = useAdminAuth();
  const location = useLocation();

  React.useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

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
    { label: 'Check-ins', to: '/checkins', roles: ['super_admin', 'branch_admin', 'instructor'] },
    { label: 'Enrollments', to: '/enrollments', roles: ['super_admin', 'branch_admin'] },
    { label: 'Branches', to: '/branches', roles: ['super_admin'] },
    { label: 'Instructors', to: '/instructors', roles: ['super_admin', 'branch_admin'] },
    { label: 'Users', to: '/users', roles: ['super_admin'] },
    { label: 'Debug', to: '/debug', roles: ['super_admin'] },
  ];

  const visibleNavItems = navItems.filter((item) => !item.roles || item.roles.includes(role));

  const roleLabel =
    role === 'super_admin'
      ? 'Super Admin'
      : role === 'branch_admin'
        ? 'Branch Admin'
        : role === 'instructor'
          ? 'Instructor'
          : 'Administrator';

  const renderNavLink = ({ label, to }) => (
    <NavLink
      key={to}
      to={to}
      className={({ isActive }) => `admin-nav__link${isActive ? ' is-active' : ''}`}
    >
      {label}
    </NavLink>
  );

  return (
    <div className={`admin-shell${sidebarOpen ? ' admin-shell--sidebar-open' : ''}`}>
      <div
        className="admin-shell__overlay"
        aria-hidden={!sidebarOpen}
        onClick={() => setSidebarOpen(false)}
      />
      <aside className="admin-sidebar" aria-label="เมนูผู้ดูแลระบบ">
        <div className="admin-sidebar__brand">
          <p className="admin-sidebar__eyebrow">Namaste Yoga</p>
          <h2 className="admin-sidebar__title">Admin Center</h2>
          {adminUser && (
            <p className="admin-sidebar__welcome">
              {adminUser.fullName || adminUser.email}
            </p>
          )}
          <span className="admin-sidebar__welcome" style={{ fontSize: '12px' }}>{roleLabel}</span>
        </div>
        <nav className="admin-nav">
          {visibleNavItems.map(renderNavLink)}
        </nav>
        <div className="admin-sidebar__footer">
          <button
            type="button"
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="btn btn--ghost"
          >
            {isLoggingOut ? 'กำลังออกจากระบบ...' : 'ออกจากระบบ'}
          </button>
          <span style={{ fontSize: '12px', color: 'var(--sidebar-muted)' }}>
            เข้าสู่ระบบล่าสุด: {adminUser?.lastLoginAt ? new Date(adminUser.lastLoginAt).toLocaleString('th-TH') : '—'}
          </span>
        </div>
      </aside>
      <div className="admin-shell__body">
        <header className="admin-shell__topbar">
          <button
            type="button"
            className="sidebar-toggle"
            onClick={() => setSidebarOpen((prev) => !prev)}
            aria-expanded={sidebarOpen}
          >
            {sidebarOpen ? 'ปิดเมนู' : 'เมนู'}
          </button>
          <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
            <h2>Signed in as</h2>
            <strong>{adminUser?.email || '—'}</strong>
          </div>
        </header>
        <main className="admin-shell__content">
          <Outlet />
        </main>
      </div>
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

const GuardedCheckins = withAdminGuard(Checkins, {
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

const GuardedDebug = withAdminGuard(AdminDebug, {
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
        <Route path="/checkins" element={<GuardedCheckins />} />
        <Route path="/enrollments" element={<GuardedEnrollments />} />
        <Route path="/branches" element={<GuardedBranches />} />
        <Route path="/instructors" element={<GuardedInstructors />} />
        <Route path="/users" element={<GuardedUsers />} />
        <Route path="/debug" element={<GuardedDebug />} />
      </Route>
    </Routes>
  );
}

export default App;