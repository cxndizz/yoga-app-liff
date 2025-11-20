import React from 'react';

const palette = {
  ink: '#0f172a',
  accent: '#3b82f6',
  accentDark: '#2563eb',
  accentSoft: '#e0ecff',
  border: '#e5e7eb',
  soft: '#f8fafc',
  muted: '#6b7280',
};

const cardStyle = {
  background: '#fff',
  borderRadius: '14px',
  padding: '16px',
  boxShadow: '0 16px 36px rgba(15, 23, 42, 0.08)',
  border: `1px solid ${palette.border}`,
};

function Contact() {
  const channels = [
    {
      title: 'โทรหาเรา',
      detail: '0x-xxx-xxxx (สาขาหลัก)',
      note: 'แนบลิงก์ tel: เพื่อให้โทรออกจากมือถือทันที',
      cta: 'โทรออก',
    },
    {
      title: 'แชทกับแอดมิน',
      detail: 'Line OA: @yourlineid',
      note: 'ใช้ LIFF SDK หรือปุ่มลิงก์กลับไปห้องแชท OA',
      cta: 'เปิดแชท',
    },
    {
      title: 'อีเมล',
      detail: 'support@yoga.local',
      note: 'ส่งอีเมลหรือ webhook ไปแจ้ง Slack/LINE Notify',
      cta: 'ส่งอีเมล',
    },
  ];

  return (
    <div style={{ padding: '18px', fontFamily: 'Inter, system-ui, sans-serif', background: palette.soft, minHeight: '100vh' }}>
      <div style={{ ...cardStyle, background: `linear-gradient(120deg, #0b1224, ${palette.ink})`, color: '#e5e7eb' }}>
        <h2 style={{ margin: '0 0 8px', color: '#fff' }}>ติดต่อ / ขอความช่วยเหลือ</h2>
        <p style={{ margin: 0, color: '#cbd5e1' }}>
          ลูกค้าสามารถติดต่อทีมงานได้ทั้งการโทร แชท LINE OA หรือส่งฟอร์มแจ้งปัญหาเพื่อให้หลังบ้านติดตาม
        </p>
      </div>

      <div style={{ marginTop: '12px', display: 'grid', gap: '12px' }}>
        <div style={cardStyle}>
          <h3 style={{ margin: '0 0 6px', color: palette.ink }}>ช่องทางด่วน</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px' }}>
            {channels.map((item) => (
              <div key={item.title} style={{ border: `1px solid ${palette.border}`, borderRadius: '12px', padding: '12px', background: '#f9fbff' }}>
                <div style={{ fontWeight: 700, color: palette.ink }}>{item.title}</div>
                <div style={{ color: palette.slate }}>{item.detail}</div>
                <div style={{ color: palette.muted, fontSize: '13px', marginTop: '4px' }}>{item.note}</div>
                <button
                  type="button"
                  style={{
                    marginTop: '10px',
                    padding: '10px 12px',
                    background: `linear-gradient(135deg, ${palette.accent} 0%, ${palette.accentDark} 100%)`,
                    color: '#fff',
                    border: 'none',
                    borderRadius: '10px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    width: '100%',
                  }}
                >
                  {item.cta}
                </button>
              </div>
            ))}
          </div>
        </div>

        <div style={cardStyle}>
          <h3 style={{ margin: '0 0 6px', color: palette.ink }}>ฟอร์มแจ้งปัญหา / นัดหมาย</h3>
          <ul style={{ margin: 0, paddingLeft: '18px', lineHeight: 1.6, color: palette.muted }}>
            <li>เปิดจาก Rich Menu ด้วย ?action=contact เพื่อพาลูกค้ามาหน้านี้ทันที</li>
            <li>เก็บข้อมูล: ชื่อ, เบอร์โทร, Email, ปัญหาที่พบ, คอร์สที่เกี่ยวข้อง</li>
            <li>บันทึกลง DB เดียวกับหลังบ้าน หรือยิง webhook ไปยัง Slack/LINE Notify เพื่อให้ทีมรับเรื่องเร็วขึ้น</li>
            <li>แนะนำให้มี dropdown เลือกสาขา/คอร์สเพื่อช่วยจัดลำดับคิว</li>
          </ul>
        </div>

        <div style={cardStyle}>
          <h3 style={{ margin: '0 0 6px', color: palette.ink }}>ข้อมูลสาขา</h3>
          <p style={{ margin: '0 0 8px', color: palette.slate }}>
            สาขาหลัก: 123/4 ถนนสุขภาพดี เขตเรียนโยคะ กรุงเทพมหานคร 10110
          </p>
          <p style={{ margin: '0 0 8px', color: palette.slate }}>
            เวลาเปิด-ปิด: จันทร์ - อาทิตย์ 07:00 - 21:00 น.
          </p>
          <p style={{ margin: 0, color: palette.muted }}>
            สามารถฝัง Google Map iframe หรือปุ่มเปิดแอปแผนที่เพื่อให้ลูกค้าเดินทางสะดวก
          </p>
        </div>
      </div>
    </div>
  );
}

export default Contact;
