import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { fetchCourseDetail } from '../lib/courseApi';
import { useAutoTranslate } from '../lib/autoTranslate';
import { placeholderImage } from '../lib/formatters';
import { createOrder, startMoneySpacePayment } from '../lib/orderApi';
import useLiffUser from '../hooks/useLiffUser';
import { getCachedLiffUser } from '../lib/liffAuth';

function Checkout() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { language, formatPrice, formatAccessTimes } = useAutoTranslate();
  const { t } = useTranslation();
  const { user: liveUser } = useLiffUser();

  const cached = getCachedLiffUser();
  const cachedUser = cached?.user || null;
  const cachedProfile = cached?.profile || {};

  const [course, setCourse] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [status, setStatus] = useState('idle');
  const [order, setOrder] = useState(null);
  const [user, setUser] = useState(cachedUser);
  const [paymentMethod, setPaymentMethod] = useState('qrnone');
  const [flowState, setFlowState] = useState('idle');
  const [paymentError, setPaymentError] = useState('');
  const [errors, setErrors] = useState({});
  const [form, setForm] = useState({
    firstName: cachedProfile.displayName?.split(' ')?.[0] || '',
    lastName: cachedProfile.displayName?.split(' ')?.slice(1).join(' ') || '',
    phone: cachedUser?.phone || '',
    email: cachedUser?.email || '',
    note: '',
  });

  useEffect(() => {
    if (liveUser) {
      setUser(liveUser);
      setForm((prev) => ({
        ...prev,
        phone: prev.phone || liveUser.phone || '',
        email: prev.email || liveUser.email || '',
        firstName: prev.firstName || liveUser.full_name?.split(' ')?.[0] || '',
        lastName: prev.lastName || liveUser.full_name?.split(' ')?.slice(1).join(' ') || '',
      }));
    }
  }, [liveUser]);

  useEffect(() => {
    let active = true;
    setStatus('loading');

    const copy = {
      branchFallback: t('branch.unspecified'),
      instructorFallback: t('instructor.unspecified'),
      courseLabel: t('course.course'),
      sessionTopicFallback: t('course.session'),
    };

    fetchCourseDetail(courseId, { language, copy })
      .then(({ course: coursePayload, sessions: sessionPayload }) => {
        if (!active) return;
        setCourse(coursePayload);
        setSessions(sessionPayload.slice(0, 3));
        setStatus(coursePayload ? 'ready' : 'error');
      })
      .catch(() => {
        if (!active) return;
        setStatus('error');
      });

    return () => {
      active = false;
    };
  }, [courseId, language, t]);

  const paymentOptions = useMemo(
    () => [
      {
        id: 'qrnone',
        label: t('payment.options.qr'),
        description: t('payment.options.qrDesc'),
        badge: t('payment.options.instant'),
      },
      {
        id: 'debit',
        label: t('payment.options.debit'),
        description: t('payment.options.debitDesc'),
        badge: t('payment.options.cardGateway'),
      },
      {
        id: 'card',
        label: t('payment.options.credit'),
        description: t('payment.options.creditDesc'),
        badge: t('payment.options.cardGateway'),
      },
    ],
    [t]
  );

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: '' }));
    setPaymentError('');
  };

  const validate = () => {
    const nextErrors = {};
    if (!form.firstName.trim()) nextErrors.firstName = t('checkout.required');
    if (!form.lastName.trim()) nextErrors.lastName = t('checkout.required');
    if (!form.phone.trim()) nextErrors.phone = t('checkout.required');
    if (!user?.id) nextErrors.user = t('checkout.loginRequired');
    return nextErrors;
  };

  const handlePay = async () => {
    const validation = validate();
    setErrors(validation);
    setPaymentError('');
    if (Object.keys(validation).length > 0) return;

    setFlowState('processing');

    try {
      const existingOrder = order || (await createOrder({ userId: user.id, courseId }));
      setOrder(existingOrder);

      const currentOrigin = window.location.origin;
      const { payment } = await startMoneySpacePayment({
        user_id: user.id,
        course_id: courseId,
        payment_method: paymentMethod,
        firstname: form.firstName,
        lastname: form.lastName,
        email: form.email,
        phone: form.phone,
        note: form.note,
        success_url: `${currentOrigin}/payments/moneyspace/success`,
        fail_url: `${currentOrigin}/payments/moneyspace/fail`,
        cancel_url: `${currentOrigin}/payments/moneyspace/cancel`,
      });

      if (payment?.redirectUrl) {
        window.location.href = payment.redirectUrl;
        return;
      }

      setFlowState('awaiting_redirect');
    } catch (err) {
      console.error('Money Space payment error', err);
      setFlowState('error');
      setPaymentError(err?.response?.data?.message || err?.message || t('checkout.errorPayment'));
    }
  };

  const priceLabel = useMemo(() => formatPrice(course?.priceCents, course?.isFree), [course, formatPrice]);
  const accessLabel = useMemo(() => formatAccessTimes(course?.accessTimes || 0), [course, formatAccessTimes]);
  const seatsLeft = course ? t('access.seatsLeftDetail', { left: course.seatsLeft, capacity: course.capacity }) : '';
  const fullName = `${form.firstName} ${form.lastName}`.trim();

  if (status === 'loading') {
    return (
      <div
        className="loading-shimmer"
        style={{
          padding: 80,
          borderRadius: 24,
          textAlign: 'center',
          color: 'var(--secondary-300)',
        }}
      >
        <div style={{ fontSize: '2.5rem', marginBottom: 16, opacity: 0.6 }}>💳</div>
        {t('course.loadingDetails')}
      </div>
    );
  }

  if (status === 'error' || !course) {
    return (
      <div
        className="card-surface"
        style={{
          padding: 80,
          borderRadius: 24,
          textAlign: 'center',
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
        }}
      >
        <div style={{ fontSize: '2.5rem', marginBottom: 16 }}>😔</div>
        <div style={{ color: '#fca5a5', fontWeight: 600 }}>{t('course.notFound')}</div>
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gap: 20 }}>
      {/* Header */}
      <div className="section-heading">
        <div>
          <h2>{t('checkout.title')}</h2>
          <div className="helper-text">{t('checkout.subtitleLive')}</div>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button type="button" className="btn btn-outline" onClick={() => navigate(-1)}>
            {t('common.back')}
          </button>
          <button type="button" className="btn btn-primary" onClick={() => navigate('/my-courses')}>
            {t('checkout.viewMyCourses')}
          </button>
        </div>
      </div>

      <div className="checkout-grid">
        {/* Student Information Form */}
        <div
          className="card-surface"
          style={{
            padding: 20,
            display: 'grid',
            gap: 18,
            background: 'linear-gradient(135deg, rgba(76, 29, 149, 0.15) 0%, rgba(59, 7, 100, 0.1) 100%)',
          }}
        >
          <div style={{ display: 'grid', gap: 8 }}>
            <div
              className="badge"
              style={{
                background: 'rgba(251, 191, 36, 0.15)',
                borderColor: 'rgba(251, 191, 36, 0.4)',
                color: '#fbbf24',
                width: 'fit-content',
              }}
            >
              👤 {t('checkout.studentInfo')}
            </div>
            <div className="helper-text">{t('checkout.contactHint')}</div>
            {errors.user && <div className="form-error">⚠️ {errors.user}</div>}
          </div>

          <div className="form-grid">
            <label className="form-field">
              <span>{t('checkout.firstName')} *</span>
              <input
                className="input"
                value={form.firstName}
                onChange={(e) => handleChange('firstName', e.target.value)}
                placeholder="Napasorn"
                style={{
                  borderColor: errors.firstName ? 'rgba(239, 68, 68, 0.5)' : undefined,
                }}
              />
              {errors.firstName && <div className="form-error">⚠️ {errors.firstName}</div>}
            </label>
            <label className="form-field">
              <span>{t('checkout.lastName')} *</span>
              <input
                className="input"
                value={form.lastName}
                onChange={(e) => handleChange('lastName', e.target.value)}
                placeholder="Sukjai"
                style={{
                  borderColor: errors.lastName ? 'rgba(239, 68, 68, 0.5)' : undefined,
                }}
              />
              {errors.lastName && <div className="form-error">⚠️ {errors.lastName}</div>}
            </label>
            <label className="form-field">
              <span>{t('checkout.phone')} *</span>
              <input
                className="input"
                value={form.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                placeholder="08x-xxx-xxxx"
                style={{
                  borderColor: errors.phone ? 'rgba(239, 68, 68, 0.5)' : undefined,
                }}
              />
              {errors.phone && <div className="form-error">⚠️ {errors.phone}</div>}
            </label>
            <label className="form-field">
              <span>{t('checkout.email')}</span>
              <input
                className="input"
                value={form.email}
                onChange={(e) => handleChange('email', e.target.value)}
                placeholder="you@email.com"
              />
            </label>
          </div>
          <label className="form-field">
            <span>{t('checkout.note')}</span>
            <textarea
              rows={3}
              className="input"
              value={form.note}
              onChange={(e) => handleChange('note', e.target.value)}
              placeholder={t('checkout.notePlaceholder')}
            />
          </label>
        </div>

        {/* Payment Method */}
        <div
          className="card-surface"
          style={{
            padding: 20,
            display: 'grid',
            gap: 18,
            background: 'linear-gradient(135deg, rgba(146, 64, 14, 0.1) 0%, rgba(76, 29, 149, 0.1) 100%)',
            border: '1px solid rgba(146, 64, 14, 0.2)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'space-between' }}>
            <div>
              <div
                className="badge"
                style={{
                  background: 'rgba(146, 64, 14, 0.2)',
                  borderColor: 'rgba(146, 64, 14, 0.4)',
                  color: '#fcd34d',
                }}
              >
                💳 {t('checkout.paymentMethod')}
              </div>
              <div className="helper-text" style={{ marginTop: 8 }}>{t('checkout.paymentHintLive')}</div>
            </div>
          </div>

          <div className="payment-options">
            {paymentOptions.map((channel) => (
              <button
                key={channel.id}
                type="button"
                className={`payment-card ${paymentMethod === channel.id ? 'active' : ''}`}
                onClick={() => setPaymentMethod(channel.id)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, textAlign: 'left' }}>
                    <div style={{ fontWeight: 700, fontSize: '1rem' }}>{channel.label}</div>
                    <div className="helper-text">{channel.description}</div>
                    <div style={{ color: '#fbbf24', fontSize: '0.875rem' }}>{channel.badge}</div>
                  </div>
                  <span
                    className="badge"
                    style={{
                      background: 'rgba(16, 185, 129, 0.2)',
                      borderColor: 'rgba(16, 185, 129, 0.5)',
                      color: '#6ee7b7',
                    }}
                  >
                    Money Space
                  </span>
                </div>
              </button>
            ))}
          </div>

          <div style={{ display: 'grid', gap: 12 }}>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handlePay}
              style={{
                padding: '16px 24px',
                fontSize: '1rem',
              }}
              disabled={flowState === 'processing'}
            >
              {flowState === 'processing' ? (
                <>⏳ {t('checkout.processing')}</>
              ) : (
                <>💳 {t('checkout.payNow')}</>
              )}
            </button>
            <div className="helper-text" style={{ textAlign: 'center' }}>{t('checkout.terms')}</div>
            {paymentError && (
              <div className="form-error" style={{ textAlign: 'center' }}>
                ⚠️ {paymentError}
              </div>
            )}
          </div>

          {flowState === 'processing' && (
            <div className="pill warning">
              <span>⏳</span> {t('checkout.redirecting')}
            </div>
          )}

          {flowState === 'awaiting_redirect' && (
            <div className="pill success" style={{ display: 'grid', gap: 10 }}>
              <div style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>✅</span> {t('checkout.intentCreated')}
              </div>
              <div className="helper-text">{t('checkout.intentCreatedHint')}</div>
            </div>
          )}
        </div>

        {/* Order Summary */}
        <div
          className="card-surface"
          style={{
            padding: 20,
            display: 'grid',
            gap: 16,
            background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.08) 0%, rgba(76, 29, 149, 0.1) 100%)',
            border: '1px solid rgba(251, 191, 36, 0.2)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'space-between' }}>
            <div>
              <div
                className="badge"
                style={{
                  background: 'rgba(251, 191, 36, 0.2)',
                  borderColor: 'rgba(251, 191, 36, 0.5)',
                  color: '#fbbf24',
                }}
              >
                📋 {t('checkout.summary')}
              </div>
              <div className="helper-text" style={{ marginTop: 8 }}>{t('checkout.summaryHint')}</div>
            </div>
            <button type="button" className="btn btn-outline" onClick={() => navigate(`/courses/${courseId}`)}>
              {t('common.viewDetails')}
            </button>
          </div>

          <div className="summary-card">
            <img
              src={course.coverImage || placeholderImage}
              alt={course.title}
              style={{
                border: '1px solid rgba(251, 191, 36, 0.3)',
              }}
            />
            <div style={{ display: 'grid', gap: 6 }}>
              <div style={{ fontWeight: 800, color: '#fff' }}>{course.title}</div>
              <div style={{ color: '#fbbf24' }}>📍 {course.branchName}</div>
              <div className="helper-text">{course.channel}</div>
              <div className="helper-text">{accessLabel}</div>
              <div
                className="badge"
                style={{
                  width: 'fit-content',
                  background: 'rgba(16, 185, 129, 0.15)',
                  borderColor: 'rgba(16, 185, 129, 0.4)',
                  color: '#6ee7b7',
                }}
              >
                🎫 {seatsLeft}
              </div>
            </div>
          </div>

          <div style={{
            borderTop: '1px solid rgba(196, 181, 253, 0.15)',
            paddingTop: 16,
          }}>
            <div className="summary-line">
              <span style={{ color: 'var(--secondary-300)' }}>{t('checkout.selectedCourse')}</span>
              <span style={{ color: '#fbbf24' }}>{priceLabel}</span>
            </div>
            <div className="summary-line">
              <span style={{ color: 'var(--secondary-300)' }}>{t('checkout.beneficiary')}</span>
              <span style={{ color: fullName ? '#fff' : 'var(--secondary-300)' }}>
                {fullName || t('checkout.toBeFilled')}
              </span>
            </div>
            <div className="summary-line total">
              <span>{t('checkout.total')}</span>
              <span>{priceLabel}</span>
            </div>
          </div>

          <div className="mini-session-list">
            {sessions.length === 0 && (
              <div className="helper-text" style={{ textAlign: 'center', padding: 16 }}>
                📅 {t('session.noSessions')}
              </div>
            )}
            {sessions.map((session) => (
              <div key={session.id} className="mini-session">
                <div>
                  <div style={{ fontWeight: 700, color: '#fff' }}>{session.topic}</div>
                  <div className="helper-text">
                    📆 {session.date} · 🕐 {session.time}
                  </div>
                </div>
                <div
                  className="badge"
                  style={{
                    background: 'rgba(196, 181, 253, 0.1)',
                    borderColor: 'rgba(196, 181, 253, 0.3)',
                  }}
                >
                  {session.branchName}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Checkout;
