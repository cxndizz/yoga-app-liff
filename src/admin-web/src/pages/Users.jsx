import React, { useEffect, useState } from 'react';
import axios from 'axios';
import TablePagination from '../components/common/TablePagination';
import usePagination from '../hooks/usePagination';

const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${apiBase}/admin/users`);
      setUsers(res.data || []);
      setError('');
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('ไม่สามารถโหลดข้อมูลผู้ใช้ได้');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const filteredUsers = users.filter(user => {
    const term = searchTerm.toLowerCase();
    return (
      user.full_name?.toLowerCase().includes(term) ||
      user.email?.toLowerCase().includes(term) ||
      user.phone?.includes(term) ||
      user.line_user_id?.toLowerCase().includes(term)
    );
  });

  const {
    page,
    pageSize,
    totalItems: totalFilteredUsers,
    paginatedItems: visibleUsers,
    setPage: goToPage,
    setPageSize: changePageSize,
    resetPage,
  } = usePagination(filteredUsers, { initialPageSize: 15 });

  useEffect(() => {
    resetPage();
  }, [searchTerm, resetPage]);

  return (
    <div className="page">
      <div className="page__header">
        <h1 className="page__title">จัดการผู้ใช้งาน</h1>
        <p className="page__subtitle">ดูข้อมูลและจัดการสมาชิกทั้งหมดในระบบ</p>
      </div>

      {error && (
        <div className="page-alert page-alert--error">
          {error}
        </div>
      )}

      <div className="page-card">
        <div className="page-card__header">
          <div>
            <h2 className="page-card__title">สมาชิกทั้งหมด</h2>
            <p style={{ color: '#6b7280', fontSize: '14px', margin: '4px 0 0' }}>
              ทั้งหมด {filteredUsers.length} รายการ
              {searchTerm && ` (จากทั้งหมด ${users.length} รายการ)`}
            </p>
          </div>
          <div className="page__actions">
            <input
              type="text"
              placeholder="ค้นหาชื่อ, อีเมล, เบอร์..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input"
              style={{ width: '280px' }}
            />
            <button
              onClick={fetchUsers}
              disabled={loading}
              className="btn btn--primary"
            >
              {loading ? 'กำลังโหลด...' : 'รีเฟรช'}
            </button>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#6b7280' }}>
            <div style={{
              width: '48px',
              height: '48px',
              border: '4px solid #e5e7eb',
              borderTopColor: '#667eea',
              borderRadius: '50%',
              margin: '0 auto 16px',
              animation: 'spin 1s linear infinite',
            }} />
            <p>กำลังโหลดข้อมูล...</p>
            <style>{`
              @keyframes spin {
                to { transform: rotate(360deg); }
              }
            `}</style>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="empty-state">
            <svg style={{ width: '64px', height: '64px', margin: '0 auto 16px', opacity: 0.3 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <p style={{ fontSize: '16px', marginBottom: '8px' }}>
              {searchTerm ? 'ไม่พบผู้ใช้ที่ค้นหา' : 'ยังไม่มีสมาชิกในระบบ'}
            </p>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="btn btn--ghost btn--small"
              >
                ล้างการค้นหา
              </button>
            )}
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Line User ID</th>
                  <th>ชื่อ-นามสกุล</th>
                  <th>อีเมล</th>
                  <th>เบอร์โทร</th>
                  <th>สมัครเมื่อ</th>
                </tr>
              </thead>
              <tbody>
                {visibleUsers.map((user) => (
                  <tr key={user.id}>
                    <td style={{ color: '#6b7280' }}>#{user.id}</td>
                    <td>
                      <span style={{
                        fontFamily: 'monospace',
                        fontSize: '13px',
                        background: '#f3f4f6',
                        padding: '4px 8px',
                        borderRadius: '4px',
                      }}>
                        {user.line_user_id || '-'}
                      </span>
                    </td>
                    <td style={{ fontWeight: '500' }}>
                      {user.full_name || <span style={{ color: '#9ca3af' }}>ไม่ระบุ</span>}
                    </td>
                    <td style={{ color: '#6b7280' }}>
                      {user.email || <span style={{ color: '#9ca3af' }}>ไม่ระบุ</span>}
                    </td>
                    <td style={{ color: '#6b7280' }}>
                      {user.phone || <span style={{ color: '#9ca3af' }}>ไม่ระบุ</span>}
                    </td>
                    <td style={{ color: '#6b7280', fontSize: '13px' }}>
                      {formatDate(user.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {!loading && (
        <TablePagination
          page={page}
          pageSize={pageSize}
          totalItems={totalFilteredUsers}
          onPageChange={goToPage}
          onPageSizeChange={changePageSize}
        />
      )}
    </div>
  );
}

export default Users;