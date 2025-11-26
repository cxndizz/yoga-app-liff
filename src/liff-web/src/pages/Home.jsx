import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import HeroCarousel from '../components/HeroCarousel';
import CourseCard from '../components/CourseCard';
import { fetchFeaturedCourses } from '../lib/courseApi';
import { useAutoTranslate } from '../lib/autoTranslate';

function Home() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [status, setStatus] = useState('idle');
  const { language } = useAutoTranslate();
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

    fetchFeaturedCourses({ limit: 8, language, copy })
      .then((data) => {
        if (!active) return;
        setCourses(data);
        setStatus('ready');
      })
      .catch(() => {
        if (!active) return;
        setStatus('error');
      });

    return () => {
      active = false;
    };
  }, [language, t]);

  const featured = useMemo(() => courses.slice(0, 4), [courses]);
  const slides = useMemo(
    () =>
      courses.slice(0, 3).map((course) => ({
        id: course.id,
        title: course.title,
        subtitle: course.description || t('hero.tagline'),
        ctaLabel: course.isFree ? t('common.registerFree') : t('common.bookCourse'),
        image: course.coverImage,
        branchName: course.branchName,
        channel: course.channel,
      })),
    [courses, t],
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 36 }}>
      {/* Hero Carousel */}
      <HeroCarousel
        slides={slides}
        isLoading={status === 'loading'}
        labels={{
          loading: t('course.loadingCourses'),
          empty: t('course.noCoursesBooking'),
          signature: t('hero.signature'),
          secondaryCta: t('hero.findCourse'),
        }}
      />

      {/* Featured Courses Section */}
      <section>
        <div className="section-heading">
          <div>
            <h2>{t('course.featured')}</h2>
            <div className="helper-text">{t('course.featuredSubtitle')}</div>
          </div>
          <button type="button" className="btn btn-outline" onClick={() => navigate('/courses')}>
            {t('common.viewAll')}
          </button>
        </div>

        {status === 'loading' && (
          <div 
            className="helper-text loading-shimmer" 
            style={{ 
              padding: 40, 
              borderRadius: 16,
              textAlign: 'center',
            }}
          >
            {t('course.loadingCourses')}
          </div>
        )}
        {status === 'error' && (
          <div 
            className="helper-text" 
            style={{ 
              padding: 40, 
              borderRadius: 16,
              textAlign: 'center',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#fca5a5',
            }}
          >
            {t('course.errorLoad')}
          </div>
        )}

        <div className="grid">
          {featured.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
          {status === 'ready' && featured.length === 0 && (
            <div 
              className="helper-text" 
              style={{ 
                gridColumn: '1 / -1',
                padding: 40,
                textAlign: 'center',
              }}
            >
              {t('course.noCoursesBooking')}
            </div>
          )}
        </div>
      </section>

      {/* Omise Payment Info Section */}
      <section 
        className="card-surface" 
        style={{ 
          padding: 24, 
          borderRadius: 20, 
          display: 'grid', 
          gap: 18,
          background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.08) 0%, rgba(76, 29, 149, 0.15) 100%)',
          border: '1px solid rgba(251, 191, 36, 0.2)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
          <div 
            className="badge"
            style={{
              background: 'rgba(251, 191, 36, 0.2)',
              borderColor: 'rgba(251, 191, 36, 0.5)',
              color: '#fbbf24',
              fontWeight: 600,
            }}
          >
            💳 {t('hero.omisePayment')}
          </div>
          <div 
            className="badge"
            style={{
              background: 'rgba(196, 181, 253, 0.1)',
              borderColor: 'rgba(196, 181, 253, 0.3)',
            }}
          >
            🌐 {t('hero.hybridTypes')}
          </div>
        </div>
        <div style={{ 
          fontSize: '1.05rem', 
          color: 'var(--secondary-200)',
          lineHeight: 1.6,
        }}>
          {t('hero.omiseDescription')}
        </div>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <button type="button" className="btn btn-primary" onClick={() => navigate('/courses')}>
            {t('hero.startBrowsing')}
          </button>
          <button type="button" className="btn btn-outline" onClick={() => navigate('/courses?filter=premium')}>
            {t('course.premium')}
          </button>
          <button type="button" className="btn btn-outline" onClick={() => navigate('/my-courses')}>
            {t('nav.myCourses')}
          </button>
        </div>
      </section>

      {/* My Courses Preview Section */}
      <section 
        className="card-surface" 
        style={{ 
          padding: 24, 
          borderRadius: 20, 
          display: 'grid', 
          gap: 14,
          background: 'linear-gradient(135deg, rgba(146, 64, 14, 0.08) 0%, rgba(76, 29, 149, 0.1) 100%)',
          border: '1px solid rgba(146, 64, 14, 0.2)',
        }}
      >
        <div className="section-heading" style={{ marginBottom: 0 }}>
          <div>
            <h2 style={{ 
              fontSize: '1.4rem',
              background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
              {t('myCourses.title')}
            </h2>
            <div className="helper-text">{t('myCourses.homeSubtitle')}</div>
          </div>
          <button type="button" className="btn btn-primary" onClick={() => navigate('/my-courses')}>
            {t('checkout.viewMyCourses')}
          </button>
        </div>
        <div className="helper-text" style={{ marginTop: '4px' }}>
          {t('myCourses.homeHint')}
        </div>
        <div style={{ 
          display: 'flex', 
          gap: '10px', 
          flexWrap: 'wrap',
          paddingTop: '12px',
          borderTop: '1px solid rgba(146, 64, 14, 0.15)',
        }}>
          <span 
            className="badge"
            style={{
              background: 'rgba(146, 64, 14, 0.15)',
              borderColor: 'rgba(146, 64, 14, 0.3)',
              color: '#fcd34d',
            }}
          >
            📋 {t('checkout.studentInfo')}
          </span>
          <span 
            className="badge"
            style={{
              background: 'rgba(251, 191, 36, 0.1)',
              borderColor: 'rgba(251, 191, 36, 0.3)',
              color: '#fbbf24',
            }}
          >
            💳 {t('checkout.paymentMethod')}
          </span>
          <span 
            className="badge"
            style={{
              background: 'rgba(245, 158, 11, 0.15)',
              borderColor: 'rgba(245, 158, 11, 0.4)',
              color: '#fcd34d',
            }}
          >
            ⏳ {t('myCourses.statusPending')}
          </span>
        </div>
      </section>
    </div>
  );
}

export default Home;