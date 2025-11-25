import axios from 'axios';

import { formatDateDisplay, formatTimeDisplay } from './formatters';

const apiBase = import.meta.env.VITE_API_BASE_URL;

if (!apiBase) {
  throw new Error('VITE_API_BASE_URL is required for LIFF web requests');
}

const api = axios.create({
  baseURL: apiBase,
  headers: { 'Content-Type': 'application/json' },
  timeout: 12000,
});

const normalizeCourse = (course = {}, copy = {}, language = 'en') => {
  const capacity = Number(course.capacity || 0);
  const totalEnrollments = Number(course.total_enrollments || course.current_enrollments || 0);
  const courseType = course.course_type || 'scheduled';
  const maxStudents = Number(course.max_students || 0);
  const sessionCount = Number(course.session_count || 0);
  const availableSpots = course.available_spots !== null && course.available_spots !== undefined
    ? Number(course.available_spots)
    : null;

  // Calculate seats left based on course type
  let seatsLeft;
  if (courseType === 'standalone') {
    seatsLeft = availableSpots !== null ? availableSpots : Math.max(maxStudents - totalEnrollments, 0);
  } else {
    seatsLeft = Math.max(capacity - totalEnrollments, 0);
  }

  return {
    id: course.id,
    title: course.title,
    description: course.description || '',
    branchName: course.branch_name || copy.branchFallback || 'Branch',
    branchAddress: course.branch_address || '',
    instructorName: course.instructor_name || copy.instructorFallback || 'Instructor',
    instructorBio: course.instructor_bio || '',
    instructorAvatar: course.instructor_avatar || '',
    priceCents: Number(course.price_cents || 0),
    isFree: Boolean(course.is_free),
    capacity,
    totalEnrollments,
    accessTimes: course.access_times ?? 1,
    channel: course.channel || copy.courseLabel || '',
    status: course.status || '',
    coverImage: course.cover_image_url || '',
    level: course.level || '',
    tags: Array.isArray(course.tags) ? course.tags : [],
    seatsLeft,
    language,
    courseType,
    maxStudents,
    sessionCount,
    availableSpots,
    enrollmentDeadline: course.enrollment_deadline || null,
  };
};

const normalizeSession = (session = {}, course, copy = {}) => ({
  id: session.id,
  topic: session.session_name || session.course_title || copy.sessionTopicFallback || 'Session',
  date: formatDateDisplay(session.start_date, course?.language || 'en'),
  time: formatTimeDisplay(session.start_time),
  endTime: formatTimeDisplay(session.end_time),
  mode: course?.channel || session.channel || copy.sessionTopicFallback || 'Session',
  availableSpots: session.available_spots ?? null,
  branchName: session.branch_name || course?.branchName || copy.branchFallback || '',
  instructorName: session.instructor_name || course?.instructorName || copy.instructorFallback || '',
});

export const fetchCourses = async ({ limit = 50, language = 'en', copy = {} } = {}) => {
  const { data } = await api.post('/courses/list', { limit, status: 'published' });
  const labels = {
    branchFallback: copy.branchFallback,
    instructorFallback: copy.instructorFallback,
    courseLabel: copy.courseLabel,
  };
  return Array.isArray(data) ? data.map((item) => normalizeCourse(item, labels, language)) : [];
};

export const fetchCourseDetail = async (id, { language = 'en', copy = {} } = {}) => {
  const [courseRes, sessionsRes] = await Promise.all([
    api.post('/api/admin/courses/detail', { id }),
    api.post('/courses/sessions', { course_id: id, status: 'open', limit: 200 }),
  ]);

  const normalizedCourse = normalizeCourse(courseRes.data, copy, language);
  const sessionItems = Array.isArray(sessionsRes.data)
    ? sessionsRes.data
    : Array.isArray(sessionsRes.data?.items)
      ? sessionsRes.data.items
      : [];

  const normalizedSessions = sessionItems.map((session) => normalizeSession(session, normalizedCourse, copy));

  return { course: normalizedCourse, sessions: normalizedSessions };
};

export const fetchFeaturedCourses = async ({ limit = 6, language = 'en', copy = {} } = {}) => {
  const courses = await fetchCourses({ limit, language, copy });
  return courses.filter((course) => course.status === 'published');
};
