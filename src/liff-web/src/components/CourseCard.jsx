import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { placeholderImage } from '../lib/formatters';
import { useAutoTranslate } from '../lib/autoTranslate';

function CourseCard({ course }) {
  const navigate = useNavigate();
  const { formatPrice, formatAccessTimes } = useAutoTranslate();
  const { t } = useTranslation();
  
  const priceLabel = formatPrice(course.priceCents, course.isFree);
  const accessLabel = formatAccessTimes(course.accessTimes);
  const coverImage = course.coverImage || placeholderImage;
  const seatsLabel = Number.isFinite(course.seatsLeft)
    ? t('access.seatsCount', { count: course.seatsLeft })
    : t('access.checkAvailability');

  return (
    <article
      className="card-surface"
      style={{
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
        height: '100%',
      }}
    >
      {/* Cover Image Section */}
      <div style={{ position: 'relative', overflow: 'hidden', borderRadius: '16px' }}>
        <img
          src={coverImage}
          alt={course.title}
          style={{
            width: '100%',
            height: 180,
            objectFit: 'cover',
            borderRadius: '16px',
            border: '1px solid rgba(196, 181, 253, 0.2)',
            transition: 'transform 0.3s ease',
          }}
        />
        
        {/* Channel Badge - Top Left */}
        <div
          className="badge"
          style={{ 
            position: 'absolute', 
            top: 12, 
            left: 12, 
            background: 'rgba(76, 29, 149, 0.9)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(196, 181, 253, 0.3)',
          }}
        >
          {course.channel || t('course.course')}
        </div>
        
        {/* Course Type Badge - Top Right */}
        {course.courseType === 'standalone' && (
          <div
            className="badge"
            style={{ 
              position: 'absolute', 
              top: 12, 
              right: 12, 
              background: 'rgba(251, 191, 36, 0.95)', 
              color: '#1e1b4b',
              border: '1px solid rgba(251, 191, 36, 0.5)',
              fontWeight: 700,
            }}
          >
            Standalone
          </div>
        )}
        {course.courseType === 'scheduled' && course.sessionCount > 0 && (
          <div
            className="badge"
            style={{ 
              position: 'absolute', 
              top: 12, 
              right: 12, 
              background: 'rgba(196, 181, 253, 0.9)', 
              color: '#1e1b4b',
              border: '1px solid rgba(196, 181, 253, 0.5)',
              fontWeight: 600,
            }}
          >
            {course.sessionCount} {t('course.sessions', { count: course.sessionCount }) || 'sessions'}
          </div>
        )}
        
        {/* Seats Badge - Bottom Right */}
        <div
          className="badge"
          style={{ 
            position: 'absolute', 
            bottom: 12, 
            right: 12, 
            background: 'rgba(30, 27, 75, 0.9)',
            backdropFilter: 'blur(8px)',
            color: '#fbbf24',
            border: '1px solid rgba(251, 191, 36, 0.3)',
          }}
        >
          {seatsLabel}
        </div>
      </div>

      {/* Course Info Section */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
        <div style={{ flex: 1 }}>
          <div style={{ color: '#fbbf24', fontWeight: 600, fontSize: '0.875rem', marginBottom: '4px' }}>
            {course.branchName}
          </div>
          <h3 style={{ 
            margin: '0 0 4px', 
            fontSize: '1.1rem', 
            lineHeight: 1.35,
            fontFamily: 'var(--font-heading)',
          }}>
            {course.title}
          </h3>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ 
            fontWeight: 700, 
            color: course.isFree ? '#34d399' : '#fbbf24',
            fontSize: '1rem',
          }}>
            {priceLabel}
          </div>
          <div style={{ color: 'var(--secondary-300)', fontSize: '0.85rem' }}>{accessLabel}</div>
        </div>
      </div>

      {/* Description */}
      <p className="line-clamp-2" style={{ 
        color: 'var(--secondary-200)', 
        margin: 0, 
        fontSize: '0.925rem',
        lineHeight: 1.5,
      }}>
        {course.description}
      </p>

      {/* Instructor Section */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '12px',
        padding: '12px',
        background: 'rgba(196, 181, 253, 0.05)',
        borderRadius: '12px',
        border: '1px solid rgba(196, 181, 253, 0.1)',
      }}>
        <img
          src={course.instructorAvatar || placeholderImage}
          alt={course.instructorName}
          style={{ 
            width: 48, 
            height: 48, 
            borderRadius: '50%', 
            border: '2px solid rgba(196, 181, 253, 0.3)', 
            objectFit: 'cover',
          }}
        />
        <div>
          <div style={{ fontWeight: 600, color: '#fff' }}>{course.instructorName}</div>
          <div style={{ color: 'var(--secondary-300)', fontSize: '0.85rem' }}>
            {course.instructorBio || t('instructor.studio')}
          </div>
        </div>
      </div>

      {/* Tags Section */}
      {course.tags?.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {course.tags.map((tag) => (
            <span 
              key={tag} 
              className="badge" 
              style={{ 
                background: 'rgba(146, 64, 14, 0.15)',
                borderColor: 'rgba(146, 64, 14, 0.3)',
                color: '#fcd34d',
                fontSize: '0.8rem',
              }}
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Action Buttons */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: 'auto' }}>
        <button
          type="button"
          className="btn btn-outline"
          onClick={() => navigate(`/courses/${course.id}`)}
        >
          {t('common.viewDetails')}
        </button>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => navigate(`/courses/${course.id}/checkout`)}
        >
          {course.isFree ? t('common.register') : t('common.buyCourse')}
        </button>
      </div>
    </article>
  );
}

export default CourseCard;