import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';

const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

const containerStyle = {
  padding: '16px',
  fontFamily: 'system-ui, sans-serif',
  background: '#f6f8f7',
  minHeight: '100vh',
};

const cardStyle = {
  background: '#fff',
  borderRadius: '12px',
  padding: '14px',
  boxShadow: '0 4px 14px rgba(0, 0, 0, 0.05)',
  border: '1px solid #e8eeeb',
};

function formatPrice(course) {
  if (course.is_free) return 'ฟรี';
  const amount = (course.price_cents || 0) / 100;
  return `${amount.toLocaleString('th-TH', { minimumFractionDigits: 0 })} บาท`;
}

function formatDate(dateString) {
  if (!dateString) return 'ไม่ระบุวันที่';
  const dateObj = new Date(dateString);
  if (Number.isNaN(dateObj.getTime())) return dateString;
  return dateObj.toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' });
}

function formatTime(timeString) {
  if (!timeString) return '';
  return timeString.slice(0, 5);
}

function Courses() {
  const [courses, setCourses] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [coursesRes, sessionsRes] = await Promise.all([
          axios.post(`${apiBase}/courses/list`, {}),
          axios.post(`${apiBase}/courses/sessions`, { status: 'open', limit: 500 }),
        ]);
        setCourses(coursesRes.data || []);
        setSessions(sessionsRes.data || []);
      } catch (err) {
        console.error(err);
        setError('โหลดข้อมูลคอร์สหรือรอบเรียนไม่สำเร็จ กรุณาลองใหม่');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const heroText = useMemo(
    () => ({
      title: 'คอร์ส + ตารางรอบเรียน',
      subtitle:
        'ลูกค้า LIFF สามารถดูรายละเอียดคอร์ส ตรวจสอบรอบเรียน สาขา ความจุ และสั่งซื้อผ่าน Omise ได้ในหน้าเดียว',
    }),
    []
  );

  const sessionsByCourse = useMemo(() => {
    return sessions.reduce((acc, session) => {
      if (!acc[session.course_id]) acc[session.course_id] = [];
      acc[session.course_id].push(session);
      return acc;
    }, {});
  }, [sessions]);

  if (loading) return <div style={{ padding: '16px' }}>กำลังโหลดคอร์ส...</div>;

  return (
    <div style={containerStyle}>
      <div style={{ ...cardStyle, background: 'linear-gradient(120deg, #ddf8ec, #f8fffa)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ flex: 1 }}>
            <h2 style={{ margin: '0 0 6px' }}>{heroText.title}</h2>
            <p style={{ margin: 0, color: '#2a3d33' }}>{heroText.subtitle}</p>
            <ul style={{ margin: '10px 0 0', paddingLeft: '18px', color: '#3c5247', lineHeight: 1.6 }}>
              <li>รองรับเปิดจาก Rich Menu ปุ่ม “ดูคอร์ส” (<code>?action=courses</code>)</li>
              <li>แสดงราคา/สิทธิ์เข้าเรียน/Capacity และชื่อผู้สอน/สาขา</li>
              <li>แสดงรอบเรียนจริงที่บันทึกไว้ในฐานข้อมูลผ่าน API <code>/courses/sessions</code></li>
            </ul>
          </div>
          <div style={{ minWidth: '220px' }}>
            <div style={{ ...cardStyle, background: '#fff', border: '1px dashed #0f5132' }}>
              <div style={{ fontWeight: 700, marginBottom: '6px' }}>จุดกดซื้อ</div>
              <ol style={{ margin: 0, paddingLeft: '18px', lineHeight: 1.6 }}>
                <li>เลือกคอร์ส → ตรวจสอบรอบเรียน</li>
                <li>กด “ซื้อ/จองคอร์ส” → call API <code>/orders</code></li>
                <li>เปิดหน้าชำระเงิน Omise → รอ webhook ยืนยัน</li>
              </ol>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div style={{ ...cardStyle, border: '1px solid #f5c2c7', background: '#fff5f5', color: '#842029', marginTop: '12px' }}>
          {error}
        </div>
      )}

      {courses.length === 0 && !error && (
        <div style={{ ...cardStyle, marginTop: '12px' }}>
          <p style={{ margin: 0 }}>ยังไม่มีคอร์สในระบบ กรุณาสร้างคอร์สจากหลังบ้านก่อน</p>
        </div>
      )}

      <div style={{ display: 'grid', gap: '12px', marginTop: '12px' }}>
        {courses.map((course) => {
          const courseSessions = sessionsByCourse[course.id] || [];

          return (
            <div key={course.id} style={{ ...cardStyle }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', flexWrap: 'wrap' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <h3 style={{ margin: 0 }}>{course.title}</h3>
                    <span
                      style={{
                        padding: '4px 10px',
                        borderRadius: '12px',
                        background: course.is_free ? '#e6f4ea' : '#fff3cd',
                        color: course.is_free ? '#0f5132' : '#856404',
                        fontSize: '12px',
                        fontWeight: 700,
                      }}
                    >
                      {course.is_free ? 'คอร์สฟรี' : 'คอร์สเสียเงิน'}
                    </span>
                    {!course.is_free && (
                      <span style={{ color: '#1f2f26', fontWeight: 700 }}>{formatPrice(course)}</span>
                    )}
                  </div>
                  {course.description && (
                    <p style={{ margin: '6px 0 10px', color: '#2f4436', lineHeight: 1.5 }}>{course.description}</p>
                  )}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '8px' }}>
                    <div style={{ background: '#f6fbf8', padding: '8px', borderRadius: '8px', border: '1px solid #e8eeeb' }}>
                      <div style={{ fontWeight: 700 }}>สาขา</div>
                      <div style={{ color: '#415a4f' }}>{course.branch_name || 'ระบุในหลังบ้าน'}</div>
                    </div>
                    <div style={{ background: '#f6fbf8', padding: '8px', borderRadius: '8px', border: '1px solid #e8eeeb' }}>
                      <div style={{ fontWeight: 700 }}>ผู้สอน</div>
                      <div style={{ color: '#415a4f' }}>{course.instructor_name || 'ยังไม่กำหนด'}</div>
                    </div>
                    <div style={{ background: '#f6fbf8', padding: '8px', borderRadius: '8px', border: '1px solid #e8eeeb' }}>
                      <div style={{ fontWeight: 700 }}>Capacity</div>
                      <div style={{ color: '#415a4f' }}>{course.capacity} ที่นั่ง</div>
                    </div>
                    <div style={{ background: '#f6fbf8', padding: '8px', borderRadius: '8px', border: '1px solid #e8eeeb' }}>
                      <div style={{ fontWeight: 700 }}>สิทธิ์เข้าเรียน</div>
                      <div style={{ color: '#415a4f' }}>เข้าได้ {course.access_times} ครั้ง</div>
                    </div>
                  </div>
                </div>
                <div style={{ minWidth: '240px', alignSelf: 'flex-start', display: 'grid', gap: '8px' }}>
                  <div style={{ background: '#fdfaf4', border: '1px solid #f3e3c2', borderRadius: '10px', padding: '10px' }}>
                    <div style={{ fontWeight: 700, marginBottom: '4px' }}>ตารางรอบเรียน (ข้อมูลจริง)</div>
                    {courseSessions.length > 0 ? (
                      <ul style={{ margin: 0, paddingLeft: '18px', lineHeight: 1.5, color: '#4b412b', display: 'grid', gap: '8px' }}>
                        {courseSessions.map((session) => (
                          <li key={session.id} style={{ listStyleType: 'disc' }}>
                            <div style={{ fontWeight: 700 }}>{session.session_name || 'รอบเรียน'}</div>
                            <div style={{ fontSize: '13px' }}>
                              {formatDate(session.start_date)} · {formatTime(session.start_time)}
                              {session.end_time ? ` - ${formatTime(session.end_time)}` : ''}
                              {session.day_of_week ? ` (${session.day_of_week})` : ''}
                            </div>
                            <div style={{ fontSize: '13px', color: '#3f4d3f' }}>
                              {session.branch_name || course.branch_name || 'ไม่ระบุสาขา'} · {session.instructor_name || course.instructor_name || 'ไม่ระบุผู้สอน'}
                            </div>
                            <div style={{ fontSize: '12px', color: '#6c6148' }}>
                              ว่าง {Math.max((session.available_spots ?? 0), 0)} / {session.max_capacity || course.capacity} ที่นั่ง · สถานะ {session.status}
                            </div>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div style={{ fontSize: '13px', color: '#6c6148' }}>ยังไม่มีรอบเรียนที่เปิดรับสำหรับคอร์สนี้</div>
                    )}
                  </div>
                  <div style={{ marginTop: '2px', display: 'grid', gap: '6px' }}>
                    <button
                      type="button"
                      style={{
                        padding: '10px 12px',
                        background: '#00b900',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '8px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        width: '100%',
                      }}
                    >
                      ซื้อ / จองคอร์ส
                    </button>
                    <button
                      type="button"
                      style={{
                        padding: '10px 12px',
                        background: '#ffffff',
                        color: '#0f5132',
                        border: '1px solid #cbe5d5',
                        borderRadius: '8px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        width: '100%',
                      }}
                    >
                      ดูรายละเอียดคอร์ส
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default Courses;
