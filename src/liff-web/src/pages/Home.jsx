import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';

const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

// Design tokens for an enterprise-grade look
const palette = {
  ink: '#0f172a',
  navy: '#111827',
  accent: '#3b82f6',
  accentDark: '#2563eb',
  accentSoft: '#e0ecff',
  slate: '#1f2937',
  muted: '#6b7280',
  border: '#e5e7eb',
  surface: '#ffffff',
  soft: '#f8fafc',
};

const layout = {
  container: {
    fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
    background: `radial-gradient(circle at 20% 20%, rgba(59, 130, 246, 0.08), transparent 25%),
      radial-gradient(circle at 80% 0%, rgba(16, 185, 129, 0.06), transparent 30%),
      ${palette.soft}`,
    minHeight: '100vh',
    color: palette.ink,
  },
  header: {
    background: `linear-gradient(130deg, ${palette.navy} 0%, ${palette.ink} 50%, #1d1f2b 100%)`,
    color: '#fff',
    padding: '32px 18px 42px',
    position: 'relative',
    overflow: 'hidden',
  },
  main: {
    padding: '0 18px 32px',
    maxWidth: '1200px',
    margin: '-60px auto 0',
  },
  card: {
    background: palette.surface,
    borderRadius: '18px',
    overflow: 'hidden',
    boxShadow: '0 20px 45px rgba(15, 23, 42, 0.12)',
    border: `1px solid ${palette.border}`,
  },
  subtleCard: {
    background: palette.surface,
    borderRadius: '14px',
    padding: '16px',
    boxShadow: '0 10px 32px rgba(15, 23, 42, 0.08)',
    border: `1px solid ${palette.border}`,
  },
  select: {
    padding: '12px 14px',
    borderRadius: '10px',
    border: `1px solid ${palette.border}`,
    background: palette.soft,
    fontSize: '14px',
    minWidth: '180px',
    cursor: 'pointer',
    outline: 'none',
    color: palette.slate,
  },
  buttonPrimary: {
    padding: '12px 18px',
    background: `linear-gradient(135deg, ${palette.accent} 0%, ${palette.accentDark} 100%)`,
    color: '#fff',
    border: 'none',
    borderRadius: '12px',
    fontWeight: 700,
    fontSize: '15px',
    cursor: 'pointer',
    width: '100%',
    transition: 'transform 0.2s, box-shadow 0.2s',
  },
  buttonSecondary: {
    padding: '12px 18px',
    background: '#0b1224',
    color: '#fff',
    border: '1px solid rgba(255, 255, 255, 0.18)',
    borderRadius: '12px',
    fontWeight: 600,
    fontSize: '14px',
    cursor: 'pointer',
    width: '100%',
    transition: 'all 0.2s',
  },
  sectionTitle: {
    fontSize: '22px',
    fontWeight: 700,
    color: palette.ink,
    marginBottom: '16px',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
};

// Helpers
function formatPrice(course) {
  if (course.is_free) return 'ฟรี';
  const amount = (course.price_cents || 0) / 100;
  return `฿${amount.toLocaleString('th-TH', { minimumFractionDigits: 0 })}`;
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

function formatDateShort(dateString) {
  if (!dateString) return '';
  const dateObj = new Date(dateString);
  if (Number.isNaN(dateObj.getTime())) return dateString;
  return dateObj.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' });
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

function Home() {
  const [courses, setCourses] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [selectedBranch, setSelectedBranch] = useState('all');
  const [selectedInstructor, setSelectedInstructor] = useState('all');

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
        setError('โหลดข้อมูลไม่สำเร็จ กรุณาลองใหม่อีกครั้ง');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const branches = useMemo(() => {
    const branchSet = new Set();
    courses.forEach((c) => {
      if (c.branch_name) branchSet.add(c.branch_name);
    });
    return Array.from(branchSet).sort();
  }, [courses]);

  const instructors = useMemo(() => {
    const instructorSet = new Set();
    courses.forEach((c) => {
      if (c.instructor_name) instructorSet.add(c.instructor_name);
    });
    return Array.from(instructorSet).sort();
  }, [courses]);

  const filteredCourses = useMemo(() => {
    return courses.filter((course) => {
      if (selectedBranch !== 'all' && course.branch_name !== selectedBranch) return false;
      if (selectedInstructor !== 'all' && course.instructor_name !== selectedInstructor) return false;
      return true;
    });
  }, [courses, selectedBranch, selectedInstructor]);

  const sessionsByCourse = useMemo(() => {
    return sessions.reduce((acc, session) => {
      if (!acc[session.course_id]) acc[session.course_id] = [];
      acc[session.course_id].push(session);
      return acc;
    }, {});
  }, [sessions]);

  const upcomingSessions = useMemo(() => {
    const now = new Date();
    return sessions
      .filter((s) => new Date(s.start_date) >= now)
      .sort((a, b) => new Date(a.start_date) - new Date(b.start_date))
      .slice(0, 8);
  }, [sessions]);

  const getCourseById = (courseId) => courses.find((c) => c.id === courseId);

  if (loading) {
    return (
      <div style={layout.container}>
        <div style={layout.header}>
          <h1 style={{ margin: 0, fontSize: '30px', fontWeight: 800 }}>NeedHome Yoga & Wellness</h1>
          <p style={{ margin: '8px 0 0', opacity: 0.85 }}>กำลังโหลดข้อมูลคอร์ส...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={layout.container}>
      <div style={layout.header}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gap: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', flexWrap: 'wrap' }}>
            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 12px', background: 'rgba(255,255,255,0.08)', borderRadius: '999px', fontSize: '13px', letterSpacing: '0.4px' }}>
                <span style={{ fontSize: '16px' }}>✨</span>
                Enterprise LIFF Experience
              </div>
              <h1 style={{ margin: '12px 0 6px', fontSize: '30px', fontWeight: 800 }}>
                NeedHome Yoga & Wellness
              </h1>
              <p style={{ margin: 0, maxWidth: '640px', lineHeight: 1.6, opacity: 0.85 }}>
                คัดสรรคลาสโยคะ พิลาทิส และเวิร์กช็อปที่ออกแบบมาเพื่อองค์กรและลูกค้า VIP เชื่อมต่อ LINE LIFF และระบบชำระเงินแบบไร้รอยต่อ
              </p>
            </div>
            <div style={{ minWidth: '220px', display: 'grid', gap: '8px' }}>
              <button
                type="button"
                style={layout.buttonSecondary}
                onMouseOver={(e) => (e.currentTarget.style.transform = 'translateY(-2px)')}
                onMouseOut={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
              >
                เปิดดูคอร์สทั้งหมด
              </button>
              <button
                type="button"
                style={{ ...layout.buttonSecondary, background: 'transparent', color: '#cbd5f5', border: '1px solid rgba(255,255,255,0.2)' }}
                onMouseOver={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
                onMouseOut={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                วิธีใช้งานระบบ LIFF
              </button>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px', marginTop: '8px' }}>
            {[{ label: 'คอร์สทั้งหมด', value: courses.length || '-' }, { label: 'รอบที่กำลังจะมาถึง', value: upcomingSessions.length }, { label: 'สาขาที่เปิดสอน', value: branches.length || '-' }].map((item) => (
              <div key={item.label} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '10px 12px' }}>
                <div style={{ fontSize: '12px', opacity: 0.8 }}>{item.label}</div>
                <div style={{ fontSize: '18px', fontWeight: 700 }}>{item.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={layout.main}>
        {error && (
          <div style={{ ...layout.subtleCard, border: '1px solid #fecdd3', background: '#fff1f2', color: '#9f1239', marginBottom: '16px' }}>
            {error}
          </div>
        )}

        {/* Filters */}
        <div style={{ ...layout.card, padding: '16px', marginBottom: '20px' }}>
          <div style={{ fontWeight: 700, marginBottom: '12px', color: palette.ink, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '18px' }}>🎛️</span> เลือกสาขาและผู้สอน
          </div>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div style={{ flex: '1 1 200px', minWidth: '160px' }}>
              <label style={{ fontSize: '13px', color: palette.muted, display: 'block', marginBottom: '6px' }}>สาขา</label>
              <select
                style={layout.select}
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
              >
                <option value="all">ทุกสาขา</option>
                {branches.map((branch) => (
                  <option key={branch} value={branch}>{branch}</option>
                ))}
              </select>
            </div>
            <div style={{ flex: '1 1 200px', minWidth: '160px' }}>
              <label style={{ fontSize: '13px', color: palette.muted, display: 'block', marginBottom: '6px' }}>ผู้สอน</label>
              <select
                style={layout.select}
                value={selectedInstructor}
                onChange={(e) => setSelectedInstructor(e.target.value)}
              >
                <option value="all">ทุกท่าน</option>
                {instructors.map((instructor) => (
                  <option key={instructor} value={instructor}>{instructor}</option>
                ))}
              </select>
            </div>
            {(selectedBranch !== 'all' || selectedInstructor !== 'all') && (
              <div style={{ flex: '0 0 auto' }}>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedBranch('all');
                    setSelectedInstructor('all');
                  }}
                  style={{
                    padding: '12px 14px',
                    background: palette.soft,
                    border: `1px solid ${palette.border}`,
                    borderRadius: '10px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    color: palette.muted,
                  }}
                >
                  ล้างตัวกรอง
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Upcoming sessions */}
        {upcomingSessions.length > 0 && (
          <div style={{ marginBottom: '24px' }}>
            <h2 style={layout.sectionTitle}>
              <span style={{ fontSize: '24px' }}>📅</span>
              ตารางเรียนที่กำลังจะมาถึง
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '14px' }}>
              {upcomingSessions.map((session) => {
                const course = getCourseById(session.course_id);
                return (
                  <div
                    key={session.id}
                    style={{ ...layout.subtleCard, borderLeft: `4px solid ${palette.accent}`, padding: '14px' }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px', gap: '10px' }}>
                      <div>
                        <div style={{ fontWeight: 700, color: palette.ink, fontSize: '15px' }}>
                          {session.session_name || course?.title || 'รอบเรียน'}
                        </div>
                        <div style={{ fontSize: '13px', color: palette.muted }}>
                          {course?.title || 'คอร์ส'}
                        </div>
                      </div>
                      <div style={{ background: palette.accentSoft, color: palette.accentDark, padding: '6px 10px', borderRadius: '10px', fontSize: '12px', fontWeight: 700 }}>
                        {formatDateShort(session.start_date)}
                      </div>
                    </div>
                    <div style={{ fontSize: '14px', color: palette.slate, marginBottom: '6px' }}>
                      🕐 {formatTime(session.start_time)}{session.end_time ? ` - ${formatTime(session.end_time)}` : ''}
                      {session.day_of_week && <span style={{ marginLeft: '8px', color: palette.muted }}>({session.day_of_week})</span>}
                    </div>
                    <div style={{ fontSize: '13px', color: palette.muted }}>
                      📍 {session.branch_name || course?.branch_name || 'ไม่ระบุสาขา'}
                    </div>
                    <div style={{ fontSize: '13px', color: palette.muted, marginTop: '2px' }}>
                      👤 {session.instructor_name || course?.instructor_name || 'ไม่ระบุผู้สอน'}
                    </div>
                    <div style={{ fontSize: '12px', color: palette.muted, marginTop: '10px', paddingTop: '10px', borderTop: `1px dashed ${palette.border}` }}>
                      ว่าง {Math.max((session.available_spots ?? 0), 0)} / {session.max_capacity || course?.capacity || 0} ที่นั่ง
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Course cards */}
        <div>
          <h2 style={layout.sectionTitle}>
            <span style={{ fontSize: '24px' }}>🧘</span>
            คอร์สทั้งหมด
            {filteredCourses.length !== courses.length && (
              <span style={{ fontSize: '14px', fontWeight: 500, color: palette.muted }}>
                ({filteredCourses.length} จาก {courses.length} คอร์ส)
              </span>
            )}
          </h2>

          {filteredCourses.length === 0 && !error && (
            <div style={{ ...layout.subtleCard, textAlign: 'center', color: palette.muted }}>
              {courses.length === 0 ? 'ยังไม่มีคอร์สในระบบ' : 'ไม่พบคอร์สตามเงื่อนไขที่เลือก'}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '18px' }}>
            {filteredCourses.map((course) => {
              const courseSessions = sessionsByCourse[course.id] || [];
              const nextSession = courseSessions
                .filter((s) => new Date(s.start_date) >= new Date())
                .sort((a, b) => new Date(a.start_date) - new Date(b.start_date))[0];
              const coverImage = getCoverImage(course);
              const placeholder = getPlaceholder(course.title);

              return (
                <div key={course.id} style={layout.card}>
                  <div
                    style={{
                      height: '180px',
                      background: coverImage
                        ? `linear-gradient(120deg, rgba(17,24,39,0.35), rgba(17,24,39,0.1)), url(${coverImage}) center/cover no-repeat`
                        : `linear-gradient(135deg, ${placeholder.color} 0%, ${placeholder.color}cc 100%)`,
                      position: 'relative',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#fff',
                    }}
                  >
                    {!coverImage && (
                      <div style={{ fontSize: '46px', fontWeight: 800, opacity: 0.28 }}>{placeholder.initial}</div>
                    )}
                    <div style={{ position: 'absolute', top: '12px', right: '12px', display: 'grid', gap: '6px' }}>
                      <div style={{
                        background: course.is_free ? 'rgba(34,197,94,0.95)' : 'rgba(17,24,39,0.85)',
                        color: '#fff',
                        padding: '8px 12px',
                        borderRadius: '12px',
                        fontSize: '13px',
                        fontWeight: 800,
                        letterSpacing: '0.3px',
                        textTransform: 'uppercase',
                      }}>
                        {course.is_free ? 'Free Access' : formatPrice(course)}
                      </div>
                      {nextSession && (
                        <div style={{ background: 'rgba(255,255,255,0.16)', color: '#e0f2fe', padding: '6px 10px', borderRadius: '10px', fontSize: '12px', fontWeight: 600 }}>
                          รอบถัดไป {formatDateShort(nextSession.start_date)}
                        </div>
                      )}
                    </div>
                  </div>

                  <div style={{ padding: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', alignItems: 'flex-start' }}>
                      <h3 style={{ margin: 0, fontSize: '18px', color: palette.ink, lineHeight: 1.4 }}>
                        {course.title}
                      </h3>
                      <span style={{ padding: '6px 10px', background: palette.accentSoft, color: palette.accentDark, borderRadius: '12px', fontSize: '12px', fontWeight: 700 }}>
                        {course.channel || 'Onsite / Online'}
                      </span>
                    </div>

                    {course.description && (
                      <p style={{ margin: '10px 0 12px', color: palette.muted, fontSize: '14px', lineHeight: 1.6, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {course.description}
                      </p>
                    )}

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
                      <div style={{ background: palette.soft, padding: '10px 12px', borderRadius: '10px', fontSize: '13px', border: `1px solid ${palette.border}` }}>
                        <div style={{ color: palette.muted, fontSize: '11px', marginBottom: '4px', letterSpacing: '0.3px' }}>สาขา</div>
                        <div style={{ color: palette.slate, fontWeight: 600 }}>{course.branch_name || '-'} </div>
                      </div>
                      <div style={{ background: palette.soft, padding: '10px 12px', borderRadius: '10px', fontSize: '13px', border: `1px solid ${palette.border}` }}>
                        <div style={{ color: palette.muted, fontSize: '11px', marginBottom: '4px', letterSpacing: '0.3px' }}>ผู้สอน</div>
                        <div style={{ color: palette.slate, fontWeight: 600 }}>{course.instructor_name || '-'}</div>
                      </div>
                    </div>

                    {nextSession && (
                      <div style={{ background: '#0b1224', color: '#e2e8f0', padding: '10px 12px', borderRadius: '12px', marginBottom: '12px', fontSize: '13px', display: 'flex', justifyContent: 'space-between', gap: '8px', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontWeight: 700, color: '#ffffff' }}>รอบถัดไป</div>
                          <div style={{ opacity: 0.85 }}>
                            {formatDate(nextSession.start_date)} · {formatTime(nextSession.start_time)}
                          </div>
                        </div>
                        <div style={{ fontSize: '12px', background: 'rgba(255,255,255,0.08)', padding: '6px 10px', borderRadius: '10px' }}>
                          ว่าง {Math.max((nextSession.available_spots ?? 0), 0)} ที่นั่ง
                        </div>
                      </div>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: palette.muted, marginBottom: '14px' }}>
                      <span>👥 {course.capacity} ที่นั่ง</span>
                      <span>🎟️ เข้าได้ {course.access_times} ครั้ง</span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      <button
                        type="button"
                        style={layout.buttonPrimary}
                        onMouseOver={(e) => {
                          e.currentTarget.style.transform = 'translateY(-2px)';
                          e.currentTarget.style.boxShadow = '0 10px 24px rgba(59,130,246,0.35)';
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = 'none';
                        }}
                      >
                        ซื้อคอร์ส
                      </button>
                      <button
                        type="button"
                        style={{
                          padding: '12px 18px',
                          background: palette.soft,
                          color: palette.slate,
                          border: `1px solid ${palette.border}`,
                          borderRadius: '12px',
                          fontWeight: 700,
                          fontSize: '14px',
                          cursor: 'pointer',
                          width: '100%',
                          transition: 'all 0.2s',
                        }}
                        onMouseOver={(e) => {
                          e.currentTarget.style.border = `1px solid ${palette.accent}`;
                          e.currentTarget.style.color = palette.accent;
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.border = `1px solid ${palette.border}`;
                          e.currentTarget.style.color = palette.slate;
                        }}
                      >
                        ดูรายละเอียด
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* All sessions */}
        {sessions.length > 0 && (
          <div style={{ marginTop: '30px' }}>
            <h2 style={layout.sectionTitle}>
              <span style={{ fontSize: '24px' }}>📋</span>
              ตารางการสอนทั้งหมด
            </h2>
            <div style={{ ...layout.card, overflow: 'hidden' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                  <thead>
                    <tr style={{ background: palette.soft }}>
                      {['คอร์ส', 'วันที่', 'เวลา', 'สาขา', 'ผู้สอน', 'ที่ว่าง'].map((head) => (
                        <th
                          key={head}
                          style={{ padding: '12px 16px', textAlign: head === 'ที่ว่าง' ? 'center' : 'left', fontWeight: 700, color: palette.ink, borderBottom: `2px solid ${palette.border}` }}
                        >
                          {head}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sessions
                      .sort((a, b) => new Date(a.start_date) - new Date(b.start_date))
                      .map((session, index) => {
                        const course = getCourseById(session.course_id);
                        const isPast = new Date(session.start_date) < new Date();
                        return (
                          <tr
                            key={session.id}
                            style={{ background: index % 2 === 0 ? '#fff' : '#f9fbff', opacity: isPast ? 0.6 : 1 }}
                          >
                            <td style={{ padding: '12px 16px', borderBottom: `1px solid ${palette.border}` }}>
                              <div style={{ fontWeight: 600, color: palette.slate }}>{session.session_name || course?.title || '-'}</div>
                              <div style={{ fontSize: '12px', color: palette.muted }}>{course?.title || '-'}</div>
                            </td>
                            <td style={{ padding: '12px 16px', borderBottom: `1px solid ${palette.border}`, color: palette.slate }}>
                              {formatDate(session.start_date)}
                              {session.day_of_week && <span style={{ color: palette.muted }}> ({session.day_of_week})</span>}
                            </td>
                            <td style={{ padding: '12px 16px', borderBottom: `1px solid ${palette.border}`, color: palette.slate }}>
                              {formatTime(session.start_time)}{session.end_time && ` - ${formatTime(session.end_time)}`}
                            </td>
                            <td style={{ padding: '12px 16px', borderBottom: `1px solid ${palette.border}`, color: palette.slate }}>
                              {session.branch_name || course?.branch_name || '-'}
                            </td>
                            <td style={{ padding: '12px 16px', borderBottom: `1px solid ${palette.border}`, color: palette.slate }}>
                              {session.instructor_name || course?.instructor_name || '-'}
                            </td>
                            <td style={{ padding: '12px 16px', borderBottom: `1px solid ${palette.border}`, textAlign: 'center' }}>
                              <span style={{
                                background: (session.available_spots ?? 0) > 0 ? '#dbeafe' : '#fee2e2',
                                color: (session.available_spots ?? 0) > 0 ? '#1d4ed8' : '#b91c1c',
                                padding: '6px 10px',
                                borderRadius: '10px',
                                fontWeight: 700,
                                fontSize: '12px',
                              }}>
                                {Math.max((session.available_spots ?? 0), 0)} / {session.max_capacity || course?.capacity || 0}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      <div style={{ background: palette.navy, color: '#e5e7eb', padding: '20px 16px', textAlign: 'center', marginTop: '40px' }}>
        <p style={{ margin: '0 0 6px', fontSize: '14px', letterSpacing: '0.3px' }}>NeedHome Yoga & Wellness</p>
        <p style={{ margin: 0, fontSize: '12px', opacity: 0.75 }}>ติดต่อทีมงานผ่าน LINE Official Account สำหรับข้อมูลเพิ่มเติม</p>
      </div>
    </div>
  );
}

export default Home;
