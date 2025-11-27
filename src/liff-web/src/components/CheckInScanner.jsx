import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
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

  return createPortal(
    <div className="scanner-modal-backdrop">
      <div className="card-surface scanner-modal" role="dialog" aria-modal="true">
        <button type="button" onClick={onClose} className="scanner-modal__close" aria-label="close">
          ✕
        </button>

        <div className="scanner-modal__header">
          <div>
            <h3 className="scanner-modal__title">สแกน QR เพื่อตัดสิทธิ์เข้าเรียน</h3>
            <p className="scanner-modal__subtitle">
              ระบบจะเรียกตัวสแกนของ LINE LIFF เพื่อบันทึกสิทธิ์ที่คุณซื้อไว้
            </p>
          </div>
        </div>

        <div className="scanner-modal__enrollments">
          <div className="scanner-modal__section-title">เลือกคอร์สที่ต้องการใช้สิทธิ์</div>

          {loadingEnrollments && <div className="scanner-modal__hint">กำลังโหลดคอร์สที่คุณมีสิทธิ์...</div>}

          {!loadingEnrollments && enrollments.length === 0 && (
            <div className="scanner-modal__error">
              ไม่พบสิทธิ์ที่สามารถใช้สแกนได้ กรุณาซื้อคอร์สหรือทำรายการใหม่
            </div>
          )}

          {!loadingEnrollments && enrollments.length > 0 && (
            <div className="scanner-modal__options">
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
                    className={`scanner-modal__option ${isSelected ? 'is-selected' : ''}`}
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
                      <div className="scanner-modal__option-title">{item.title}</div>
                      <div className="scanner-modal__option-subtitle">
                        สิทธิ์คงเหลือ: {remaining} / รวม {total}
                      </div>
                      {item.last_attended_at && (
                        <div className="scanner-modal__option-muted">
                          เข้าเรียนล่าสุด: {new Date(item.last_attended_at).toLocaleString()}
                        </div>
                      )}
                    </div>
                    <div className="scanner-modal__option-hint">เลือก</div>
                  </label>
                );
              })}
            </div>
          )}
        </div>

        <div className="scanner-modal__status" style={{ borderColor: statusColor, color: statusColor }}>
          {status.state === 'success' && '✅'}
          {status.state === 'error' && '⚠️'}
          {status.state === 'idle' && 'ℹ️'}
          <span className="scanner-modal__status-text">
            {status.message || 'กดปุ่ม "เริ่มสแกน" เพื่อเปิดกล้องจาก LINE'}
          </span>
        </div>

        <div className="scanner-modal__actions">
          <button type="button" className="btn btn-outline" onClick={onClose}>
            ปิดหน้าต่าง
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleScan}
            disabled={processing || !userId || !selectedEnrollment}
          >
            {processing ? 'กำลังเปิดกล้อง...' : 'เริ่มสแกน'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default CheckInScanner;
