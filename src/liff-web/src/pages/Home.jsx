import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import HeroCarousel from '../components/HeroCarousel';
import CourseCard from '../components/CourseCard';
import { fetchFeaturedCourses } from '../lib/courseApi';
import { useI18n } from '../lib/i18n';

function Home() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [status, setStatus] = useState('idle');
  const { t, language } = useI18n();

  useEffect(() => {
    let active = true;
    setStatus('loading');

    const copy = {
      branchFallback: t('fallback.branch'),
      instructorFallback: t('fallback.instructor'),
      courseLabel: t('fallback.courseLabel'),
      sessionTopicFallback: t('session.topicFallback'),
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
        subtitle: course.description || t('hero.fallbackSubtitle'),
        ctaLabel: course.isFree ? t('courses.featuredCtaFree') : t('courses.featuredCtaPaid'),
        image: course.coverImage,
        branchName: course.branchName,
        channel: course.channel,
      })),
    [courses, t],
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      <HeroCarousel slides={slides} isLoading={status === 'loading'} />

      <section>
        <div className="section-heading">
          <div>
            <h2>{t('home.featuredTitle')}</h2>
            <div className="helper-text">{t('home.featuredSubtitle')}</div>
          </div>
          <button type="button" className="btn btn-outline" onClick={() => navigate('/courses')}>
            {t('home.viewAll')}
          </button>
        </div>

        {status === 'loading' && <div className="helper-text">{t('home.loading')}</div>}
        {status === 'error' && <div className="helper-text">{t('home.error')}</div>}

        <div className="grid">
          {featured.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
          {status === 'ready' && featured.length === 0 && (
            <div className="helper-text">{t('home.empty')}</div>
          )}
        </div>
      </section>

      <section className="card-surface" style={{ padding: 20, borderRadius: 18, display: 'grid', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
          <div className="badge">{t('home.omisePill1')}</div>
          <div className="badge">{t('home.omisePill2')}</div>
        </div>
        <div style={{ fontSize: '1.05rem', color: '#e6e9f3' }}>{t('home.omiseDescription')}</div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <button type="button" className="btn btn-primary" onClick={() => navigate('/courses')}>
            {t('home.ctaStart')}
          </button>
          <button type="button" className="btn btn-outline" onClick={() => navigate('/courses?filter=premium')}>
            {t('home.ctaPremium')}
          </button>
        </div>
      </section>
    </div>
  );
}

export default Home;
