import React, { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import CourseCard from '../components/CourseCard';
import FilterBar from '../components/FilterBar';
import { fetchCourses } from '../lib/courseApi';

function Courses() {
  const location = useLocation();
  const [courses, setCourses] = useState([]);
  const [search, setSearch] = useState('');
  const [branch, setBranch] = useState('');
  const [instructor, setInstructor] = useState('');
  const [status, setStatus] = useState('idle');

  useEffect(() => {
    let active = true;
    setStatus('loading');

    const params = new URLSearchParams(location.search);
    const highlight = params.get('filter');

    fetchCourses({ limit: 100 })
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
  }, [location.search]);

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
    <div style={{ display: 'grid', gap: 18 }}>
      <div className="section-heading">
        <div>
          <h2>คอร์สทั้งหมด</h2>
          <div className="helper-text">ค้นหาและกรองคอร์สด้วยหมวดหมู่ สาขา และผู้สอน</div>
        </div>
      </div>

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

      {status === 'loading' && <div className="helper-text">กำลังโหลดคอร์สทั้งหมด...</div>}
      {status === 'error' && <div className="helper-text">ไม่สามารถดึงข้อมูลคอร์สได้</div>}

      <div className="grid">
        {filtered.map((course) => (
          <CourseCard key={course.id} course={course} />
        ))}
        {status === 'ready' && filtered.length === 0 && (
          <div className="helper-text">ไม่มีคอร์สที่ตรงกับเงื่อนไขการค้นหา</div>
        )}
      </div>
    </div>
  );
}

export default Courses;
