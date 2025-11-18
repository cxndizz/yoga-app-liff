import React from 'react';
import { Routes, Route, Link, Outlet } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Courses from './pages/Courses';
import Users from './pages/Users';
import Login from './pages/Login';
import { withAdminGuard } from './auth/AdminGuard';

const AdminLayout = () => (
  <div style={{ display: 'flex', fontFamily: 'system-ui, sans-serif', minHeight: '100vh' }}>
    <aside style={{ width: '220px', background: '#111827', color: '#fff', padding: '16px' }}>
      <h2>NeedHome Admin</h2>
      <nav style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <Link to="/" style={{ color: '#fff', textDecoration: 'none' }}>Dashboard</Link>
        <Link to="/courses" style={{ color: '#fff', textDecoration: 'none' }}>Courses</Link>
        <Link to="/users" style={{ color: '#fff', textDecoration: 'none' }}>Users</Link>
      </nav>
    </aside>
    <main style={{ flex: 1, padding: '16px' }}>
      <Outlet />
    </main>
  </div>
);

const GuardedAdminLayout = withAdminGuard(AdminLayout, {
  allowedRoles: ['super_admin', 'admin', 'staff'],
});

function App() {
  return (
    <Routes>
      <Route path="/admin/login" element={<Login />} />
      <Route element={<GuardedAdminLayout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/admin" element={<Dashboard />} />
        <Route path="/courses" element={<Courses />} />
        <Route path="/users" element={<Users />} />
      </Route>
    </Routes>
  );
}

export default App;
