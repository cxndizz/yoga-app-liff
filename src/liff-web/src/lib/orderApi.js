import axios from 'axios';
import { isOrderOwned } from './orderUtils';
import { withRetry } from './apiRetry';

const apiBase = import.meta.env.VITE_API_BASE_URL;

if (!apiBase) {
  throw new Error('VITE_API_BASE_URL is required for LIFF web requests');
}

const api = axios.create({
  baseURL: apiBase,
  headers: { 'Content-Type': 'application/json' },
  timeout: 8000,
});

export const createOrder = async ({ userId, courseId }) => {
  const { data } = await api.post('/orders', { user_id: userId, course_id: courseId });
  return data;
};

// Wrap fetchOrdersForUser with retry logic
const fetchOrdersForUserRaw = async (userId) => {
  const { data } = await api.post('/users/orders', { user_id: userId });
  const list = Array.isArray(data) ? data : [];
  return list.map((order) => ({ ...order, is_owned: order?.is_owned ?? isOrderOwned(order) }));
};

export const fetchOrdersForUser = withRetry(fetchOrdersForUserRaw, {
  maxRetries: 2,
  initialDelay: 400,
  maxDelay: 2000,
});

export const startMoneySpacePayment = async (payload) => {
  const { data } = await api.post('/payments/moneyspace/create', payload);
  return data;
};

export const fetchOrderStatus = async ({ orderId, userId }) => {
  const { data } = await api.post('/orders/status', { order_id: orderId, user_id: userId });
  return data;
};

export const checkMoneySpaceStatus = async ({ transactionId, orderId }) => {
  const { data } = await api.post('/payments/moneyspace/status', {
    transaction_id: transactionId,
    order_id: orderId,
  });
  return data;
};

export const checkMoneySpaceOrderStatus = async ({ orderId }) => {
  const { data } = await api.post('/payments/moneyspace/order-status', { order_id: orderId });
  return data;
};

export default {
  createOrder,
  fetchOrdersForUser,
  fetchOrderStatus,
  startMoneySpacePayment,
  checkMoneySpaceStatus,
  checkMoneySpaceOrderStatus,
};
