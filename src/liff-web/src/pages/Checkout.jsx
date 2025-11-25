import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { fetchCourseDetail } from '../lib/courseApi';
import { useAutoTranslate } from '../lib/autoTranslate';
import { placeholderImage } from '../lib/formatters';
import { mockPaymentChannels, mockTransferAccounts } from '../lib/mockData';

function Checkout() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { language, formatPrice, formatAccessTimes } = useAutoTranslate();
  const { t } = useTranslation();

  const [course, setCourse] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [status, setStatus] = useState('idle');
  const [form, setForm] = useState({ firstName: '', lastName: '', phone: '', email: '', note: '' });
  const [paymentMethod, setPaymentMethod] = useState('bank');
  const [flowState, setFlowState] = useState('idle');
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [submitAttempted, setSubmitAttempted] = useState(false);

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

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (touched[field] || submitAttempted) {
      setErrors((prev) => ({ ...prev, [field]: validateField(field, value) }));
    } else {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const handleBlur = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    setErrors((prev) => ({ ...prev, [field]: validateField(field, form[field]) }));
  };

  const validateField = (field, value) => {
    const trimmed = value.trim();
    switch (field) {
      case 'firstName':
        if (!trimmed) return t('checkout.errors.firstNameRequired');
        if (trimmed.length < 2 || trimmed.length > 50) return t('checkout.errors.firstNameLength');
        if (!/^[\p{L}\s'.-]+$/u.test(trimmed)) return t('checkout.errors.nameCharacters');
        return '';
      case 'lastName':
        if (!trimmed) return t('checkout.errors.lastNameRequired');
        if (trimmed.length < 2 || trimmed.length > 50) return t('checkout.errors.lastNameLength');
        if (!/^[\p{L}\s'.-]+$/u.test(trimmed)) return t('checkout.errors.nameCharacters');
        return '';
      case 'phone': {
        const digits = trimmed.replace(/[\s-]/g, '');
        if (!digits) return t('checkout.errors.phoneRequired');
        if (!/^[+]?\d{9,15}$/.test(digits)) return t('checkout.errors.phoneFormat');
        return '';
      }
      case 'email':
        if (!trimmed) return '';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return t('checkout.errors.emailFormat');
        return '';
      case 'note':
        if (trimmed.length > 200) return t('checkout.errors.noteLength');
        return '';
      default:
        return '';
    }
  };

  const validate = () => {
    const nextErrors = {};
    ['firstName', 'lastName', 'phone', 'email', 'note'].forEach((field) => {
      const result = validateField(field, form[field]);
      if (result) nextErrors[field] = result;
    });
    return nextErrors;
  };

  const handleMockPay = () => {
    setSubmitAttempted(true);
    const validation = validate();
    setErrors(validation);
    if (Object.keys(validation).length > 0) return;
    setFlowState('processing');
    setTimeout(() => {
      setFlowState('paid');
    }, 600);
  };

  const priceLabel = useMemo(() => formatPrice(course?.priceCents, course?.isFree), [course, formatPrice]);
  const accessLabel = useMemo(() => formatAccessTimes(course?.accessTimes || 0), [course, formatAccessTimes]);
  const seatsLeft = course ? t('access.seatsLeftDetail', { left: course.seatsLeft, capacity: course.capacity }) : '';
  const fullName = `${form.firstName} ${form.lastName}`.trim();
  const primaryActionLabel = flowState === 'processing' ? t('checkout.processing') : t('checkout.mockPay');
  const isProcessing = flowState === 'processing';

  const fieldStates = {
    firstName: {
      error: errors.firstName,
      valid: !errors.firstName && form.firstName.trim().length >= 2,
      helper: t('checkout.assist.firstName'),
      success: t('checkout.success.firstName'),
    },
    lastName: {
      error: errors.lastName,
      valid: !errors.lastName && form.lastName.trim().length >= 2,
      helper: t('checkout.assist.lastName'),
      success: t('checkout.success.lastName'),
    },
    phone: {
      error: errors.phone,
      valid: !errors.phone && form.phone.trim().length >= 9,
      helper: t('checkout.assist.phone'),
      success: t('checkout.success.phone'),
    },
    email: {
      error: errors.email,
      valid: !errors.email && !!form.email.trim(),
      helper: t('checkout.assist.email'),
      success: t('checkout.success.email'),
    },
    note: {
      error: errors.note,
      valid: !errors.note && !!form.note.trim(),
      helper: t('checkout.assist.note'),
      success: t('checkout.success.note'),
    },
  };

  const buildDescribedBy = (fieldKey) => {
    const ids = [`${fieldKey}-helper`];
    if (fieldStates[fieldKey].error) ids.push(`${fieldKey}-error`);
    else if (fieldStates[fieldKey].valid) ids.push(`${fieldKey}-success`);
    return ids.join(' ');
  };

  if (status === 'loading') return <div className="helper-text">{t('course.loadingDetails')}</div>;
  if (status === 'error' || !course) return <div className="helper-text">{t('course.notFound')}</div>;

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <div className="section-heading">
        <div>
          <h2>{t('checkout.title')}</h2>
          <div className="helper-text">{t('checkout.subtitle')}</div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button type="button" className="btn btn-outline" onClick={() => navigate(-1)}>
            {t('common.back')}
          </button>
          <button type="button" className="btn btn-primary" onClick={() => navigate('/my-courses')}>
            {t('checkout.viewMyCourses')}
          </button>
        </div>
      </div>

      <div className="checkout-grid">
        <div className="card-surface" style={{ padding: 16, display: 'grid', gap: 14 }}>
          <div style={{ display: 'grid', gap: 10 }}>
            <div className="badge">{t('checkout.studentInfo')}</div>
            <div className="helper-text">{t('checkout.contactHint')}</div>
          </div>
          <div className="form-grid">
            <label className="form-field" htmlFor="firstName">
              <span>{t('checkout.firstName')}</span>
              <div className="input-with-icon">
                <input
                  id="firstName"
                  className={`input ${fieldStates.firstName.error ? 'has-error' : fieldStates.firstName.valid ? 'has-success' : ''}`}
                  value={form.firstName}
                  onChange={(e) => handleChange('firstName', e.target.value)}
                  onBlur={() => handleBlur('firstName')}
                  placeholder="Napasorn"
                  aria-invalid={Boolean(fieldStates.firstName.error)}
                  aria-describedby={buildDescribedBy('firstName')}
                />
                {fieldStates.firstName.error && (
                  <span className="field-icon" aria-hidden="true">⚠️</span>
                )}
                {!fieldStates.firstName.error && fieldStates.firstName.valid && (
                  <span className="field-icon" aria-hidden="true">✅</span>
                )}
              </div>
              <div className="form-helper" id="firstName-helper">
                {fieldStates.firstName.helper}
              </div>
              {fieldStates.firstName.error ? (
                <div className="form-error" id="firstName-error" role="alert" aria-live="assertive">
                  ⚠️ {fieldStates.firstName.error}
                </div>
              ) : (
                fieldStates.firstName.valid && (
                  <div className="form-success" id="firstName-success" aria-live="polite">
                    ✅ {fieldStates.firstName.success}
                  </div>
                )
              )}
            </label>
            <label className="form-field" htmlFor="lastName">
              <span>{t('checkout.lastName')}</span>
              <div className="input-with-icon">
                <input
                  id="lastName"
                  className={`input ${fieldStates.lastName.error ? 'has-error' : fieldStates.lastName.valid ? 'has-success' : ''}`}
                  value={form.lastName}
                  onChange={(e) => handleChange('lastName', e.target.value)}
                  onBlur={() => handleBlur('lastName')}
                  placeholder="Sukjai"
                  aria-invalid={Boolean(fieldStates.lastName.error)}
                  aria-describedby={buildDescribedBy('lastName')}
                />
                {fieldStates.lastName.error && (
                  <span className="field-icon" aria-hidden="true">⚠️</span>
                )}
                {!fieldStates.lastName.error && fieldStates.lastName.valid && (
                  <span className="field-icon" aria-hidden="true">✅</span>
                )}
              </div>
              <div className="form-helper" id="lastName-helper">
                {fieldStates.lastName.helper}
              </div>
              {fieldStates.lastName.error ? (
                <div className="form-error" id="lastName-error" role="alert" aria-live="assertive">
                  ⚠️ {fieldStates.lastName.error}
                </div>
              ) : (
                fieldStates.lastName.valid && (
                  <div className="form-success" id="lastName-success" aria-live="polite">
                    ✅ {fieldStates.lastName.success}
                  </div>
                )
              )}
            </label>
            <label className="form-field" htmlFor="phone">
              <span>{t('checkout.phone')}</span>
              <div className="input-with-icon">
                <input
                  id="phone"
                  className={`input ${fieldStates.phone.error ? 'has-error' : fieldStates.phone.valid ? 'has-success' : ''}`}
                  value={form.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  onBlur={() => handleBlur('phone')}
                  placeholder="0812345678"
                  aria-invalid={Boolean(fieldStates.phone.error)}
                  aria-describedby={buildDescribedBy('phone')}
                  inputMode="tel"
                />
                {fieldStates.phone.error && (
                  <span className="field-icon" aria-hidden="true">⚠️</span>
                )}
                {!fieldStates.phone.error && fieldStates.phone.valid && (
                  <span className="field-icon" aria-hidden="true">✅</span>
                )}
              </div>
              <div className="form-helper" id="phone-helper">
                {fieldStates.phone.helper}
              </div>
              {fieldStates.phone.error ? (
                <div className="form-error" id="phone-error" role="alert" aria-live="assertive">
                  ⚠️ {fieldStates.phone.error}
                </div>
              ) : (
                fieldStates.phone.valid && (
                  <div className="form-success" id="phone-success" aria-live="polite">
                    ✅ {fieldStates.phone.success}
                  </div>
                )
              )}
            </label>
            <label className="form-field" htmlFor="email">
              <span>{t('checkout.email')}</span>
              <div className="input-with-icon">
                <input
                  id="email"
                  type="email"
                  className={`input ${fieldStates.email.error ? 'has-error' : fieldStates.email.valid ? 'has-success' : ''}`}
                  value={form.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  onBlur={() => handleBlur('email')}
                  placeholder="you@email.com"
                  aria-invalid={Boolean(fieldStates.email.error)}
                  aria-describedby={buildDescribedBy('email')}
                  inputMode="email"
                />
                {fieldStates.email.error && (
                  <span className="field-icon" aria-hidden="true">⚠️</span>
                )}
                {!fieldStates.email.error && fieldStates.email.valid && (
                  <span className="field-icon" aria-hidden="true">✅</span>
                )}
              </div>
              <div className="form-helper" id="email-helper">
                {fieldStates.email.helper}
              </div>
              {fieldStates.email.error ? (
                <div className="form-error" id="email-error" role="alert" aria-live="assertive">
                  ⚠️ {fieldStates.email.error}
                </div>
              ) : (
                fieldStates.email.valid && (
                  <div className="form-success" id="email-success" aria-live="polite">
                    ✅ {fieldStates.email.success}
                  </div>
                )
              )}
            </label>
          </div>
          <label className="form-field" htmlFor="note">
            <span>{t('checkout.note')}</span>
            <div className="input-with-icon">
              <textarea
                id="note"
                rows={3}
                className={`input ${fieldStates.note.error ? 'has-error' : fieldStates.note.valid ? 'has-success' : ''}`}
                value={form.note}
                onChange={(e) => handleChange('note', e.target.value)}
                onBlur={() => handleBlur('note')}
                placeholder={t('checkout.notePlaceholder')}
                aria-invalid={Boolean(fieldStates.note.error)}
                aria-describedby={buildDescribedBy('note')}
              />
              {fieldStates.note.error && (
                <span className="field-icon" aria-hidden="true">⚠️</span>
              )}
              {!fieldStates.note.error && fieldStates.note.valid && (
                <span className="field-icon" aria-hidden="true">✅</span>
              )}
            </div>
            <div className="form-helper" id="note-helper">
              {fieldStates.note.helper}
            </div>
            {fieldStates.note.error ? (
              <div className="form-error" id="note-error" role="alert" aria-live="assertive">
                ⚠️ {fieldStates.note.error}
              </div>
            ) : (
              fieldStates.note.valid && (
                <div className="form-success" id="note-success" aria-live="polite">
                  ✅ {fieldStates.note.success}
                </div>
              )
            )}
          </label>
        </div>

        <div className="card-surface" style={{ padding: 16, display: 'grid', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'space-between' }}>
            <div>
              <div className="badge">{t('checkout.paymentMethod')}</div>
              <div className="helper-text">{t('checkout.paymentHint')}</div>
            </div>
          </div>

          <div className="payment-options">
            {mockPaymentChannels.map((channel) => (
              <button
                key={channel.id}
                type="button"
                className={`payment-card ${paymentMethod === channel.id ? 'active' : ''} ${channel.disabled ? 'disabled' : ''}`}
                onClick={() => !channel.disabled && setPaymentMethod(channel.id)}
                disabled={channel.disabled}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, textAlign: 'left' }}>
                    <div style={{ fontWeight: 700 }}>{channel.label}</div>
                    <div className="helper-text">{channel.description}</div>
                    <div style={{ color: '#e7b1a0', fontSize: '0.9rem' }}>{channel.eta}</div>
                  </div>
                  {channel.recommended && <span className="badge">{t('checkout.recommended')}</span>}
                  {channel.disabled && <span className="badge">{t('checkout.mockOnly')}</span>}
                </div>
              </button>
            ))}
          </div>

          <div className="transfer-box">
            <div style={{ fontWeight: 700 }}>{t('checkout.bankInstruction')}</div>
            <div className="helper-text">{t('checkout.bankInstructionDetail')}</div>
            <div className="transfer-grid">
              {mockTransferAccounts.map((account) => (
                <div key={account.accountNumber} className="transfer-card">
                  <div style={{ fontWeight: 700 }}>{account.bank}</div>
                  <div>{account.accountName}</div>
                  <div className="helper-text">{account.accountNumber}</div>
                  <div className="badge">PromptPay: {account.promptPay}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gap: 10 }}>
            <button type="button" className="btn btn-primary" onClick={handleMockPay} disabled={isProcessing}>
              {primaryActionLabel}
            </button>
            <div className="helper-text">{t('checkout.terms')}</div>
          </div>

          {flowState === 'processing' && <div className="pill warning">{t('checkout.mockPending')}</div>}
          {flowState === 'paid' && (
            <div className="pill success" style={{ display: 'grid', gap: 6 }}>
              <div style={{ fontWeight: 700 }}>{t('checkout.mockSuccess')}</div>
              <div className="helper-text">{t('checkout.mockSuccessHint')}</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button type="button" className="btn btn-outline" onClick={() => navigate('/my-courses')}>
                  {t('checkout.viewMyCourses')}
                </button>
                <button type="button" className="btn btn-outline" onClick={() => navigate(`/courses/${courseId}`)}>
                  {t('common.viewDetails')}
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="card-surface" style={{ padding: 16, display: 'grid', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'space-between' }}>
            <div>
              <div className="badge">{t('checkout.summary')}</div>
              <div className="helper-text">{t('checkout.summaryHint')}</div>
            </div>
            <button type="button" className="btn btn-outline" onClick={() => navigate(`/courses/${courseId}`)}>
              {t('common.viewDetails')}
            </button>
          </div>

          <div className="summary-card">
            <img src={course.coverImage || placeholderImage} alt={course.title} />
            <div style={{ display: 'grid', gap: 6 }}>
              <div style={{ fontWeight: 800 }}>{course.title}</div>
              <div style={{ color: '#e7b1a0' }}>{course.branchName}</div>
              <div className="helper-text">{course.channel}</div>
              <div className="helper-text">{accessLabel}</div>
              <div className="badge">{seatsLeft}</div>
            </div>
          </div>

          <div className="summary-line">
            <span>{t('checkout.selectedCourse')}</span>
            <span>{priceLabel}</span>
          </div>
          <div className="summary-line">
            <span>{t('checkout.beneficiary')}</span>
            <span>{fullName || t('checkout.toBeFilled')}</span>
          </div>
          <div className="summary-line total">
            <span>{t('checkout.total')}</span>
            <span>{priceLabel}</span>
          </div>

          <div className="helper-text">{t('checkout.mockData')}</div>

          <div className="mini-session-list">
            {sessions.length === 0 && <div className="helper-text">{t('session.noSessions')}</div>}
            {sessions.map((session) => (
              <div key={session.id} className="mini-session">
                <div>
                  <div style={{ fontWeight: 700 }}>{session.topic}</div>
                  <div className="helper-text">
                    {session.date} · {session.time}
                  </div>
                </div>
                <div className="badge">{session.branchName}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mobile-action-bar">
        <div className="mobile-action-bar__meta">
          <span style={{ fontWeight: 800 }}>{priceLabel}</span>
          <span className="helper-text">{fullName || t('checkout.toBeFilled')}</span>
        </div>
        <button type="button" className="btn btn-primary" onClick={handleMockPay} disabled={isProcessing}>
          {primaryActionLabel}
        </button>
      </div>
    </div>
  );
}

export default Checkout;
