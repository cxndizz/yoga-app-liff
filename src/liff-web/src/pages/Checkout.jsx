import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { fetchCourseDetail } from '../lib/courseApi';
import { useAutoTranslate } from '../lib/autoTranslate';
import { placeholderImage } from '../lib/formatters';
import {
  checkMoneySpaceStatus,
  checkMoneySpaceOrderStatus,
  createOrder,
  fetchOrderStatus,
  startMoneySpacePayment,
} from '../lib/orderApi';
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
  const [qrDisplay, setQrDisplay] = useState(null);
  const [errors, setErrors] = useState({});
  const [currentStep, setCurrentStep] = useState(0);
  const cachedDisplayName = cachedUser?.full_name || cachedUser?.line_display_name || cachedProfile.displayName || '';
  const [form, setForm] = useState({
    firstName: cachedDisplayName?.split(' ')?.[0] || '',
    lastName: cachedDisplayName?.split(' ')?.slice(1).join(' ') || '',
    phone: cachedUser?.phone || '',
    email: cachedUser?.email || '',
    note: '',
  });

  useEffect(() => {
    if (liveUser) {
      setUser(liveUser);
      const preferredName = liveUser.full_name || liveUser.line_display_name || cachedProfile.displayName || '';
      setForm((prev) => ({
        ...prev,
        phone: prev.phone || liveUser.phone || '',
        email: prev.email || liveUser.email || '',
        firstName: prev.firstName || preferredName?.split(' ')?.[0] || '',
        lastName: prev.lastName || preferredName?.split(' ')?.slice(1).join(' ') || '',
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

  const steps = useMemo(
    () => [
      { key: 'info', label: t('checkout.stepInfo'), description: t('checkout.stepInfoDesc') },
      { key: 'payment', label: t('checkout.stepPayment'), description: t('checkout.stepPaymentDesc') },
      { key: 'result', label: t('checkout.stepRedirect'), description: t('checkout.stepRedirectDesc') },
    ],
    [t]
  );

  const getStepNumber = (key) => steps.findIndex((step) => step.key === key) + 1;

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: '' }));
    setPaymentError('');
  };

  const stepStatus = (index) => {
    if (currentStep > index) return 'done';
    if (currentStep === index) return 'active';
    return 'upcoming';
  };

  const goToStep = (index) => {
    const max = steps.length - 1;
    setCurrentStep(Math.min(Math.max(index, 0), max));
  };

  useEffect(() => {
    if (paymentMethod !== 'qrnone') {
      setQrDisplay(null);
    }
  }, [paymentMethod]);

  useEffect(() => {
    if (flowState !== 'qr_ready' || !qrDisplay?.orderId) return () => {};

    let cancelled = false;

    const pollStatus = async () => {
      try {
        const latestOrder = await fetchOrderStatus({ orderId: qrDisplay.orderId, userId: user?.id });
        if (!latestOrder || cancelled) return;

        if (['completed', 'success'].includes(latestOrder.status)) {
          navigate('/payments/moneyspace/success');
          return;
        }

        if (['failed', 'cancelled'].includes(latestOrder.status)) {
          setFlowState('error');
          setPaymentError(t('checkout.errorPayment'));
          return;
        }

        const remoteStatusPayload = qrDisplay.transactionId
          ? await checkMoneySpaceStatus({
              transactionId: qrDisplay.transactionId,
              orderId: qrDisplay.orderId,
            })
          : await checkMoneySpaceOrderStatus({ orderId: qrDisplay.orderId });

        const nextStatus = (remoteStatusPayload?.order?.status || remoteStatusPayload?.mappedStatus || remoteStatusPayload?.status || latestOrder.status || '')
          .toString()
          .toLowerCase();
        const normalizedNextStatus = nextStatus.replace(/[^a-z]/g, '');

        if (['completed', 'success', 'paysuccess'].includes(normalizedNextStatus)) {
          navigate('/payments/moneyspace/success');
          return;
        }

        if (['failed', 'cancelled', 'canceled'].includes(normalizedNextStatus)) {
          setFlowState('error');
          setPaymentError(t('checkout.errorPayment'));
        }
      } catch (err) {
        if (!cancelled) {
          console.error('Error polling order status', err);
        }
      }
    };

    pollStatus();
    const timer = setInterval(pollStatus, 3000);

    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [flowState, qrDisplay?.orderId, qrDisplay?.transactionId, user?.id, navigate, t]);

  const validate = () => {
    const nextErrors = {};
    if (!form.firstName.trim()) nextErrors.firstName = t('checkout.required');
    if (!form.lastName.trim()) nextErrors.lastName = t('checkout.required');
    if (!form.phone.trim()) nextErrors.phone = t('checkout.required');
    if (!user?.id) nextErrors.user = t('checkout.loginRequired');
    return nextErrors;
  };

  const handleInfoNext = () => {
    const validation = validate();
    setErrors(validation);
    setPaymentError('');
    if (Object.keys(validation).length > 0) {
      goToStep(0);
      return;
    }
    goToStep(1);
  };

  const handlePay = async () => {
    const validation = validate();
    setErrors(validation);
    setPaymentError('');
    if (Object.keys(validation).length > 0) return;

    setFlowState('processing');
    const resultStepIndex = steps.findIndex((step) => step.key === 'result');
    setCurrentStep(resultStepIndex);

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
        success_url: `${currentOrigin}/payments/moneyspace/success?orderId=${existingOrder?.id}`,
        fail_url: `${currentOrigin}/payments/moneyspace/fail?orderId=${existingOrder?.id}`,
        cancel_url: `${currentOrigin}/payments/moneyspace/cancel?orderId=${existingOrder?.id}`,
      });

      if (payment?.paymentType === 'qrnone') {
        setQrDisplay({
          transactionId: payment.transactionId,
          orderId: existingOrder?.id,
          qrImage: payment.qrImage || payment.redirectUrl,
          embedHtml: payment.embedHtml,
          redirectUrl: payment.redirectUrl,
        });
        setFlowState('qr_ready');
        return;
      }

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

  const handleDownloadQr = async () => {
    if (!qrDisplay?.qrImage) return;
    try {
      const response = await fetch(qrDisplay.qrImage);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `promptpay-${qrDisplay.orderId || qrDisplay.transactionId || 'payment'}.png`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download QR error', err);
      setPaymentError(t('checkout.qrDownloadError'));
    }
  };

  const priceLabel = useMemo(() => formatPrice(course?.priceCents, course?.isFree), [course, formatPrice]);
  const accessLabel = useMemo(() => formatAccessTimes(course?.accessTimes || 0), [course, formatAccessTimes]);
  const seatsLeft = course ? t('access.seatsLeftDetail', { left: course.seatsLeft, capacity: course.capacity }) : '';
  const fullName = `${form.firstName} ${form.lastName}`.trim();
  const selectedPayment = useMemo(
    () => paymentOptions.find((option) => option.id === paymentMethod),
    [paymentMethod, paymentOptions]
  );
  const qrEmbedAvailable = qrDisplay && (qrDisplay.qrImage || qrDisplay.embedHtml || qrDisplay.redirectUrl);

  const renderInfoStep = () => (
    <div className="card-surface step-card" style={{ padding: 20, display: 'grid', gap: 18 }}>
      <div className="step-card__title">
        <div className="step-index">{getStepNumber('info')}</div>
        <div style={{ display: 'grid', gap: 6 }}>
          <div className="badge" style={{ width: 'fit-content' }}>
            {t('checkout.studentInfo')}
          </div>
          <div className="helper-text">{t('checkout.contactHint')}</div>
          {errors.user && <div className="form-error">{errors.user}</div>}
        </div>
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
          {errors.firstName && <div className="form-error">{errors.firstName}</div>}
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
          {errors.lastName && <div className="form-error">{errors.lastName}</div>}
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
          {errors.phone && <div className="form-error">{errors.phone}</div>}
        </label>
        <label className="form-field">
          <span>{t('checkout.email')}</span>
          <input
            className="input"
            value={form.email}
            onChange={(e) => handleChange('email', e.target.value)}
            placeholder="you@example.com"
          />
        </label>
      </div>

      <label className="form-field">
        <span>{t('checkout.note')}</span>
        <textarea
          className="textarea"
          rows={3}
          value={form.note}
          onChange={(e) => handleChange('note', e.target.value)}
          placeholder={t('checkout.notePlaceholder')}
        />
      </label>

      <div className="step-actions">
        <button type="button" className="btn btn-outline" onClick={() => navigate(-1)}>
          {t('common.back')}
        </button>
        <button type="button" className="btn btn-primary" onClick={handleInfoNext}>
          {t('checkout.nextStep')}
        </button>
      </div>
    </div>
  );

  const renderPaymentStep = () => (
    <div className="card-surface step-card" style={{ padding: 20, display: 'grid', gap: 14 }}>
      <div className="step-card__title">
        <div className="step-index">{getStepNumber('payment')}</div>
        <div style={{ display: 'grid', gap: 6 }}>
          <div className="badge" style={{ width: 'fit-content' }}>
            {t('checkout.paymentMethod')}
          </div>
          <div className="helper-text">{t('checkout.paymentHintLive')}</div>
        </div>
      </div>

      <div className="payment-options">
        {paymentOptions.map((option) => (
          <button
            type="button"
            key={option.id}
            onClick={() => setPaymentMethod(option.id)}
            className={`payment-card ${paymentMethod === option.id ? 'active' : ''}`}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
              <div style={{ display: 'grid', gap: 6, textAlign: 'left' }}>
                <div style={{ fontWeight: 700 }}>{option.label}</div>
                <div className="helper-text">{option.description}</div>
              </div>
              <div className="helper-text" style={{ color: 'var(--secondary-200)' }}>{option.badge}</div>
            </div>
          </button>
        ))}
      </div>

      {selectedPayment && (
        <div className="pill" style={{ width: 'fit-content' }}>
          {t('checkout.paymentMethod')}: <strong>{selectedPayment.label}</strong>
        </div>
      )}

      <div className="step-actions" style={{ justifyContent: 'flex-start' }}>
        <button type="button" className="btn btn-outline" onClick={() => goToStep(0)}>
          {t('common.back')}
        </button>
        <button
          type="button"
          className="btn btn-primary"
          onClick={handlePay}
          disabled={flowState === 'processing'}
        >
          {flowState === 'processing' ? t('checkout.processing') : t('checkout.payNow')}
        </button>
      </div>

      <div className="helper-text" style={{ textAlign: 'center' }}>{t('checkout.terms')}</div>
    </div>
  );

  const renderResultStep = () => (
    <div className="card-surface step-card" style={{ padding: 20, display: 'grid', gap: 14 }}>
      <div className="step-card__title">
        <div className="step-index">{getStepNumber('result')}</div>
        <div style={{ display: 'grid', gap: 6 }}>
          <div className="badge" style={{ width: 'fit-content' }}>
            {t('checkout.stepRedirect')}
          </div>
          <div className="helper-text">{t('checkout.stepRedirectDesc')}</div>
        </div>
      </div>

      {paymentError && (
        <div className="status-banner status-banner--error" style={{ marginTop: 4 }}>
          {paymentError}
        </div>
      )}

      {flowState === 'processing' && (
        <div className="status-banner" style={{ marginTop: 4 }}>
          {t('checkout.redirecting')}
        </div>
      )}

      {flowState === 'awaiting_redirect' && (
        <div className="pill success" style={{ display: 'grid', gap: 10 }}>
          <div style={{ fontWeight: 700 }}>{t('checkout.intentCreated')}</div>
          <div className="helper-text">{t('checkout.intentCreatedHint')}</div>
        </div>
      )}

      {qrEmbedAvailable && (
        <div
          style={{
            marginTop: 4,
            padding: 14,
            borderRadius: 14,
            border: '1px dashed rgba(251, 191, 36, 0.4)',
            background: 'rgba(15, 23, 42, 0.45)',
            display: 'grid',
            gap: 12,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
            <div style={{ display: 'grid', gap: 6 }}>
              <div className="badge" style={{ width: 'fit-content' }}>
                {t('checkout.qrTitle')}
              </div>
              <div className="helper-text">{t('checkout.qrSubtitle')}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div className="helper-text" style={{ color: '#fbbf24' }}>
                {t('checkout.qrAmount')} {priceLabel}
              </div>
              <div className="helper-text">{t('checkout.qrRef')}: {qrDisplay?.transactionId || '-'}</div>
              <div className="helper-text">{t('checkout.selectedCourse')} #{qrDisplay?.orderId || '-'}</div>
            </div>
          </div>

          {qrDisplay?.qrImage && (
            <div style={{ textAlign: 'center' }}>
              <img
                src={qrDisplay.qrImage}
                alt="PromptPay QR"
                style={{
                  width: 'min(320px, 100%)',
                  margin: '0 auto',
                  borderRadius: 12,
                  background: '#fff',
                  padding: 12,
                }}
              />
              <div className="helper-text" style={{ marginTop: 8 }}>
                {t('checkout.qrFallback')}
              </div>
            </div>
          )}

          {!qrDisplay?.qrImage && qrDisplay?.embedHtml && (
            <div
              className="qr-embed"
              style={{ background: '#fff', borderRadius: 12, overflow: 'hidden' }}
              dangerouslySetInnerHTML={{ __html: qrDisplay.embedHtml }}
            />
          )}

          {!qrDisplay?.qrImage && !qrDisplay?.embedHtml && qrDisplay?.redirectUrl && (
            <iframe
              title="PromptPay QR"
              src={qrDisplay.redirectUrl}
              style={{ width: '100%', minHeight: 420, borderRadius: 12, border: '1px solid rgba(251, 191, 36, 0.4)' }}
              allow="payment"
            />
          )}

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
            {qrDisplay?.qrImage && (
              <button type="button" className="btn btn-primary" onClick={handleDownloadQr}>
                {t('checkout.qrDownload')}
              </button>
            )}
            {qrDisplay?.redirectUrl && (
              <a
                href={qrDisplay.redirectUrl}
                target="_blank"
                rel="noreferrer"
                className="btn btn-outline"
                style={{ textDecoration: 'none' }}
              >
                {t('checkout.qrOpenLink')}
              </a>
            )}
          </div>
        </div>
      )}

      {!qrEmbedAvailable && flowState !== 'error' && (
        <div className="helper-text" style={{ textAlign: 'center' }}>
          {t('checkout.resultPlaceholder')}
        </div>
      )}

      <div className="step-actions" style={{ justifyContent: 'space-between' }}>
        <button type="button" className="btn btn-outline" onClick={() => goToStep(1)}>
          {t('checkout.backToPayment')}
        </button>
        <button type="button" className="btn btn-primary" onClick={() => navigate('/my-courses')}>
          {t('checkout.viewMyCourses')}
        </button>
      </div>
    </div>
  );

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
        <div style={{ color: '#fca5a5', fontWeight: 600 }}>{t('course.notFound')}</div>
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gap: 20 }}>
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
        <div className="step-stack">
          <div className="step-progress">
            {steps.map((step, index) => {
              const status = stepStatus(index);
              const isDone = status === 'done';
              return (
                <button
                  key={step.key}
                  type="button"
                  className={`step-progress-item ${status}`}
                  onClick={isDone ? () => goToStep(index) : undefined}
                  disabled={!isDone}
                >
                  <div className="step-progress-number">{index + 1}</div>
                  <div>
                    <div className="step-progress-label">{step.label}</div>
                    <div className="helper-text" style={{ marginTop: 2 }}>{step.description}</div>
                  </div>
                </button>
              );
            })}
          </div>

          {currentStep === 0 && renderInfoStep()}
          {currentStep === 1 && renderPaymentStep()}
          {currentStep === 2 && renderResultStep()}
        </div>

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
              <div className="badge" style={{ background: 'rgba(251, 191, 36, 0.15)', borderColor: 'rgba(251, 191, 36, 0.3)', color: '#fbbf24' }}>
                {t('checkout.summary')}
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
              <div style={{ color: '#fbbf24' }}>{course.branchName}</div>
              <div className="helper-text">{course.channel}</div>
              <div className="helper-text">{accessLabel}</div>
              <div className="badge" style={{ width: 'fit-content', background: 'rgba(16, 185, 129, 0.1)', borderColor: 'rgba(16, 185, 129, 0.3)', color: '#6ee7b7' }}>
                {seatsLeft}
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
                {t('session.noSessions')}
              </div>
            )}
            {sessions.map((session) => (
              <div key={session.id} className="mini-session">
                <div>
                  <div style={{ fontWeight: 700, color: '#fff' }}>{session.topic}</div>
                  <div className="helper-text">
                    {session.date} · {session.time}
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
