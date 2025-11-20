import React, { useEffect } from 'react';
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import Home from './pages/Home';
import Courses from './pages/Courses';

function App() {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const action = params.get('action');
    if (!action) return;

    // Handle Rich Menu navigation
    if (action === 'courses') {
      navigate('/courses');
    } else {
      navigate('/');
    }
  }, [location.search, navigate]);

  return (
    <div style={{
      minHeight: '100vh',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '8px',
        padding: '12px 16px',
        background: '#0f172a',
        color: '#fff',
        position: 'sticky',
        top: 0,
        zIndex: 20,
      }}>
        <div style={{ fontWeight: 700 }}>Yoga LIFF</div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            onClick={() => navigate('/')}
            style={{
              background: 'transparent',
              border: '1px solid rgba(255,255,255,0.2)',
              color: '#fff',
              padding: '6px 10px',
              borderRadius: '8px',
              cursor: 'pointer',
            }}
          >
            Home
          </button>
          <button
            type="button"
            onClick={() => navigate('/courses')}
            style={{
              background: '#38bdf8',
              border: 'none',
              color: '#0f172a',
              padding: '6px 10px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            คอร์สทั้งหมด
          </button>
        </div>
      </div>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/courses" element={<Courses />} />
      </Routes>
    </div>
  );
}

export default App;