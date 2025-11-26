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

export const submitCheckin = async ({ userId, code }) => {
  if (!userId || !code) {
    throw new Error('userId and code are required');
  }
  const { data } = await api.post('/courses/checkin', { user_id: userId, code });
  return data;
};
