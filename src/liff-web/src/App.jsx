import React, { useEffect } from 'react';
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import Home from './pages/Home';
import Courses from './pages/Courses';
import CourseDetail from './pages/CourseDetail';
import Checkout from './pages/Checkout';
import MyCourses from './pages/MyCourses';
import PaymentResult from './pages/PaymentResult';
import Navbar from './components/Navbar';
import WelcomeBar from './components/WelcomeBar';
import Footer from './components/Footer';
import useLiffUser from './hooks/useLiffUser';

function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const liffState = useLiffUser();
  const { status: authStatus, errorMessage } = liffState;

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
      <WelcomeBar liffState={liffState} />
      <main className="content-area">
        {/* Loading Status Banner */}
        {(authStatus === 'loading' || authStatus === 'redirecting') && (
          <div 
            className="status-banner"
            style={{
              background: 'linear-gradient(135deg, rgba(91, 33, 182, 0.2), rgba(196, 181, 253, 0.1))',
              borderColor: 'rgba(196, 181, 253, 0.3)',
              color: 'var(--secondary-100)',
            }}
          >
            <span style={{ marginRight: 8 }}>
              {authStatus === 'redirecting' ? '🔄' : '⏳'}
            </span>
            {authStatus === 'redirecting'
              ? 'กำลังนำคุณเข้าสู่ระบบ LINE...'
              : 'กำลังเชื่อมต่อบัญชี LINE ของคุณ...'}
          </div>
        )}
        
        {/* Error Status Banner */}
        {authStatus === 'error' && (
          <div 
            className="status-banner status-banner--error"
            style={{
              background: 'rgba(239, 68, 68, 0.15)',
              borderColor: 'rgba(239, 68, 68, 0.4)',
              color: '#fca5a5',
            }}
          >
            <span style={{ marginRight: 8 }}>⚠️</span>
            ไม่สามารถเชื่อมต่อ LINE ได้: {errorMessage}
          </div>
        )}
        
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/courses" element={<Courses />} />
          <Route path="/courses/:courseId" element={<CourseDetail />} />
          <Route path="/courses/:courseId/checkout" element={<Checkout />} />
          <Route path="/my-courses" element={<MyCourses />} />
          <Route path="/payments/moneyspace/:state" element={<PaymentResult />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

export default App;