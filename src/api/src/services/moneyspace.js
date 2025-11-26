const crypto = require('crypto');
const https = require('https');
const { URL } = require('url');
const db = require('../db');

const MONEYSPACE_SECRET_ID = process.env.MONEYSPACE_SECRET_ID || process.env.MONEYSPACE_SECRETID;
const MONEYSPACE_SECRET_KEY = process.env.MONEYSPACE_SECRET_KEY || process.env.MONEYSPACE_SECRETKEY;
const MONEYSPACE_BASE = process.env.MONEYSPACE_API_BASE || 'https://a.moneyspace.net';
const PUBLIC_BASE = process.env.MONEYSPACE_DOMAIN || process.env.PUBLIC_BASE_URL || 'https://fortestonlyme.online';

const safeFetch = (url, { method = 'GET', headers = {}, body } = {}) => {
  if (typeof globalThis.fetch === 'function') {
    return globalThis.fetch(url, { method, headers, body });
  }

  const parsedUrl = new URL(url);
  const payload = typeof body === 'string' ? body : body ? JSON.stringify(body) : undefined;

  return new Promise((resolve, reject) => {
    const request = https.request(
      {
        method,
        hostname: parsedUrl.hostname,
        path: `${parsedUrl.pathname}${parsedUrl.search}`,
        port: parsedUrl.port || 443,
        headers: {
          ...headers,
          ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {}),
        },
      },
      (res) => {
        let raw = '';
        res.on('data', (chunk) => {
          raw += chunk;
        });
        res.on('end', () => {
          resolve({
            ok: res.statusCode >= 200 && res.statusCode < 300,
            status: res.statusCode,
            headers: res.headers,
            json: async () => JSON.parse(raw || '{}'),
            text: async () => raw,
          });
        });
      }
    );

    request.on('error', reject);
    if (payload) request.write(payload);
    request.end();
  });
};

const defaultReturnUrl = (path) => `${PUBLIC_BASE}${path}`;
const SUCCESS_URL = process.env.MONEYSPACE_SUCCESS_URL || defaultReturnUrl('/payments/moneyspace/success');
const FAIL_URL = process.env.MONEYSPACE_FAIL_URL || defaultReturnUrl('/payments/moneyspace/fail');
const CANCEL_URL = process.env.MONEYSPACE_CANCEL_URL || defaultReturnUrl('/payments/moneyspace/cancel');
const AGREEMENT = process.env.MONEYSPACE_AGREEMENT || '4';

const normalizePaymentType = (paymentMethod = 'card') => {
  const map = {
    card: 'card',
    credit: 'card',
    debit: 'card',
    qrcode: 'qrnone',
    qr: 'qrnone',
    qrnone: 'qrnone',
  };
  return map[paymentMethod] || 'card';
};

const ensureSecrets = () => {
  if (!MONEYSPACE_SECRET_ID || !MONEYSPACE_SECRET_KEY) {
    throw new Error('Money Space secrets are not configured');
  }
};

const findNestedUrl = (value, depth = 0) => {
  if (!value || depth > 3) return null;

  if (typeof value === 'string' && value.startsWith('http')) {
    return value;
  }

  if (Array.isArray(value)) {
    for (const entry of value) {
      const found = findNestedUrl(entry, depth + 1);
      if (found) return found;
    }
  }

  if (typeof value === 'object') {
    for (const key of Object.keys(value)) {
      const found = findNestedUrl(value[key], depth + 1);
      if (found) return found;
    }
  }

  return null;
};

const extractRedirectUrl = (payload = {}) => {
  if (typeof payload === 'string' && payload.startsWith('http')) return payload;

  const directUrl =
    payload.url_qr ||
    payload.qr_url ||
    payload.checkout_url ||
    payload.payment_url ||
    payload.paymenturl ||
    payload.link_payment ||
    payload.redirect_url ||
    payload.redirectUrl ||
    payload.url ||
    payload.iframe ||
    null;

  if (directUrl) return directUrl;

  return findNestedUrl(payload);
};

const extractTransactionId = (payload = {}) => {
  const source = Array.isArray(payload) ? payload[0] || {} : payload;
  return (
    source.transection_ID ||
    source.transectionID ||
    source.transaction_ID ||
    source.transactionId ||
    source.txn_id ||
    null
  );
};

const createTransaction = async ({
  orderCode,
  amount,
  customer = {},
  description,
  paymentMethod = 'card',
  returnUrls = {},
  branch,
  references = {},
}) => {
  ensureSecrets();

  const body = {
    secret_id: MONEYSPACE_SECRET_ID,
    secret_key: MONEYSPACE_SECRET_KEY,
    order_id: orderCode,
    firstname: customer.firstName || customer.fullName || 'Customer',
    lastname: customer.lastName || '',
    email: customer.email || 'customer@fortestonlyme.online',
    phone: customer.phone || '0000000000',
    amount: Number(amount || 0),
    description: description || 'Yoga course booking',
    address: customer.address || 'Thailand',
    message: customer.message || '',
    feeType: 'include',
    payment_type: normalizePaymentType(paymentMethod),
    success_Url: returnUrls.success || SUCCESS_URL,
    fail_Url: returnUrls.fail || FAIL_URL,
    cancel_Url: returnUrls.cancel || CANCEL_URL,
    agreement: AGREEMENT,
    branch: branch || 'Yoga Studio',
    device_id: 'LIFF',
    ref1: references.ref1 || '',
    ref2: references.ref2 || '',
    ref3: references.ref3 || '',
    ref4: references.ref4 || '',
    ref5: references.ref5 || '',
  };

  const response = await safeFetch(`${MONEYSPACE_BASE}/CreateTransactionID`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  let payload = {};
  let rawText = '';
  try {
    rawText = await response.text();
    payload = JSON.parse(rawText);
  } catch (err) {
    payload = {};
  }

  if (!response.ok) {
    console.error('Money Space API error:', {
      status: response.status,
      payload,
      rawText,
      requestBody: { ...body, secret_key: '[REDACTED]' }
    });
    const message = payload?.message || payload?.error || payload?.msg || `Money Space API returned ${response.status}`;
    throw new Error(message);
  }

  const transactionId = extractTransactionId(payload);
  let redirectUrl = extractRedirectUrl(payload);

  if (!redirectUrl && transactionId) {
    redirectUrl = `${MONEYSPACE_BASE}/payment/${transactionId}`;
  }

  const result = {
    raw: payload,
    transactionId,
    redirectUrl,
    paymentType: body.payment_type,
  };

  console.log('Money Space transaction created successfully:', {
    orderId: orderCode,
    transactionId: result.transactionId,
    paymentType: result.paymentType,
    hasRedirectUrl: !!result.redirectUrl
  });

  return result;
};

const computeSignature = ({ transectionID, amount, status, orderid }) => {
  const payload = `${transectionID}${amount}${status}${orderid}`;
  return crypto.createHmac('sha256', MONEYSPACE_SECRET_KEY).update(payload).digest('hex');
};

const statusMap = {
  OK: 'pending',
  paysuccess: 'completed',
  success: 'completed',
  fail: 'failed',
  cancel: 'cancelled',
};

const recordPaymentStatus = async ({ orderId, status, transactionId, payload }) => {
  const normalizedStatus = statusMap[status] || status || 'pending';
  const rawPayload = payload ? JSON.stringify(payload) : null;

  const updateResult = await db.query(
    `UPDATE payments
     SET status = $1,
         omise_charge_id = COALESCE($2, omise_charge_id),
         raw_payload = $3,
         updated_at = NOW()
     WHERE order_id = $4
     RETURNING id`,
    [normalizedStatus, transactionId || null, rawPayload, orderId]
  );

  if (updateResult.rowCount === 0) {
    await db.query(
      `INSERT INTO payments (order_id, status, omise_charge_id, raw_payload)
       VALUES ($1, $2, $3, $4)`,
      [orderId, normalizedStatus, transactionId || null, rawPayload]
    );
  }
};

const handleWebhook = async (body = {}) => {
  ensureSecrets();
  const { transectionID, amount, status, orderid, hash } = body;

  if (!transectionID || !amount || !status || !orderid || !hash) {
    return { signatureValid: false, reason: 'missing_fields' };
  }

  const expected = computeSignature({ transectionID, amount, status, orderid });
  const signatureValid = expected.toLowerCase() === String(hash || '').toLowerCase();
  const mappedStatus = statusMap[status] || 'pending';
  let orderUpdate;

  if (signatureValid) {
    const numericOrderId = Number(orderid);
    if (!Number.isNaN(numericOrderId)) {
      try {
        const updateOrder = await db.query(
          `UPDATE orders
           SET status = $1,
               updated_at = NOW()
           WHERE id = $2
           RETURNING id, status`,
          [mappedStatus, numericOrderId]
        );
        orderUpdate = updateOrder.rows[0];

        await recordPaymentStatus({
          orderId: numericOrderId,
          status: mappedStatus,
          transactionId: transectionID,
          payload: body,
        });
      } catch (err) {
        console.error('Money Space webhook DB error:', err);
      }
    }
  }

  return { signatureValid, mappedStatus, orderUpdate };
};

module.exports = {
  createTransaction,
  recordPaymentStatus,
  handleWebhook,
  normalizePaymentType,
};
