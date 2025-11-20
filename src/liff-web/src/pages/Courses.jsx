import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';

const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

const palette = {
  ink: '#0f172a',
  navy: '#111827',
  accent: '#3b82f6',
  accentDark: '#2563eb',
  accentSoft: '#e0ecff',
  border: '#e5e7eb',
  soft: '#f8fafc',
  muted: '#6b7280',
  slate: '#1f2937',
};

const layout = {
  container: {
    padding: '18px',
    fontFamily: 'Inter, system-ui, sans-serif',
    background: palette.soft,
    minHeight: '100vh',
  },
  card: {
    background: '#fff',
    borderRadius: '16px',
    padding: '16px',
    boxShadow: '0 16px 40px rgba(15, 23, 42, 0.08)',
    border: `1px solid ${palette.border}`,
  },
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

function getCoverImage(course) {
  return course.cover_image_url || course.course_image || '';
}

function getPlaceholder(courseTitle) {
  const colors = ['#0ea5e9', '#8b5cf6', '#14b8a6', '#f59e0b', '#6366f1'];
  const colorIndex = Math.abs((courseTitle || 'C').charCodeAt(0) % colors.length);
  const color = colors[colorIndex];
  const initial = courseTitle?.charAt(0)?.toUpperCase() || 'C';
  return { color, initial };
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
      subtitle: 'ประสบการณ์ลูกค้าแบบองค์กรใน LIFF ตรวจสอบรูปปก ราคา และตารางจริงก่อนจอง',
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

  if (loading) return <div style={{ padding: '16px', fontFamily: 'Inter, system-ui, sans-serif' }}>กำลังโหลดคอร์ส...</div>;

  return (
    <div style={layout.container}>
      <div style={{ ...layout.card, background: `linear-gradient(120deg, ${palette.navy}, #0b1224)`, color: '#fff' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 12px', background: 'rgba(255,255,255,0.08)', borderRadius: '999px', fontSize: '13px' }}>
              <span>📡</span> Live on LINE LIFF
            </div>
            <h2 style={{ margin: '12px 0 6px' }}>{heroText.title}</h2>
            <p style={{ margin: 0, color: '#e5e7eb', lineHeight: 1.6 }}>{heroText.subtitle}</p>
          </div>
          <div style={{ minWidth: '240px', display: 'grid', gap: '8px' }}>
            <button
              type="button"
              style={{
                padding: '12px 16px',
                background: '#fff',
                color: palette.ink,
                border: 'none',
                borderRadius: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 12px 24px rgba(0,0,0,0.15)',
              }}
            >
              เปิดดูคอร์สทั้งหมด
            </button>
            <button
              type="button"
              style={{
                padding: '12px 16px',
                background: 'transparent',
                color: '#cbd5f5',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '12px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              วิธีจองและชำระเงิน Omise
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div style={{ ...layout.card, border: '1px solid #f5c2c7', background: '#fff5f5', color: '#842029', marginTop: '12px' }}>
          {error}
        </div>
      )}

      {courses.length === 0 && !error && (
        <div style={{ ...layout.card, marginTop: '12px' }}>
          <p style={{ margin: 0 }}>ยังไม่มีคอร์สในระบบ กรุณาสร้างคอร์สจากหลังบ้านก่อน</p>
        </div>
      )}

      <div style={{ display: 'grid', gap: '14px', marginTop: '12px' }}>
        {courses.map((course) => {
          const courseSessions = sessionsByCourse[course.id] || [];
          const coverImage = getCoverImage(course);
          const placeholder = getPlaceholder(course.title);

          return (
            <div key={course.id} style={{ ...layout.card, padding: '0' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'minmax(220px, 320px) 1fr', gap: '0', alignItems: 'stretch' }}>
                <div
                  style={{
                    minHeight: '220px',
                    background: coverImage
                      ? `linear-gradient(120deg, rgba(17,24,39,0.35), rgba(17,24,39,0.1)), url(${coverImage}) center/cover no-repeat`
                      : `linear-gradient(135deg, ${placeholder.color} 0%, ${placeholder.color}dd 100%)`,
                    position: 'relative',
                  }}
                >
                  {!coverImage && (
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '56px', fontWeight: 800, opacity: 0.3 }}>
                      {placeholder.initial}
                    </div>
                  )}
                  <div style={{ position: 'absolute', top: '12px', left: '12px', display: 'grid', gap: '6px' }}>
                    <span style={{ background: course.is_free ? 'rgba(34,197,94,0.95)' : 'rgba(17,24,39,0.85)', color: '#fff', padding: '8px 12px', borderRadius: '12px', fontWeight: 800, fontSize: '13px' }}>
                      {course.is_free ? 'คอร์สฟรี' : formatPrice(course)}
                    </span>
                    <span style={{ background: 'rgba(255,255,255,0.12)', color: '#f8fafc', padding: '6px 10px', borderRadius: '10px', fontSize: '12px', fontWeight: 700 }}>
                      สิทธิ์เข้าเรียน {course.access_times} ครั้ง
                    </span>
                  </div>
                </div>

                <div style={{ padding: '16px 16px 18px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', alignItems: 'flex-start' }}>
                    <h3 style={{ margin: 0, color: palette.ink }}>{course.title}</h3>
                    <span style={{ padding: '6px 10px', background: palette.accentSoft, color: palette.accentDark, borderRadius: '12px', fontSize: '12px', fontWeight: 700 }}>
                      {course.channel || 'Onsite / Online'}
                    </span>
                  </div>

                  {course.description && (
                    <p style={{ margin: '8px 0 12px', color: palette.muted, lineHeight: 1.6 }}>
                      {course.description}
                    </p>
                  )}

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '8px' }}>
                    {[{ label: 'สาขา', value: course.branch_name || 'ระบุในหลังบ้าน' }, { label: 'ผู้สอน', value: course.instructor_name || 'ยังไม่กำหนด' }, { label: 'Capacity', value: `${course.capacity} ที่นั่ง` }].map((item) => (
                      <div key={item.label} style={{ background: palette.soft, padding: '10px 12px', borderRadius: '10px', border: `1px solid ${palette.border}` }}>
                        <div style={{ fontSize: '11px', color: palette.muted, letterSpacing: '0.3px', marginBottom: '4px' }}>{item.label}</div>
                        <div style={{ color: palette.slate, fontWeight: 700 }}>{item.value}</div>
                      </div>
                    ))}
                  </div>

                  <div style={{ marginTop: '12px', background: '#0b1224', color: '#e5e7eb', borderRadius: '12px', padding: '12px', border: '1px solid #1f2a44' }}>
                    <div style={{ fontWeight: 700, marginBottom: '6px' }}>ตารางรอบเรียน (ข้อมูลจริง)</div>
                    {courseSessions.length > 0 ? (
                      <ul style={{ margin: 0, paddingLeft: '18px', lineHeight: 1.5, display: 'grid', gap: '8px' }}>
                        {courseSessions.map((session) => (
                          <li key={session.id} style={{ listStyleType: 'disc' }}>
                            <div style={{ fontWeight: 700 }}>
                              {session.session_name || 'รอบเรียน'}
                            </div>
                            <div style={{ fontSize: '13px', color: '#cbd5e1' }}>
                              {formatDate(session.start_date)} · {formatTime(session.start_time)}
                              {session.end_time ? ` - ${formatTime(session.end_time)}` : ''}
                              {session.day_of_week ? ` (${session.day_of_week})` : ''}
                            </div>
                            <div style={{ fontSize: '13px', color: '#cbd5e1' }}>
                              {session.branch_name || course.branch_name || 'ไม่ระบุสาขา'} · {session.instructor_name || course.instructor_name || 'ไม่ระบุผู้สอน'}
                            </div>
                            <div style={{ fontSize: '12px', color: '#a5b4fc' }}>
                              ว่าง {Math.max((session.available_spots ?? 0), 0)} / {session.max_capacity || course.capacity} ที่นั่ง · สถานะ {session.status}
                            </div>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div style={{ fontSize: '13px', color: '#cbd5e1' }}>ยังไม่มีรอบเรียนที่เปิดรับสำหรับคอร์สนี้</div>
                    )}
                  </div>

                  <div style={{ marginTop: '12px', display: 'grid', gap: '8px', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
                    <button
                      type="button"
                      style={{
                        padding: '12px 14px',
                        background: `linear-gradient(135deg, ${palette.accent} 0%, ${palette.accentDark} 100%)`,
                        color: '#fff',
                        border: 'none',
                        borderRadius: '12px',
                        fontWeight: 800,
                        cursor: 'pointer',
                      }}
                    >
                      ซื้อ / จองคอร์ส
                    </button>
                    <button
                      type="button"
                      style={{
                        padding: '12px 14px',
                        background: '#fff',
                        color: palette.slate,
                        border: `1px solid ${palette.border}`,
                        borderRadius: '12px',
                        fontWeight: 700,
                        cursor: 'pointer',
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
