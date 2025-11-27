const normalizeStatus = (value) => String(value ?? '').trim().toLowerCase();

const paidStatusSet = new Set([
  'completed',
  'paid',
  'success',
  'paysuccess',
  'succeeded',
  'successed',
  'authorized',
  'authorised',
  'ok',
]);

const cancelledStatusSet = new Set(['cancelled', 'canceled', 'failed']);

const isPaidStatus = (value, isFree = false) => {
  if (isFree) return true;
  const normalized = normalizeStatus(value);
  return paidStatusSet.has(normalized);
};

const isCancelledStatus = (value) => cancelledStatusSet.has(normalizeStatus(value));

const isEnrollmentExpired = (order = {}) => {
  const expiresAt = order?.enrollment_expires_at || order?.expires_at;
  if (!expiresAt) return false;
  return new Date(expiresAt).getTime() <= Date.now();
};

const hasActiveEnrollment = (order = {}) => {
  const status = normalizeStatus(order?.enrollment_status);
  const remaining = order?.remaining_access;
  const hasRemaining = remaining === null || Number(remaining) > 0;
  if (isEnrollmentExpired(order)) return false;
  return order?.enrollment_id && !['cancelled', 'expired'].includes(status) && hasRemaining;
};

const derivePaymentStatus = (order = {}) =>
  normalizeStatus(order?.resolved_payment_status || order?.payment_status || order?.status);

const isOrderOwned = (order = {}, courseId) => {
  const courseMatches = courseId
    ? String(order?.course_id ?? '') === String(courseId ?? '')
    : Boolean(order?.course_id);

  if (!courseMatches) return false;

  const normalizedStatus = normalizeStatus(order?.status);
  const normalizedPayment = derivePaymentStatus(order);
  const priceCents = Number(order?.total_price_cents ?? order?.price_cents ?? 0);
  const isFree = order?.is_free || priceCents === 0;

  if (isCancelledStatus(normalizedStatus) || isCancelledStatus(normalizedPayment)) return false;

  return (
    isPaidStatus(normalizedPayment, isFree) ||
    isPaidStatus(normalizedStatus, isFree) ||
    order?.enrollment_active ||
    hasActiveEnrollment(order)
  );
};

const collectOwnedCourseIds = (orders = []) => {
  const set = new Set();
  orders.forEach((order) => {
    const owned = order?.is_owned ?? isOrderOwned(order);
    if (owned && order?.course_id !== undefined && order?.course_id !== null) {
      set.add(String(order.course_id));
    }
  });
  return set;
};

export {
  normalizeStatus,
  isPaidStatus,
  isCancelledStatus,
  hasActiveEnrollment,
  isEnrollmentExpired,
  derivePaymentStatus,
  isOrderOwned,
  collectOwnedCourseIds,
};
