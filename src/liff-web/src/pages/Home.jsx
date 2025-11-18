import React from 'react';
import { Link } from 'react-router-dom';

function Home() {
  return (
    <div style={{ padding: '16px', fontFamily: 'system-ui, sans-serif' }}>
      <h1>NeedHome Courses</h1>
      <p>ยินดีต้อนรับเข้าสู่ระบบคอร์สผ่าน LINE LIFF</p>
      <div style={{ marginTop: '16px' }}>
        <Link to="/courses" style={{ padding: '8px 16px', background: '#00b900', color: '#fff', borderRadius: '4px', textDecoration: 'none' }}>
          ดูคอร์สทั้งหมด
        </Link>
      </div>
    </div>
  );
}

export default Home;
