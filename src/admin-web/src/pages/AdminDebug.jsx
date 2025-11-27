import React, { useMemo, useState } from 'react';
import axios from 'axios';
import { apiBase } from '../config';

const RESOURCES = [
  {
    value: 'orders',
    label: 'ออเดอร์ (Orders)',
    description: 'ลบออเดอร์พร้อมเคลียร์การชำระเงินและการลงทะเบียนที่อ้างถึง',
  },
  {
    value: 'payments',
    label: 'การชำระเงิน (Payments)',
    description: 'ลบเฉพาะบันทึกการชำระเงิน ไม่แตะต้องออเดอร์',
  },
  {
    value: 'enrollments',
    label: 'การลงทะเบียนเรียน (Enrollments)',
    description: 'ลบเฉพาะข้อมูลการลงทะเบียนเรียน',
  },
];

const parseIds = (input) =>
  input
    .split(/[,\s]+/)
    .map((value) => Number(value))
    .filter((value) => Number.isInteger(value) && value > 0);

function AdminDebug() {
  const [resource, setResource] = useState('orders');
  const [idInput, setIdInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const selectedResource = useMemo(
    () => RESOURCES.find((item) => item.value === resource),
    [resource],
  );

  const handleSubmit = async (event) => {
    event.preventDefault();
    const ids = parseIds(idInput);

    if (ids.length === 0) {
      setError('กรุณาใส่ ID ที่ต้องการลบ (ตัวเลข)');
      setResult(null);
      return;
    }

    const confirmation = confirm(
      `ยืนยันการลบ ${ids.length} รายการสำหรับ ${selectedResource?.label || resource} ?\n` +
        `รายการเหล่านี้จะถูกลบถาวรและไม่สามารถกู้คืนได้`,
    );

    if (!confirmation) {
      return;
    }

    setIsSubmitting(true);
    setError('');
    setResult(null);

    try {
      const response = await axios.post(`${apiBase}/api/admin/debug/delete-records`, {
        resource,
        ids,
      });
      setResult(response.data);
    } catch (err) {
      console.error('Failed to delete records', err);
      setError(err.response?.data?.message || 'เกิดข้อผิดพลาด ไม่สามารถลบข้อมูลได้');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="page">
      <div className="page__header">
        <div>
          <h1 className="page__title">Debug / Data Cleanup</h1>
          <p className="page__subtitle">
            เครื่องมือสำหรับลบข้อมูลเชิงลึก (ใช้เฉพาะ Super Admin) เช่น ออเดอร์ การชำระเงิน และการลงทะเบียน
          </p>
        </div>
      </div>

      <div className="page-card" style={{ boxShadow: 'none', border: '1px solid #e5e7eb' }}>
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <label className="form-field">
              <span className="form-field__label">เลือกข้อมูลที่ต้องการลบ</span>
              <select
                className="select"
                value={resource}
                onChange={(event) => setResource(event.target.value)}
                disabled={isSubmitting}
              >
                {RESOURCES.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
              <small style={{ color: '#6b7280' }}>{selectedResource?.description}</small>
            </label>

            <label className="form-field">
              <span className="form-field__label">ระบุ ID ที่ต้องการลบ</span>
              <textarea
                rows={3}
                className="input"
                placeholder="เช่น 101, 102 หรือคั่นด้วยบรรทัดใหม่"
                value={idInput}
                onChange={(event) => setIdInput(event.target.value)}
                disabled={isSubmitting}
              />
              <small style={{ color: '#6b7280' }}>
                ระบบจะลบเฉพาะตัวเลขที่กรอก (คั่นด้วย , หรือ เว้นบรรทัด) และไม่สามารถกู้คืนได้
              </small>
            </label>
          </div>

          <div
            style={{
              background: '#fef2f2',
              color: '#b91c1c',
              padding: '12px 16px',
              borderRadius: '12px',
              border: '1px solid #fecaca',
              marginTop: '10px',
            }}
          >
            ⚠️ โปรดใช้อย่างระมัดระวัง ระบบจะลบข้อมูลจริงทันที
          </div>

          <div className="page__actions" style={{ marginTop: '16px' }}>
            <button type="submit" className="btn btn--danger" disabled={isSubmitting}>
              {isSubmitting ? 'กำลังลบ...' : 'ลบข้อมูล'}
            </button>
          </div>
        </form>

        {error && (
          <div
            style={{
              marginTop: '16px',
              color: '#b91c1c',
              background: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '12px',
              padding: '12px 16px',
            }}
          >
            {error}
          </div>
        )}

        {result && (
          <div className="page-card" style={{ marginTop: '16px', border: '1px solid #e5e7eb' }}>
            <h3 className="page-card__title">ผลลัพธ์</h3>
            <p style={{ marginBottom: '6px' }}>{result.message}</p>
            {result.processedIds?.length ? (
              <p style={{ color: '#6b7280' }}>IDs: {result.processedIds.join(', ')}</p>
            ) : null}
            {result.removed && (
              <ul style={{ marginTop: '8px' }}>
                {Object.entries(result.removed).map(([key, value]) => (
                  <li key={key}>
                    <strong>{key}:</strong> {value} รายการที่ถูกลบ
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminDebug;
