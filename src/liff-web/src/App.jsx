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

    if (action === 'courses') navigate('/courses');
    else if (action === 'howto') navigate('/how-to');
    else if (action === 'contact') navigate('/contact');
    // action = register|login จะคงอยู่ที่หน้าหลักเพื่อให้ banner แสดงพารามิเตอร์ที่ส่งมาจาก Rich Menu
  }, [location.search, navigate]);

  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/courses" element={<Courses />} />
      <Route path="/how-to" element={<HowTo />} />
      <Route path="/contact" element={<Contact />} />
    </Routes>
  );
}

export default App;
