const db = require('../db');
const eventBus = require('../events/eventBus');
const moneyspace = require('./moneyspace');

const DEFAULT_TIMEOUT_MINUTES = parseInt(process.env.ORDER_PENDING_TIMEOUT_MINUTES || '10', 10);
const DEFAULT_SWEEP_INTERVAL_MS = parseInt(process.env.ORDER_PENDING_SWEEP_INTERVAL_MS || '60000', 10);

const parseInterval = (value, fallback) => {
  const parsed = parseInt(value, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
};

const cancelOrderRecord = async ({ orderId, transactionId }) => {
  const update = await db.query(
    `UPDATE orders
     SET status = 'cancelled',
         updated_at = NOW()
     WHERE id = $1 AND status = 'pending'
     RETURNING *`,
    [orderId]
  );

  const order = update.rows[0];
  if (!order) return null;

  await moneyspace.recordPaymentStatus({
    orderId,
    status: 'cancelled',
    transactionId,
    payload: { reason: 'expired_pending_timeout' },
  });

  eventBus.emitOrderEvent('cancelled', order);
  eventBus.emitPaymentEvent('cancelled', {
    order_id: order.id,
    user_id: order.user_id,
    transaction_id: transactionId,
    status: 'cancelled',
  });

  return order;
};

const sweepExpiredOrders = async ({
  timeoutMinutes = DEFAULT_TIMEOUT_MINUTES,
} = {}) => {
  const minutes = parseInterval(timeoutMinutes, DEFAULT_TIMEOUT_MINUTES);

  const result = await db.query(
    `SELECT o.id, o.user_id, o.course_id, p.omise_charge_id AS transaction_id
     FROM orders o
     LEFT JOIN payments p ON p.order_id = o.id
     WHERE o.status = 'pending'
       AND o.created_at < NOW() - ($1 * INTERVAL '1 minute')`,
    [minutes]
  );

  const cancelled = [];
  for (const order of result.rows) {
    try {
      const cancelledOrder = await cancelOrderRecord({
        orderId: order.id,
        transactionId: order.transaction_id,
      });
      if (cancelledOrder) cancelled.push(cancelledOrder);
    } catch (err) {
      console.error('Error cancelling expired order', { orderId: order.id, error: err.message });
    }
  }

  return cancelled;
};

const startOrderExpiryWatcher = ({
  intervalMs = DEFAULT_SWEEP_INTERVAL_MS,
  timeoutMinutes = DEFAULT_TIMEOUT_MINUTES,
  logger = console,
} = {}) => {
  const interval = parseInterval(intervalMs, DEFAULT_SWEEP_INTERVAL_MS);
  const timeout = parseInterval(timeoutMinutes, DEFAULT_TIMEOUT_MINUTES);

  logger.log(
    `[OrderScheduler] Starting expiry watcher: timeout ${timeout} minutes, interval ${interval}ms`
  );

  const timer = setInterval(() => {
    sweepExpiredOrders({ timeoutMinutes: timeout }).catch((err) => {
      logger.error('[OrderScheduler] Sweep error', err);
    });
  }, interval);

  return () => clearInterval(timer);
};

module.exports = {
  startOrderExpiryWatcher,
  sweepExpiredOrders,
};
