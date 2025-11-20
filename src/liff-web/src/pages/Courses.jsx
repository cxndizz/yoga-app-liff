import React, { useEffect, useMemo, useState } from 'react';
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
    padding: '32px 0',
    marginBottom: '32px',
  },
  headerContent: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '0 16px',
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
    padding: '0 16px 32px',
  },
  filterContainer: {
    backgroundColor: palette.surface,
    borderRadius: '12px',
    border: `1px solid ${palette.border}`,
    padding: '24px',
    marginBottom: '32px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
  searchContainer: {
    display: 'flex',
    gap: '16px',
    flexWrap: 'wrap',
    alignItems: 'flex-end',
  },
  inputGroup: {
    flex: '1',
    minWidth: '200px',
  },
  label: {
    display: 'block',
    fontSize: '14px',
    fontWeight: '500',
    color: palette.text,
    marginBottom: '4px',
  },
  input: {
    width: '100%',
    padding: '8px 12px',
    borderRadius: '6px',
    border: `1px solid ${palette.border}`,
    backgroundColor: palette.surface,
    fontSize: '14px',
    color: palette.text,
  },
  select: {
    width: '100%',
    padding: '8px 12px',
    borderRadius: '6px',
    border: `1px solid ${palette.border}`,
    backgroundColor: palette.surface,
    fontSize: '14px',
    color: palette.text,
  },
  button: {
    padding: '8px 16px',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    border: 'none',
    transition: 'all 0.2s',
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
  courseGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
    gap: '24px',
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
    height: '200px',
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#fff',
    fontSize: '48px',
    fontWeight: '700',
  },
  priceTag: {
    position: 'absolute',
    top: '12px',
    right: '12px',
    padding: '6px 12px',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: '600',
    color: '#fff',
  },
  sessionTag: {
    position: 'absolute',
    top: '12px',
    left: '12px',
    padding: '4px 8px',
    borderRadius: '6px',
    fontSize: '11px',
    fontWeight: '500',
    backgroundColor: 'rgba(255,255,255,0.9)',
    color: palette.text,
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
  metaGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '12px',
    marginBottom: '16px',
  },
  metaItem: {
    fontSize: '12px',
    color: palette.textMuted,
  },
  metaValue: {
    fontSize: '14px',
    fontWeight: '500',
    color: palette.text,
    marginTop: '2px',
  },
  sessionsContainer: {
    backgroundColor: palette.borderLight,
    borderRadius: '6px',
    padding: '12px',
    marginBottom: '16px',
  },
  sessionsTitle: {
    fontSize: '14px',
    fontWeight: '600',
    color: palette.text,
    marginBottom: '8px',
  },
  sessionItem: {
    fontSize: '13px',
    color: palette.textMuted,
    marginBottom: '4px',
    paddingLeft: '12px',
    position: 'relative',
  },
  actionButtons: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '8px',
  },
  emptyState: {
    textAlign: 'center',
    padding: '64px 24px',
    backgroundColor: palette.surface,
    borderRadius: '12px',
    border: `1px solid ${palette.border}`,
    color: palette.textMuted,
  },
  loadingState: {
    textAlign: 'center',
    padding: '64px 24px',
    color: palette.textMuted,
  },
  errorState: {
    backgroundColor: '#fee2e2',
    color: '#991b1b',
    padding: '16px',
    borderRadius: '8px',
    border: '1px solid #fecaca',
    marginBottom: '24px',
  },
  resultCount: {
    fontSize: '14px',
    color: palette.textMuted,
    marginBottom: '24px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
};

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

// Icon components
const SearchIcon = () => (
  <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clipRule="evenodd" />
  </svg>
);

const FilterIcon = () => (
  <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M2.628 1.601C5.028 1.206 7.49 1 10 1s4.973.206 7.372.601a.75.75 0 01.628.74v2.288a2.25 2.25 0 01-.659 1.59l-4.682 4.683a2.25 2.25 0 00-.659 1.59v3.037c0 .684-.31 1.33-.844 1.757l-1.937 1.55A.75.75 0 018 18.25v-5.757a2.25 2.25 0 00-.659-1.591L2.659 6.22A2.25 2.25 0 012 4.629V2.34a.75.75 0 01.628-.74z" clipRule="evenodd" />
  </svg>
);

const ClockIcon = () => (
  <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-13a.75.75 0 00-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 000-1.5h-3.25V5z" clipRule="evenodd" />
  </svg>
);

function Courses() {
  const [courses, setCourses] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('all');
  const [selectedInstructor, setSelectedInstructor] = useState('all');
  const [selectedType, setSelectedType] = useState('all');

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
        setError('ไม่สามารถโหลดข้อมูลคอร์สได้ กรุณาลองใหม่อีกครั้ง');
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

  const sessionsByCourse = useMemo(() => {
    return sessions.reduce((acc, session) => {
      if (!acc[session.course_id]) acc[session.course_id] = [];
      acc[session.course_id].push(session);
      return acc;
    }, {});
  }, [sessions]);

  const filteredCourses = useMemo(() => {
    return courses.filter((course) => {
      // Search filter
      if (searchTerm && !course.title.toLowerCase().includes(searchTerm.toLowerCase()) 
          && !course.description?.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }
      
      // Branch filter
      if (selectedBranch !== 'all' && course.branch_name !== selectedBranch) return false;
      
      // Instructor filter
      if (selectedInstructor !== 'all' && course.instructor_name !== selectedInstructor) return false;
      
      // Type filter
      if (selectedType === 'free' && !course.is_free) return false;
      if (selectedType === 'paid' && course.is_free) return false;
      
      return true;
    });
  }, [courses, searchTerm, selectedBranch, selectedInstructor, selectedType]);

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedBranch('all');
    setSelectedInstructor('all');
    setSelectedType('all');
  };

  const hasActiveFilters = searchTerm || selectedBranch !== 'all' || selectedInstructor !== 'all' || selectedType !== 'all';

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.header}>
          <div style={styles.headerContent}>
            <h1 style={styles.title}>คอร์สทั้งหมด</h1>
            <p style={styles.subtitle}>กำลังโหลดข้อมูล...</p>
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
          <h1 style={styles.title}>คอร์สทั้งหมด</h1>
          <p style={styles.subtitle}>
            เลือกและจองคอร์สที่เหมาะกับคุณ
          </p>
        </div>
      </div>

      <div style={styles.mainContent}>
        {/* Error Alert */}
        {error && (
          <div style={styles.errorState}>
            {error}
          </div>
        )}

        {/* Filters */}
        <div style={styles.filterContainer}>
          <h3 style={{ marginTop: 0, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FilterIcon />
            ค้นหาและกรองข้อมูล
          </h3>
          <div style={styles.searchContainer}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>ค้นหาคอร์ส</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  placeholder="ชื่อคอร์สหรือคำอธิบาย..."
                  style={{
                    ...styles.input,
                    paddingLeft: '36px',
                  }}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <SearchIcon />
                <div style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: palette.textMuted,
                }}>
                </div>
              </div>
            </div>
            <div style={{ ...styles.inputGroup, flex: '0 0 160px' }}>
              <label style={styles.label}>ประเภท</label>
              <select
                style={styles.select}
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
              >
                <option value="all">ทุกประเภท</option>
                <option value="free">คอร์สฟรี</option>
                <option value="paid">คอร์สเสียเงิน</option>
              </select>
            </div>
            <div style={{ ...styles.inputGroup, flex: '0 0 160px' }}>
              <label style={styles.label}>สาขา</label>
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
            <div style={{ ...styles.inputGroup, flex: '0 0 160px' }}>
              <label style={styles.label}>ผู้สอน</label>
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
            {hasActiveFilters && (
              <div style={{ flex: '0 0 auto' }}>
                <label style={{ ...styles.label, color: 'transparent' }}>.</label>
                <button
                  style={{ ...styles.button, ...styles.buttonSecondary }}
                  onClick={clearFilters}
                >
                  ล้างตัวกรอง
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Results */}
        <div style={styles.resultCount}>
          <span>
            พบ <strong>{filteredCourses.length}</strong> คอร์ส
            {filteredCourses.length !== courses.length && ` จากทั้งหมด ${courses.length} คอร์ส`}
          </span>
          {hasActiveFilters && (
            <span style={{ fontSize: '12px', color: palette.accent }}>
              มีการกรองข้อมูลอยู่
            </span>
          )}
        </div>

        {/* Courses Grid */}
        {filteredCourses.length === 0 && !error ? (
          <div style={styles.emptyState}>
            <div style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.3 }}>
              📚
            </div>
            <h3 style={{ marginBottom: '8px', color: palette.text }}>
              {courses.length === 0 ? 'ยังไม่มีคอร์สในระบบ' : 'ไม่พบคอร์สที่ตรงกับเงื่อนไข'}
            </h3>
            <p style={{ margin: 0 }}>
              {courses.length === 0 
                ? 'กรุณารอการเพิ่มคอร์สใหม่ หรือติดต่อเจ้าหน้าที่'
                : 'ลองปรับเปลี่ยนเงื่อนไขการค้นหาหรือลบตัวกรองออก'
              }
            </p>
            {hasActiveFilters && (
              <button
                style={{ ...styles.button, ...styles.buttonPrimary, marginTop: '16px' }}
                onClick={clearFilters}
              >
                ล้างตัวกรองทั้งหมด
              </button>
            )}
          </div>
        ) : (
          <div style={styles.courseGrid}>
            {filteredCourses.map((course) => {
              const courseSessions = sessionsByCourse[course.id] || [];
              const nextSession = courseSessions
                .filter((s) => new Date(s.start_date) >= new Date())
                .sort((a, b) => new Date(a.start_date) - new Date(b.start_date))[0];
              const availableSessions = courseSessions.filter(s => (s.available_spots ?? 0) > 0);
              const coverImage = getCoverImage(course);
              const placeholderColor = getPlaceholder(course.title);

              return (
                <div 
                  key={course.id} 
                  style={{
                    ...styles.courseCard,
                    transform: 'none',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.15)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
                  }}
                >
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
                      <span style={{ opacity: 0.4 }}>
                        {course.title?.charAt(0)?.toUpperCase() || 'C'}
                      </span>
                    )}
                    
                    {/* Price Tag */}
                    <div
                      style={{
                        ...styles.priceTag,
                        backgroundColor: course.is_free ? palette.success : palette.primary,
                      }}
                    >
                      {formatPrice(course)}
                    </div>

                    {/* Sessions Count */}
                    {courseSessions.length > 0 && (
                      <div style={styles.sessionTag}>
                        {availableSessions.length} รอบว่าง
                      </div>
                    )}
                  </div>

                  {/* Course Content */}
                  <div style={styles.courseContent}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                      <h3 style={styles.courseTitle}>{course.title}</h3>
                      <span style={{
                        padding: '2px 6px',
                        backgroundColor: palette.borderLight,
                        color: palette.textMuted,
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: '500',
                        flexShrink: 0,
                        marginLeft: '8px',
                      }}>
                        {course.channel || 'Onsite'}
                      </span>
                    </div>

                    {course.description && (
                      <p style={styles.courseDescription}>{course.description}</p>
                    )}

                    {/* Course Meta */}
                    <div style={styles.metaGrid}>
                      <div>
                        <div style={styles.metaItem}>สาขา</div>
                        <div style={styles.metaValue}>{course.branch_name || 'ไม่ระบุ'}</div>
                      </div>
                      <div>
                        <div style={styles.metaItem}>ผู้สอน</div>
                        <div style={styles.metaValue}>{course.instructor_name || 'ไม่ระบุ'}</div>
                      </div>
                      <div>
                        <div style={styles.metaItem}>ความจุ</div>
                        <div style={styles.metaValue}>{course.capacity} คน</div>
                      </div>
                      <div>
                        <div style={styles.metaItem}>สิทธิ์เข้าเรียน</div>
                        <div style={styles.metaValue}>{course.access_times} ครั้ง</div>
                      </div>
                    </div>

                    {/* Sessions */}
                    {courseSessions.length > 0 && (
                      <div style={styles.sessionsContainer}>
                        <div style={styles.sessionsTitle}>
                          <ClockIcon />
                          <span style={{ marginLeft: '6px' }}>
                            รอบเรียน ({courseSessions.length} รอบ)
                          </span>
                        </div>
                        {courseSessions.slice(0, 3).map((session) => (
                          <div key={session.id} style={styles.sessionItem}>
                            <span style={{
                              position: 'absolute',
                              left: 0,
                              color: (session.available_spots ?? 0) > 0 ? palette.success : palette.textLight,
                            }}>
                              •
                            </span>
                            {session.session_name && `${session.session_name}: `}
                            {formatDate(session.start_date)} เวลา {formatTime(session.start_time)}
                            {session.end_time && ` - ${formatTime(session.end_time)}`}
                            <span style={{ 
                              color: (session.available_spots ?? 0) > 0 ? palette.success : palette.danger,
                              fontWeight: '500',
                              marginLeft: '8px',
                            }}>
                              (ว่าง {Math.max((session.available_spots ?? 0), 0)})
                            </span>
                          </div>
                        ))}
                        {courseSessions.length > 3 && (
                          <div style={{ ...styles.sessionItem, fontStyle: 'italic' }}>
                            และอีก {courseSessions.length - 3} รอบ...
                          </div>
                        )}
                      </div>
                    )}

                    {/* Next Session */}
                    {nextSession && (
                      <div style={{
                        backgroundColor: palette.primary,
                        color: '#fff',
                        padding: '8px 12px',
                        borderRadius: '6px',
                        marginBottom: '16px',
                        fontSize: '13px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}>
                        <ClockIcon />
                        <span>
                          <strong>รอบถัดไป:</strong> {formatDate(nextSession.start_date)} 
                          เวลา {formatTime(nextSession.start_time)}
                        </span>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div style={styles.actionButtons}>
                      <button 
                        style={{ 
                          ...styles.button, 
                          ...styles.buttonPrimary,
                          justifyContent: 'center',
                        }}
                        disabled={availableSessions.length === 0}
                        onMouseEnter={(e) => {
                          if (availableSessions.length > 0) {
                            e.currentTarget.style.backgroundColor = palette.primaryDark;
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (availableSessions.length > 0) {
                            e.currentTarget.style.backgroundColor = palette.accent;
                          }
                        }}
                      >
                        {availableSessions.length > 0 ? 'จองคอร์ส' : 'เต็มแล้ว'}
                      </button>
                      <button 
                        style={{ 
                          ...styles.button, 
                          ...styles.buttonSecondary,
                          justifyContent: 'center',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = palette.borderLight;
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = palette.surface;
                        }}
                      >
                        รายละเอียด
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default Courses;