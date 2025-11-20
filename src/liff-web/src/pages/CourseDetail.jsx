import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import SessionList from '../components/SessionList';
import { fetchCourseDetail } from '../lib/courseApi';
import { placeholderImage } from '../lib/formatters';
import { useI18n } from '../lib/i18n';

function CourseDetail() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [status, setStatus] = useState('idle');
  const { t, language, formatPrice, formatAccessTimes } = useI18n();

  useEffect(() => {
    let active = true;
    setStatus('loading');

    const copy = {
      branchFallback: t('fallback.branch'),
      instructorFallback: t('fallback.instructor'),
      courseLabel: t('detail.channelFallback'),
      sessionTopicFallback: t('session.topicFallback'),
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

  if (status === 'loading') return <div className="helper-text">{t('detail.loading')}</div>;
  if (status === 'error' || !course)
    return <div className="helper-text">{t('detail.error')}</div>;

  const priceLabel = formatPrice(course.priceCents, course.isFree);
  const accessLabel = formatAccessTimes(course.accessTimes);
  const coverImage = course.coverImage || placeholderImage;
  const seatLabel = t('detail.seatsLeft', { left: course.seatsLeft, capacity: course.capacity });

  return (
    <div style={{ display: 'grid', gap: 18 }}>
      <div
        className="card-surface"
        style={{
          position: 'relative',
          overflow: 'hidden',
          borderRadius: 24,
          padding: 0,
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(135deg, rgba(11,26,60,0.6), rgba(231,177,160,0.25))',
            zIndex: 1,
          }}
        />
        <img
          src={coverImage}
          alt={course.title}
          style={{ width: '100%', height: 320, objectFit: 'cover', display: 'block' }}
        />
        <div
          style={{
            position: 'absolute',
            top: 16,
            left: 16,
            zIndex: 2,
            display: 'flex',
            gap: 10,
          }}
        >
          <button type="button" className="btn btn-outline" onClick={() => navigate(-1)}>
            {t('detail.back')}
          </button>
          <div className="badge">{course.channel || t('detail.channelFallback')}</div>
        </div>
        <div style={{ position: 'absolute', bottom: 18, left: 18, zIndex: 2, right: 18 }}>
          <div style={{ color: 'var(--rose)', fontWeight: 700 }}>{course.branchName}</div>
          <h1
            style={{
              margin: '6px 0',
              fontFamily: 'var(--font-heading)',
              fontSize: '2rem',
              lineHeight: 1.2,
            }}
          >
            {course.title}
          </h1>
          <div style={{ color: '#e8ecf5', maxWidth: 720 }}>{course.description}</div>
        </div>
      </div>

      <div className="card-surface" style={{ padding: 18, display: 'grid', gap: 12 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ color: 'var(--muted)' }}>{t('detail.priceAccess')}</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800 }}>{priceLabel}</div>
            <div style={{ color: 'var(--muted)' }}>{accessLabel}</div>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button type="button" className="btn btn-outline" onClick={() => navigate('/courses')}>
              {t('detail.chooseOther')}
            </button>
            <button type="button" className="btn btn-primary">
              {course.isFree ? t('detail.registerNow') : t('detail.buyNow')}
            </button>
          </div>
        </div>
        <div style={{ display: 'grid', gap: 10, gridTemplateColumns: '1fr', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <img
              src={course.instructorAvatar || placeholderImage}
              alt={course.instructorName}
              style={{ width: 64, height: 64, borderRadius: '50%', border: '1px solid var(--border)', objectFit: 'cover' }}
            />
            <div>
              <div style={{ fontWeight: 700, fontSize: '1.05rem' }}>{course.instructorName}</div>
              <div style={{ color: 'var(--muted)' }}>{course.instructorBio || t('card.instructorBioFallback')}</div>
            </div>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {course.tags.map((tag) => (
              <span key={tag} className="badge">
                {tag}
              </span>
            ))}
            {course.level && (
              <span className="badge">
                {t('detail.levelLabel')}: {course.level}
              </span>
            )}
            <span className="badge">{seatLabel}</span>
          </div>
        </div>
      </div>

      <section>
        <div className="section-heading">
          <div>
            <h2>{t('detail.sessionsTitle')}</h2>
            <div className="helper-text">{t('detail.sessionsSubtitle')}</div>
          </div>
        </div>
        <SessionList sessions={sessions} fallbackChannel={course.channel || t('detail.channelFallback')} />
      </section>
    </div>
  );
}

export default CourseDetail;
