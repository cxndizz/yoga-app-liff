import React, { useEffect, useState } from 'react';
import axios from 'axios';

const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

function Courses() {
  const [courses, setCourses] = useState([]);
  const [form, setForm] = useState({
    title: '',
    description: '',
    capacity: 0,
    is_free: false,
    price_cents: 0,
    access_times: 1,
  });

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = () => {
    axios.get(`${apiBase}/courses`)
      .then(res => setCourses(res.data || []))
      .catch(err => console.error(err));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    axios.post(`${apiBase}/courses`, {
      ...form,
      capacity: Number(form.capacity),
      price_cents: Number(form.price_cents),
      access_times: Number(form.access_times),
    }).then(() => {
      setForm({
        title: '',
        description: '',
        capacity: 0,
        is_free: false,
        price_cents: 0,
        access_times: 1,
      });
      fetchCourses();
    }).catch(err => console.error(err));
  };

  return (
    <div>
      <h1>จัดการคอร์ส</h1>
      <form onSubmit={handleSubmit} style={{ marginBottom: '16px', display: 'grid', gap: '8px', maxWidth: '400px' }}>
        <input
          placeholder="ชื่อคอร์ส"
          value={form.title}
          onChange={e => setForm({ ...form, title: e.target.value })}
        />
        <textarea
          placeholder="รายละเอียด"
          value={form.description}
          onChange={e => setForm({ ...form, description: e.target.value })}
        />
        <input
          type="number"
          placeholder="Capacity"
          value={form.capacity}
          onChange={e => setForm({ ...form, capacity: e.target.value })}
        />
        <label>
          <input
            type="checkbox"
            checked={form.is_free}
            onChange={e => setForm({ ...form, is_free: e.target.checked })}
          />{' '}
          คอร์สฟรี
        </label>
        {!form.is_free && (
          <input
            type="number"
            placeholder="ราคา (บาท)"
            value={form.price_cents}
            onChange={e => setForm({ ...form, price_cents: Number(e.target.value) * 100 })}
          />
        )}
        <input
          type="number"
          placeholder="เข้าได้กี่ครั้ง"
          value={form.access_times}
          onChange={e => setForm({ ...form, access_times: e.target.value })}
        />
        <button type="submit">สร้างคอร์ส</button>
      </form>

      <h2>รายการคอร์ส</h2>
      <table border="1" cellPadding="6">
        <thead>
          <tr>
            <th>ID</th>
            <th>ชื่อคอร์ส</th>
            <th>ประเภท</th>
            <th>ราคา</th>
            <th>Capacity</th>
            <th>Access Times</th>
          </tr>
        </thead>
        <tbody>
          {courses.map(c => (
            <tr key={c.id}>
              <td>{c.id}</td>
              <td>{c.title}</td>
              <td>{c.is_free ? 'ฟรี' : 'เสียเงิน'}</td>
              <td>{c.is_free ? '-' : (c.price_cents || 0) / 100}</td>
              <td>{c.capacity}</td>
              <td>{c.access_times}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Courses;
