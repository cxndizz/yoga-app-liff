import axios from 'axios';

const apiBase = import.meta.env.VITE_API_BASE_URL;

if (!apiBase) {
  throw new Error('VITE_API_BASE_URL is required for LIFF web requests');
}

const api = axios.create({
  baseURL: apiBase,
  headers: { 'Content-Type': 'application/json' },
  timeout: 12000,
});

export const submitCheckin = async ({ userId, code, courseId, enrollmentId }) => {
  if (!userId || !code) {
    throw new Error('userId and code are required');
  }
  const payload = {
    user_id: userId,
    code,
    course_id: courseId,
    enrollment_id: enrollmentId,
  };
  const { data } = await api.post('/courses/checkin', payload);
  return data;
};

export const fetchCheckinEnrollments = async (userId) => {
  if (!userId) return [];
  const { data } = await api.post('/users/checkin/enrollments', { user_id: userId });
  return Array.isArray(data) ? data : [];
};
