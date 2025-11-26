import React, { useEffect, useMemo, useState } from 'react';
import { submitCheckin } from '../lib/checkinApi';

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

  useEffect(() => {
    if (!open) {
      setStatus({ state: 'idle', message: '' });
      setProcessing(false);
    }
  }, [open]);

  const handleScan = async () => {
    if (!userId) {
      setStatus({ state: 'error', message: 'กรุณาเข้าสู่ระบบก่อนสแกน' });
      return;
    }

    if (!window?.liff?.scanCodeV2 && !window?.liff?.scanCode) {
      setStatus({ state: 'error', message: 'ไม่สามารถเปิดกล้องสแกนจาก LIFF ได้' });
      return;
    }

    setProcessing(true);
    setStatus({ state: 'idle', message: 'กำลังเปิดกล้อง...' });

    try {
      const result = (await window.liff.scanCodeV2?.()) || (await window.liff.scanCode?.());
      const rawValue = result?.value || result?.result || '';
      const code = extractCode(rawValue);
      if (!code) {
        setStatus({ state: 'error', message: 'QR ไม่ถูกต้อง' });
        return;
      }

      const response = await submitCheckin({ userId, code });
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
            disabled={processing || !userId}
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
