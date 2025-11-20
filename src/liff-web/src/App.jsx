import React, { useEffect } from 'react';
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import Home from './pages/Home';
import Courses from './pages/Courses';
import HowTo from './pages/HowTo';
import Contact from './pages/Contact';

function App() {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const action = params.get('action');
    if (!action) return;

    // Handle Rich Menu navigation
    if (action === 'register' || action === 'login') {
      // For register/login, stay on home page but could add specific handling
      navigate('/');
    } else if (action === 'courses') {
      navigate('/courses');
    } else if (action === 'howto') {
      navigate('/how-to');
    } else if (action === 'contact') {
      navigate('/contact');
    }
  }, [location.search, navigate]);

  return (
    <div style={{
      minHeight: '100vh',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    }}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/courses" element={<Courses />} />
        <Route path="/how-to" element={<HowTo />} />
        <Route path="/contact" element={<Contact />} />
      </Routes>
    </div>
  );
}

export default App;