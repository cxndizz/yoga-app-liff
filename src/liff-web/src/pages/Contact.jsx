import React from 'react';

const containerStyle = {
  padding: '16px',
  fontFamily: 'system-ui, sans-serif',
  background: '#f6f8f7',
  minHeight: '100vh',
};

const cardStyle = {
  background: '#fff',
  borderRadius: '12px',
  padding: '16px',
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
  border: '1px solid #e8eeeb',
};

function Contact() {
  return (
    <div style={containerStyle}>
      <div style={{ ...cardStyle, background: 'linear-gradient(120deg, #e4fff1, #f7fffb)' }}>
        <h2 style={{ margin: '0 0 8px' }}>ติดต่อ / ขอความช่วยเหลือ</h2>
        <p style={{ margin: 0, color: '#2a3d33' }}>
          ลูกค้าสามารถติดต่อทีมงานได้ทั้งการโทร แชท LINE OA หรือส่งฟอร์มแจ้งปัญหาเพื่อให้หลังบ้านติดตาม
        </p>
      </div>

      <div style={{ marginTop: '12px', display: 'grid', gap: '12px' }}>
        <div style={cardStyle}>
          <h3 style={{ margin: '0 0 6px' }}>ช่องทางด่วน</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px' }}>
            {[{
              title: 'โทรหาเรา',
              detail: '0x-xxx-xxxx (สาขาหลัก)',
              note: 'แนบลิงก์ tel: เพื่อให้โทรออกจากมือถือทันที',
            }, {
              title: 'แชทกับแอดมิน',
              detail: 'Line OA: @yourlineid',
              note: 'ใช้ LIFF SDK หรือปุ่มลิงก์กลับไปห้องแชท OA',
            }, {
              title: 'อีเมล',
              detail: 'support@yoga.local',
              note: 'ส่งอีเมลหรือ webhook ไปแจ้ง Slack/LINE Notify',
            }].map((item) => (
              <div key={item.title} style={{ border: '1px solid #e8eeeb', borderRadius: '10px', padding: '12px', background: '#f9fbf9' }}>
                <div style={{ fontWeight: 700 }}>{item.title}</div>
                <div style={{ color: '#1f2f26' }}>{item.detail}</div>
                <div style={{ color: '#47624c', fontSize: '13px', marginTop: '4px' }}>{item.note}</div>
                <button
                  type="button"
                  style={{
                    marginTop: '8px',
                    padding: '10px 12px',
                    background: '#00b900',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    width: '100%',
                  }}
                >
                  เปิดช่องทางนี้
                </button>
              </div>
            ))}
          </div>
        </div>

        <div style={cardStyle}>
          <h3 style={{ margin: '0 0 6px' }}>ฟอร์มแจ้งปัญหา / นัดหมาย</h3>
          <ul style={{ margin: 0, paddingLeft: '18px', lineHeight: 1.6 }}>
            <li>เปิดจาก Rich Menu ด้วย <code>?action=contact</code> เพื่อพาลูกค้ามาหน้านี้ทันที</li>
            <li>เก็บข้อมูล: ชื่อ, เบอร์โทร, Email, ปัญหาที่พบ, คอร์สที่เกี่ยวข้อง</li>
            <li>บันทึกลง DB เดียวกับหลังบ้าน หรือยิง webhook ไปยัง Slack/LINE Notify เพื่อให้ทีมรับเรื่องเร็วขึ้น</li>
            <li>แนะนำให้มี dropdown เลือกสาขา/คอร์สเพื่อช่วยจัดลำดับคิว</li>
          </ul>
        </div>

        <div style={cardStyle}>
          <h3 style={{ margin: '0 0 6px' }}>ข้อมูลสาขา</h3>
          <p style={{ margin: '0 0 8px' }}>
            สาขาหลัก: 123/4 ถนนสุขภาพดี เขตเรียนโยคะ กรุงเทพมหานคร 10110
          </p>
          <p style={{ margin: '0 0 8px' }}>
            เวลาเปิด-ปิด: จันทร์ - อาทิตย์ 07:00 - 21:00 น.
          </p>
          <p style={{ margin: 0, color: '#47624c' }}>
            สามารถฝัง Google Map iframe หรือปุ่มเปิดแอปแผนที่เพื่อให้ลูกค้าเดินทางสะดวก
          </p>
        </div>
      </div>
    </div>
  );
}

export default Contact;
