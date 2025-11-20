import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const containerStyle = {
  padding: '16px',
  fontFamily: 'system-ui, sans-serif',
  color: '#0b1d16',
  background: 'linear-gradient(180deg, #f7fff7 0%, #ffffff 70%)',
  minHeight: '100vh',
};

const cardStyle = {
  background: '#fff',
  borderRadius: '12px',
  padding: '16px',
  boxShadow: '0 4px 14px rgba(0, 0, 0, 0.06)',
};

const badge = {
  display: 'inline-block',
  padding: '4px 10px',
  borderRadius: '12px',
  background: '#e9f7ef',
  color: '#0f5132',
  fontSize: '12px',
  fontWeight: 700,
};

function Home() {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const entryAction = searchParams.get('action');

  return (
    <div style={containerStyle}>
      <div style={{ ...cardStyle, background: 'linear-gradient(120deg, #c8fce3, #f5fff9)', border: '1px solid #c4f0d6' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ flex: 1 }}>
            <div style={badge}>Customer (LIFF)</div>
            <h1 style={{ margin: '12px 0 8px', fontSize: '26px' }}>NeedHome Yoga & Wellness</h1>
            <p style={{ margin: '0 0 10px', color: '#1f3b2c' }}>
              หน้าจอลูกค้าบน LINE LIFF สำหรับสมัครสมาชิก ดูคอร์ส ซื้อคอร์ส และตรวจสอบตารางเรียนแบบละเอียด
            </p>
            {entryAction && (
              <p style={{ margin: '0 0 8px', fontWeight: 600, color: '#0f5132' }}>
                คุณเข้ามาผ่าน action = <span style={{ fontFamily: 'monospace' }}>{entryAction}</span>
              </p>
            )}
            <div style={{ display: 'flex', gap: '8px', marginTop: '10px', flexWrap: 'wrap' }}>
              <Link to="/courses" style={{ padding: '10px 16px', background: '#00b900', color: '#fff', borderRadius: '8px', textDecoration: 'none', fontWeight: 700 }}>
                ดูคอร์ส & ตารางเรียน
              </Link>
              <Link to="/how-to" style={{ padding: '10px 16px', background: '#0b2f1e', color: '#fff', borderRadius: '8px', textDecoration: 'none', fontWeight: 700 }}>
                ดู Flow สมัคร/ซื้อคอร์ส
              </Link>
              <Link to="/contact" style={{ padding: '10px 16px', background: '#fff', border: '1px solid #0b2f1e', color: '#0b2f1e', borderRadius: '8px', textDecoration: 'none', fontWeight: 700 }}>
                ติดต่อ / ช่วยเหลือ
              </Link>
            </div>
          </div>
          <div style={{ minWidth: '240px' }}>
            <div style={{ ...cardStyle, border: '1px dashed #0b2f1e', background: '#ffffffaa' }}>
              <h3 style={{ margin: '0 0 8px' }}>จุดประสงค์หลัก</h3>
              <ul style={{ margin: 0, paddingLeft: '18px', lineHeight: 1.6 }}>
                <li>รองรับ Rich Menu 5 ปุ่ม (สมัคร, เข้าสู่ระบบ, ดูคอร์ส, วิธีใช้งาน, ติดต่อ)</li>
                <li>เปิด LIFF แล้วพาลูกค้าไปหน้าที่ต้องการทันทีด้วยพารามิเตอร์ <code>?action=</code></li>
                <li>ดึงข้อมูลคอร์ส/ตารางเรียนจาก API กลางเดียวกันกับหลังบ้าน</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div style={{ marginTop: '16px', display: 'grid', gap: '12px' }}>
        <div style={cardStyle}>
          <h2 style={{ margin: '0 0 8px' }}>Flow หลักของลูกค้าบน LIFF</h2>
          <ol style={{ margin: '0 0 8px', lineHeight: 1.6 }}>
            <li>เปิด LIFF ผ่าน Rich Menu (หรือ deeplink) แล้วดึงโปรไฟล์ LINE</li>
            <li>ยินยอมและบันทึกข้อมูลสมาชิก (full name / email / phone) ผ่าน API <code>/auth/line-login</code></li>
            <li>สำรวจคอร์สและรอบเรียน → สร้างคำสั่งซื้อ <code>/orders</code></li>
            <li>จ่ายเงินผ่าน Omise → รอ webhook จาก Omise อัปเดตสถานะ</li>
            <li>ดูประวัติคำสั่งซื้อผ่าน <code>/users/orders</code> และลิงก์วิธีเข้าเรียน/ตารางเรียน</li>
            <li>ต้องการความช่วยเหลือ → ปุ่มโทร / เปิดแชท LINE / ฟอร์มแจ้งปัญหา</li>
          </ol>
          <p style={{ margin: 0, color: '#47624c' }}>
            ทุกขั้นตอนใช้ฐานข้อมูลเดียวกับหลังบ้าน ทำให้คอร์ส ตารางเรียน และสถานะคำสั่งซื้ออัปเดตตรงกันทั้งสองระบบ
          </p>
        </div>

        <div style={cardStyle}>
          <h2 style={{ margin: '0 0 8px' }}>Mapping ระหว่าง Rich Menu → LIFF Action</h2>
          <div style={{ display: 'grid', gap: '10px' }}>
            {[
              { label: 'สมัครสมาชิก', action: 'register', target: 'หน้า Home พร้อม banner อธิบายสิทธิ์' },
              { label: 'เข้าสู่ระบบ', action: 'login', target: 'หน้า Home และเช็ก session/LineID' },
              { label: 'ดูคอร์ส', action: 'courses', target: 'หน้า Courses พร้อมตารางรอบเรียน' },
              { label: 'วิธีใช้งาน', action: 'howto', target: 'หน้า Flow & FAQ' },
              { label: 'ติดต่อเรา', action: 'contact', target: 'หน้า Contact + CTA โทร/แชท' },
            ].map((item) => (
              <div
                key={item.action}
                style={{
                  border: '1px solid #e3e8e6',
                  borderRadius: '10px',
                  padding: '10px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: '12px',
                  flexWrap: 'wrap',
                  background: '#f9fbf9',
                }}
              >
                <div>
                  <div style={{ fontWeight: 700 }}>{item.label}</div>
                  <div style={{ color: '#47624c' }}>พารามิเตอร์: <code>?action={item.action}</code></div>
                  <div style={{ color: '#2f4436' }}>ไปยัง: {item.target}</div>
                </div>
                <div style={{ alignSelf: 'center' }}>
                  <code>https://your-ngrok.ngrok-free.app/?action={item.action}</code>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={cardStyle}>
          <h2 style={{ margin: '0 0 8px' }}>สิ่งที่ลูกค้าทำได้ทันที</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
            {[{
              title: 'ดูคอร์ส & ตารางรอบเรียน',
              desc: 'ค้นหา/กรองคอร์ส ดูรอบเช้า–บ่าย สาขา และความจุที่เหลือ',
            }, {
              title: 'จองหรือซื้อทันที',
              desc: 'กดซื้อ สร้างคำสั่งซื้อ แล้วเด้งไปหน้าชำระเงิน Omise พร้อม webhook แจ้งผล',
            }, {
              title: 'ดูประวัติคำสั่งซื้อ',
              desc: 'บันทึกการซื้อไว้ในฐานข้อมูล สามารถเรียกดูย้อนหลังบน LIFF ได้',
            }, {
              title: 'ดูวิธีเข้าเรียน',
              desc: 'เช็กว่าคอร์สเป็น On-site หรือ Online พร้อมลิงก์/แผนที่/Zoom',
            }, {
              title: 'แจ้งปัญหาหรือคุยกับแอดมิน',
              desc: 'ปุ่มโทร เปิดแชท LINE OA หรือกรอกฟอร์มแจ้งปัญหา',
            }, {
              title: 'ซิงก์ข้อมูลกับหลังบ้าน',
              desc: 'ข้อมูลคอร์ส/คำสั่งซื้อใช้ API/DB เดียวกับ admin-site ทำให้สถานะตรงกัน',
            }].map((item) => (
              <div key={item.title} style={{ border: '1px solid #e3e8e6', borderRadius: '10px', padding: '12px', background: '#f9fbf9' }}>
                <div style={{ fontWeight: 700, marginBottom: '6px' }}>{item.title}</div>
                <div style={{ color: '#415a4f', lineHeight: 1.6 }}>{item.desc}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={cardStyle}>
          <h2 style={{ margin: '0 0 8px' }}>Checklist การเชื่อมต่อกับ LINE LIFF</h2>
          <ul style={{ margin: 0, paddingLeft: '18px', lineHeight: 1.7 }}>
            <li>สร้าง LIFF ด้วย URL จาก ngrok เช่น <code>https://dccd85b17f88.ngrok-free.app</code> → ชี้ไปที่ <code>http://localhost:3000</code> ตอน dev</li>
            <li>ฝัง LIFF ID ใน env: <code>VITE_LIFF_ID</code> และใช้ SDK เพื่อดึง LineID / profile</li>
            <li>ยิง API <code>/auth/line-login</code> เพื่อสร้าง/อัปเดตสมาชิก พร้อมเก็บ full name / email / phone</li>
            <li>คอร์ส/รอบเรียนดึงจาก <code>/courses/list</code> (เปิดให้ LIFF เรียกได้) และ sync กับ admin</li>
            <li>สร้างคำสั่งซื้อผ่าน <code>/orders</code> → ส่งเข้าชำระ Omise → รับ webhook ที่ backend แล้วอัปเดต order</li>
            <li>หน้าช่วยเหลือมีปุ่มกลับไปคุยแชท LINE OA เพื่อโต้ตอบกับแอดมินได้ทันที</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default Home;
