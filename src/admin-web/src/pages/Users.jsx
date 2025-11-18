import React, { useEffect, useState } from 'react';
import axios from 'axios';

const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

function Users() {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    axios.get(`${apiBase}/admin/users`)
      .then(res => setUsers(res.data || []))
      .catch(err => console.error(err));
  }, []);

  return (
    <div>
      <h1>ผู้ใช้งาน</h1>
      <table border="1" cellPadding="6">
        <thead>
          <tr>
            <th>ID</th>
            <th>Line User ID</th>
            <th>ชื่อเต็ม</th>
            <th>Email</th>
            <th>เบอร์</th>
            <th>สมัครเมื่อ</th>
          </tr>
        </thead>
        <tbody>
          {users.map(u => (
            <tr key={u.id}>
              <td>{u.id}</td>
              <td>{u.line_user_id}</td>
              <td>{u.full_name}</td>
              <td>{u.email}</td>
              <td>{u.phone}</td>
              <td>{u.created_at}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Users;
