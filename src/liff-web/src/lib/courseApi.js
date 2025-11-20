import axios from 'axios';

import { formatDateDisplay, formatTimeDisplay } from './formatters';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '',
  headers: { 'Content-Type': 'application/json' },
  timeout: 12000,
});

const normalizeCourse = (course = {}) => {
  const capacity = Number(course.capacity || 0);
  const totalEnrollments = Number(course.total_enrollments || course.current_enrollments || 0);

  return {
    id: course.id,
    title: course.title,
    description: course.description || '',
    branchName: course.branch_name || 'ไม่ระบุสาขา',
    branchAddress: course.branch_address || '',
    instructorName: course.instructor_name || 'ไม่ระบุผู้สอน',
    instructorBio: course.instructor_bio || '',
    instructorAvatar: course.instructor_avatar || '',
    priceCents: Number(course.price_cents || 0),
    isFree: Boolean(course.is_free),
    capacity,
    totalEnrollments,
    accessTimes: course.access_times ?? 1,
    channel: course.channel || '',
    status: course.status || '',
    coverImage: course.cover_image_url || '',
    level: course.level || '',
    tags: Array.isArray(course.tags) ? course.tags : [],
    seatsLeft: Math.max(capacity - totalEnrollments, 0),
  };
};

const normalizeSession = (session = {}, course) => ({
  id: session.id,
  topic: session.session_name || session.course_title || 'Session',
  date: formatDateDisplay(session.start_date),
  time: formatTimeDisplay(session.start_time),
  endTime: formatTimeDisplay(session.end_time),
  mode: course?.channel || session.channel || 'Session',
  availableSpots: session.available_spots ?? null,
  branchName: session.branch_name || course?.branchName || '',
  instructorName: session.instructor_name || course?.instructorName || '',
});

export const fetchCourses = async ({ limit = 50 } = {}) => {
  const { data } = await api.post('/courses/list', { limit, status: 'published' });
  return Array.isArray(data) ? data.map(normalizeCourse) : [];
};

export const fetchCourseDetail = async (id) => {
  const [courseRes, sessionsRes] = await Promise.all([
    api.post('/api/admin/courses/detail', { id }),
    api.post('/courses/sessions', { course_id: id, status: 'open', limit: 200 }),
  ]);

  const normalizedCourse = normalizeCourse(courseRes.data);
  const sessionItems = Array.isArray(sessionsRes.data)
    ? sessionsRes.data
    : Array.isArray(sessionsRes.data?.items)
      ? sessionsRes.data.items
      : [];

  const normalizedSessions = sessionItems.map((session) => normalizeSession(session, normalizedCourse));

  return { course: normalizedCourse, sessions: normalizedSessions };
};

export const fetchFeaturedCourses = async ({ limit = 6 } = {}) => {
  const courses = await fetchCourses({ limit });
  return courses.filter((course) => course.status === 'published');
};
