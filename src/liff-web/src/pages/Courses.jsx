import React, { useEffect, useState } from 'react';
import axios from 'axios';

const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

function Courses() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.post(`${apiBase}/courses/list`, {})
      .then(res => setCourses(res.data || []))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ padding: '16px' }}>กำลังโหลดคอร์ส...</div>;

  return (
    <div style={{ padding: '16px', fontFamily: 'system-ui, sans-serif' }}>
      <h2>คอร์สทั้งหมด</h2>
      {courses.length === 0 && <p>ยังไม่มีคอร์สในระบบ</p>}
      <div style={{ display: 'grid', gap: '12px', marginTop: '12px' }}>
        {courses.map(course => (
          <div key={course.id} style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '12px' }}>
            <h3>{course.title}</h3>
            {course.description && <p>{course.description}</p>}
            <p>
              ประเภท: {course.is_free ? 'ฟรี' : 'เสียเงิน'}
              {!course.is_free && <> | ราคา: {(course.price_cents || 0) / 100} บาท</>}
            </p>
            <p>Capacity: {course.capacity} | เข้าได้ {course.access_times} ครั้ง</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Courses;
