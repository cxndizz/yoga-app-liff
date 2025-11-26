import React, { useMemo } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

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

function PaymentResult() {
  const { state } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const query = useMemo(() => new URLSearchParams(location.search), [location.search]);

  const statusKey = ['success', 'fail', 'cancel'].includes(state) ? state : 'fail';
  const style = labelStyles[statusKey];

  const summary = useMemo(
    () => ({
      locale: query.get('locale'),
      store: query.get('store_name'),
      customer: query.get('name_customer'),
      amount: query.get('amount'),
      datetime: query.get('datetime') || `${query.get('date') || ''} ${query.get('time') || ''}`.trim(),
      transaction: query.get('idpay') || query.get('transactionId'),
      description: query.get('description'),
      agreement: query.get('agreement'),
    }),
    [query]
  );

  return (
    <div className="card-surface" style={{ padding: 24, borderRadius: 20, display: 'grid', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
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

      <div className="summary-card" style={{ alignItems: 'flex-start' }}>
        <div style={{ display: 'grid', gap: 6 }}>
          <div style={{ fontWeight: 800, color: '#fff' }}>{summary.store || t('payment.storePlaceholder')}</div>
          <div className="helper-text">{summary.description || t('payment.noDescription')}</div>
          {summary.amount && (
            <div className="pill" style={{ background: style.bg, borderColor: style.border, color: style.color }}>
              💳 {t('payment.amountLabel', { amount: summary.amount })}
            </div>
          )}
        </div>
        <div style={{ display: 'grid', gap: 6 }}>
          {summary.customer && (
            <div className="summary-line">
              <span>{t('payment.customer')}</span>
              <span>{summary.customer}</span>
            </div>
          )}
          {summary.transaction && (
            <div className="summary-line">
              <span>{t('payment.transaction')}</span>
              <span>{summary.transaction}</span>
            </div>
          )}
          {summary.agreement && (
            <div className="summary-line">
              <span>{t('payment.agreement')}</span>
              <span>{summary.agreement}</span>
            </div>
          )}
          {summary.datetime && (
            <div className="summary-line">
              <span>{t('payment.datetime')}</span>
              <span>{summary.datetime}</span>
            </div>
          )}
        </div>
      </div>

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
