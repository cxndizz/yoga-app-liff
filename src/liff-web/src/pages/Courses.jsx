import React, { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import CourseCard from '../components/CourseCard';
import FilterBar from '../components/FilterBar';
import { courseData } from '../data/sampleData';

function Courses() {
  const location = useLocation();
  const [courses, setCourses] = useState([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [instructor, setInstructor] = useState('');
  const [status, setStatus] = useState('idle');

  useEffect(() => {
    let active = true;
    setStatus('loading');

    // Example: fetch('/api/courses?withInstructor=true')
    //   .then((res) => res.json())
    //   .then((data) => active && setCourses(data.results))
    //   .catch(() => active && setStatus('error'));

    const params = new URLSearchParams(location.search);
    const highlight = params.get('filter');

    setTimeout(() => {
      if (!active) return;
      setCourses(courseData);
      if (highlight === 'premium') setCategory('Performance');
      setStatus('ready');
    }, 320);

    return () => {
      active = false;
    };
  }, [location.search]);

  const categories = useMemo(() => [...new Set(courseData.map((c) => c.category))], []);
  const instructors = useMemo(() => [...new Set(courseData.map((c) => c.instructor.name))], []);

  const filtered = useMemo(
    () =>
      courses.filter((course) => {
        const matchSearch = course.title.toLowerCase().includes(search.toLowerCase());
        const matchCategory = category ? course.category === category : true;
        const matchInstructor = instructor ? course.instructor.name === instructor : true;
        return matchSearch && matchCategory && matchInstructor;
      }),
    [courses, search, category, instructor],
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
        category={category}
        onCategory={setCategory}
        instructor={instructor}
        onInstructor={setInstructor}
        categories={categories}
        instructors={instructors}
      />

      {status === 'loading' && <div className="helper-text">กำลังโหลดคอร์สทั้งหมด...</div>}
      {status === 'error' && <div className="helper-text">ไม่สามารถดึงข้อมูลคอร์สได้</div>}

      <div className="grid">
        {filtered.map((course) => (
          <CourseCard key={course.id} course={course} />
        ))}
      </div>
    </div>
  );
}

export default Courses;
