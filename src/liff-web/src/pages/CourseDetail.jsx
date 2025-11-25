import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import SessionList from '../components/SessionList';
import { fetchCourseDetail } from '../lib/courseApi';
import { placeholderImage } from '../lib/formatters';
import { useAutoTranslate } from '../lib/autoTranslate';

function CourseDetail() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [status, setStatus] = useState('idle');
  const { language, formatPrice, formatAccessTimes } = useAutoTranslate();
  const { t } = useTranslation();

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

  if (status === 'loading') return <div className="helper-text">{t('course.loadingDetails')}</div>;
  if (status === 'error' || !course) return <div className="helper-text">{t('course.notFound')}</div>;

  const priceLabel = formatPrice(course.priceCents, course.isFree);
  const accessLabel = formatAccessTimes(course.accessTimes);
  const coverImage = course.coverImage || placeholderImage;
  const isStandalone = course.courseType === 'standalone';
  const seatLabel = isStandalone
    ? t('access.seatsLeftDetail', { left: course.seatsLeft, capacity: course.maxStudents })
    : t('access.seatsLeftDetail', { left: course.seatsLeft, capacity: course.capacity });
  const ctaLabel = course.isFree ? t('common.registerNow') : t('common.payOmise');

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
            {t('common.back')}
          </button>
          <div className="badge">{course.channel || t('course.course')}</div>
          {isStandalone && (
            <div className="badge" style={{ background: 'rgba(251, 191, 36, 0.9)', color: '#78350f' }}>
              Standalone
            </div>
          )}
          {!isStandalone && course.sessionCount > 0 && (
            <div className="badge" style={{ background: 'rgba(96, 165, 250, 0.9)', color: '#1e3a8a' }}>
              {course.sessionCount} {t('course.sessions', { count: course.sessionCount }) || 'sessions'}
            </div>
          )}
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
            <div style={{ color: 'var(--muted)' }}>{t('course.priceAccess')}</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800 }}>{priceLabel}</div>
            <div style={{ color: 'var(--muted)' }}>{accessLabel}</div>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button type="button" className="btn btn-outline" onClick={() => navigate('/courses')}>
              {t('course.browseOther')}
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() =>
                navigate(course.isFree ? `/courses/${courseId}/checkout` : `/courses/${courseId}/checkout`)
              }
            >
              {ctaLabel}
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
              <div style={{ color: 'var(--muted)' }}>{course.instructorBio || t('instructor.studio')}</div>
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
                {t('course.level')}: {course.level}
              </span>
            )}
            <span className="badge">{seatLabel}</span>
          </div>
        </div>
      </div>

      {isStandalone ? (
        // Standalone Course - No sessions section
        <div className="card-surface" style={{ padding: 18 }}>
          <h3 style={{ marginTop: 0, marginBottom: 12 }}>
            {t('course.standalone.title') || 'เรียนได้ทันที'}
          </h3>
          <div style={{ display: 'grid', gap: 10, color: 'var(--muted)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: '1.2rem' }}>✓</span>
              <span>{t('course.standalone.immediate') || 'เข้าเรียนได้ทันทีหลังลงทะเบียน'}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: '1.2rem' }}>✓</span>
              <span>{t('course.standalone.flexible') || 'ไม่ต้องจองรอบเรียน เรียนได้ตามสะดวก'}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: '1.2rem' }}>✓</span>
              <span>{t('course.standalone.access') || `เข้าเรียนได้ ${course.accessTimes} ครั้ง`}</span>
            </div>
            {course.enrollmentDeadline && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: '1.2rem' }}>⏰</span>
                <span>
                  {t('course.standalone.deadline') || 'ปิดรับสมัคร'}: {new Date(course.enrollmentDeadline).toLocaleDateString('th-TH', {
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
        // Scheduled Course - Show sessions
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

      <div className="mobile-action-bar">
        <div className="mobile-action-bar__meta">
          <span style={{ fontWeight: 800 }}>{priceLabel}</span>
          <span className="helper-text">{seatLabel}</span>
        </div>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => navigate(`/courses/${courseId}/checkout`)}
        >
          {ctaLabel}
        </button>
      </div>
    </div>
  );
}

export default CourseDetail;
