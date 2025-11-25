import React, { useEffect } from 'react';
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import Home from './pages/Home';
import Courses from './pages/Courses';
import CourseDetail from './pages/CourseDetail';
import Checkout from './pages/Checkout';
import MyCourses from './pages/MyCourses';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import useLiffUser from './hooks/useLiffUser';

function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const { status: authStatus, errorMessage } = useLiffUser();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const action = params.get('action');
    if (!action) return;

    const actionRoutes = {
      courses: '/courses',
      register: '/',
      login: '/',
      howto: '/',
      contact: '/',
      mycourses: '/my-courses',
    };

    const destination = actionRoutes[action];
    if (destination) navigate(destination);
  }, [location.search, navigate]);

  return (
    <div className="app-shell">
      <div className="nav-spacer" />
      <Navbar />
      <main className="content-area">
        {(authStatus === 'loading' || authStatus === 'redirecting') && (
          <div className="status-banner">
            {authStatus === 'redirecting'
              ? 'กำลังนำคุณเข้าสู่ระบบ LINE...'
              : 'กำลังเชื่อมต่อบัญชี LINE ของคุณ...'}
          </div>
        )}
        {authStatus === 'error' && (
          <div className="status-banner status-banner--error">
            ไม่สามารถเชื่อมต่อ LINE ได้: {errorMessage}
          </div>
        )}
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/courses" element={<Courses />} />
          <Route path="/courses/:courseId" element={<CourseDetail />} />
          <Route path="/courses/:courseId/checkout" element={<Checkout />} />
          <Route path="/my-courses" element={<MyCourses />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

export default App;
