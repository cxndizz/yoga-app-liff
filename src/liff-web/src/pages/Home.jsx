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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
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

        {status === 'loading' && <div className="helper-text">{t('course.loadingCourses')}</div>}
        {status === 'error' && <div className="helper-text">{t('course.errorLoad')}</div>}

        <div className="grid">
          {featured.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
          {status === 'ready' && featured.length === 0 && <div className="helper-text">{t('course.noCoursesBooking')}</div>}
        </div>
      </section>

      <section className="card-surface" style={{ padding: 20, borderRadius: 18, display: 'grid', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
          <div className="badge">{t('hero.omisePayment')}</div>
          <div className="badge">{t('hero.hybridTypes')}</div>
        </div>
        <div style={{ fontSize: '1.05rem', color: '#e6e9f3' }}>{t('hero.omiseDescription')}</div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <button type="button" className="btn btn-primary" onClick={() => navigate('/courses')}>
            {t('hero.startBrowsing')}
          </button>
          <button type="button" className="btn btn-outline" onClick={() => navigate('/courses?filter=premium')}>
            {t('course.premium')}
          </button>
        </div>
      </section>
    </div>
  );
}

export default Home;
