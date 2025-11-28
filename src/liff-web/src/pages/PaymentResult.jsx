import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { checkMoneySpaceStatus } from '../lib/orderApi';

const labelStyles = {
  success: {
    emoji: '✅',
    color: '#6ee7b7',
    bg: 'rgba(16, 185, 129, 0.15)',
    border: 'rgba(16, 185, 129, 0.4)',
  },
  fail: {
    emoji: '❌',
    color: '#fca5a5',
    bg: 'rgba(239, 68, 68, 0.1)',
    border: 'rgba(239, 68, 68, 0.3)',
  },
  cancel: {
    emoji: '⚠️',
    color: '#fcd34d',
    bg: 'rgba(245, 158, 11, 0.1)',
    border: 'rgba(245, 158, 11, 0.3)',
  },
};

const formatAmount = (value, locale = 'th-TH') => {
  if (value === null || value === undefined) return null;

  const numeric = typeof value === 'string' ? Number(value.replace(/,/g, '')) : Number(value);
  if (Number.isNaN(numeric)) return value;

  return numeric.toLocaleString(locale, {
    style: 'currency',
    currency: 'THB',
    minimumFractionDigits: 2,
  });
};

const formatDateTime = (value, locale = 'th-TH') => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat(locale, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
};

function PaymentResult() {
  const { state } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const query = useMemo(() => new URLSearchParams(location.search), [location.search]);

  const [verificationStatus, setVerificationStatus] = useState('idle');
  const [verifiedData, setVerifiedData] = useState(null);
  const [actualStatus, setActualStatus] = useState(state);

  const summary = useMemo(
    () => ({
      locale: query.get('locale'),
      store: query.get('store_name'),
      customer: query.get('name_customer'),
      amount: query.get('amount'),
      datetime: query.get('datetime') || `${query.get('date') || ''} ${query.get('time') || ''}`.trim(),
      transaction: query.get('idpay') || query.get('transactionId'),
      orderId: query.get('orderId') || query.get('order_id'),
      description: query.get('description'),
      agreement: query.get('agreement'),
    }),
    [query]
  );

  useEffect(() => {
    if (state !== 'success' || !summary.transaction) {
      setVerificationStatus('skipped');
      return;
    }

    let cancelled = false;
    setVerificationStatus('verifying');

    const verifyTransaction = async () => {
      try {
        const result = await checkMoneySpaceStatus({
          transactionId: summary.transaction,
          orderId: summary.orderId ? parseInt(summary.orderId, 10) : undefined,
        });

        if (cancelled) return;

        setVerifiedData(result);

        const mappedStatus = result?.mappedStatus || result?.order?.status || 'pending';
        if (['completed', 'success', 'paysuccess'].includes(mappedStatus.toLowerCase())) {
          setActualStatus('success');
          setVerificationStatus('verified');
        } else if (['failed', 'fail'].includes(mappedStatus.toLowerCase())) {
          setActualStatus('fail');
          setVerificationStatus('verified');
        } else if (['cancelled', 'cancel'].includes(mappedStatus.toLowerCase())) {
          setActualStatus('cancel');
          setVerificationStatus('verified');
        } else {
          setActualStatus('fail');
          setVerificationStatus('verified');
        }
      } catch (err) {
        if (cancelled) return;
        console.error('Error verifying payment status', err);
        setVerificationStatus('error');
        setActualStatus('fail');
      }
    };

    verifyTransaction();

    return () => {
      cancelled = true;
    };
  }, [state, summary.transaction, summary.orderId]);

  const statusKey = ['success', 'fail', 'cancel'].includes(actualStatus) ? actualStatus : 'fail';
  const style = labelStyles[statusKey];

  const friendlySummary = useMemo(() => {
    const locale = summary.locale || 'th-TH';
    const verifiedSummary = verifiedData?.summary || {};

    const courseTitle = summary.description || verifiedSummary.courseTitle || t('payment.storePlaceholder');
    const customerName = summary.customer || verifiedSummary.customerName;
    const amount = formatAmount(verifiedSummary.amount ?? summary.amount, locale);
    const paidAt =
      formatDateTime(summary.datetime, locale) ||
      formatDateTime(verifiedSummary.updatedAt || verifiedSummary.createdAt, locale);
    const reference = summary.orderId || verifiedSummary.orderId || summary.transaction;

    return {
      locale,
      courseTitle,
      customerName,
      amount,
      paidAt,
      reference,
    };
  }, [summary, verifiedData, t]);

  const nextSteps = useMemo(() => {
    const steps = t('payment.nextSteps', { returnObjects: true });
    return Array.isArray(steps) ? steps : [];
  }, [t]);

  return (
    <div className="card-surface" style={{ padding: 24, borderRadius: 20, display: 'grid', gap: 16 }}>
      {verificationStatus === 'verifying' && (
        <div
          className="status-banner"
          style={{
            background: 'linear-gradient(135deg, rgba(91, 33, 182, 0.2), rgba(196, 181, 253, 0.1))',
            borderColor: 'rgba(196, 181, 253, 0.3)',
            color: 'var(--secondary-100)',
            textAlign: 'center',
          }}
        >
          <span style={{ marginRight: 8 }}>⏳</span>
          {t('payment.verifying') || 'กำลังตรวจสอบสถานะการชำระเงิน...'}
        </div>
      )}

      {verificationStatus === 'error' && (
        <div
          className="status-banner status-banner--error"
          style={{
            background: 'rgba(239, 68, 68, 0.15)',
            borderColor: 'rgba(239, 68, 68, 0.4)',
            color: '#fca5a5',
            textAlign: 'center',
          }}
        >
          <span style={{ marginRight: 8 }}>⚠️</span>
          {t('payment.verificationError') || 'ไม่สามารถตรวจสอบสถานะการชำระเงินได้ กรุณาติดต่อเจ้าหน้าที่'}
        </div>
      )}

      {verificationStatus === 'verified' && (
        <div
          className="status-banner"
          style={{
            background: 'rgba(16, 185, 129, 0.15)',
            borderColor: 'rgba(16, 185, 129, 0.4)',
            color: '#6ee7b7',
            textAlign: 'center',
          }}
        >
          <span style={{ marginRight: 8 }}>✓</span>
          {t('payment.verified') || 'ตรวจสอบสถานะการชำระเงินเรียบร้อยแล้ว'}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'grid', gap: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              className="badge"
              style={{
                background: style.bg,
                borderColor: style.border,
                color: style.color,
                fontWeight: 700,
              }}
            >
              {style.emoji} {t(`payment.status.${statusKey}`)}
            </div>
            <div className="helper-text">{t(`payment.message.${statusKey}`)}</div>
          </div>
          <div style={{ color: '#fff', fontSize: 20, fontWeight: 800 }}>{t('payment.headline')}</div>
          <div className="helper-text" style={{ color: '#cbd5e1' }}>
            {t('payment.subheadline')}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button type="button" className="btn btn-outline" onClick={() => navigate('/courses')}>
            {t('common.viewAll')}
          </button>
          <button type="button" className="btn btn-primary" onClick={() => navigate('/my-courses')}>
            {t('checkout.viewMyCourses')}
          </button>
        </div>
      </div>

      <div className="helper-text" style={{ color: style.color }}>
        {t('payment.redirectReminder')}
      </div>

      <div className="summary-card" style={{ alignItems: 'stretch', gap: 18 }}>
        <div style={{ display: 'grid', gap: 12, flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <div>
              <div style={{ fontWeight: 800, color: '#fff' }}>{summary.store || t('payment.storePlaceholder')}</div>
              <div className="helper-text">{friendlySummary.courseTitle}</div>
            </div>
            {friendlySummary.amount && (
              <div className="pill" style={{ background: style.bg, borderColor: style.border, color: style.color }}>
                💳 {t('payment.summary.amountPaid', { amount: friendlySummary.amount })}
              </div>
            )}
          </div>

          <div className="helper-text" style={{ color: '#cbd5e1' }}>
            {t('payment.summarySubtitle')}
          </div>

          <div className="summary-line">
            <span>{t('payment.summary.course')}</span>
            <span>{friendlySummary.courseTitle}</span>
          </div>
          {friendlySummary.customerName && (
            <div className="summary-line">
              <span>{t('payment.summary.participant')}</span>
              <span>{friendlySummary.customerName}</span>
            </div>
          )}
          {friendlySummary.paidAt && (
            <div className="summary-line">
              <span>{t('payment.summary.paidAt')}</span>
              <span>{friendlySummary.paidAt}</span>
            </div>
          )}
          {friendlySummary.reference && (
            <div className="summary-line">
              <span>{t('payment.summary.reference')}</span>
              <span>{friendlySummary.reference}</span>
            </div>
          )}
        </div>
      </div>

      {nextSteps.length > 0 && (
        <div className="summary-card" style={{ gap: 12 }}>
          <div style={{ fontWeight: 700, color: '#fff' }}>{t('payment.nextStepsTitle')}</div>
          <ul style={{ margin: 0, paddingLeft: 18, color: '#e2e8f0', display: 'grid', gap: 6 }}>
            {nextSteps.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="helper-text" style={{ textAlign: 'center' }}>
        <Link to="/my-courses" className="btn btn-outline" style={{ marginRight: 8 }}>
          {t('payment.goToMyCourses')}
        </Link>
        <Link to="/courses" className="btn btn-outline">
          {t('payment.browseMore')}
        </Link>
      </div>
    </div>
  );
}

export default PaymentResult;
