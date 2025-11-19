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
  const [branches, setBranches] = useState([]);
  const [instructors, setInstructors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingSession, setEditingSession] = useState(null);
  const emptyFormState = {
    course_id: '',
    session_name: '',
    start_date: '',
    start_time: '',
    end_time: '',
    day_of_week: '',
    max_capacity: 20,
    status: 'open',
    notes: '',
    branch_id: '',
    instructor_id: ''
  };
  const [formData, setFormData] = useState(emptyFormState);
  const [selectedInstructorId, setSelectedInstructorId] = useState('');
  const [selectedBranchId, setSelectedBranchId] = useState('');
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
    fetchBranches();
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

  const branchMap = useMemo(() => {
    const map = {};
    branches.forEach((branch) => {
      map[String(branch.id)] = branch.name;
    });
    return map;
  }, [branches]);

  const selectedCourse = selectedCourseId ? courseMap[selectedCourseId] : null;
  const canSchedule = Boolean(selectedCourseId && selectedInstructorId && selectedBranchId);

  useEffect(() => {
    if (selectedCourse) {
      setBulkMaxCapacity(selectedCourse.capacity || 20);
    }
  }, [selectedCourse]);

  useEffect(() => {
    setSelectedSlots({});
  }, [selectedCourseId, selectedInstructorId, selectedBranchId]);

  const { filteredCourses, showAllCoursesFallback } = useMemo(() => {
    let filtered = courses;

    if (selectedInstructorId) {
      filtered = filtered.filter((course) => String(course.instructor_id) === selectedInstructorId);
    }

    if (selectedBranchId) {
      filtered = filtered.filter((course) => String(course.branch_id) === selectedBranchId);
    }

    if (filtered.length === 0 && (selectedInstructorId || selectedBranchId)) {
      return { filteredCourses: courses, showAllCoursesFallback: true };
    }

    return { filteredCourses: filtered, showAllCoursesFallback: false };
  }, [courses, selectedInstructorId, selectedBranchId]);

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
        const instructorId = session.instructor_id ?? course?.instructor_id;
        if (!instructorId || String(instructorId) !== selectedInstructorId) {
          return false;
        }
      }
      if (selectedBranchId) {
        const branchId = session.branch_id ?? course?.branch_id;
        if (!branchId || String(branchId) !== selectedBranchId) {
          return false;
        }
      }
      if (selectedCourseId && String(session.course_id) !== selectedCourseId) {
        return false;
      }
      return true;
    })
  ), [sessions, courseMap, selectedInstructorId, selectedBranchId, selectedCourseId]);

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
  }, [selectedInstructorId, selectedBranchId, selectedCourseId, resetSessionsPage]);

  const getInstructorLabel = (session) => {
    if (session.instructor_name) {
      return session.instructor_name;
    }
    if (session.instructor_id) {
      const fromSession = instructorMap[String(session.instructor_id)];
      if (fromSession) {
        return fromSession;
      }
    }
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
    return 'ยังไม่ระบุ';
  };

  const getBranchLabel = (session) => {
    if (session.branch_name) {
      return session.branch_name;
    }
    if (session.branch_id) {
      const fromSession = branchMap[String(session.branch_id)];
      if (fromSession) {
        return fromSession;
      }
    }
    const course = courseMap[String(session.course_id)];
    if (course?.branch_name) {
      return course.branch_name;
    }
    if (course?.branch_id) {
      const fromCourse = branchMap[String(course.branch_id)];
      if (fromCourse) {
        return fromCourse;
      }
    }
    return '-';
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
      const response = await axios.post(`${apiBase}/api/admin/course-sessions/list`, {});
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
      const response = await axios.post(`${apiBase}/api/admin/courses/list`, {});
      setCourses(response.data);
    } catch (error) {
      console.error('Error fetching courses:', error);
    }
  };

  const fetchInstructors = async () => {
    try {
      const response = await axios.post(`${apiBase}/api/admin/instructors/list`, { active_only: true });
      setInstructors(response.data);
    } catch (error) {
      console.error('Error fetching instructors:', error);
    }
  };

  const fetchBranches = async () => {
    try {
      const response = await axios.post(`${apiBase}/api/admin/branches/list`, { active_only: true });
      setBranches(response.data);
    } catch (error) {
      console.error('Error fetching branches:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (!formData.branch_id || !formData.instructor_id) {
        alert('กรุณาเลือกสาขาและผู้สอนสำหรับรอบเรียนนี้');
        return;
      }

      const payload = {
        ...formData,
        course_id: Number(formData.course_id),
        branch_id: Number(formData.branch_id),
        instructor_id: Number(formData.instructor_id),
        max_capacity: formData.max_capacity ? Number(formData.max_capacity) : null
      };

      if (editingSession) {
        await axios.post(`${apiBase}/api/admin/course-sessions/update`, {
          id: editingSession.id,
          ...payload,
        });
        alert('อัพเดทรอบเรียนสำเร็จ');
      } else {
        await axios.post(`${apiBase}/api/admin/course-sessions`, payload);
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
    const fallbackCourse = courseMap[String(session.course_id)];
    setFormData({
      course_id: session.course_id || '',
      session_name: session.session_name || '',
      start_date: session.start_date ? session.start_date.split('T')[0] : '',
      start_time: session.start_time || '',
      end_time: session.end_time || '',
      day_of_week: session.day_of_week || '',
      max_capacity: session.max_capacity || 20,
      status: session.status || 'open',
      notes: session.notes || '',
      branch_id: session.branch_id
        ? String(session.branch_id)
        : fallbackCourse?.branch_id
          ? String(fallbackCourse.branch_id)
          : '',
      instructor_id: session.instructor_id
        ? String(session.instructor_id)
        : fallbackCourse?.instructor_id
          ? String(fallbackCourse.instructor_id)
          : ''
    });
    setShowForm(true);
  };

  const handleDelete = async (sessionId) => {
    if (!confirm('คุณแน่ใจหรือไม่ที่จะลบรอบเรียนนี้?')) {
      return;
    }
    try {
      await axios.post(`${apiBase}/api/admin/course-sessions/delete`, { id: sessionId });
      alert('ลบรอบเรียนสำเร็จ');
      fetchSessions();
    } catch (error) {
      console.error('Error deleting session:', error);
      alert(error.response?.data?.message || 'เกิดข้อผิดพลาดในการลบ');
    }
  };

  const resetForm = (overrides = {}) => {
    setFormData({
      ...emptyFormState,
      ...overrides
    });
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingSession(null);
    resetForm();
  };

  const handleAddNewClick = () => {
    if (!selectedInstructorId || !selectedBranchId) {
      alert('กรุณาเลือกผู้สอนและสาขาก่อนเพิ่มรอบเรียน');
      return;
    }
    setEditingSession(null);
    resetForm({
      instructor_id: selectedInstructorId,
      branch_id: selectedBranchId,
      course_id: selectedCourseId || ''
    });
    setShowForm(true);
  };

  const toggleDateSelection = (dateKey, isDisabled) => {
    if (!canSchedule || isDisabled) {
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
    if (!canSchedule) {
      alert('กรุณาเลือกสาขา ผู้สอน และคอร์สที่จะสร้างรอบเรียน');
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
          notes: bulkNotes || null,
          branch_id: Number(selectedBranchId),
          instructor_id: Number(selectedInstructorId)
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
    return <div className="page">กำลังโหลด...</div>;
  }

  return (
    <div className="page">
      <div className="page__header">
        <div>
          <h1 className="page__title">จัดการรอบเรียน (Sessions)</h1>
          <p className="page__subtitle">วางตารางผู้สอนได้จากปฏิทินและจัดการรายการทั้งหมดจากหน้านี้</p>
        </div>
        <div className="page__actions">
          <button
            onClick={handleAddNewClick}
            disabled={!selectedInstructorId || !selectedBranchId}
            className="btn btn--primary"
          >
            เพิ่มรอบเรียนใหม่
          </button>
        </div>
      </div>

      <div className="page-card">
        <div className="form-grid form-grid--two">
          <div className="field">
            <label className="field__label">เลือกสาขา</label>
            <select
              value={selectedBranchId}
              onChange={(e) => {
                setSelectedBranchId(e.target.value);
                setSelectedCourseId('');
              }}
              className="select"
            >
              <option value="">ทุกสาขา</option>
              {branches.map((branch) => (
                <option key={branch.id} value={branch.id}>
                  {branch.name}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label className="field__label">เลือกผู้สอน</label>
            <select
              value={selectedInstructorId}
              onChange={(e) => {
                setSelectedInstructorId(e.target.value);
                setSelectedCourseId('');
              }}
              className="select"
            >
              <option value="">ผู้สอนทั้งหมด</option>
              {instructors.map((instructor) => (
                <option key={instructor.id} value={instructor.id}>
                  {instructor.name}
                </option>
              ))}
            </select>
          </div>

          <div className="field" style={{ gridColumn: '1 / -1' }}>
            <label className="field__label">เลือกคอร์สที่ต้องการวางตาราง</label>
            <select
              value={selectedCourseId}
              onChange={(e) => setSelectedCourseId(e.target.value)}
              disabled={!selectedInstructorId || !selectedBranchId}
              className="select"
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
                ยังไม่มีคอร์สที่ตรงกับตัวกรองนี้ ระบบจะแสดงทุกคอร์สให้เลือก
              </span>
            )}
            {!selectedBranchId || !selectedInstructorId ? (
              <span style={{ fontSize: '12px', color: '#b45309' }}>
                กรุณาเลือกทั้งสาขาและผู้สอนก่อนเลือกคอร์สและลงตาราง
              </span>
            ) : null}
          </div>
        </div>

        {!canSchedule && (
          <div className="page-alert page-alert--error" style={{ background: '#fef3c7', borderColor: '#f59e0b', color: '#92400e' }}>
            กรุณาเลือกสาขา ผู้สอน และคอร์สก่อนทำการเลือกวันที่จากปฏิทิน
          </div>
        )}

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'stretch' }}>
          <div style={{ flex: '2 1 480px', borderRight: '1px dashed #e5e7eb', paddingRight: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <button
                onClick={() => setCalendarMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))}
                className="btn btn--ghost btn--small"
                aria-label="เดือนก่อนหน้า"
              >
                ←
              </button>
              <strong>{calendarMonth.toLocaleDateString('th-TH', { month: 'long', year: 'numeric' })}</strong>
              <button
                onClick={() => setCalendarMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))}
                className="btn btn--ghost btn--small"
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
                    disabled={disabled || !canSchedule}
                    style={{
                      borderRadius: '12px',
                      border: isSelected ? '2px solid #2563eb' : '1px solid #e5e7eb',
                      background: isSelected ? '#dbeafe' : '#fff',
                      minHeight: '110px',
                      padding: '8px',
                      textAlign: 'left',
                      opacity: disabled ? 0.4 : 1,
                      cursor: disabled || !canSchedule ? 'not-allowed' : 'pointer',
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
                    className="btn btn--text"
                    style={{ color: '#2563eb' }}
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
                          className="btn btn--text"
                          style={{ color: '#dc2626', fontSize: '12px' }}
                        >
                          ลบ
                        </button>
                      </div>
                      <input
                        type="text"
                        value={slot.session_name}
                        onChange={(e) => updateSlotField(dateKey, 'session_name', e.target.value)}
                        placeholder="ชื่อรอบ (ไม่บังคับ)"
                        className="input"
                      />
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                        <div className="field">
                          <span style={{ fontSize: '12px', color: '#6b7280' }}>เวลาเริ่ม *</span>
                          <input
                            type="time"
                            value={slot.start_time}
                            onChange={(e) => updateSlotField(dateKey, 'start_time', e.target.value)}
                            required
                            className="input"
                          />
                        </div>
                        <div className="field">
                          <span style={{ fontSize: '12px', color: '#6b7280' }}>เวลาสิ้นสุด</span>
                          <input
                            type="time"
                            value={slot.end_time}
                            onChange={(e) => updateSlotField(dateKey, 'end_time', e.target.value)}
                            className="input"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="form-grid">
                <div className="field">
                  <label className="field__label">จำนวนผู้เข้าร่วมสูงสุด</label>
                  <input
                    type="number"
                    min="1"
                    value={bulkMaxCapacity}
                    onChange={(e) => setBulkMaxCapacity(parseInt(e.target.value, 10) || 0)}
                    className="input"
                  />
                </div>
                <div className="field">
                  <label className="field__label">สถานะ</label>
                  <select
                    value={bulkStatus}
                    onChange={(e) => setBulkStatus(e.target.value)}
                    className="select"
                  >
                    <option value="open">เปิดให้ลงทะเบียน</option>
                    <option value="full">เต็ม</option>
                    <option value="closed">ปิด</option>
                    <option value="cancelled">ยกเลิก</option>
                  </select>
                </div>
                <div className="field">
                  <label className="field__label">หมายเหตุ (ใช้กับทุกวันที่เลือก)</label>
                  <textarea
                    value={bulkNotes}
                    onChange={(e) => setBulkNotes(e.target.value)}
                    rows={2}
                    className="textarea"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleBulkCreate}
                  disabled={bulkSubmitting || !canSchedule || selectedSlotEntries.length === 0}
                  className="btn btn--primary"
                  style={{ background: bulkSubmitting || !canSchedule ? '#9ca3af' : '#16a34a' }}
                >
                  {bulkSubmitting ? 'กำลังบันทึก...' : 'สร้างรอบเรียนตามวันที่ที่เลือก'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showForm && (
        <div className="page-card">
          <div className="page-card__header">
            <h2 className="page-card__title">{editingSession ? 'แก้ไขรอบเรียน' : 'เพิ่มรอบเรียนใหม่'}</h2>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="form-grid form-grid--two">
              <div className="field">
                <label className="field__label">สาขา *</label>
                <select
                  value={formData.branch_id}
                  onChange={(e) => setFormData({ ...formData, branch_id: e.target.value })}
                  required
                  className="select"
                >
                  <option value="">-- เลือกสาขา --</option>
                  {branches.map((branch) => (
                    <option key={branch.id} value={branch.id}>
                      {branch.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="field">
                <label className="field__label">ผู้สอน *</label>
                <select
                  value={formData.instructor_id}
                  onChange={(e) => setFormData({ ...formData, instructor_id: e.target.value })}
                  required
                  className="select"
                >
                  <option value="">-- เลือกผู้สอน --</option>
                  {instructors.map((instructor) => (
                    <option key={instructor.id} value={instructor.id}>
                      {instructor.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-grid">
              <div className="field">
                <label className="field__label">คอร์สเรียน *</label>
                <select
                  value={formData.course_id}
                  onChange={(e) => setFormData({ ...formData, course_id: e.target.value })}
                  required
                  className="select"
                >
                  <option value="">-- เลือกคอร์สเรียน --</option>
                  {courses.map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.title}{course.instructor_name ? ` · ${course.instructor_name}` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="field">
                <label className="field__label">ชื่อรอบเรียน</label>
                <input
                  type="text"
                  value={formData.session_name}
                  onChange={(e) => setFormData({ ...formData, session_name: e.target.value })}
                  placeholder="เช่น รอบเช้า, รอบเย็น"
                  className="input"
                />
              </div>
            </div>

            <div className="form-grid form-grid--two">
              <div className="field">
                <label className="field__label">วันที่เริ่ม *</label>
                <input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  required
                  className="input"
                />
              </div>

              <div className="field">
                <label className="field__label">วันในสัปดาห์</label>
                <input
                  type="text"
                  value={formData.day_of_week}
                  onChange={(e) => setFormData({ ...formData, day_of_week: e.target.value })}
                  placeholder="จันทร์, อังคาร, ..."
                  className="input"
                />
              </div>
            </div>

            <div className="form-grid form-grid--two">
              <div className="field">
                <label className="field__label">เวลาเริ่ม *</label>
                <input
                  type="time"
                  value={formData.start_time}
                  onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                  required
                  className="input"
                />
              </div>

              <div className="field">
                <label className="field__label">เวลาสิ้นสุด</label>
                <input
                  type="time"
                  value={formData.end_time}
                  onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                  className="input"
                />
              </div>
            </div>

            <div className="form-grid form-grid--two">
              <div className="field">
                <label className="field__label">จำนวนผู้เข้าร่วมสูงสุด</label>
                <input
                  type="number"
                  value={formData.max_capacity}
                  onChange={(e) => setFormData({ ...formData, max_capacity: parseInt(e.target.value, 10) })}
                  min="1"
                  className="input"
                />
              </div>

              <div className="field">
                <label className="field__label">สถานะ</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="select"
                >
                  <option value="open">เปิดให้ลงทะเบียน</option>
                  <option value="full">เต็ม</option>
                  <option value="closed">ปิด</option>
                  <option value="cancelled">ยกเลิก</option>
                </select>
              </div>
            </div>

            <div className="form-grid">
              <div className="field">
                <label className="field__label">หมายเหตุ</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={2}
                  className="textarea"
                />
              </div>
            </div>

            <div className="page__actions">
              <button
                type="submit"
                className="btn btn--primary"
              >
                บันทึก
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="btn btn--ghost"
              >
                ยกเลิก
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="page-card">
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>คอร์สเรียน</th>
                <th>สาขา</th>
                <th>ผู้สอน</th>
                <th>ชื่อรอบ</th>
                <th>วันที่</th>
                <th>เวลา</th>
                <th style={{ textAlign: 'center' }}>จำนวน</th>
                <th style={{ textAlign: 'center' }}>สถานะ</th>
                <th style={{ textAlign: 'center' }}>จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {visibleSessions.length === 0 ? (
                <tr>
                  <td colSpan={9} className="empty-state">
                    ไม่มีข้อมูลรอบเรียนในตัวกรองนี้
                  </td>
                </tr>
              ) : (
                visibleSessions.map((session) => (
                  <tr key={session.id}>
                    <td>
                      {session.course_title || '-'}
                    </td>
                    <td>
                      {getBranchLabel(session)}
                    </td>
                    <td>
                      {getInstructorLabel(session)}
                    </td>
                    <td>
                      {session.session_name || '-'}
                    </td>
                    <td>
                      {session.start_date ? new Date(session.start_date).toLocaleDateString('th-TH') : '-'}
                    </td>
                    <td>
                      {formatTime(session.start_time)} {session.end_time ? `- ${formatTime(session.end_time)}` : ''}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {session.current_enrollments || 0} / {session.max_capacity || 0}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span className={
                        session.status === 'open' ? 'status-pill status-pill--success' :
                        session.status === 'full' ? 'status-pill status-pill--warning' :
                        'status-pill status-pill--danger'
                      }>
                        {session.status === 'open'
                          ? 'เปิด'
                          : session.status === 'full'
                            ? 'เต็ม'
                            : session.status === 'closed'
                              ? 'ปิด'
                              : 'ยกเลิก'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button
                        onClick={() => handleEdit(session)}
                        className="btn btn--small"
                        style={{ background: '#f59e0b', color: '#fff', marginRight: '8px' }}
                      >
                        แก้ไข
                      </button>
                      <button
                        onClick={() => handleDelete(session.id)}
                        className="btn btn--small btn--danger"
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
