import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import SessionList from '../components/SessionList';
import { fetchCourseDetail } from '../lib/courseApi';
import { placeholderImage } from '../lib/formatters';
import { useAutoTranslate } from '../lib/autoTranslate';
import useLiffUser from '../hooks/useLiffUser';
import { getCachedLiffUser } from '../lib/liffAuth';
import { fetchOrdersForUser } from '../lib/orderApi';
import { collectOwnedCourseIds, isOrderOwned } from '../lib/orderUtils';

function CourseDetail() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { user: liveUser } = useLiffUser();
  const [course, setCourse] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [status, setStatus] = useState('idle');
  const [user, setUser] = useState(getCachedLiffUser()?.user || null);
  const [ownership, setOwnership] = useState({ checked: false, owned: false });
  const { language, formatPrice, formatAccessTimes } = useAutoTranslate();
  const { t } = useTranslation();

  useEffect(() => {
    if (liveUser) setUser(liveUser);
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
        setSessions(sessionPayload);
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

  useEffect(() => {
    if (!user?.id || !courseId) {
      setOwnership({ checked: true, owned: false });
      return undefined;
    }

    let active = true;
    let timeoutId = null;

    // Set a fallback timeout to prevent infinite loading (6 seconds)
    timeoutId = setTimeout(() => {
      if (active) {
        console.warn('Ownership check timed out, allowing purchase anyway');
        setOwnership({ checked: true, owned: false });
      }
    }, 6000);

    fetchOrdersForUser(user.id)
      .then((orders) => {
        if (!active) return;
        if (timeoutId) clearTimeout(timeoutId);
        const orderList = Array.isArray(orders) ? orders : [];
        const ownedSet = collectOwnedCourseIds(orderList);
        const owned = ownedSet.has(String(courseId)) || orderList.some((order) => isOrderOwned(order, courseId));
        setOwnership({ checked: true, owned });
      })
      .catch((error) => {
        if (!active) return;
        if (timeoutId) clearTimeout(timeoutId);
        console.error('Failed to fetch orders:', error);
        setOwnership((prev) => ({ ...prev, checked: true }));
      });

    return () => {
      active = false;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [courseId, user?.id]);

  const canPurchase = useMemo(() => !ownership.owned, [ownership.owned]);

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
        <div style={{ fontSize: '2.5rem', marginBottom: 16, opacity: 0.6 }}>🧘</div>
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
        <div style={{ color: '#fca5a5', fontWeight: 600, marginBottom: 16 }}>
          {t('course.notFound')}
        </div>
        <button type="button" className="btn btn-outline" onClick={() => navigate('/courses')}>
          {t('common.back')}
        </button>
      </div>
    );
  }

  const priceLabel = formatPrice(course.priceCents, course.isFree);
  const accessLabel = formatAccessTimes(course.accessTimes);
  const coverImage = course.coverImage || placeholderImage;
  const isStandalone = course.courseType === 'standalone';
  const seatLabel = isStandalone
    ? t('access.seatsLeftDetail', { left: course.seatsLeft, capacity: course.maxStudents })
    : t('access.seatsLeftDetail', { left: course.seatsLeft, capacity: course.capacity });

  return (
    <div style={{ display: 'grid', gap: 24 }}>
      {/* Hero Cover Section */}
      <div
        className="card-surface"
        style={{
          position: 'relative',
          overflow: 'hidden',
          borderRadius: 28,
          padding: 0,
        }}
      >
        {/* Gradient Overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(180deg, rgba(76, 29, 149, 0.3) 0%, rgba(30, 27, 75, 0.9) 100%)',
            zIndex: 1,
          }}
        />
        
        {/* Cover Image */}
        <img
          src={coverImage}
          alt={course.title}
          style={{ 
            width: '100%', 
            height: 360, 
            objectFit: 'cover', 
            display: 'block',
          }}
        />
        
        {/* Top Badges */}
        <div
          style={{
            position: 'absolute',
            top: 20,
            left: 20,
            right: 20,
            zIndex: 2,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            flexWrap: 'wrap',
            gap: 10,
          }}
        >
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button type="button" className="btn btn-outline" onClick={() => navigate(-1)}>
              {t('common.back')}
            </button>
            <div 
              className="badge"
              style={{
                background: 'rgba(76, 29, 149, 0.9)',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(196, 181, 253, 0.3)',
              }}
            >
              {course.channel || t('course.course')}
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {isStandalone && (
              <div 
                className="badge"
                style={{ 
                  background: 'rgba(251, 191, 36, 0.95)', 
                  color: '#1e1b4b',
                  fontWeight: 700,
                  border: '1px solid rgba(251, 191, 36, 0.5)',
                }}
              >
                ⚡ Standalone
              </div>
            )}
            {!isStandalone && course.sessionCount > 0 && (
              <div 
                className="badge"
                style={{ 
                  background: 'rgba(196, 181, 253, 0.9)', 
                  color: '#1e1b4b',
                  fontWeight: 600,
                  border: '1px solid rgba(196, 181, 253, 0.5)',
                }}
              >
                📅 {course.sessionCount} {t('course.sessions', { count: course.sessionCount }) || 'sessions'}
              </div>
            )}
          </div>
        </div>
        
        {/* Bottom Content */}
        <div style={{ 
          position: 'absolute', 
          bottom: 24, 
          left: 24, 
          right: 24,
          zIndex: 2,
        }}>
          <div style={{ 
            color: '#fbbf24', 
            fontWeight: 700,
            fontSize: '0.9rem',
            marginBottom: 8,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}>
            <span>📍</span>
            {course.branchName}
          </div>
          <h1
            style={{
              margin: '0 0 12px',
              fontFamily: 'var(--font-heading)',
              fontSize: 'clamp(1.75rem, 5vw, 2.5rem)',
              lineHeight: 1.15,
              background: 'linear-gradient(135deg, #fff 0%, #c4b5fd 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            {course.title}
          </h1>
          <div style={{ 
            color: 'var(--secondary-200)', 
            maxWidth: 720,
            lineHeight: 1.6,
          }}>
            {course.description}
          </div>
        </div>
      </div>

      {/* Course Info Card */}
      <div 
        className="card-surface" 
        style={{ 
          padding: 24, 
          display: 'grid', 
          gap: 20,
          background: 'linear-gradient(135deg, rgba(76, 29, 149, 0.2) 0%, rgba(59, 7, 100, 0.15) 100%)',
        }}
      >
        {/* Price and CTA Row */}
        <div style={{ 
          display: 'flex', 
          flexWrap: 'wrap', 
          gap: 16, 
          alignItems: 'center', 
          justifyContent: 'space-between',
        }}>
          <div>
            <div style={{ color: 'var(--secondary-300)', fontSize: '0.9rem', marginBottom: 4 }}>
              {t('course.priceAccess')}
            </div>
            <div style={{ 
              fontSize: '1.75rem', 
              fontWeight: 800,
              color: course.isFree ? '#34d399' : '#fbbf24',
            }}>
              {priceLabel}
            </div>
            <div style={{ color: 'var(--secondary-300)', marginTop: 4 }}>{accessLabel}</div>
          </div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <button type="button" className="btn btn-outline" onClick={() => navigate('/courses')}>
              {t('course.browseOther')}
            </button>
            {canPurchase ? (
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => navigate(`/courses/${courseId}/checkout`)}
                style={{ padding: '14px 28px' }}
              >
                {course.isFree ? t('common.registerNow') : t('common.payOmise')}
              </button>
            ) : (
              <div className="pill success" style={{ padding: '12px 16px', fontWeight: 700 }}>
                {t('course.alreadyPurchased')}
              </div>
            )}
          </div>
        </div>
        
        {/* Divider */}
        <div style={{ 
          height: 1, 
          background: 'linear-gradient(90deg, transparent, rgba(196, 181, 253, 0.2), transparent)',
        }} />
        
        {/* Instructor and Tags Row */}
        <div style={{ 
          display: 'grid', 
          gap: 16, 
          gridTemplateColumns: '1fr', 
          alignItems: 'center',
        }}>
          {/* Instructor */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 16,
            padding: '14px',
            background: 'rgba(196, 181, 253, 0.05)',
            borderRadius: 14,
            border: '1px solid rgba(196, 181, 253, 0.1)',
          }}>
            <img
              src={course.instructorAvatar || placeholderImage}
              alt={course.instructorName}
              style={{ 
                width: 72, 
                height: 72, 
                borderRadius: '50%', 
                border: '2px solid rgba(251, 191, 36, 0.4)', 
                objectFit: 'cover',
              }}
            />
            <div>
              <div style={{ fontWeight: 700, fontSize: '1.1rem', color: '#fff' }}>
                {course.instructorName}
              </div>
              <div style={{ color: 'var(--secondary-300)', marginTop: 4 }}>
                {course.instructorBio || t('instructor.studio')}
              </div>
            </div>
          </div>
          
          {/* Tags */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            {course.tags.map((tag) => (
              <span 
                key={tag} 
                className="badge"
                style={{
                  background: 'rgba(146, 64, 14, 0.15)',
                  borderColor: 'rgba(146, 64, 14, 0.3)',
                  color: '#fcd34d',
                }}
              >
                {tag}
              </span>
            ))}
            {course.level && (
              <span 
                className="badge"
                style={{
                  background: 'rgba(196, 181, 253, 0.1)',
                  borderColor: 'rgba(196, 181, 253, 0.3)',
                }}
              >
                📊 {t('course.level')}: {course.level}
              </span>
            )}
            <span 
              className="badge"
              style={{
                background: course.seatsLeft < 5 
                  ? 'rgba(239, 68, 68, 0.15)' 
                  : 'rgba(16, 185, 129, 0.15)',
                borderColor: course.seatsLeft < 5 
                  ? 'rgba(239, 68, 68, 0.4)' 
                  : 'rgba(16, 185, 129, 0.4)',
                color: course.seatsLeft < 5 ? '#fca5a5' : '#6ee7b7',
              }}
            >
              🎫 {seatLabel}
            </span>
          </div>
        </div>
      </div>

      {/* Sessions or Standalone Info */}
      {isStandalone ? (
        <div 
          className="card-surface" 
          style={{ 
            padding: 24,
            background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.08) 0%, rgba(76, 29, 149, 0.1) 100%)',
            border: '1px solid rgba(251, 191, 36, 0.2)',
          }}
        >
          <h3 style={{
            marginTop: 0,
            marginBottom: 20,
            color: '#fbbf24',
            fontFamily: 'var(--font-heading)',
            fontSize: '1.3rem',
          }}>
            ⚡ {t('course.standalone.title')}
          </h3>
          <div style={{ display: 'grid', gap: 14 }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '12px 16px',
              background: 'rgba(16, 185, 129, 0.1)',
              borderRadius: 12,
              border: '1px solid rgba(16, 185, 129, 0.2)',
            }}>
              <span style={{ fontSize: '1.3rem' }}>✓</span>
              <span style={{ color: '#6ee7b7' }}>
                {t('course.standalone.immediate')}
              </span>
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '12px 16px',
              background: 'rgba(196, 181, 253, 0.1)',
              borderRadius: 12,
              border: '1px solid rgba(196, 181, 253, 0.2)',
            }}>
              <span style={{ fontSize: '1.3rem' }}>✓</span>
              <span style={{ color: 'var(--secondary-200)' }}>
                {t('course.standalone.flexible')}
              </span>
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '12px 16px',
              background: 'rgba(251, 191, 36, 0.1)',
              borderRadius: 12,
              border: '1px solid rgba(251, 191, 36, 0.2)',
            }}>
              <span style={{ fontSize: '1.3rem' }}>✓</span>
              <span style={{ color: '#fbbf24' }}>
                {t('course.standalone.access', { count: course.accessTimes })}
              </span>
            </div>
            {course.enrollmentDeadline && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '12px 16px',
                background: 'rgba(245, 158, 11, 0.1)',
                borderRadius: 12,
                border: '1px solid rgba(245, 158, 11, 0.3)',
              }}>
                <span style={{ fontSize: '1.3rem' }}>⏰</span>
                <span style={{ color: '#fcd34d' }}>
                  {t('course.standalone.deadline')}: {new Date(course.enrollmentDeadline).toLocaleDateString('th-TH', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>
            )}
          </div>
        </div>
      ) : (
        <section>
          <div className="section-heading">
            <div>
              <h2>{t('course.sessions')}</h2>
              <div className="helper-text">{t('session.timetable')}</div>
            </div>
          </div>
          <SessionList sessions={sessions} fallbackChannel={course.channel || t('course.course')} />
        </section>
      )}
    </div>
  );
}

export default CourseDetail;