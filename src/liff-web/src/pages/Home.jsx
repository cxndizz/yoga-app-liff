import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import HeroCarousel from '../components/HeroCarousel';
import CourseCard from '../components/CourseCard';
import { fetchFeaturedCourses } from '../lib/courseApi';

function Home() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [status, setStatus] = useState('idle');

  useEffect(() => {
    let active = true;
    setStatus('loading');

    fetchFeaturedCourses({ limit: 8 })
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
  }, []);

  const featured = useMemo(() => courses.slice(0, 4), [courses]);
  const slides = useMemo(
    () =>
      courses.slice(0, 3).map((course) => ({
        id: course.id,
        title: course.title,
        subtitle: course.description || 'คอร์สที่ทีมคัดมาเป็นพิเศษ',
        ctaLabel: course.isFree ? 'ลงทะเบียนฟรี' : 'จองคอร์สนี้',
        image: course.coverImage,
        branchName: course.branchName,
        channel: course.channel,
      })),
    [courses],
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      <HeroCarousel slides={slides} isLoading={status === 'loading'} />

      <section>
        <div className="section-heading">
          <div>
            <h2>คอร์สแนะนำ</h2>
            <div className="helper-text">เลือกจากคอร์สยอดนิยม ประสบการณ์แบบ Luxury พร้อมจองได้ทันที</div>
          </div>
          <button type="button" className="btn btn-outline" onClick={() => navigate('/courses')}>
            ดูทั้งหมด
          </button>
        </div>

        {status === 'loading' && <div className="helper-text">กำลังโหลดคอร์ส...</div>}
        {status === 'error' && <div className="helper-text">เกิดข้อผิดพลาดในการโหลดข้อมูล</div>}

        <div className="grid">
          {featured.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
          {status === 'ready' && featured.length === 0 && (
            <div className="helper-text">ยังไม่พบคอร์สที่เปิดรับจองในระบบ</div>
          )}
        </div>
      </section>

      <section className="card-surface" style={{ padding: 20, borderRadius: 18, display: 'grid', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
          <div className="badge">Omise Payment</div>
          <div className="badge">Hybrid / Onsite / Online</div>
        </div>
        <div style={{ fontSize: '1.05rem', color: '#e6e9f3' }}>
          ประสบการณ์จองและชำระเงินที่ไหลลื่น — ใช้ Omise Payment เชื่อมต่อกับ SchemaDB เดิม รองรับทั้งผู้ใช้ที่
          Login ผ่าน LINE LIFF และข้อมูลสิทธิ์เข้าคอร์สแบบเรียลไทม์
        </div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <button type="button" className="btn btn-primary" onClick={() => navigate('/courses')}>
            เริ่มเลือกคอร์ส
          </button>
          <button type="button" className="btn btn-outline" onClick={() => navigate('/courses?filter=premium')}>
            คอร์สระดับพรีเมียม
          </button>
        </div>
      </section>
    </div>
  );
}

export default Home;
