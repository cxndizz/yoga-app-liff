import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { mockMyCourses } from '../lib/mockData';
import { useAutoTranslate } from '../lib/autoTranslate';
import { formatAccessTimes } from '../lib/formatters';

function statusClass(paymentStatus) {
  if (paymentStatus === 'pending') return 'pill warning';
  if (paymentStatus === 'paid') return 'pill success';
  return 'pill';
}

function MyCourses() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { formatDate, formatPrice, language } = useAutoTranslate();

  const courses = mockMyCourses;

  const renderAccess = (course) => {
    if (course.accessRemaining === -1) return t('access.unlimited');
    if (course.accessRemaining === 0 && course.accessTotal === 0) return t('myCourses.streaming');
    return formatAccessTimes(course.accessRemaining, {
      language,
      singleLabel: t('access.single'),
      unlimitedLabel: t('access.unlimited'),
      multipleTemplate: t('access.multiple', { count: '{count}' }),
    });
  };

  return (
    <div style={{ display: 'grid', gap: 24 }}>
      {/* Header */}
      <div className="section-heading">
        <div>
          <h2>{t('myCourses.title')}</h2>
          <div className="helper-text">{t('myCourses.subtitle')}</div>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button type="button" className="btn btn-outline" onClick={() => navigate('/courses')}>
            {t('common.viewAll')}
          </button>
        </div>
      </div>

      {/* Courses Grid */}
      <div className="grid">
        {courses.map((course, index) => (
          <div 
            key={course.id} 
            className="card-surface mycourse-card"
            style={{
              animation: `fadeIn 0.4s ease-out ${index * 0.1}s both`,
            }}
          >
            {/* Cover Image */}
            <div className="mycourse-cover" aria-hidden>
              <img src={course.coverImage} alt={course.title} />
              {/* Status Overlay */}
              <div
                style={{
                  position: 'absolute',
                  top: 12,
                  right: 12,
                  zIndex: 3,
                }}
              >
                <div 
                  className={statusClass(course.paymentStatus)}
                  style={{
                    background: course.paymentStatus === 'paid' 
                      ? 'rgba(16, 185, 129, 0.9)' 
                      : 'rgba(245, 158, 11, 0.9)',
                    backdropFilter: 'blur(8px)',
                    border: 'none',
                    color: course.paymentStatus === 'paid' ? '#fff' : '#1e1b4b',
                    fontWeight: 700,
                  }}
                >
                  {course.paymentStatus === 'pending' 
                    ? `⏳ ${t('myCourses.statusPending')}` 
                    : `✓ ${t('myCourses.statusPaid')}`}
                </div>
              </div>
            </div>
            
            {/* Body Content */}
            <div className="mycourse-body">
              {/* Header Info */}
              <div className="mycourse-header">
                <div>
                  <div 
                    className="badge"
                    style={{
                      background: 'rgba(251, 191, 36, 0.15)',
                      borderColor: 'rgba(251, 191, 36, 0.4)',
                      color: '#fbbf24',
                    }}
                  >
                    {course.channel}
                  </div>
                  <h3 style={{ color: '#fff' }}>{course.title}</h3>
                  <div className="helper-text">📍 {course.branchName}</div>
                  <div className="helper-text">👤 {course.instructorName}</div>
                </div>
              </div>

              {/* Meta Information */}
              <div className="mycourse-meta">
                {/* Next Session */}
                <div 
                  style={{
                    padding: '12px',
                    background: 'rgba(196, 181, 253, 0.05)',
                    borderRadius: '12px',
                    border: '1px solid rgba(196, 181, 253, 0.1)',
                  }}
                >
                  <div className="helper-text" style={{ marginBottom: 4 }}>
                    📅 {t('myCourses.nextSession')}
                  </div>
                  <div style={{ fontWeight: 700, color: '#fff' }}>
                    {formatDate(course.nextSession.date)} · {course.nextSession.time}
                  </div>
                  <div className="helper-text" style={{ marginTop: 4 }}>
                    {course.nextSession.topic}
                  </div>
                </div>
                
                {/* Remaining Access */}
                <div 
                  style={{
                    padding: '12px',
                    background: 'rgba(251, 191, 36, 0.05)',
                    borderRadius: '12px',
                    border: '1px solid rgba(251, 191, 36, 0.1)',
                  }}
                >
                  <div className="helper-text" style={{ marginBottom: 4 }}>
                    🎫 {t('myCourses.remaining')}
                  </div>
                  <div style={{ fontWeight: 700, color: '#fbbf24' }}>
                    {renderAccess(course)}
                  </div>
                  <div className="helper-text" style={{ marginTop: 4 }}>
                    {t('myCourses.reference', { ref: course.reference })}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="mycourse-actions">
                <div>
                  <div className="helper-text">{t('myCourses.amount')}</div>
                  <div style={{ 
                    fontWeight: 800, 
                    fontSize: '1.1rem',
                    color: course.isFree ? '#34d399' : '#fbbf24',
                  }}>
                    {formatPrice(course.priceCents, course.isFree)}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                  {course.paymentStatus === 'pending' && (
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={() => navigate(`/courses/${course.courseId || course.id}/checkout`)}
                    >
                      💳 {t('myCourses.payNow')}
                    </button>
                  )}
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={() => navigate(`/courses/${course.courseId || course.id}`)}
                  >
                    {t('myCourses.goToCourse')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State Message */}
      {courses.length === 0 && (
        <div 
          className="card-surface"
          style={{ 
            padding: 60, 
            textAlign: 'center',
            background: 'linear-gradient(135deg, rgba(76, 29, 149, 0.15) 0%, rgba(196, 181, 253, 0.05) 100%)',
          }}
        >
          <div style={{ fontSize: '3rem', marginBottom: 16, opacity: 0.6 }}>📚</div>
          <div style={{ 
            color: 'var(--secondary-200)', 
            fontWeight: 600,
            fontSize: '1.1rem',
            marginBottom: 8,
          }}>
            No courses yet
          </div>
          <div className="helper-text" style={{ marginBottom: 20 }}>
            Browse our catalog to find your perfect course
          </div>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => navigate('/courses')}
          >
            Browse Courses
          </button>
        </div>
      )}

      {/* Mock Data Notice */}
      <div 
        className="card-surface" 
        style={{ 
          padding: 18,
          background: 'linear-gradient(135deg, rgba(146, 64, 14, 0.1) 0%, rgba(76, 29, 149, 0.05) 100%)',
          border: '1px solid rgba(146, 64, 14, 0.2)',
          textAlign: 'center',
        }}
      >
        <div className="helper-text" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <span style={{ color: '#b45309' }}>⚠️</span>
          {t('myCourses.mockData')}
        </div>
      </div>
    </div>
  );
}

export default MyCourses;