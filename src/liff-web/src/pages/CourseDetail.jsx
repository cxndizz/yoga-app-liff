import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import SessionList from '../components/SessionList';
import { fetchCourseDetail } from '../lib/courseApi';
import { formatAccessTimes, formatPriceTHB, placeholderImage } from '../lib/formatters';

function CourseDetail() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [status, setStatus] = useState('idle');

  useEffect(() => {
    let active = true;
    setStatus('loading');

    fetchCourseDetail(courseId)
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
  }, [courseId]);

  if (status === 'loading') return <div className="helper-text">กำลังโหลดรายละเอียดคอร์ส...</div>;
  if (status === 'error' || !course)
    return <div className="helper-text">ไม่พบคอร์สที่คุณต้องการ กรุณากลับไปหน้าหลัก</div>;

  const priceLabel = formatPriceTHB(course.priceCents, course.isFree);
  const accessLabel = formatAccessTimes(course.accessTimes);
  const coverImage = course.coverImage || placeholderImage;

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
            ← กลับ
          </button>
          <div className="badge">{course.channel || 'คอร์ส'}</div>
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
            <div style={{ color: 'var(--muted)' }}>ราคา / สิทธิ์เข้าเรียน</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800 }}>{priceLabel}</div>
            <div style={{ color: 'var(--muted)' }}>{accessLabel}</div>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button type="button" className="btn btn-outline" onClick={() => navigate('/courses')}>
              เลือกคอร์สอื่น
            </button>
            <button type="button" className="btn btn-primary">
              {course.isFree ? 'ลงทะเบียนทันที' : 'ซื้อคอร์สผ่าน Omise'}
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
              <div style={{ color: 'var(--muted)' }}>{course.instructorBio || 'ผู้สอนจากสตูดิโอ'}</div>
            </div>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {course.tags.map((tag) => (
              <span key={tag} className="badge">
                {tag}
              </span>
            ))}
            {course.level && <span className="badge">ระดับ: {course.level}</span>}
            <span className="badge">ที่นั่งเหลือ {course.seatsLeft}/{course.capacity}</span>
          </div>
        </div>
      </div>

      <section>
        <div className="section-heading">
          <div>
            <h2>รอบเรียน / Sessions</h2>
            <div className="helper-text">ตารางเรียนปรับตามขนาดหน้าจอ รองรับ Onsite / Online / Hybrid</div>
          </div>
        </div>
        <SessionList sessions={sessions} fallbackChannel={course.channel} />
      </section>
    </div>
  );
}

export default CourseDetail;
