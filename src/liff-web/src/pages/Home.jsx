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
    <div className="page-stack">
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

      <section aria-labelledby="featured-heading">
        <div className="section-heading">
          <div>
            <h2 id="featured-heading">{t('course.featured')}</h2>
            <div className="helper-text">{t('course.featuredSubtitle')}</div>
          </div>
          <button type="button" className="btn btn-outline" onClick={() => navigate('/courses')}>
            {t('common.viewAll')}
          </button>
        </div>

        {status === 'loading' && <div className="helper-text">{t('course.loadingCourses')}</div>}
        {status === 'error' && <div className="helper-text">{t('course.errorLoad')}</div>}

        <div className="grid" role="list">
          {featured.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
          {status === 'ready' && featured.length === 0 && <div className="helper-text">{t('course.noCoursesBooking')}</div>}
        </div>
      </section>

      <section className="card-surface section-card" aria-labelledby="omise-feature">
        <div className="flow-row">
          <div className="badge">{t('hero.omisePayment')}</div>
          <div className="badge">{t('hero.hybridTypes')}</div>
        </div>
        <div id="omise-feature" className="meta-text" style={{ fontSize: '1.05rem' }}>
          {t('hero.omiseDescription')}
        </div>
        <div className="action-row">
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

      <section className="card-surface section-card" aria-labelledby="my-courses-heading">
        <div className="section-heading" style={{ marginBottom: 0 }}>
          <div>
            <h2 id="my-courses-heading">{t('myCourses.title')}</h2>
            <div className="helper-text">{t('myCourses.homeSubtitle')}</div>
          </div>
          <button type="button" className="btn btn-primary" onClick={() => navigate('/my-courses')}>
            {t('checkout.viewMyCourses')}
          </button>
        </div>
        <div className="helper-text">{t('myCourses.homeHint')}</div>
        <div className="chip-row">
          <span className="badge">{t('checkout.studentInfo')}</span>
          <span className="badge">{t('checkout.paymentMethod')}</span>
          <span className="badge">{t('myCourses.statusPending')}</span>
        </div>
      </section>
    </div>
  );
}

export default Home;
