import React from 'react';
import { useNavigate } from 'react-router-dom';

import { formatAccessTimes, formatPriceTHB, placeholderImage } from '../lib/formatters';

function CourseCard({ course }) {
  const navigate = useNavigate();
  const priceLabel = formatPriceTHB(course.priceCents, course.isFree);
  const accessLabel = formatAccessTimes(course.accessTimes);
  const coverImage = course.coverImage || placeholderImage;
  const seatsLabel = Number.isFinite(course.seatsLeft) ? `${course.seatsLeft} ที่นั่ง` : 'ตรวจสอบที่ว่าง';

  return (
    <article
      className="card-surface"
      style={{
        padding: '14px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        height: '100%',
      }}
    >
      <div style={{ position: 'relative' }}>
        <img
          src={coverImage}
          alt={course.title}
          style={{
            width: '100%',
            height: 160,
            objectFit: 'cover',
            borderRadius: '18px',
            border: '1px solid var(--border)',
          }}
        />
        <div
          className="badge"
          style={{ position: 'absolute', top: 10, left: 10, background: 'rgba(11, 26, 60, 0.75)' }}
        >
          {course.channel || 'คอร์ส'}
        </div>
        <div
          className="badge"
          style={{ position: 'absolute', bottom: 10, right: 10, background: 'rgba(231, 177, 160, 0.18)', color: '#0b1a3c' }}
        >
          {seatsLabel}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
        <div>
          <div style={{ color: 'var(--rose)', fontWeight: 600, fontSize: '0.9rem' }}>{course.branchName}</div>
          <h3 style={{ margin: '4px 0 6px', fontSize: '1.05rem', lineHeight: 1.35 }}>{course.title}</h3>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontWeight: 700, color: '#fff' }}>{priceLabel}</div>
          <div style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>{accessLabel}</div>
        </div>
      </div>

      <p style={{ color: '#d9dce7', margin: 0, fontSize: '0.95rem' }}>{course.description}</p>

      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <img
          src={course.instructorAvatar || placeholderImage}
          alt={course.instructorName}
          style={{ width: 44, height: 44, borderRadius: '50%', border: '1px solid var(--border)', objectFit: 'cover' }}
        />
        <div>
          <div style={{ fontWeight: 600 }}>{course.instructorName}</div>
          <div style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>{course.instructorBio || 'ผู้สอนจากสตูดิโอ'}</div>
        </div>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
        {course.tags?.map((tag) => (
          <span key={tag} className="badge" style={{ borderColor: 'rgba(231, 177, 160, 0.25)' }}>
            {tag}
          </span>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: 'auto' }}>
        <button
          type="button"
          className="btn btn-outline"
          onClick={() => navigate(`/courses/${course.id}`)}
        >
          ดูรายละเอียด
        </button>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => navigate(`/courses/${course.id}?action=purchase`)}
        >
          {course.isFree ? 'ลงทะเบียน' : 'ซื้อคอร์ส'}
        </button>
      </div>
    </article>
  );
}

export default CourseCard;
