import React, { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import CourseCard from '../components/CourseCard';
import FilterBar from '../components/FilterBar';
import { fetchCourses } from '../lib/courseApi';
import { useAutoTranslate } from '../lib/autoTranslate';

function Courses() {
  const location = useLocation();
  const [courses, setCourses] = useState([]);
  const [search, setSearch] = useState('');
  const [branch, setBranch] = useState('');
  const [instructor, setInstructor] = useState('');
  const [status, setStatus] = useState('idle');
  const { language } = useAutoTranslate();
  const { t } = useTranslation();

  useEffect(() => {
    let active = true;
    setStatus('loading');

    const params = new URLSearchParams(location.search);
    const highlight = params.get('filter');

    const copy = {
      branchFallback: t('branch.unspecified'),
      instructorFallback: t('instructor.unspecified'),
      courseLabel: t('course.course'),
      sessionTopicFallback: t('course.session'),
    };

    fetchCourses({ limit: 100, language, copy })
      .then((data) => {
        if (!active) return;
        setCourses(data);
        if (highlight === 'premium') {
          const premiumCourse = data.find((item) => !item.isFree && item.branchName);
          if (premiumCourse?.branchName) setBranch(premiumCourse.branchName);
        }
        setStatus('ready');
      })
      .catch(() => {
        if (!active) return;
        setStatus('error');
      });

    return () => {
      active = false;
    };
  }, [language, t, location.search]);

  const branches = useMemo(() => [...new Set(courses.map((c) => c.branchName).filter(Boolean))], [courses]);
  const instructors = useMemo(
    () => [...new Set(courses.map((c) => c.instructorName).filter(Boolean))],
    [courses],
  );

  const filtered = useMemo(
    () =>
      courses.filter((course) => {
        const title = course.title || '';
        const matchSearch = title.toLowerCase().includes(search.toLowerCase());
        const matchBranch = branch ? course.branchName === branch : true;
        const matchInstructor = instructor ? course.instructorName === instructor : true;
        return matchSearch && matchBranch && matchInstructor;
      }),
    [courses, search, branch, instructor],
  );

  return (
    <div style={{ display: 'grid', gap: 24 }}>
      {/* Header Section */}
      <div className="section-heading">
        <div>
          <h2>{t('course.all')}</h2>
          <div className="helper-text">{t('filter.searchFilter')}</div>
        </div>
        {/* Course Count Badge */}
        {status === 'ready' && (
          <div 
            className="badge"
            style={{
              background: 'rgba(251, 191, 36, 0.15)',
              borderColor: 'rgba(251, 191, 36, 0.4)',
              color: '#fbbf24',
              fontWeight: 600,
            }}
          >
            {filtered.length} {t('course.course')}
            {filtered.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>

      {/* Filter Bar */}
      <FilterBar
        search={search}
        onSearch={setSearch}
        category={branch}
        onCategory={setBranch}
        instructor={instructor}
        onInstructor={setInstructor}
        categories={branches}
        instructors={instructors}
      />

      {/* Loading State */}
      {status === 'loading' && (
        <div 
          className="loading-shimmer"
          style={{ 
            padding: 60, 
            borderRadius: 20,
            textAlign: 'center',
            color: 'var(--secondary-300)',
          }}
        >
          <div style={{ fontSize: '2rem', marginBottom: 12, opacity: 0.7 }}>📚</div>
          {t('course.loadingAll')}
        </div>
      )}

      {/* Error State */}
      {status === 'error' && (
        <div 
          className="card-surface"
          style={{ 
            padding: 60, 
            borderRadius: 20,
            textAlign: 'center',
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
          }}
        >
          <div style={{ fontSize: '2rem', marginBottom: 12 }}>⚠️</div>
          <div style={{ color: '#fca5a5', fontWeight: 600 }}>{t('course.errorFetch')}</div>
        </div>
      )}

      {/* Courses Grid */}
      <div className="grid">
        {filtered.map((course, index) => (
          <div 
            key={course.id}
            style={{
              animation: `fadeIn 0.4s ease-out ${index * 0.05}s both`,
            }}
          >
            <CourseCard course={course} />
          </div>
        ))}
        
        {/* Empty State */}
        {status === 'ready' && filtered.length === 0 && (
          <div 
            className="card-surface"
            style={{ 
              gridColumn: '1 / -1',
              padding: 60, 
              textAlign: 'center',
              background: 'linear-gradient(135deg, rgba(76, 29, 149, 0.15) 0%, rgba(196, 181, 253, 0.05) 100%)',
            }}
          >
            <div style={{ fontSize: '3rem', marginBottom: 16, opacity: 0.6 }}>🔍</div>
            <div style={{ 
              color: 'var(--secondary-200)', 
              fontWeight: 600,
              fontSize: '1.1rem',
              marginBottom: 8,
            }}>
              {t('course.noCoursesMatch')}
            </div>
            <div className="helper-text">
              Try adjusting your search or filters
            </div>
            {(search || branch || instructor) && (
              <button
                type="button"
                className="btn btn-outline"
                style={{ marginTop: 20 }}
                onClick={() => {
                  setSearch('');
                  setBranch('');
                  setInstructor('');
                }}
              >
                Clear all filters
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default Courses;