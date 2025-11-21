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
    setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const validate = () => {
    const nextErrors = {};
    if (!form.firstName.trim()) nextErrors.firstName = t('checkout.required');
    if (!form.lastName.trim()) nextErrors.lastName = t('checkout.required');
    if (!form.phone.trim()) nextErrors.phone = t('checkout.required');
    return nextErrors;
  };

  const handleMockPay = () => {
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

  if (status === 'loading') return <div className="helper-text">{t('course.loadingDetails')}</div>;
  if (status === 'error' || !course) return <div className="helper-text">{t('course.notFound')}</div>;

  return (
    <div className="page-stack">
      <div className="section-heading">
        <div>
          <h2>{t('checkout.title')}</h2>
          <div className="helper-text">{t('checkout.subtitle')}</div>
        </div>
        <div className="action-row">
          <button type="button" className="btn btn-outline" onClick={() => navigate(-1)}>
            {t('common.back')}
          </button>
          <button type="button" className="btn btn-primary" onClick={() => navigate('/my-courses')}>
            {t('checkout.viewMyCourses')}
          </button>
        </div>
      </div>

      <div className="checkout-grid">
        <div className="card-surface section-card" style={{ padding: 16 }}>
          <div style={{ display: 'grid', gap: 10 }}>
            <div className="badge">{t('checkout.studentInfo')}</div>
            <div className="helper-text">{t('checkout.contactHint')}</div>
          </div>
          <div className="form-grid">
            <label className="form-field">
              <span>{t('checkout.firstName')}</span>
              <input
                className="input"
                value={form.firstName}
                onChange={(e) => handleChange('firstName', e.target.value)}
                placeholder="Napasorn"
              />
              {errors.firstName && <div className="form-error">{errors.firstName}</div>}
            </label>
            <label className="form-field">
              <span>{t('checkout.lastName')}</span>
              <input
                className="input"
                value={form.lastName}
                onChange={(e) => handleChange('lastName', e.target.value)}
                placeholder="Sukjai"
              />
              {errors.lastName && <div className="form-error">{errors.lastName}</div>}
            </label>
            <label className="form-field">
              <span>{t('checkout.phone')}</span>
              <input
                className="input"
                value={form.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                placeholder="08x-xxx-xxxx"
              />
              {errors.phone && <div className="form-error">{errors.phone}</div>}
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

        <div className="card-surface section-card" style={{ padding: 16 }}>
          <div className="action-row" style={{ justifyContent: 'space-between' }}>
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
            <button type="button" className="btn btn-primary" onClick={handleMockPay}>
              {flowState === 'processing' ? t('checkout.processing') : t('checkout.mockPay')}
            </button>
            <div className="helper-text">{t('checkout.terms')}</div>
          </div>

          {flowState === 'processing' && <div className="pill warning">{t('checkout.mockPending')}</div>}
          {flowState === 'paid' && (
            <div className="pill success" style={{ display: 'grid', gap: 6 }}>
              <div style={{ fontWeight: 700 }}>{t('checkout.mockSuccess')}</div>
              <div className="helper-text">{t('checkout.mockSuccessHint')}</div>
              <div className="action-row">
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

        <div className="card-surface section-card" style={{ padding: 16 }}>
          <div className="action-row" style={{ justifyContent: 'space-between' }}>
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
    </div>
  );
}

export default Checkout;
