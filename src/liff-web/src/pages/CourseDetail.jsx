import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';

const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

const palette = {
  primary: '#1e40af',
  primaryDark: '#1e3a8a',
  secondary: '#64748b',
  accent: '#3b82f6',
  success: '#059669',
  warning: '#d97706',
  danger: '#dc2626',
  text: '#1f2937',
  textMuted: '#6b7280',
  textLight: '#9ca3af',
  background: '#f8fafc',
  surface: '#ffffff',
  border: '#e2e8f0',
  borderLight: '#f1f5f9',
};

const styles = {
  container: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    backgroundColor: palette.background,
    minHeight: '100vh',
    color: palette.text,
  },
  header: {
    backgroundColor: palette.primary,
    color: '#fff',
    padding: '24px 0',
    marginBottom: '24px',
  },
  headerContent: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '0 16px',
  },
  title: {
    fontSize: '30px',
    fontWeight: '700',
    marginBottom: '8px',
    lineHeight: '1.2',
  },
  subtitle: {
    fontSize: '15px',
    color: 'rgba(255,255,255,0.9)',
    lineHeight: '1.5',
  },
  mainContent: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '0 16px 32px',
    display: 'grid',
    gap: '20px',
  },
  hero: {
    position: 'relative',
    backgroundColor: palette.surface,
    borderRadius: '16px',
    overflow: 'hidden',
    border: `1px solid ${palette.border}`,
    boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
  },
  heroImage: {
    height: '260px',
    width: '100%',
    objectFit: 'cover',
  },
  heroOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    background: 'linear-gradient(180deg, rgba(15,23,42,0) 0%, rgba(15,23,42,0.85) 100%)',
    color: '#fff',
    padding: '20px',
  },
  infoCard: {
    backgroundColor: palette.surface,
    borderRadius: '12px',
    border: `1px solid ${palette.border}`,
    padding: '18px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
  },
  label: {
    fontSize: '13px',
    color: palette.textMuted,
    marginBottom: '4px',
  },
  value: {
    fontSize: '16px',
    fontWeight: '600',
    color: palette.text,
  },
  badge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 10px',
    borderRadius: '999px',
    fontSize: '12px',
    fontWeight: '600',
  },
  button: {
    padding: '10px 16px',
    borderRadius: '10px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    border: 'none',
    transition: 'all 0.2s ease',
  },
  buttonPrimary: {
    backgroundColor: palette.accent,
    color: '#fff',
  },
  buttonSecondary: {
    backgroundColor: palette.surface,
    color: palette.text,
    border: `1px solid ${palette.border}`,
  },
  table: {
    width: '100%',
    borderCollapse: 'separate',
    borderSpacing: '0',
  },
  th: {
    textAlign: 'left',
    padding: '12px 10px',
    backgroundColor: palette.borderLight,
    color: palette.textMuted,
    fontSize: '13px',
    borderBottom: `1px solid ${palette.border}`,
  },
  td: {
    padding: '12px 10px',
    borderBottom: `1px solid ${palette.borderLight}`,
    fontSize: '14px',
    color: palette.text,
  },
};

function formatPrice(course) {
  if (!course) return '';
  if (course.is_free) return 'ฟรี';
  const amount = (course.price_cents || 0) / 100;
  return `฿${amount.toLocaleString('th-TH')}`;
}

function formatDate(dateString) {
  if (!dateString) return 'ไม่ระบุวันที่';
  const dateObj = new Date(dateString);
  if (Number.isNaN(dateObj.getTime())) return dateString;
  return dateObj.toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function formatTime(timeString) {
  if (!timeString) return '';
  return timeString.slice(0, 5);
}

function CourseDetail() {
  const navigate = useNavigate();
  const { courseId } = useParams();
  const [course, setCourse] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [sessionsTotal, setSessionsTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loadingCourse, setLoadingCourse] = useState(true);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [error, setError] = useState('');
  const pageSize = 5;

  useEffect(() => {
    const fetchCourse = async () => {
      setLoadingCourse(true);
      setError('');
      try {
        const response = await axios.post(`${apiBase}/courses/detail`, { id: Number(courseId) });
        setCourse(response.data);
      } catch (err) {
        console.error(err);
        setError('ไม่สามารถโหลดข้อมูลคอร์สได้');
      } finally {
        setLoadingCourse(false);
      }
    };

    fetchCourse();
  }, [courseId]);

  useEffect(() => {
    const fetchSessions = async () => {
      setLoadingSessions(true);
      try {
        const response = await axios.post(`${apiBase}/courses/sessions`, {
          course_id: Number(courseId),
          status: 'open',
          limit: pageSize,
          offset: (page - 1) * pageSize,
          paginate: true,
        });

        if (response.data?.items) {
          setSessions(response.data.items);
          setSessionsTotal(response.data.total || 0);
        } else {
          setSessions(response.data || []);
          setSessionsTotal(response.data?.length || 0);
        }
      } catch (err) {
        console.error(err);
        setError('ไม่สามารถโหลดตารางการสอนได้');
      } finally {
        setLoadingSessions(false);
      }
    };

    fetchSessions();
  }, [courseId, page]);

  const totalPages = useMemo(() => {
    if (!sessionsTotal) return 1;
    return Math.max(Math.ceil(sessionsTotal / pageSize), 1);
  }, [sessionsTotal]);

  const instructorInfo = useMemo(() => {
    if (!course) return null;
    return {
      name: course.instructor_name || 'ไม่ระบุผู้สอน',
      avatar: course.instructor_avatar,
      bio: course.instructor_bio,
    };
  }, [course]);

  const coverImage = course?.cover_image_url || course?.course_image;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.headerContent}>
          <button
            type="button"
            onClick={() => navigate(-1)}
            style={{
              ...styles.button,
              ...styles.buttonSecondary,
              marginBottom: '12px',
            }}
          >
            ย้อนกลับ
          </button>
          <h1 style={styles.title}>รายละเอียดคอร์ส</h1>
          <p style={styles.subtitle}>ดูข้อมูลคอร์ส ตารางการสอน และผู้สอนอย่างละเอียด</p>
        </div>
      </div>

      <div style={styles.mainContent}>
        {error && (
          <div style={{ background: '#fee2e2', color: '#b91c1c', padding: '12px 16px', borderRadius: '10px', border: '1px solid #fecdd3' }}>
            {error}
          </div>
        )}

        <div style={styles.hero}>
          {coverImage ? (
            <img src={coverImage} alt={course?.title || 'course cover'} style={styles.heroImage} />
          ) : (
            <div style={{
              ...styles.heroImage,
              background: 'linear-gradient(120deg, #38bdf8, #1e3a8a)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontSize: '32px',
              fontWeight: 700,
            }}>
              {course?.title || 'คอร์สโยคะ'}
            </div>
          )}

          <div style={styles.heroOverlay}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: '12px', flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.8)' }}>คอร์ส #{courseId}</div>
                <h2 style={{ margin: '6px 0', fontSize: '24px' }}>{course?.title || 'กำลังโหลด...'}</h2>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <span style={{ ...styles.badge, background: 'rgba(255,255,255,0.15)', color: '#fff' }}>
                    {course?.branch_name || 'ไม่ระบุสาขา'}
                  </span>
                  <span style={{ ...styles.badge, background: course?.is_free ? '#22c55e' : '#0f172a', color: '#fff' }}>
                    {formatPrice(course)}
                  </span>
                </div>
              </div>
              <button
                type="button"
                style={{ ...styles.button, ...styles.buttonPrimary }}
                onClick={() => alert('เริ่มขั้นตอนจองคอร์ส (จำลอง)')}
                disabled={loadingCourse}
              >
                เริ่มจองคอร์ส
              </button>
            </div>
          </div>
        </div>

        {loadingCourse ? (
          <div style={{ textAlign: 'center', color: palette.textMuted }}>กำลังโหลดรายละเอียดคอร์ส...</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.2fr', gap: '18px', alignItems: 'start' }}>
            <div style={styles.infoCard}>
              <h3 style={{ marginTop: 0, marginBottom: '10px' }}>รายละเอียดคอร์ส</h3>
              <p style={{ color: palette.text, lineHeight: '1.6', marginTop: 0 }}>
                {course?.description || 'ไม่มีรายละเอียดคอร์ส'}
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '10px' }}>
                <div>
                  <div style={styles.label}>สาขา</div>
                  <div style={styles.value}>{course?.branch_name || 'ไม่ระบุ'}</div>
                </div>
                <div>
                  <div style={styles.label}>ผู้สอน</div>
                  <div style={styles.value}>{course?.instructor_name || 'ไม่ระบุ'}</div>
                </div>
                <div>
                  <div style={styles.label}>จำนวนที่รับ</div>
                  <div style={styles.value}>{course?.capacity || 0} คน</div>
                </div>
                <div>
                  <div style={styles.label}>สิทธิ์เข้าเรียน</div>
                  <div style={styles.value}>{course?.access_times || 0} ครั้ง</div>
                </div>
              </div>
            </div>

            <div style={styles.infoCard}>
              <h3 style={{ marginTop: 0, marginBottom: '12px' }}>ผู้สอน</h3>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: palette.borderLight, overflow: 'hidden', flexShrink: 0 }}>
                  {instructorInfo?.avatar ? (
                    <img src={instructorInfo.avatar} alt={instructorInfo.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: palette.textMuted }}>
                      👤
                    </div>
                  )}
                </div>
                <div>
                  <div style={{ fontSize: '16px', fontWeight: 700 }}>{instructorInfo?.name}</div>
                  <div style={{ color: palette.textMuted, fontSize: '13px' }}>{course?.channel || 'รูปแบบการเรียน'}</div>
                </div>
              </div>
              {instructorInfo?.bio && (
                <p style={{ color: palette.textMuted, fontSize: '13px', marginTop: '10px', lineHeight: '1.5' }}>
                  {instructorInfo.bio}
                </p>
              )}
            </div>
          </div>
        )}

        <div style={styles.infoCard}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', gap: '12px', flexWrap: 'wrap' }}>
            <h3 style={{ margin: 0 }}>ตารางการสอน</h3>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <button
                type="button"
                style={{ ...styles.button, ...styles.buttonSecondary, opacity: page === 1 ? 0.6 : 1 }}
                onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                disabled={page === 1}
              >
                ก่อนหน้า
              </button>
              <span style={{ color: palette.textMuted, fontSize: '14px' }}>
                หน้า {page} / {totalPages}
              </span>
              <button
                type="button"
                style={{ ...styles.button, ...styles.buttonSecondary, opacity: page === totalPages ? 0.6 : 1 }}
                onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={page === totalPages}
              >
                ถัดไป
              </button>
            </div>
          </div>

          {loadingSessions ? (
            <div style={{ color: palette.textMuted }}>กำลังโหลดตารางการสอน...</div>
          ) : sessions.length === 0 ? (
            <div style={{ color: palette.textMuted }}>ยังไม่มีรอบการสอน</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>รอบเรียน</th>
                    <th style={styles.th}>วันที่</th>
                    <th style={styles.th}>เวลา</th>
                    <th style={styles.th}>สาขา</th>
                    <th style={styles.th}>ผู้สอน</th>
                    <th style={styles.th}>จำนวนที่ว่าง</th>
                  </tr>
                </thead>
                <tbody>
                  {sessions.map((session) => (
                    <tr key={session.id}>
                      <td style={styles.td}>{session.session_name || 'รอบเรียน'}</td>
                      <td style={styles.td}>{formatDate(session.start_date)}</td>
                      <td style={styles.td}>
                        {formatTime(session.start_time)}
                        {session.end_time && ` - ${formatTime(session.end_time)}`}
                      </td>
                      <td style={styles.td}>{session.branch_name || course?.branch_name || 'ไม่ระบุ'}</td>
                      <td style={styles.td}>{session.instructor_name || course?.instructor_name || 'ไม่ระบุ'}</td>
                      <td style={{ ...styles.td, color: (session.available_spots ?? 0) > 0 ? palette.success : palette.danger, fontWeight: 700 }}>
                        ว่าง {Math.max(session.available_spots ?? 0, 0)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default CourseDetail;
