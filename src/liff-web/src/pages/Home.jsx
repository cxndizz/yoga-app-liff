import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

// Professional design system
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
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '16px',
  },
  badge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    backgroundColor: 'rgba(255,255,255,0.1)',
    color: 'rgba(255,255,255,0.9)',
    padding: '6px 12px',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: '500',
    marginBottom: '16px',
  },
  title: {
    fontSize: '32px',
    fontWeight: '700',
    marginBottom: '8px',
    lineHeight: '1.2',
  },
  subtitle: {
    fontSize: '16px',
    color: 'rgba(255,255,255,0.8)',
    lineHeight: '1.5',
    maxWidth: '600px',
  },
  mainContent: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '0 16px 24px',
  },
  card: {
    backgroundColor: palette.surface,
    borderRadius: '12px',
    border: `1px solid ${palette.border}`,
    overflow: 'hidden',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
  cardPadding: {
    padding: '18px',
  },
  sectionTitle: {
    fontSize: '22px',
    fontWeight: '600',
    color: palette.text,
    marginBottom: '16px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  icon: {
    width: '20px',
    height: '20px',
    fill: 'currentColor',
  },
  filterContainer: {
    display: 'flex',
    gap: '16px',
    flexWrap: 'wrap',
    marginBottom: '24px',
  },
  select: {
    padding: '8px 12px',
    borderRadius: '6px',
    border: `1px solid ${palette.border}`,
    backgroundColor: palette.surface,
    fontSize: '14px',
    color: palette.text,
    minWidth: '160px',
  },
  button: {
    padding: '8px 16px',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    border: 'none',
    transition: 'all 0.2s',
    textDecoration: 'none',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
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
  grid: {
    display: 'grid',
    gap: '24px',
  },
  gridCols: {
    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px',
    marginBottom: '32px',
  },
  statCard: {
    backgroundColor: palette.surface,
    padding: '20px',
    borderRadius: '8px',
    border: `1px solid ${palette.border}`,
    textAlign: 'center',
  },
  statValue: {
    fontSize: '32px',
    fontWeight: '700',
    color: palette.accent,
    marginBottom: '4px',
  },
  statLabel: {
    fontSize: '14px',
    color: palette.textMuted,
  },
  courseCard: {
    backgroundColor: palette.surface,
    borderRadius: '12px',
    border: `1px solid ${palette.border}`,
    overflow: 'hidden',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    transition: 'all 0.2s',
  },
  courseImage: {
    height: '180px',
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#fff',
  },
  priceTag: {
    position: 'absolute',
    top: '12px',
    right: '12px',
    padding: '6px 12px',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: '600',
  },
  courseContent: {
    padding: '20px',
  },
  courseTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: palette.text,
    marginBottom: '8px',
    lineHeight: '1.4',
  },
  courseDescription: {
    fontSize: '14px',
    color: palette.textMuted,
    lineHeight: '1.5',
    marginBottom: '16px',
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
  },
  courseDetails: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '12px',
    marginBottom: '16px',
  },
  detailItem: {
    fontSize: '12px',
    color: palette.textMuted,
  },
  detailValue: {
    fontSize: '14px',
    fontWeight: '500',
    color: palette.text,
  },
  actionButtons: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '8px',
  },
  responsiveTable: {
    '@media (max-width: 768px)': {
      display: 'none',
    },
  },
  mobileCards: {
    display: 'none',
    '@media (max-width: 768px)': {
      display: 'block',
    },
  },
};

// Helper functions
function formatPrice(course) {
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
    day: 'numeric' 
  });
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
  return colors[colorIndex];
}

// Icon components (using SVG)
const CourseIcon = () => (
  <svg style={styles.icon} viewBox="0 0 20 20">
    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const CalendarIcon = () => (
  <svg style={styles.icon} viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
  </svg>
);

const TableIcon = () => (
  <svg style={styles.icon} viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 0l-2 2a1 1 0 101.414 1.414L8 10.414l1.293 1.293a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
  </svg>
);

function Home() {
  const navigate = useNavigate();
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
        setError('ไม่สามารถโหลดข้อมูลได้ กรุณาลองใหม่อีกครั้ง');
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
      .slice(0, 10);
  }, [sessions]);

  const getCourseById = (courseId) => courses.find((c) => c.id === courseId);

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.header}>
          <div style={styles.headerContent}>
            <div>
              <h1 style={styles.title}>Yoga Studio</h1>
              <p style={styles.subtitle}>กำลังโหลดข้อมูล...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerContent}>
          <div style={{ flex: 1 }}>
            <div style={styles.badge}>
              <span>•</span> ระบบจองคอร์ส
            </div>
            <h1 style={styles.title}>Yoga Studio</h1>
            <p style={styles.subtitle}>
              จองคอร์สโยคะและเวลเนส พร้อมระบบชำระเงินที่ปลอดภัย
            </p>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              style={{ ...styles.button, ...styles.buttonSecondary }}
              onClick={() => navigate('/courses')}
            >
              ดูคอร์สทั้งหมด
            </button>
          </div>
        </div>
      </div>

      <div style={styles.mainContent}>
        {/* Error Alert */}
        {error && (
          <div style={{
            ...styles.card,
            ...styles.cardPadding,
            borderColor: palette.danger,
            backgroundColor: '#fee2e2',
            color: palette.danger,
            marginBottom: '24px'
          }}>
            {error}
          </div>
        )}

        {/* Statistics */}
        <div style={styles.statsGrid}>
          <div style={styles.statCard}>
            <div style={styles.statValue}>{courses.length}</div>
            <div style={styles.statLabel}>คอร์สทั้งหมด</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statValue}>{upcomingSessions.length}</div>
            <div style={styles.statLabel}>รอบเรียนที่กำลังจะมา</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statValue}>{branches.length}</div>
            <div style={styles.statLabel}>สาขา</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statValue}>{instructors.length}</div>
            <div style={styles.statLabel}>ผู้สอน</div>
          </div>
        </div>

        {/* Filters */}
        <div style={{ ...styles.card, ...styles.cardPadding, marginBottom: '24px' }}>
          <h3 style={{ marginTop: 0, marginBottom: '16px', color: palette.text }}>ตัวกรอง</h3>
          <div style={styles.filterContainer}>
            <div>
              <label style={{ fontSize: '14px', color: palette.textMuted, display: 'block', marginBottom: '4px' }}>
                สาขา
              </label>
              <select
                style={styles.select}
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
              >
                <option value="all">ทุกสาขา</option>
                {branches.map((branch) => (
                  <option key={branch} value={branch}>{branch}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ fontSize: '14px', color: palette.textMuted, display: 'block', marginBottom: '4px' }}>
                ผู้สอน
              </label>
              <select
                style={styles.select}
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
              <div>
                <label style={{ fontSize: '14px', color: 'transparent', display: 'block', marginBottom: '4px' }}>
                  .
                </label>
                <button
                  style={{ ...styles.button, ...styles.buttonSecondary }}
                  onClick={() => {
                    setSelectedBranch('all');
                    setSelectedInstructor('all');
                  }}
                >
                  ล้างตัวกรอง
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Upcoming Sessions */}
        {upcomingSessions.length > 0 && (
          <div style={{ marginBottom: '32px' }}>
            <h2 style={styles.sectionTitle}>
              <CalendarIcon />
              รอบเรียนที่กำลังจะมาถึง
            </h2>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', 
              gap: '16px' 
            }}>
              {upcomingSessions.map((session) => {
                const course = getCourseById(session.course_id);
                return (
                  <div
                    key={session.id}
                    style={{
                      ...styles.card,
                      ...styles.cardPadding,
                      borderLeft: `4px solid ${palette.accent}`,
                      padding: '16px'
                    }}
                  >
                    <div style={{ marginBottom: '8px' }}>
                      <h4 style={{ 
                        margin: '0 0 4px', 
                        fontSize: '16px', 
                        fontWeight: '600',
                        color: palette.text 
                      }}>
                        {session.session_name || course?.title || 'รอบเรียน'}
                      </h4>
                      <p style={{ 
                        margin: 0, 
                        fontSize: '14px', 
                        color: palette.textMuted 
                      }}>
                        {course?.title || 'คอร์ส'}
                      </p>
                    </div>
                    <div style={{ fontSize: '14px', color: palette.text, marginBottom: '4px' }}>
                      <strong>วันที่:</strong> {formatDate(session.start_date)}
                    </div>
                    <div style={{ fontSize: '14px', color: palette.text, marginBottom: '4px' }}>
                      <strong>เวลา:</strong> {formatTime(session.start_time)}
                      {session.end_time && ` - ${formatTime(session.end_time)}`}
                    </div>
                    <div style={{ fontSize: '14px', color: palette.text, marginBottom: '4px' }}>
                      <strong>สาขา:</strong> {session.branch_name || course?.branch_name || 'ไม่ระบุ'}
                    </div>
                    <div style={{ fontSize: '14px', color: palette.text, marginBottom: '8px' }}>
                      <strong>ผู้สอน:</strong> {session.instructor_name || course?.instructor_name || 'ไม่ระบุ'}
                    </div>
                    <div style={{
                      fontSize: '12px',
                      color: palette.textMuted,
                      paddingTop: '8px',
                      borderTop: `1px solid ${palette.borderLight}`
                    }}>
                      ที่ว่าง: {Math.max((session.available_spots ?? 0), 0)} / {session.max_capacity || course?.capacity || 0}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Courses */}
        <div>
          <h2 style={styles.sectionTitle}>
            <CourseIcon />
            คอร์สทั้งหมด
            {filteredCourses.length !== courses.length && (
              <span style={{ fontSize: '16px', fontWeight: '400', color: palette.textMuted }}>
                ({filteredCourses.length} จาก {courses.length})
              </span>
            )}
          </h2>

          {filteredCourses.length === 0 && !error && (
            <div style={{ ...styles.card, ...styles.cardPadding, textAlign: 'center', color: palette.textMuted }}>
              {courses.length === 0 ? 'ยังไม่มีคอร์สในระบบ' : 'ไม่พบคอร์สตามเงื่อนไข'}
            </div>
          )}

          <div style={{ ...styles.grid, ...styles.gridCols }}>
            {filteredCourses.map((course) => {
              const courseSessions = sessionsByCourse[course.id] || [];
              const nextSession = courseSessions
                .filter((s) => new Date(s.start_date) >= new Date())
                .sort((a, b) => new Date(a.start_date) - new Date(b.start_date))[0];
              const coverImage = getCoverImage(course);
              const placeholderColor = getPlaceholder(course.title);

              return (
                <div key={course.id} style={styles.courseCard}>
                  {/* Course Image */}
                  <div
                    style={{
                      ...styles.courseImage,
                      background: coverImage
                        ? `linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.1)), url(${coverImage}) center/cover`
                        : `linear-gradient(135deg, ${placeholderColor}, ${placeholderColor}cc)`,
                    }}
                  >
                    {!coverImage && (
                      <span style={{ fontSize: '48px', opacity: 0.3 }}>
                        {course.title?.charAt(0)?.toUpperCase() || 'C'}
                      </span>
                    )}
                    <div
                      style={{
                        ...styles.priceTag,
                        backgroundColor: course.is_free ? palette.success : palette.primary,
                        color: '#fff',
                      }}
                    >
                      {formatPrice(course)}
                    </div>
                  </div>

                  {/* Course Content */}
                  <div style={styles.courseContent}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                      <h3 style={styles.courseTitle}>{course.title}</h3>
                      <span style={{
                        padding: '4px 8px',
                        backgroundColor: palette.borderLight,
                        color: palette.textMuted,
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: '500',
                      }}>
                        {course.channel || 'Onsite'}
                      </span>
                    </div>

                    {course.description && (
                      <p style={styles.courseDescription}>{course.description}</p>
                    )}

                    <div style={styles.courseDetails}>
                      <div>
                        <div style={styles.detailItem}>สาขา</div>
                        <div style={styles.detailValue}>{course.branch_name || '-'}</div>
                      </div>
                      <div>
                        <div style={styles.detailItem}>ผู้สอน</div>
                        <div style={styles.detailValue}>{course.instructor_name || '-'}</div>
                      </div>
                      <div>
                        <div style={styles.detailItem}>ความจุ</div>
                        <div style={styles.detailValue}>{course.capacity} คน</div>
                      </div>
                      <div>
                        <div style={styles.detailItem}>สิทธิ์เข้าเรียน</div>
                        <div style={styles.detailValue}>{course.access_times} ครั้ง</div>
                      </div>
                    </div>

                    {nextSession && (
                      <div style={{
                        backgroundColor: palette.borderLight,
                        padding: '12px',
                        borderRadius: '6px',
                        marginBottom: '16px',
                        fontSize: '14px',
                      }}>
                        <strong>รอบถัดไป:</strong> {formatDate(nextSession.start_date)} เวลา {formatTime(nextSession.start_time)}
                        <br />
                        <span style={{ color: palette.textMuted }}>
                          ที่ว่าง: {Math.max((nextSession.available_spots ?? 0), 0)} คน
                        </span>
                      </div>
                    )}

                    <div style={styles.actionButtons}>
                      <button
                        style={{ ...styles.button, ...styles.buttonPrimary }}
                        onClick={() => navigate(`/courses?courseId=${course.id}`)}
                      >
                        จองคอร์ส
                      </button>
                      <button
                        style={{ ...styles.button, ...styles.buttonSecondary }}
                        onClick={() => navigate(`/courses?courseId=${course.id}`)}
                      >
                        รายละเอียด
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Sessions Table */}
        {sessions.length > 0 && (
          <div style={{ marginTop: '32px' }}>
            <h2 style={styles.sectionTitle}>
              <TableIcon />
              ตารางการสอนทั้งหมด
            </h2>
            
            {/* Desktop Table */}
            <div style={{ ...styles.card, overflow: 'hidden', display: window.innerWidth > 768 ? 'block' : 'none' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                  <thead>
                    <tr style={{ backgroundColor: palette.borderLight }}>
                      <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600', borderBottom: `1px solid ${palette.border}` }}>
                        คอร์ส
                      </th>
                      <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600', borderBottom: `1px solid ${palette.border}` }}>
                        วันที่
                      </th>
                      <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600', borderBottom: `1px solid ${palette.border}` }}>
                        เวลา
                      </th>
                      <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600', borderBottom: `1px solid ${palette.border}` }}>
                        สาขา
                      </th>
                      <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600', borderBottom: `1px solid ${palette.border}` }}>
                        ผู้สอน
                      </th>
                      <th style={{ padding: '16px', textAlign: 'center', fontWeight: '600', borderBottom: `1px solid ${palette.border}` }}>
                        ที่ว่าง
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {sessions
                      .sort((a, b) => new Date(a.start_date) - new Date(b.start_date))
                      .slice(0, 20) // Limit to 20 sessions for better performance
                      .map((session, index) => {
                        const course = getCourseById(session.course_id);
                        const isPast = new Date(session.start_date) < new Date();
                        return (
                          <tr
                            key={session.id}
                            style={{
                              backgroundColor: index % 2 === 0 ? palette.surface : palette.borderLight,
                              opacity: isPast ? 0.6 : 1,
                            }}
                          >
                            <td style={{ padding: '16px', borderBottom: `1px solid ${palette.border}` }}>
                              <div style={{ fontWeight: '500' }}>
                                {session.session_name || course?.title || '-'}
                              </div>
                              {session.session_name && (
                                <div style={{ fontSize: '12px', color: palette.textMuted }}>
                                  {course?.title || '-'}
                                </div>
                              )}
                            </td>
                            <td style={{ padding: '16px', borderBottom: `1px solid ${palette.border}` }}>
                              {formatDate(session.start_date)}
                            </td>
                            <td style={{ padding: '16px', borderBottom: `1px solid ${palette.border}` }}>
                              {formatTime(session.start_time)}
                              {session.end_time && ` - ${formatTime(session.end_time)}`}
                            </td>
                            <td style={{ padding: '16px', borderBottom: `1px solid ${palette.border}` }}>
                              {session.branch_name || course?.branch_name || '-'}
                            </td>
                            <td style={{ padding: '16px', borderBottom: `1px solid ${palette.border}` }}>
                              {session.instructor_name || course?.instructor_name || '-'}
                            </td>
                            <td style={{ padding: '16px', borderBottom: `1px solid ${palette.border}`, textAlign: 'center' }}>
                              <span
                                style={{
                                  padding: '4px 8px',
                                  borderRadius: '4px',
                                  fontSize: '12px',
                                  fontWeight: '500',
                                  backgroundColor: (session.available_spots ?? 0) > 0 ? '#dcfce7' : '#fee2e2',
                                  color: (session.available_spots ?? 0) > 0 ? '#166534' : '#991b1b',
                                }}
                              >
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

            {/* Mobile Cards */}
            <div style={{ display: window.innerWidth <= 768 ? 'block' : 'none' }}>
              {sessions
                .sort((a, b) => new Date(a.start_date) - new Date(b.start_date))
                .slice(0, 10)
                .map((session) => {
                  const course = getCourseById(session.course_id);
                  return (
                    <div key={session.id} style={{ ...styles.card, ...styles.cardPadding, marginBottom: '16px' }}>
                      <h4 style={{ marginTop: 0, marginBottom: '8px', fontSize: '16px' }}>
                        {session.session_name || course?.title || 'รอบเรียน'}
                      </h4>
                      <div style={{ fontSize: '14px', marginBottom: '4px' }}>
                        <strong>วันที่:</strong> {formatDate(session.start_date)}
                      </div>
                      <div style={{ fontSize: '14px', marginBottom: '4px' }}>
                        <strong>เวลา:</strong> {formatTime(session.start_time)}
                        {session.end_time && ` - ${formatTime(session.end_time)}`}
                      </div>
                      <div style={{ fontSize: '14px', marginBottom: '4px' }}>
                        <strong>สาขา:</strong> {session.branch_name || course?.branch_name || '-'}
                      </div>
                      <div style={{ fontSize: '14px', marginBottom: '8px' }}>
                        <strong>ผู้สอน:</strong> {session.instructor_name || course?.instructor_name || '-'}
                      </div>
                      <div style={{ 
                        fontSize: '14px', 
                        color: (session.available_spots ?? 0) > 0 ? palette.success : palette.danger,
                        fontWeight: '500' 
                      }}>
                        ที่ว่าง: {Math.max((session.available_spots ?? 0), 0)} / {session.max_capacity || course?.capacity || 0}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Home;