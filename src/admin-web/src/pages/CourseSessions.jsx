import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import TablePagination from '../components/common/TablePagination';
import usePagination from '../hooks/usePagination';

const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';
const dayLabels = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];
const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const formatDateKey = (dateObj) => {
  const year = dateObj.getFullYear();
  const month = `${dateObj.getMonth() + 1}`.padStart(2, '0');
  const day = `${dateObj.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatDisplayDate = (dateStr) => {
  const date = new Date(`${dateStr}T00:00:00`);
  return date.toLocaleDateString('th-TH', { weekday: 'short', day: 'numeric', month: 'short' });
};

const formatTime = (timeValue) => {
  if (!timeValue) return '-';
  return timeValue.slice(0, 5);
};

const generateCalendarDays = (monthDate) => {
  const startOfMonth = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
  const startDay = startOfMonth.getDay();
  const firstGridDate = new Date(startOfMonth);
  firstGridDate.setDate(firstGridDate.getDate() - startDay);
  const days = [];
  for (let i = 0; i < 42; i += 1) {
    const day = new Date(firstGridDate);
    day.setDate(firstGridDate.getDate() + i);
    days.push(day);
  }
  return days;
};

function CourseSessions() {
  const [sessions, setSessions] = useState([]);
  const [courses, setCourses] = useState([]);
  const [instructors, setInstructors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingSession, setEditingSession] = useState(null);
  const [formData, setFormData] = useState({
    course_id: '',
    session_name: '',
    start_date: '',
    start_time: '',
    end_time: '',
    day_of_week: '',
    max_capacity: 20,
    status: 'open',
    notes: ''
  });
  const [selectedInstructorId, setSelectedInstructorId] = useState('');
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });
  const [selectedSlots, setSelectedSlots] = useState({});
  const [bulkMaxCapacity, setBulkMaxCapacity] = useState(20);
  const [bulkStatus, setBulkStatus] = useState('open');
  const [bulkNotes, setBulkNotes] = useState('');
  const [bulkSubmitting, setBulkSubmitting] = useState(false);

  useEffect(() => {
    fetchSessions();
    fetchCourses();
    fetchInstructors();
  }, []);

  const courseMap = useMemo(() => {
    const map = {};
    courses.forEach((course) => {
      map[String(course.id)] = course;
    });
    return map;
  }, [courses]);

  const instructorMap = useMemo(() => {
    const map = {};
    instructors.forEach((instructor) => {
      map[String(instructor.id)] = instructor.name;
    });
    return map;
  }, [instructors]);

  const selectedCourse = selectedCourseId ? courseMap[selectedCourseId] : null;

  useEffect(() => {
    if (selectedCourse) {
      setBulkMaxCapacity(selectedCourse.capacity || 20);
    }
  }, [selectedCourse]);

  useEffect(() => {
    setSelectedSlots({});
  }, [selectedCourseId]);

  const { filteredCourses, showAllCoursesFallback } = useMemo(() => {
    if (!selectedInstructorId) {
      return { filteredCourses: courses, showAllCoursesFallback: false };
    }

    const matchingCourses = courses.filter((course) => String(course.instructor_id) === selectedInstructorId);

    if (matchingCourses.length === 0) {
      return { filteredCourses: courses, showAllCoursesFallback: true };
    }

    return { filteredCourses: matchingCourses, showAllCoursesFallback: false };
  }, [courses, selectedInstructorId]);

  useEffect(() => {
    if (
      selectedCourseId &&
      filteredCourses.every((course) => String(course.id) !== selectedCourseId)
    ) {
      setSelectedCourseId('');
    }
  }, [filteredCourses, selectedCourseId]);

  const filteredSessions = useMemo(() => (
    sessions.filter((session) => {
      const course = courseMap[String(session.course_id)];
      if (selectedInstructorId) {
        if (!course || String(course.instructor_id) !== selectedInstructorId) {
          return false;
        }
      }
      if (selectedCourseId && String(session.course_id) !== selectedCourseId) {
        return false;
      }
      return true;
    })
  ), [sessions, courseMap, selectedInstructorId, selectedCourseId]);

  const {
    page: sessionsPage,
    pageSize: sessionsPageSize,
    totalItems: totalFilteredSessions,
    paginatedItems: visibleSessions,
    setPage: setSessionsPage,
    setPageSize: setSessionsPageSize,
    resetPage: resetSessionsPage,
  } = usePagination(filteredSessions, { initialPageSize: 12 });

  useEffect(() => {
    resetSessionsPage();
  }, [selectedInstructorId, selectedCourseId, resetSessionsPage]);

  const getInstructorLabel = (session) => {
    const course = courseMap[String(session.course_id)];
    if (course?.instructor_name) {
      return course.instructor_name;
    }
    if (course?.instructor_id) {
      const fromInstructor = instructorMap[String(course.instructor_id)];
      if (fromInstructor) {
        return fromInstructor;
      }
    }
    if (session.instructor_name) {
      return session.instructor_name;
    }
    return 'ยังไม่ระบุ';
  };

  const sessionsByDate = useMemo(() => {
    return filteredSessions.reduce((acc, session) => {
      if (!session.start_date) {
        return acc;
      }
      const dateKey = session.start_date.split('T')[0];
      if (!acc[dateKey]) {
        acc[dateKey] = [];
      }
      acc[dateKey].push(session);
      return acc;
    }, {});
  }, [filteredSessions]);

  const calendarDays = useMemo(() => generateCalendarDays(calendarMonth), [calendarMonth]);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${apiBase}/api/admin/course-sessions`);
      setSessions(response.data);
    } catch (error) {
      console.error('Error fetching sessions:', error);
      alert('ไม่สามารถโหลดข้อมูลรอบเรียนได้');
    } finally {
      setLoading(false);
    }
  };

  const fetchCourses = async () => {
    try {
      const response = await axios.get(`${apiBase}/api/admin/courses`);
      setCourses(response.data);
    } catch (error) {
      console.error('Error fetching courses:', error);
    }
  };

  const fetchInstructors = async () => {
    try {
      const response = await axios.get(`${apiBase}/api/admin/instructors?active_only=true`);
      setInstructors(response.data);
    } catch (error) {
      console.error('Error fetching instructors:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingSession) {
        await axios.put(`${apiBase}/api/admin/course-sessions/${editingSession.id}`, formData);
        alert('อัพเดทรอบเรียนสำเร็จ');
      } else {
        await axios.post(`${apiBase}/api/admin/course-sessions`, formData);
        alert('สร้างรอบเรียนสำเร็จ');
      }
      setShowForm(false);
      setEditingSession(null);
      resetForm();
      fetchSessions();
    } catch (error) {
      console.error('Error saving session:', error);
      alert('เกิดข้อผิดพลาดในการบันทึก');
    }
  };

  const handleEdit = (session) => {
    setEditingSession(session);
    setFormData({
      course_id: session.course_id || '',
      session_name: session.session_name || '',
      start_date: session.start_date ? session.start_date.split('T')[0] : '',
      start_time: session.start_time || '',
      end_time: session.end_time || '',
      day_of_week: session.day_of_week || '',
      max_capacity: session.max_capacity || 20,
      status: session.status || 'open',
      notes: session.notes || ''
    });
    setShowForm(true);
  };

  const handleDelete = async (sessionId) => {
    if (!confirm('คุณแน่ใจหรือไม่ที่จะลบรอบเรียนนี้?')) {
      return;
    }
    try {
      await axios.delete(`${apiBase}/api/admin/course-sessions/${sessionId}`);
      alert('ลบรอบเรียนสำเร็จ');
      fetchSessions();
    } catch (error) {
      console.error('Error deleting session:', error);
      alert(error.response?.data?.message || 'เกิดข้อผิดพลาดในการลบ');
    }
  };

  const resetForm = () => {
    setFormData({
      course_id: '',
      session_name: '',
      start_date: '',
      start_time: '',
      end_time: '',
      day_of_week: '',
      max_capacity: 20,
      status: 'open',
      notes: ''
    });
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingSession(null);
    resetForm();
  };

  const toggleDateSelection = (dateKey, isDisabled) => {
    if (!selectedCourseId || isDisabled) {
      return;
    }
    setSelectedSlots((prev) => {
      if (prev[dateKey]) {
        const updated = { ...prev };
        delete updated[dateKey];
        return updated;
      }
      const defaultName = selectedCourse
        ? `${selectedCourse.title} (${formatDisplayDate(dateKey)})`
        : '';
      return {
        ...prev,
        [dateKey]: {
          session_name: defaultName,
          start_time: '',
          end_time: ''
        }
      };
    });
  };

  const updateSlotField = (dateKey, field, value) => {
    setSelectedSlots((prev) => ({
      ...prev,
      [dateKey]: {
        ...prev[dateKey],
        [field]: value
      }
    }));
  };

  const selectedSlotEntries = useMemo(() => (
    Object.entries(selectedSlots).sort(([a], [b]) => (a > b ? 1 : -1))
  ), [selectedSlots]);

  const handleBulkCreate = async () => {
    if (!selectedCourseId) {
      alert('กรุณาเลือกคอร์สที่จะสร้างรอบเรียน');
      return;
    }
    if (selectedSlotEntries.length === 0) {
      alert('กรุณาเลือกวันที่จากปฏิทินอย่างน้อย 1 วัน');
      return;
    }
    const invalidSlot = selectedSlotEntries.find(([, slot]) => !slot.start_time);
    if (invalidSlot) {
      alert('กรุณากรอกเวลาเริ่มสำหรับทุกวันที่เลือก');
      return;
    }

    setBulkSubmitting(true);
    try {
      for (const [dateKey, slot] of selectedSlotEntries) {
        const payload = {
          course_id: Number(selectedCourseId),
          session_name: slot.session_name || `${selectedCourse?.title || 'Session'} (${formatDisplayDate(dateKey)})`,
          start_date: dateKey,
          start_time: slot.start_time,
          end_time: slot.end_time || null,
          day_of_week: dayNames[new Date(`${dateKey}T00:00:00`).getDay()],
          max_capacity: Number(bulkMaxCapacity) || (selectedCourse?.capacity || 20),
          status: bulkStatus,
          notes: bulkNotes || null
        };
        await axios.post(`${apiBase}/api/admin/course-sessions`, payload);
      }
      alert('สร้างรอบเรียนตามวันที่ที่เลือกเรียบร้อยแล้ว');
      setSelectedSlots({});
      fetchSessions();
    } catch (error) {
      console.error('Error creating sessions in bulk:', error);
      alert(error.response?.data?.message || 'เกิดข้อผิดพลาดในการสร้างรอบเรียน');
    } finally {
      setBulkSubmitting(false);
    }
  };

  if (loading) {
    return <div style={{ padding: '20px' }}>กำลังโหลด...</div>;
  }

  return (
    <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ margin: 0 }}>จัดการรอบเรียน (Sessions)</h1>
          <p style={{ margin: 0, color: '#6b7280' }}>วางตารางผู้สอนได้จากปฏิทินและจัดการรายการทั้งหมดจากหน้านี้</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          style={{
            background: '#2563eb',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            padding: '10px 20px',
            cursor: 'pointer'
          }}
        >
          เพิ่มรอบเรียนใหม่
        </button>
      </div>

      <div style={{
        background: '#fff',
        border: '1px solid #e5e7eb',
        borderRadius: '12px',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
      }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: '1 1 250px' }}>
            <span style={{ fontSize: '14px', fontWeight: 500 }}>เลือกผู้สอน</span>
            <select
              value={selectedInstructorId}
              onChange={(e) => {
                setSelectedInstructorId(e.target.value);
                setSelectedCourseId('');
              }}
              style={{
                padding: '10px 12px',
                borderRadius: '8px',
                border: '1px solid #d1d5db'
              }}
            >
              <option value="">ผู้สอนทั้งหมด</option>
              {instructors.map((instructor) => (
                <option key={instructor.id} value={instructor.id}>
                  {instructor.name}
                </option>
              ))}
            </select>
          </label>

          <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: '1 1 250px' }}>
            <span style={{ fontSize: '14px', fontWeight: 500 }}>เลือกคอร์สที่ต้องการวางตาราง</span>
            <select
              value={selectedCourseId}
              onChange={(e) => setSelectedCourseId(e.target.value)}
              style={{
                padding: '10px 12px',
                borderRadius: '8px',
                border: '1px solid #d1d5db'
              }}
            >
              <option value="">เลือกคอร์ส</option>
              {filteredCourses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.title}{course.instructor_name ? ` · ${course.instructor_name}` : ''}
                </option>
              ))}
            </select>
            {showAllCoursesFallback && (
              <span style={{ fontSize: '12px', color: '#6b7280' }}>
                ยังไม่มีคอร์สที่ผูกกับผู้สอนคนนี้ ระบบจะแสดงทุกคอร์สให้เลือก
              </span>
            )}
          </label>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'stretch' }}>
          <div style={{ flex: '2 1 480px', borderRight: '1px dashed #e5e7eb', paddingRight: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <button
                onClick={() => setCalendarMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))}
                style={{ border: 'none', background: '#f3f4f6', borderRadius: '6px', padding: '6px 10px', cursor: 'pointer' }}
                aria-label="เดือนก่อนหน้า"
              >
                ←
              </button>
              <strong>{calendarMonth.toLocaleDateString('th-TH', { month: 'long', year: 'numeric' })}</strong>
              <button
                onClick={() => setCalendarMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))}
                style={{ border: 'none', background: '#f3f4f6', borderRadius: '6px', padding: '6px 10px', cursor: 'pointer' }}
                aria-label="เดือนถัดไป"
              >
                →
              </button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px' }}>
              {dayLabels.map((label) => (
                <div key={label} style={{ textAlign: 'center', fontSize: '13px', fontWeight: 600, color: '#6b7280' }}>{label}</div>
              ))}
              {calendarDays.map((day) => {
                const dateKey = formatDateKey(day);
                const isCurrentMonth = day.getMonth() === calendarMonth.getMonth();
                const isSelected = Boolean(selectedSlots[dateKey]);
                const daySessions = sessionsByDate[dateKey] || [];
                const sessionPreview = daySessions.slice(0, 2);
                const disabled = !isCurrentMonth;
                return (
                  <button
                    key={dateKey}
                    type="button"
                    onClick={() => toggleDateSelection(dateKey, disabled)}
                    disabled={disabled || !selectedCourseId}
                    style={{
                      borderRadius: '12px',
                      border: isSelected ? '2px solid #2563eb' : '1px solid #e5e7eb',
                      background: isSelected ? '#dbeafe' : '#fff',
                      minHeight: '110px',
                      padding: '8px',
                      textAlign: 'left',
                      opacity: disabled ? 0.4 : 1,
                      cursor: disabled || !selectedCourseId ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '6px'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 600, color: '#111827' }}>{day.getDate()}</span>
                      {daySessions.length > 0 && (
                        <span style={{ fontSize: '11px', background: '#e0e7ff', color: '#4338ca', borderRadius: '999px', padding: '0 8px' }}>
                          {daySessions.length} คลาส
                        </span>
                      )}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flexGrow: 1 }}>
                      {sessionPreview.map((session) => (
                        <span
                          key={session.id}
                          style={{
                            fontSize: '12px',
                            background: '#f3f4f6',
                            borderRadius: '6px',
                            padding: '2px 4px'
                          }}
                        >
                          {formatTime(session.start_time)} {session.course_title ? `· ${session.course_title}` : ''}
                        </span>
                      ))}
                      {daySessions.length > 2 && (
                        <span style={{ fontSize: '11px', color: '#6b7280' }}>+{daySessions.length - 2} รายการ</span>
                      )}
                      {!sessionPreview.length && (
                        <span style={{ fontSize: '12px', color: '#9ca3af' }}>ยังไม่มีรอบ</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div style={{ flex: '1 1 320px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{
              background: '#f9fafb',
              borderRadius: '12px',
              padding: '16px',
              border: '1px solid #e5e7eb'
            }}>
              {selectedCourse ? (
                <div style={{ display: 'flex', gap: '12px' }}>
                  {selectedCourse.cover_image_url ? (
                    <img
                      src={selectedCourse.cover_image_url}
                      alt={selectedCourse.title}
                      style={{ width: '64px', height: '64px', borderRadius: '12px', objectFit: 'cover' }}
                    />
                  ) : (
                    <div style={{
                      width: '64px',
                      height: '64px',
                      borderRadius: '12px',
                      background: '#e5e7eb',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#6b7280',
                      fontSize: '12px'
                    }}>
                      ไม่มีรูป
                    </div>
                  )}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <strong>{selectedCourse.title}</strong>
                    {selectedCourse.instructor_name && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {selectedCourse.instructor_avatar && (
                          <img
                            src={selectedCourse.instructor_avatar}
                            alt={selectedCourse.instructor_name}
                            style={{ width: '28px', height: '28px', borderRadius: '999px', objectFit: 'cover' }}
                          />
                        )}
                        <span style={{ fontSize: '13px', color: '#374151' }}>{selectedCourse.instructor_name}</span>
                      </div>
                    )}
                    <span style={{ fontSize: '12px', color: '#6b7280' }}>
                      รับได้สูงสุด {selectedCourse.capacity || '-'} คน · {selectedCourse.is_free ? 'คอร์สฟรี' : 'มีค่าใช้จ่าย'}
                    </span>
                  </div>
                </div>
              ) : (
                <p style={{ margin: 0, color: '#6b7280' }}>เลือกคอร์สเพื่อเริ่มกำหนดวันที่บนปฏิทิน</p>
              )}
            </div>

            <div style={{
              background: '#fff',
              borderRadius: '12px',
              border: '1px solid #e5e7eb',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <strong>วันที่เลือก {selectedSlotEntries.length} วัน</strong>
                {selectedSlotEntries.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setSelectedSlots({})}
                    style={{ background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer', fontSize: '13px' }}
                  >
                    ล้างทั้งหมด
                  </button>
                )}
              </div>

              {selectedSlotEntries.length === 0 ? (
                <p style={{ margin: 0, color: '#9ca3af', fontSize: '13px' }}>
                  เลือกวันที่จากปฏิทินทางซ้าย แล้วตั้งชื่อรอบและเวลาได้ทีละวัน
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '320px', overflowY: 'auto' }}>
                  {selectedSlotEntries.map(([dateKey, slot]) => (
                    <div
                      key={dateKey}
                      style={{
                        border: '1px solid #e5e7eb',
                        borderRadius: '10px',
                        padding: '12px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: 600 }}>{formatDisplayDate(dateKey)}</span>
                        <button
                          type="button"
                          onClick={() => toggleDateSelection(dateKey, false)}
                          style={{ border: 'none', background: 'none', color: '#dc2626', cursor: 'pointer', fontSize: '12px' }}
                        >
                          ลบ
                        </button>
                      </div>
                      <input
                        type="text"
                        value={slot.session_name}
                        onChange={(e) => updateSlotField(dateKey, 'session_name', e.target.value)}
                        placeholder="ชื่อรอบ (ไม่บังคับ)"
                        style={{
                          width: '100%',
                          padding: '8px',
                          borderRadius: '8px',
                          border: '1px solid #d1d5db'
                        }}
                      />
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                        <label style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <span style={{ fontSize: '12px', color: '#6b7280' }}>เวลาเริ่ม *</span>
                          <input
                            type="time"
                            value={slot.start_time}
                            onChange={(e) => updateSlotField(dateKey, 'start_time', e.target.value)}
                            required
                            style={{ padding: '8px', borderRadius: '8px', border: '1px solid #d1d5db' }}
                          />
                        </label>
                        <label style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <span style={{ fontSize: '12px', color: '#6b7280' }}>เวลาสิ้นสุด</span>
                          <input
                            type="time"
                            value={slot.end_time}
                            onChange={(e) => updateSlotField(dateKey, 'end_time', e.target.value)}
                            style={{ padding: '8px', borderRadius: '8px', border: '1px solid #d1d5db' }}
                          />
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontSize: '12px', color: '#6b7280' }}>จำนวนผู้เข้าร่วมสูงสุด</span>
                  <input
                    type="number"
                    min="1"
                    value={bulkMaxCapacity}
                    onChange={(e) => setBulkMaxCapacity(parseInt(e.target.value, 10) || 0)}
                    style={{ padding: '8px', borderRadius: '8px', border: '1px solid #d1d5db' }}
                  />
                </label>
                <label style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontSize: '12px', color: '#6b7280' }}>สถานะ</span>
                  <select
                    value={bulkStatus}
                    onChange={(e) => setBulkStatus(e.target.value)}
                    style={{ padding: '8px', borderRadius: '8px', border: '1px solid #d1d5db' }}
                  >
                    <option value="open">เปิดให้ลงทะเบียน</option>
                    <option value="full">เต็ม</option>
                    <option value="closed">ปิด</option>
                    <option value="cancelled">ยกเลิก</option>
                  </select>
                </label>
                <label style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontSize: '12px', color: '#6b7280' }}>หมายเหตุ (ใช้กับทุกวันที่เลือก)</span>
                  <textarea
                    value={bulkNotes}
                    onChange={(e) => setBulkNotes(e.target.value)}
                    rows={2}
                    style={{ padding: '8px', borderRadius: '8px', border: '1px solid #d1d5db' }}
                  />
                </label>
                <button
                  type="button"
                  onClick={handleBulkCreate}
                  disabled={bulkSubmitting || !selectedCourseId || selectedSlotEntries.length === 0}
                  style={{
                    background: bulkSubmitting ? '#9ca3af' : '#16a34a',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '10px 16px',
                    cursor: bulkSubmitting ? 'not-allowed' : 'pointer',
                    fontWeight: 600
                  }}
                >
                  {bulkSubmitting ? 'กำลังบันทึก...' : 'สร้างรอบเรียนตามวันที่ที่เลือก'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showForm && (
        <div style={{
          background: '#fff',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          padding: '20px'
        }}>
          <h2 style={{ marginTop: 0 }}>{editingSession ? 'แก้ไขรอบเรียน' : 'เพิ่มรอบเรียนใหม่'}</h2>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>คอร์สเรียน *</label>
              <select
                value={formData.course_id}
                onChange={(e) => setFormData({ ...formData, course_id: e.target.value })}
                required
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '4px'
                }}
              >
                <option value="">-- เลือกคอร์สเรียน --</option>
                {courses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.title}{course.instructor_name ? ` · ${course.instructor_name}` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>ชื่อรอบเรียน</label>
              <input
                type="text"
                value={formData.session_name}
                onChange={(e) => setFormData({ ...formData, session_name: e.target.value })}
                placeholder="เช่น รอบเช้า, รอบเย็น"
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '4px'
                }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '5px' }}>วันที่เริ่ม *</label>
                <input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  required
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '4px'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '5px' }}>วันในสัปดาห์</label>
                <input
                  type="text"
                  value={formData.day_of_week}
                  onChange={(e) => setFormData({ ...formData, day_of_week: e.target.value })}
                  placeholder="จันทร์, อังคาร, ..."
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '4px'
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '5px' }}>เวลาเริ่ม *</label>
                <input
                  type="time"
                  value={formData.start_time}
                  onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                  required
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '4px'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '5px' }}>เวลาสิ้นสุด</label>
                <input
                  type="time"
                  value={formData.end_time}
                  onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '4px'
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '5px' }}>จำนวนผู้เข้าร่วมสูงสุด</label>
                <input
                  type="number"
                  value={formData.max_capacity}
                  onChange={(e) => setFormData({ ...formData, max_capacity: parseInt(e.target.value, 10) })}
                  min="1"
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '4px'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '5px' }}>สถานะ</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '4px'
                  }}
                >
                  <option value="open">เปิดให้ลงทะเบียน</option>
                  <option value="full">เต็ม</option>
                  <option value="closed">ปิด</option>
                  <option value="cancelled">ยกเลิก</option>
                </select>
              </div>
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>หมายเหตุ</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={2}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '4px'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="submit"
                style={{
                  background: '#2563eb',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '10px 20px',
                  cursor: 'pointer'
                }}
              >
                บันทึก
              </button>
              <button
                type="button"
                onClick={handleCancel}
                style={{
                  background: '#6b7280',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '10px 20px',
                  cursor: 'pointer'
                }}
              >
                ยกเลิก
              </button>
            </div>
          </form>
        </div>
      )}

      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', overflow: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ background: '#f9fafb' }}>
            <tr>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>คอร์สเรียน</th>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>ผู้สอน</th>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>ชื่อรอบ</th>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>วันที่</th>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>เวลา</th>
              <th style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #e5e7eb' }}>จำนวน</th>
              <th style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #e5e7eb' }}>สถานะ</th>
              <th style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #e5e7eb' }}>จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {visibleSessions.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ padding: '20px', textAlign: 'center', color: '#6b7280' }}>
                  ไม่มีข้อมูลรอบเรียนในตัวกรองนี้
                </td>
              </tr>
            ) : (
              visibleSessions.map((session) => (
                <tr key={session.id}>
                  <td style={{ padding: '12px', borderBottom: '1px solid #e5e7eb' }}>
                    {session.course_title || '-'}
                  </td>
                  <td style={{ padding: '12px', borderBottom: '1px solid #e5e7eb' }}>
                    {getInstructorLabel(session)}
                  </td>
                  <td style={{ padding: '12px', borderBottom: '1px solid #e5e7eb' }}>
                    {session.session_name || '-'}
                  </td>
                  <td style={{ padding: '12px', borderBottom: '1px solid #e5e7eb' }}>
                    {session.start_date ? new Date(session.start_date).toLocaleDateString('th-TH') : '-'}
                  </td>
                  <td style={{ padding: '12px', borderBottom: '1px solid #e5e7eb' }}>
                    {formatTime(session.start_time)} {session.end_time ? `- ${formatTime(session.end_time)}` : ''}
                  </td>
                  <td style={{ padding: '12px', borderBottom: '1px solid #e5e7eb', textAlign: 'center' }}>
                    {session.current_enrollments || 0} / {session.max_capacity || 0}
                  </td>
                  <td style={{ padding: '12px', borderBottom: '1px solid #e5e7eb', textAlign: 'center' }}>
                    <span style={{
                      padding: '4px 12px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      background: session.status === 'open' ? '#dcfce7' : session.status === 'full' ? '#fef3c7' : '#fee2e2',
                      color: session.status === 'open' ? '#166534' : session.status === 'full' ? '#92400e' : '#991b1b'
                    }}>
                      {session.status === 'open'
                        ? 'เปิด'
                        : session.status === 'full'
                          ? 'เต็ม'
                          : session.status === 'closed'
                            ? 'ปิด'
                            : 'ยกเลิก'}
                    </span>
                  </td>
                  <td style={{ padding: '12px', borderBottom: '1px solid #e5e7eb', textAlign: 'center' }}>
                    <button
                      onClick={() => handleEdit(session)}
                      style={{
                        background: '#f59e0b',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '4px',
                        padding: '6px 12px',
                        cursor: 'pointer',
                        marginRight: '8px'
                      }}
                    >
                      แก้ไข
                    </button>
                    <button
                      onClick={() => handleDelete(session.id)}
                      style={{
                        background: '#dc2626',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '4px',
                        padding: '6px 12px',
                        cursor: 'pointer'
                      }}
                    >
                      ลบ
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <TablePagination
        page={sessionsPage}
        pageSize={sessionsPageSize}
        totalItems={totalFilteredSessions}
        onPageChange={setSessionsPage}
        onPageSizeChange={setSessionsPageSize}
      />
    </div>
  );
}

export default CourseSessions;
