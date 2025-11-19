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
    <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '700', marginBottom: '8px' }}>จัดการผู้ใช้งาน</h1>
        <p style={{ color: '#6b7280', margin: 0 }}>ดูข้อมูลและจัดการสมาชิกทั้งหมดในระบบ</p>
      </div>

      {error && (
        <div style={{
          background: '#fee2e2',
          border: '1px solid #fecaca',
          color: '#991b1b',
          padding: '12px 16px',
          borderRadius: '8px',
          marginBottom: '16px',
        }}>
          {error}
        </div>
      )}

      <div style={{
        background: '#fff',
        borderRadius: '12px',
        padding: '24px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
          gap: '16px',
          flexWrap: 'wrap',
        }}>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: '600', margin: 0 }}>สมาชิกทั้งหมด</h2>
            <p style={{ color: '#6b7280', fontSize: '14px', margin: '4px 0 0' }}>
              ทั้งหมด {filteredUsers.length} รายการ
              {searchTerm && ` (จากทั้งหมด ${users.length} รายการ)`}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <input
              type="text"
              placeholder="ค้นหาชื่อ, อีเมล, เบอร์..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                padding: '10px 16px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '14px',
                width: '280px',
              }}
            />
            <button
              onClick={fetchUsers}
              disabled={loading}
              style={{
                background: '#667eea',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                padding: '10px 20px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.6 : 1,
              }}
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
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#6b7280' }}>
            <svg style={{ width: '64px', height: '64px', margin: '0 auto 16px', opacity: 0.3 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <p style={{ fontSize: '16px', marginBottom: '8px' }}>
              {searchTerm ? 'ไม่พบผู้ใช้ที่ค้นหา' : 'ยังไม่มีสมาชิกในระบบ'}
            </p>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                style={{
                  background: 'transparent',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  padding: '6px 12px',
                  fontSize: '13px',
                  color: '#6b7280',
                  cursor: 'pointer',
                }}
              >
                ล้างการค้นหา
              </button>
            )}
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '14px',
            }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e5e7eb', textAlign: 'left' }}>
                  <th style={{ padding: '12px 8px', fontWeight: '600', color: '#374151' }}>ID</th>
                  <th style={{ padding: '12px 8px', fontWeight: '600', color: '#374151' }}>Line User ID</th>
                  <th style={{ padding: '12px 8px', fontWeight: '600', color: '#374151' }}>ชื่อ-นามสกุล</th>
                  <th style={{ padding: '12px 8px', fontWeight: '600', color: '#374151' }}>อีเมล</th>
                  <th style={{ padding: '12px 8px', fontWeight: '600', color: '#374151' }}>เบอร์โทร</th>
                  <th style={{ padding: '12px 8px', fontWeight: '600', color: '#374151' }}>สมัครเมื่อ</th>
                </tr>
              </thead>
              <tbody>
                {visibleUsers.map((user) => (
                  <tr key={user.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '12px 8px', color: '#6b7280' }}>#{user.id}</td>
                    <td style={{ padding: '12px 8px' }}>
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
                    <td style={{ padding: '12px 8px', fontWeight: '500' }}>
                      {user.full_name || <span style={{ color: '#9ca3af' }}>ไม่ระบุ</span>}
                    </td>
                    <td style={{ padding: '12px 8px', color: '#6b7280' }}>
                      {user.email || <span style={{ color: '#9ca3af' }}>ไม่ระบุ</span>}
                    </td>
                    <td style={{ padding: '12px 8px', color: '#6b7280' }}>
                      {user.phone || <span style={{ color: '#9ca3af' }}>ไม่ระบุ</span>}
                    </td>
                    <td style={{ padding: '12px 8px', color: '#6b7280', fontSize: '13px' }}>
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