import React, { useEffect, useMemo, useState } from 'react';
import { fetchCheckinEnrollments, submitCheckin } from '../lib/checkinApi';

const CHECKIN_PREFIX = 'yoga-checkin:';

const extractCode = (rawValue = '') => {
  const value = String(rawValue || '').trim();
  if (!value) return '';

  const lower = value.toLowerCase();
  if (lower.startsWith(CHECKIN_PREFIX)) {
    return value.slice(CHECKIN_PREFIX.length);
  }

  try {
    const url = new URL(value);
    return url.searchParams.get('code') || url.searchParams.get('checkin') || value;
  } catch (err) {
    // not a URL, fall back to raw string
  }

  return value;
};

function CheckInScanner({ userId, open, onClose }) {
  const [status, setStatus] = useState({ state: 'idle', message: '' });
  const [processing, setProcessing] = useState(false);
  const [loadingEnrollments, setLoadingEnrollments] = useState(false);
  const [enrollments, setEnrollments] = useState([]);
  const [selectedEnrollmentId, setSelectedEnrollmentId] = useState('');

  useEffect(() => {
    if (!open) {
      setStatus({ state: 'idle', message: '' });
      setProcessing(false);
      setEnrollments([]);
      setSelectedEnrollmentId('');
    }
  }, [open]);

  useEffect(() => {
    if (!open || !userId) return;

    let active = true;
    setLoadingEnrollments(true);
    fetchCheckinEnrollments(userId)
      .then((items) => {
        if (!active) return;
        setEnrollments(items);
        setSelectedEnrollmentId(items[0]?.enrollment_id ? String(items[0].enrollment_id) : '');
      })
      .catch((err) => {
        if (!active) return;
        const message = err.response?.data?.message || err.message || 'ไม่สามารถดึงรายการคอร์สได้';
        setStatus({ state: 'error', message });
        setEnrollments([]);
      })
      .finally(() => {
        if (!active) return;
        setLoadingEnrollments(false);
      });

    return () => {
      active = false;
    };
  }, [open, userId]);

  const selectedEnrollment = useMemo(
    () => enrollments.find((item) => String(item.enrollment_id) === String(selectedEnrollmentId)),
    [enrollments, selectedEnrollmentId]
  );

  const handleScan = async () => {
    if (!userId) {
      setStatus({ state: 'error', message: 'กรุณาเข้าสู่ระบบก่อนสแกน' });
      return;
    }

    if (!selectedEnrollment) {
      setStatus({ state: 'error', message: 'กรุณาเลือกคอร์สที่ต้องการใช้สิทธิ์ก่อน' });
      return;
    }

    if (!window?.liff?.scanCodeV2 && !window?.liff?.scanCode) {
      setStatus({ state: 'error', message: 'ไม่สามารถเปิดกล้องสแกนจาก LIFF ได้' });
      return;
    }

    setProcessing(true);
    setStatus({ state: 'idle', message: 'กำลังเปิดกล้อง...' });

    try {
      const openScanner = async () => {
        const liff = window?.liff;
        if (!liff) throw new Error('ไม่พบ LIFF');

        if (typeof liff.scanCodeV2 === 'function') {
          try {
            return await liff.scanCodeV2();
          } catch (err) {
            const errMessage = String(err?.message || '').toLowerCase();
            if (errMessage.includes('not allowed') && typeof liff.scanCode === 'function') {
              return await liff.scanCode();
            }
            throw err;
          }
        }

        if (typeof liff.scanCode === 'function') {
          return await liff.scanCode();
        }

        throw new Error('ไม่พบความสามารถสแกนจาก LIFF');
      };

      const result = await openScanner();
      const rawValue = result?.value || result?.result || '';
      const code = extractCode(rawValue);
      if (!code) {
        setStatus({ state: 'error', message: 'QR ไม่ถูกต้อง' });
        return;
      }

      const response = await submitCheckin({
        userId,
        code,
        courseId: selectedEnrollment.course_id,
        enrollmentId: selectedEnrollment.enrollment_id,
      });
      setStatus({ state: 'success', message: response?.message || 'บันทึกการเข้าเรียนแล้ว' });
    } catch (err) {
      const message = err.response?.data?.message || err.message || 'ไม่สามารถบันทึกการเข้าเรียนได้';
      setStatus({ state: 'error', message });
    } finally {
      setProcessing(false);
    }
  };

  const statusColor = useMemo(() => {
    if (status.state === 'success') return '#10b981';
    if (status.state === 'error') return '#ef4444';
    return '#cbd5e1';
  }, [status.state]);

  if (!open) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.55)',
        display: 'grid',
        placeItems: 'center',
        zIndex: 3000,
        padding: '16px',
      }}
    >
      <div
        className="card-surface"
        style={{
          width: 'min(520px, 96vw)',
          background: '#0b1220',
          border: '1px solid rgba(148, 163, 184, 0.35)',
          borderRadius: '16px',
          padding: '18px',
          position: 'relative',
        }}
      >
        <button
          type="button"
          onClick={onClose}
          style={{
            position: 'absolute',
            top: 10,
            right: 10,
            border: 'none',
            background: 'transparent',
            color: '#e5e7eb',
            fontSize: '18px',
            cursor: 'pointer',
          }}
          aria-label="close"
        >
          ✕
        </button>

        <h3 style={{ margin: '0 0 4px', color: '#e0e7ff' }}>สแกน QR เพื่อตัดสิทธิ์เข้าเรียน</h3>
        <p style={{ margin: '0 0 10px', color: '#94a3b8', fontSize: 14 }}>
          ระบบจะเรียกตัวสแกนของ LINE LIFF เพื่อบันทึกสิทธิ์ที่คุณซื้อไว้
        </p>

        <div
          style={{
            background: 'rgba(148, 163, 184, 0.06)',
            border: '1px solid rgba(148, 163, 184, 0.2)',
            borderRadius: 12,
            padding: 12,
            marginBottom: 12,
            maxHeight: 220,
            overflow: 'auto',
          }}
        >
          <div style={{ color: '#cbd5e1', marginBottom: 8, fontWeight: 600 }}>เลือกคอร์สที่ต้องการใช้สิทธิ์</div>

          {loadingEnrollments && <div style={{ color: '#94a3b8' }}>กำลังโหลดคอร์สที่คุณมีสิทธิ์...</div>}

          {!loadingEnrollments && enrollments.length === 0 && (
            <div style={{ color: '#ef4444', fontSize: 14 }}>
              ไม่พบสิทธิ์ที่สามารถใช้สแกนได้ กรุณาซื้อคอร์สหรือทำรายการใหม่
            </div>
          )}

          {!loadingEnrollments && enrollments.length > 0 && (
            <div style={{ display: 'grid', gap: 8 }}>
              {enrollments.map((item) => {
                const remaining =
                  item.remaining_access === null || item.remaining_access === undefined
                    ? 'ไม่จำกัด'
                    : item.remaining_access;
                const total = item.total_access ?? '-';
                const isSelected = String(item.enrollment_id) === String(selectedEnrollmentId);

                return (
                  <label
                    key={item.enrollment_id}
                    htmlFor={`enroll-${item.enrollment_id}`}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'auto 1fr auto',
                      gap: 10,
                      alignItems: 'center',
                      border: isSelected
                        ? '1px solid rgba(94, 234, 212, 0.8)'
                        : '1px solid rgba(148, 163, 184, 0.35)',
                      borderRadius: 12,
                      padding: 10,
                      background: isSelected ? 'rgba(45, 212, 191, 0.06)' : 'rgba(148, 163, 184, 0.04)',
                      cursor: 'pointer',
                    }}
                  >
                    <input
                      type="radio"
                      id={`enroll-${item.enrollment_id}`}
                      name="enrollment"
                      value={item.enrollment_id}
                      checked={isSelected}
                      onChange={(e) => setSelectedEnrollmentId(e.target.value)}
                    />
                    <div>
                      <div style={{ color: '#e2e8f0', fontWeight: 600 }}>{item.title}</div>
                      <div style={{ color: '#94a3b8', fontSize: 13 }}>
                        สิทธิ์คงเหลือ: {remaining} / รวม {total}
                      </div>
                      {item.last_attended_at && (
                        <div style={{ color: '#94a3b8', fontSize: 12 }}>
                          เข้าเรียนล่าสุด: {new Date(item.last_attended_at).toLocaleString()}
                        </div>
                      )}
                    </div>
                    <div style={{ color: '#cbd5e1', fontSize: 12 }}>เลือก</div>
                  </label>
                );
              })}
            </div>
          )}
        </div>

        <div
          style={{
            background: 'rgba(148, 163, 184, 0.08)',
            border: `1px solid ${statusColor}`,
            color: statusColor,
            borderRadius: 10,
            padding: '10px 12px',
            minHeight: 44,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            marginBottom: 12,
          }}
        >
          {status.state === 'success' && '✅'}
          {status.state === 'error' && '⚠️'}
          {status.state === 'idle' && 'ℹ️'}
          <span style={{ color: '#e2e8f0' }}>
            {status.message || 'กดปุ่ม "เริ่มสแกน" เพื่อเปิดกล้องจาก LINE'}
          </span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button
            type="button"
            className="btn btn-outline"
            onClick={onClose}
            style={{ paddingInline: 16 }}
          >
            ปิดหน้าต่าง
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleScan}
            disabled={processing || !userId || !selectedEnrollment}
            style={{ paddingInline: 16 }}
          >
            {processing ? 'กำลังเปิดกล้อง...' : 'เริ่มสแกน'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default CheckInScanner;
