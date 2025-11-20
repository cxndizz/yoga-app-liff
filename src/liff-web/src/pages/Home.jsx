import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import HeroCarousel from '../components/HeroCarousel';
import CourseCard from '../components/CourseCard';
import { fetchFeaturedCourses } from '../lib/courseApi';
import { useAutoTranslate, useTranslatedText } from '../lib/autoTranslate';

function Home() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [status, setStatus] = useState('idle');
  const { language } = useAutoTranslate();
  const labels = useTranslatedText(
    useMemo(
      () => ({
        branchFallback: 'Unspecified branch',
        instructorFallback: 'Unspecified instructor',
        courseLabel: 'Course',
        sessionTopicFallback: 'Session',
        heroFallbackSubtitle: 'Hand-picked experiences by our studio team',
        featuredCtaFree: 'Register for free',
        featuredCtaPaid: 'Book this course',
        featuredTitle: 'Featured courses',
        featuredSubtitle: 'Curated classes with real-time availability',
        viewAll: 'View all',
        loading: 'Loading courses...',
        error: 'Unable to load courses right now',
        empty: 'No courses are open for booking yet',
        omisePill1: 'Omise Payment',
        omisePill2: 'Hybrid / Onsite / Online',
        omiseDescription:
          'Seamless booking and payments with Omise and shared SchemaDB — works with LINE LIFF login and real-time access control.',
        ctaStart: 'Start browsing',
        ctaPremium: 'Premium courses',
        heroSignature: 'SIGNATURE EXPERIENCE',
        heroSecondaryCta: 'Find the right course',
      }),
      [],
    ),
  );

  useEffect(() => {
    let active = true;
    setStatus('loading');

    const copy = {
      branchFallback: labels.branchFallback,
      instructorFallback: labels.instructorFallback,
      courseLabel: labels.courseLabel,
      sessionTopicFallback: labels.sessionTopicFallback,
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
  }, [language, labels]);

  const featured = useMemo(() => courses.slice(0, 4), [courses]);
  const slides = useMemo(
    () =>
      courses.slice(0, 3).map((course) => ({
        id: course.id,
        title: course.title,
        subtitle: course.description || labels.heroFallbackSubtitle,
        ctaLabel: course.isFree ? labels.featuredCtaFree : labels.featuredCtaPaid,
        image: course.coverImage,
        branchName: course.branchName,
        channel: course.channel,
      })),
    [courses, labels],
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      <HeroCarousel
        slides={slides}
        isLoading={status === 'loading'}
        labels={{
          loading: labels.loading,
          empty: labels.empty,
          signature: labels.heroSignature,
          secondaryCta: labels.heroSecondaryCta,
        }}
      />

      <section>
        <div className="section-heading">
          <div>
            <h2>{labels.featuredTitle}</h2>
            <div className="helper-text">{labels.featuredSubtitle}</div>
          </div>
          <button type="button" className="btn btn-outline" onClick={() => navigate('/courses')}>
            {labels.viewAll}
          </button>
        </div>

        {status === 'loading' && <div className="helper-text">{labels.loading}</div>}
        {status === 'error' && <div className="helper-text">{labels.error}</div>}

        <div className="grid">
          {featured.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
          {status === 'ready' && featured.length === 0 && <div className="helper-text">{labels.empty}</div>}
        </div>
      </section>

      <section className="card-surface" style={{ padding: 20, borderRadius: 18, display: 'grid', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
          <div className="badge">{labels.omisePill1}</div>
          <div className="badge">{labels.omisePill2}</div>
        </div>
        <div style={{ fontSize: '1.05rem', color: '#e6e9f3' }}>{labels.omiseDescription}</div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <button type="button" className="btn btn-primary" onClick={() => navigate('/courses')}>
            {labels.ctaStart}
          </button>
          <button type="button" className="btn btn-outline" onClick={() => navigate('/courses?filter=premium')}>
            {labels.ctaPremium}
          </button>
        </div>
      </section>
    </div>
  );
}

export default Home;
