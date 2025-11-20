import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';

const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

// Styles
const containerStyle = {
  fontFamily: 'system-ui, -apple-system, sans-serif',
  background: 'linear-gradient(135deg, #f8fdf9 0%, #e8f5e9 100%)',
  minHeight: '100vh',
};

const headerStyle = {
  background: 'linear-gradient(135deg, #00b900 0%, #00a000 100%)',
  color: '#fff',
  padding: '24px 16px',
  textAlign: 'center',
};

const mainContent = {
  padding: '16px',
  maxWidth: '1200px',
  margin: '0 auto',
};

const cardStyle = {
  background: '#fff',
  borderRadius: '16px',
  overflow: 'hidden',
  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
  transition: 'transform 0.2s, box-shadow 0.2s',
};

const filterContainerStyle = {
  background: '#fff',
  borderRadius: '12px',
  padding: '16px',
  marginBottom: '20px',
  boxShadow: '0 2px 12px rgba(0, 0, 0, 0.06)',
};

const selectStyle = {
  padding: '10px 14px',
  borderRadius: '8px',
  border: '1px solid #d0e8d4',
  background: '#f8fdf9',
  fontSize: '14px',
  minWidth: '160px',
  cursor: 'pointer',
  outline: 'none',
};

const buttonPrimary = {
  padding: '12px 20px',
  background: 'linear-gradient(135deg, #00b900 0%, #00a000 100%)',
  color: '#fff',
  border: 'none',
  borderRadius: '10px',
  fontWeight: 700,
  fontSize: '15px',
  cursor: 'pointer',
  width: '100%',
  transition: 'transform 0.2s, box-shadow 0.2s',
};

const buttonSecondary = {
  padding: '10px 16px',
  background: '#fff',
  color: '#00a000',
  border: '2px solid #00b900',
  borderRadius: '10px',
  fontWeight: 600,
  fontSize: '14px',
  cursor: 'pointer',
  width: '100%',
  transition: 'all 0.2s',
};

const sectionTitle = {
  fontSize: '22px',
  fontWeight: 700,
  color: '#1a472a',
  marginBottom: '16px',
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
};

// Helper functions
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

// Placeholder image for courses
function getPlaceholderImage(courseTitle) {
  const colors = ['#00b900', '#00a000', '#008f00', '#007e00', '#006d00'];
  const colorIndex = Math.abs(courseTitle.charCodeAt(0) % colors.length);
  return colors[colorIndex];
}

function Home() {
  const [courses, setCourses] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
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

  // Extract unique branches and instructors for filters
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

  // Filter courses
  const filteredCourses = useMemo(() => {
    return courses.filter((course) => {
      if (selectedBranch !== 'all' && course.branch_name !== selectedBranch) return false;
      if (selectedInstructor !== 'all' && course.instructor_name !== selectedInstructor) return false;
      return true;
    });
  }, [courses, selectedBranch, selectedInstructor]);

  // Sessions grouped by course
  const sessionsByCourse = useMemo(() => {
    return sessions.reduce((acc, session) => {
      if (!acc[session.course_id]) acc[session.course_id] = [];
      acc[session.course_id].push(session);
      return acc;
    }, {});
  }, [sessions]);

  // Upcoming sessions (sorted by date)
  const upcomingSessions = useMemo(() => {
    const now = new Date();
    return sessions
      .filter((s) => new Date(s.start_date) >= now)
      .sort((a, b) => new Date(a.start_date) - new Date(b.start_date))
      .slice(0, 8);
  }, [sessions]);

  // Get course name by ID
  const getCourseById = (courseId) => {
    return courses.find((c) => c.id === courseId);
  };

  if (loading) {
    return (
      <div style={containerStyle}>
        <div style={headerStyle}>
          <h1 style={{ margin: '0 0 8px', fontSize: '28px' }}>NeedHome Yoga & Wellness</h1>
        </div>
        <div style={{ ...mainContent, textAlign: 'center', padding: '60px 16px' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🧘</div>
          <p style={{ color: '#666', fontSize: '16px' }}>กำลังโหลดข้อมูลคอร์ส...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      {/* Header */}
      <div style={headerStyle}>
        <h1 style={{ margin: '0 0 8px', fontSize: '28px', fontWeight: 700 }}>
          NeedHome Yoga & Wellness
        </h1>
        <p style={{ margin: 0, opacity: 0.9, fontSize: '15px' }}>
          ค้นหาคอร์สโยคะที่เหมาะกับคุณ
        </p>
      </div>

      <div style={mainContent}>
        {/* Error message */}
        {error && (
          <div style={{
            background: '#fff5f5',
            border: '1px solid #feb2b2',
            borderRadius: '12px',
            padding: '16px',
            marginBottom: '20px',
            color: '#c53030',
            textAlign: 'center',
          }}>
            {error}
          </div>
        )}

        {/* Filters */}
        <div style={filterContainerStyle}>
          <div style={{ fontWeight: 600, marginBottom: '12px', color: '#2d3748' }}>
            กรองคอร์ส
          </div>
          <div style={{
            display: 'flex',
            gap: '12px',
            flexWrap: 'wrap',
          }}>
            <div style={{ flex: '1 1 160px', minWidth: '140px' }}>
              <label style={{ fontSize: '13px', color: '#666', display: 'block', marginBottom: '6px' }}>
                สาขา
              </label>
              <select
                style={selectStyle}
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
              >
                <option value="all">ทุกสาขา</option>
                {branches.map((branch) => (
                  <option key={branch} value={branch}>{branch}</option>
                ))}
              </select>
            </div>
            <div style={{ flex: '1 1 160px', minWidth: '140px' }}>
              <label style={{ fontSize: '13px', color: '#666', display: 'block', marginBottom: '6px' }}>
                ผู้สอน
              </label>
              <select
                style={selectStyle}
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
              <div style={{ flex: '0 0 auto', alignSelf: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedBranch('all');
                    setSelectedInstructor('all');
                  }}
                  style={{
                    padding: '10px 16px',
                    background: '#f0f0f0',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    color: '#666',
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
          <div style={{ marginBottom: '24px' }}>
            <h2 style={sectionTitle}>
              <span style={{ fontSize: '24px' }}>📅</span>
              ตารางเรียนที่กำลังจะมาถึง
            </h2>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '12px',
            }}>
              {upcomingSessions.map((session) => {
                const course = getCourseById(session.course_id);
                return (
                  <div
                    key={session.id}
                    style={{
                      background: '#fff',
                      borderRadius: '12px',
                      padding: '14px',
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
                      borderLeft: '4px solid #00b900',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                      <div style={{ fontWeight: 600, color: '#1a472a', fontSize: '15px' }}>
                        {session.session_name || course?.title || 'รอบเรียน'}
                      </div>
                      <div style={{
                        background: '#e6f4ea',
                        color: '#137333',
                        padding: '4px 8px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: 600,
                      }}>
                        {formatDateShort(session.start_date)}
                      </div>
                    </div>
                    <div style={{ fontSize: '14px', color: '#555', marginBottom: '6px' }}>
                      🕐 {formatTime(session.start_time)}{session.end_time ? ` - ${formatTime(session.end_time)}` : ''}
                      {session.day_of_week && <span style={{ marginLeft: '8px' }}>({session.day_of_week})</span>}
                    </div>
                    <div style={{ fontSize: '13px', color: '#666' }}>
                      📍 {session.branch_name || course?.branch_name || 'ไม่ระบุสาขา'}
                    </div>
                    <div style={{ fontSize: '13px', color: '#666', marginTop: '2px' }}>
                      👤 {session.instructor_name || course?.instructor_name || 'ไม่ระบุผู้สอน'}
                    </div>
                    <div style={{
                      fontSize: '12px',
                      color: '#888',
                      marginTop: '8px',
                      paddingTop: '8px',
                      borderTop: '1px solid #f0f0f0',
                    }}>
                      ว่าง {Math.max((session.available_spots ?? 0), 0)} / {session.max_capacity || course?.capacity || 0} ที่นั่ง
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Course Cards */}
        <div>
          <h2 style={sectionTitle}>
            <span style={{ fontSize: '24px' }}>🧘</span>
            คอร์สทั้งหมด
            {filteredCourses.length !== courses.length && (
              <span style={{ fontSize: '14px', fontWeight: 400, color: '#666' }}>
                ({filteredCourses.length} จาก {courses.length} คอร์ส)
              </span>
            )}
          </h2>

          {filteredCourses.length === 0 && !error && (
            <div style={{
              background: '#fff',
              borderRadius: '12px',
              padding: '40px 20px',
              textAlign: 'center',
              color: '#666',
            }}>
              {courses.length === 0 ? (
                <p>ยังไม่มีคอร์สในระบบ</p>
              ) : (
                <p>ไม่พบคอร์สตามเงื่อนไขที่เลือก</p>
              )}
            </div>
          )}

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '20px',
          }}>
            {filteredCourses.map((course) => {
              const courseSessions = sessionsByCourse[course.id] || [];
              const nextSession = courseSessions
                .filter((s) => new Date(s.start_date) >= new Date())
                .sort((a, b) => new Date(a.start_date) - new Date(b.start_date))[0];

              return (
                <div key={course.id} style={cardStyle}>
                  {/* Course Image Placeholder */}
                  <div style={{
                    height: '160px',
                    background: `linear-gradient(135deg, ${getPlaceholderImage(course.title)} 0%, ${getPlaceholderImage(course.title)}dd 100%)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                  }}>
                    <span style={{ fontSize: '48px', opacity: 0.3 }}>🧘</span>
                    {/* Price Badge */}
                    <div style={{
                      position: 'absolute',
                      top: '12px',
                      right: '12px',
                      background: course.is_free ? '#4ade80' : '#fbbf24',
                      color: course.is_free ? '#166534' : '#92400e',
                      padding: '6px 12px',
                      borderRadius: '20px',
                      fontSize: '14px',
                      fontWeight: 700,
                    }}>
                      {formatPrice(course)}
                    </div>
                  </div>

                  {/* Course Content */}
                  <div style={{ padding: '16px' }}>
                    <h3 style={{ margin: '0 0 8px', fontSize: '18px', color: '#1a472a' }}>
                      {course.title}
                    </h3>

                    {course.description && (
                      <p style={{
                        margin: '0 0 12px',
                        color: '#555',
                        fontSize: '14px',
                        lineHeight: 1.5,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}>
                        {course.description}
                      </p>
                    )}

                    {/* Course Info */}
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '8px',
                      marginBottom: '12px',
                    }}>
                      <div style={{
                        background: '#f8fdf9',
                        padding: '8px 10px',
                        borderRadius: '8px',
                        fontSize: '13px',
                      }}>
                        <div style={{ color: '#888', fontSize: '11px', marginBottom: '2px' }}>สาขา</div>
                        <div style={{ color: '#333', fontWeight: 500 }}>{course.branch_name || '-'}</div>
                      </div>
                      <div style={{
                        background: '#f8fdf9',
                        padding: '8px 10px',
                        borderRadius: '8px',
                        fontSize: '13px',
                      }}>
                        <div style={{ color: '#888', fontSize: '11px', marginBottom: '2px' }}>ผู้สอน</div>
                        <div style={{ color: '#333', fontWeight: 500 }}>{course.instructor_name || '-'}</div>
                      </div>
                    </div>

                    {/* Next Session Info */}
                    {nextSession && (
                      <div style={{
                        background: '#fef3c7',
                        padding: '10px',
                        borderRadius: '8px',
                        marginBottom: '12px',
                        fontSize: '13px',
                      }}>
                        <div style={{ fontWeight: 600, color: '#92400e', marginBottom: '4px' }}>
                          รอบถัดไป
                        </div>
                        <div style={{ color: '#78350f' }}>
                          {formatDate(nextSession.start_date)} · {formatTime(nextSession.start_time)}
                        </div>
                        <div style={{ color: '#92400e', fontSize: '12px', marginTop: '2px' }}>
                          ว่าง {Math.max((nextSession.available_spots ?? 0), 0)} ที่นั่ง
                        </div>
                      </div>
                    )}

                    {/* Capacity & Access */}
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: '13px',
                      color: '#666',
                      marginBottom: '16px',
                    }}>
                      <span>👥 {course.capacity} ที่นั่ง</span>
                      <span>🎟️ เข้าได้ {course.access_times} ครั้ง</span>
                    </div>

                    {/* Action Buttons */}
                    <div style={{ display: 'grid', gap: '8px' }}>
                      <button
                        type="button"
                        style={buttonPrimary}
                        onMouseOver={(e) => {
                          e.currentTarget.style.transform = 'translateY(-2px)';
                          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 185, 0, 0.4)';
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = 'none';
                        }}
                      >
                        ซื้อคอร์ส
                      </button>
                      <button type="button" style={buttonSecondary}>
                        ดูรายละเอียด
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* All Sessions Schedule */}
        {sessions.length > 0 && (
          <div style={{ marginTop: '32px' }}>
            <h2 style={sectionTitle}>
              <span style={{ fontSize: '24px' }}>📋</span>
              ตารางการสอนทั้งหมด
            </h2>
            <div style={{
              background: '#fff',
              borderRadius: '12px',
              overflow: 'hidden',
              boxShadow: '0 2px 12px rgba(0, 0, 0, 0.06)',
            }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                  <thead>
                    <tr style={{ background: '#f8fdf9' }}>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#1a472a', borderBottom: '2px solid #e8f5e9' }}>คอร์ส</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#1a472a', borderBottom: '2px solid #e8f5e9' }}>วันที่</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#1a472a', borderBottom: '2px solid #e8f5e9' }}>เวลา</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#1a472a', borderBottom: '2px solid #e8f5e9' }}>สาขา</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#1a472a', borderBottom: '2px solid #e8f5e9' }}>ผู้สอน</th>
                      <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 600, color: '#1a472a', borderBottom: '2px solid #e8f5e9' }}>ที่ว่าง</th>
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
                            style={{
                              background: index % 2 === 0 ? '#fff' : '#fafffe',
                              opacity: isPast ? 0.5 : 1,
                            }}
                          >
                            <td style={{ padding: '12px 16px', borderBottom: '1px solid #f0f0f0' }}>
                              <div style={{ fontWeight: 500, color: '#333' }}>
                                {session.session_name || course?.title || '-'}
                              </div>
                            </td>
                            <td style={{ padding: '12px 16px', borderBottom: '1px solid #f0f0f0', color: '#555' }}>
                              {formatDate(session.start_date)}
                              {session.day_of_week && <span style={{ color: '#888' }}> ({session.day_of_week})</span>}
                            </td>
                            <td style={{ padding: '12px 16px', borderBottom: '1px solid #f0f0f0', color: '#555' }}>
                              {formatTime(session.start_time)}
                              {session.end_time && ` - ${formatTime(session.end_time)}`}
                            </td>
                            <td style={{ padding: '12px 16px', borderBottom: '1px solid #f0f0f0', color: '#555' }}>
                              {session.branch_name || course?.branch_name || '-'}
                            </td>
                            <td style={{ padding: '12px 16px', borderBottom: '1px solid #f0f0f0', color: '#555' }}>
                              {session.instructor_name || course?.instructor_name || '-'}
                            </td>
                            <td style={{ padding: '12px 16px', borderBottom: '1px solid #f0f0f0', textAlign: 'center' }}>
                              <span style={{
                                background: (session.available_spots ?? 0) > 0 ? '#dcfce7' : '#fee2e2',
                                color: (session.available_spots ?? 0) > 0 ? '#166534' : '#dc2626',
                                padding: '4px 8px',
                                borderRadius: '4px',
                                fontSize: '12px',
                                fontWeight: 500,
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

      {/* Footer */}
      <div style={{
        background: '#1a472a',
        color: '#fff',
        padding: '20px 16px',
        textAlign: 'center',
        marginTop: '40px',
      }}>
        <p style={{ margin: '0 0 8px', fontSize: '14px', opacity: 0.9 }}>
          NeedHome Yoga & Wellness
        </p>
        <p style={{ margin: 0, fontSize: '12px', opacity: 0.7 }}>
          สอบถามเพิ่มเติม ติดต่อผ่าน LINE Official Account
        </p>
      </div>
    </div>
  );
}

export default Home;
