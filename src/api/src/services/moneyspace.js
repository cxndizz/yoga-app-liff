const crypto = require('crypto');
const https = require('https');
const { URL } = require('url');
const db = require('../db');
const { ensureEnrollmentForOrder } = require('./enrollmentService');

const MONEYSPACE_SECRET_ID = process.env.MONEYSPACE_SECRET_ID || process.env.MONEYSPACE_SECRETID;
const MONEYSPACE_SECRET_KEY = process.env.MONEYSPACE_SECRET_KEY || process.env.MONEYSPACE_SECRETKEY;
const MONEYSPACE_BASE = process.env.MONEYSPACE_API_BASE || 'https://a.moneyspace.net';
const MONEYSPACE_STORE_BASE = process.env.MONEYSPACE_STORE_BASE || 'https://www.moneyspace.net';
const PUBLIC_BASE = process.env.MONEYSPACE_DOMAIN || process.env.PUBLIC_BASE_URL || 'https://fortestonlyme.online';
const MONEYSPACE_CREATE_PATH = process.env.MONEYSPACE_CREATE_PATH || '/payment/CreateTransaction';
const MONEYSPACE_CHECK_PATH = process.env.MONEYSPACE_CHECK_PATH || '/CheckPayment';
const MONEYSPACE_CANCEL_PATH = process.env.MONEYSPACE_CANCEL_PATH || '/merchantapi/cancelpayment';

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
const CREATE_TRANSACTION_URL = `${MONEYSPACE_BASE.replace(/\/$/, '')}${MONEYSPACE_CREATE_PATH}`;
const CHECK_TRANSACTION_URL = `${MONEYSPACE_BASE.replace(/\/$/, '')}${MONEYSPACE_CHECK_PATH}`;
const CANCEL_TRANSACTION_URL = `${MONEYSPACE_BASE.replace(/\/$/, '')}${MONEYSPACE_CANCEL_PATH}`;
const STORE_INFO_URL = `${MONEYSPACE_STORE_BASE.replace(/\/$/, '')}/merchantapi/v1/store/obj`;

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

const extractQrImage = (payload = {}) => {
  const source = Array.isArray(payload) ? payload[0] || {} : payload;
  const directImage =
    source.qr_image ||
    source.qrImage ||
    source.qr_base64 ||
    source.qrBase64 ||
    source.promptpay_qr ||
    source.promptpayQR ||
    source.promptPayQR ||
    source.qr_img ||
    source.qrcode ||
    source.qrCode ||
    source.qr;

  if (typeof directImage === 'string' && directImage.trim()) {
    return directImage;
  }

  const nested = findNestedUrl(payload);
  if (nested && nested.startsWith('data:image')) {
    return nested;
  }

  return null;
};

const extractEmbedHtml = (payload = {}) => {
  const source = Array.isArray(payload) ? payload[0] || {} : payload;
  return source.iframe || source.embed_html || source.embedHtml || null;
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

  const response = await safeFetch(CREATE_TRANSACTION_URL, {
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

  const logRequestBody = { ...body, secret_key: '[REDACTED]' };
  const payloadArray = Array.isArray(payload) ? payload : [payload];
  const primaryPayload = payloadArray.find(Boolean) || {};
  const statusValue = String(primaryPayload.status || '').toLowerCase();

  if (!response.ok) {
    console.error('Money Space API error:', {
      status: response.status,
      payload,
      rawText,
      requestBody: logRequestBody,
    });
    const message =
      primaryPayload?.message ||
      primaryPayload?.error ||
      primaryPayload?.msg ||
      primaryPayload?.description ||
      `Money Space API returned ${response.status}`;
    throw new Error(message);
  }

  const hasErrorStatus = statusValue && !['success', 'ok', 'paysuccess'].includes(statusValue);
  if (hasErrorStatus) {
    const description =
      primaryPayload.description ||
      primaryPayload.message ||
      primaryPayload.msg ||
      primaryPayload.error ||
      primaryPayload.status ||
      'Money Space returned an error status';

    console.error('Money Space API error status:', {
      status: response.status,
      payload,
      rawText,
      requestBody: logRequestBody,
    });
    throw new Error(description);
  }

  const transactionId = extractTransactionId(payload);
  let redirectUrl = extractRedirectUrl(payload);
  const qrImage = extractQrImage(payload);
  const embedHtml = extractEmbedHtml(payload);

  if (!redirectUrl && transactionId) {
    redirectUrl = `${MONEYSPACE_BASE}/payment/${transactionId}`;
  }

  const result = {
    raw: payload,
    transactionId,
    redirectUrl,
    paymentType: body.payment_type,
    qrImage,
    embedHtml,
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

const normalizeStatus = (value) => statusMap[value] || String(value || 'pending').toLowerCase() || 'pending';

const resolveOrderIdForTransaction = async ({ transactionId, providedOrderId, payload }) => {
  if (providedOrderId) return providedOrderId;

  const guessFromPayload =
    payload?.order_id ||
    payload?.orderid ||
    payload?.orderId ||
    payload?.ref1 ||
    payload?.reference1 ||
    payload?.ref ||
    null;

  const numericGuess = guessFromPayload ? Number(String(guessFromPayload).replace(/[^0-9]/g, '')) : null;
  if (numericGuess && !Number.isNaN(numericGuess)) return numericGuess;

  if (transactionId) {
    const lookup = await db.query(
      `SELECT order_id
       FROM payments
       WHERE omise_charge_id = $1
       ORDER BY updated_at DESC
       LIMIT 1`,
      [transactionId]
    );

    if (lookup.rows[0]?.order_id) {
      return lookup.rows[0].order_id;
    }
  }

  return null;
};

const updateOrderAndPayment = async ({ orderId, mappedStatus, transactionId, payload }) => {
  if (!orderId) return null;

  let orderUpdate = null;

  try {
    const updateOrder = await db.query(
      `UPDATE orders
       SET status = $1,
           updated_at = NOW()
       WHERE id = $2
       RETURNING id, status`,
      [mappedStatus, orderId]
    );

    orderUpdate = updateOrder.rows[0] || null;

    await recordPaymentStatus({
      orderId,
      status: mappedStatus,
      transactionId,
      payload,
    });

    if (mappedStatus === 'completed') {
      try {
        await ensureEnrollmentForOrder(orderId);
      } catch (err) {
        console.error('Money Space enrollment error:', err);
      }
    }
  } catch (err) {
    console.error('Money Space order update error:', err);
  }

  return orderUpdate;
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
        orderUpdate = await updateOrderAndPayment({
          orderId: numericOrderId,
          mappedStatus,
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

const checkTransactionStatus = async ({ transactionId, orderId }) => {
  ensureSecrets();

  if (!transactionId) {
    throw new Error('transaction_id is required');
  }

  const response = await safeFetch(CHECK_TRANSACTION_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      secret_id: MONEYSPACE_SECRET_ID,
      secret_key: MONEYSPACE_SECRET_KEY,
      transaction_ID: transactionId,
    }),
  });

  const payload = (await response.json().catch(() => ({}))) || {};
  const primaryPayload = Array.isArray(payload) ? payload[0] || {} : payload;
  const statusValue =
    primaryPayload.status ||
    primaryPayload.transaction_status ||
    primaryPayload.payment_status ||
    primaryPayload.result ||
    primaryPayload.state ||
    'pending';

  const mappedStatus = normalizeStatus(statusValue);
  const resolvedOrderId = await resolveOrderIdForTransaction({
    transactionId,
    providedOrderId: orderId,
    payload: primaryPayload,
  });

  const orderUpdate = await updateOrderAndPayment({
    orderId: resolvedOrderId,
    mappedStatus,
    transactionId,
    payload,
  });

  return {
    ok: response.ok,
    status: response.status,
    mappedStatus,
    orderId: resolvedOrderId,
    order: orderUpdate,
    payload,
  };
};

const cancelTransaction = async ({ transactionId, orderId }) => {
  ensureSecrets();

  if (!transactionId) {
    throw new Error('transaction_id is required');
  }

  const response = await safeFetch(CANCEL_TRANSACTION_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      secret_id: MONEYSPACE_SECRET_ID,
      secret_key: MONEYSPACE_SECRET_KEY,
      transaction_ID: transactionId,
    }),
  });

  const payload = (await response.json().catch(() => ({}))) || {};
  const mappedStatus = normalizeStatus(payload.status || 'cancel');
  const resolvedOrderId = await resolveOrderIdForTransaction({
    transactionId,
    providedOrderId: orderId,
    payload,
  });

  const orderUpdate = await updateOrderAndPayment({
    orderId: resolvedOrderId,
    mappedStatus,
    transactionId,
    payload,
  });

  return {
    ok: response.ok,
    status: response.status,
    mappedStatus,
    orderId: resolvedOrderId,
    order: orderUpdate,
    payload,
  };
};

const formatTimeHash = () => {
  const now = new Date();
  const pad = (value) => String(value).padStart(2, '0');
  return `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}${pad(now.getHours())}${pad(
    now.getMinutes()
  )}${pad(now.getSeconds())}`;
};

const fetchStoreInfo = async () => {
  ensureSecrets();

  const timeHash = formatTimeHash();
  const hashPayload = `${timeHash}${MONEYSPACE_SECRET_ID}${MONEYSPACE_SECRET_KEY}`;
  const hash = crypto.createHash('sha256').update(hashPayload).digest('hex');

  const url = `${STORE_INFO_URL}?timeHash=${timeHash}&secreteID=${MONEYSPACE_SECRET_ID}&hash=${hash}`;

  const response = await safeFetch(url, { method: 'GET' });
  const payload = (await response.json().catch(() => ({}))) || {};

  return {
    ok: response.ok,
    status: response.status,
    payload,
  };
};

module.exports = {
  createTransaction,
  recordPaymentStatus,
  handleWebhook,
  normalizePaymentType,
  checkTransactionStatus,
  cancelTransaction,
  fetchStoreInfo,
};
