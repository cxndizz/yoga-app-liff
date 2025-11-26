import axios from 'axios';

const apiBase = import.meta.env.VITE_API_BASE_URL;

if (!apiBase) {
  throw new Error('VITE_API_BASE_URL is required for LIFF web requests');
}

const api = axios.create({
  baseURL: apiBase,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

export const createOrder = async ({ userId, courseId }) => {
  const { data } = await api.post('/orders', { user_id: userId, course_id: courseId });
  return data;
};

export const fetchOrdersForUser = async (userId) => {
  const { data } = await api.post('/users/orders', { user_id: userId });
  return Array.isArray(data) ? data : [];
};

export const startMoneySpacePayment = async (payload) => {
  const { data } = await api.post('/payments/moneyspace/create', payload);
  return data;
};

export default {
  createOrder,
  fetchOrdersForUser,
  startMoneySpacePayment,
};
