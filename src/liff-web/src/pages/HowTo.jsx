import React from 'react';

const palette = {
  ink: '#0f172a',
  accent: '#3b82f6',
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

function HowTo() {
  return (
    <div style={{ padding: '18px', fontFamily: 'Inter, system-ui, sans-serif', background: palette.soft, minHeight: '100vh' }}>
      <div style={{ ...cardStyle, background: `linear-gradient(120deg, #0b1224, ${palette.ink})`, color: '#e5e7eb' }}>
        <h2 style={{ margin: '0 0 8px', color: '#fff' }}>วิธีใช้งาน (Customer - LIFF)</h2>
        <p style={{ margin: 0, color: '#cbd5e1' }}>
          Flow ฉบับละเอียดสำหรับลูกค้าที่เข้าใช้งานผ่าน Rich Menu LINE OA ครอบคลุมสมัครสมาชิก ดูคอร์ส และชำระเงิน
        </p>
      </div>

      <div style={{ marginTop: '12px', display: 'grid', gap: '12px' }}>
        {[{
          title: '1) สมัคร / เข้าสู่ระบบ',
          items: [
            'ลูกค้ากด Rich Menu “สมัครสมาชิก” หรือ “เข้าสู่ระบบ” → เปิด LIFF ด้วย ?action=register|login',
            'LIFF เรียก LINE SDK (หรือ fallback) เพื่อดึง Line User ID + โปรไฟล์พื้นฐาน',
            'ส่งข้อมูลไปที่ API /auth/line-login เพื่อสร้าง/อัปเดตบัญชีลูกค้าในฐานข้อมูลกลาง',
            'ถ้าลูกค้าเคยกรอก full name / email / phone แล้ว ระบบดึงกลับมาแสดงและให้แก้ไขได้',
            'หลังบันทึก → พาไปหน้า Home/Courses และเริ่มใช้งานได้ทันที (ไม่ต้องรหัสผ่านแยก)',
          ],
        }, {
          title: '2) ดูคอร์ส + ตารางรอบเรียน',
          items: [
            'ลูกค้ากดปุ่ม “ดูคอร์ส” หรือใช้ Rich Menu ที่แนบ ?action=courses',
            'LIFF เรียก API /courses/list เพื่อดึงข้อมูลคอร์สทั้งหมด (รวมสาขา/ผู้สอน/ราคา/สิทธิ์เข้าเรียน)',
            'แสดง “ตารางรอบเรียน” ที่ดึงมาจาก API /courses/sessions',
            'หากคอร์สฟรี ให้ขึ้นปุ่ม “ลงทะเบียน” ทันที; หากคอร์สเสียเงิน ให้แสดงราคาและปุ่ม “ซื้อ/จองคอร์ส”',
          ],
        }, {
          title: '3) สั่งซื้อ + ชำระเงิน (Omise)',
          items: [
            'เมื่อกด “ซื้อ/จองคอร์ส” → LIFF สร้างคำสั่งซื้อผ่าน API /orders (ผูกกับ user_id & course_id)',
            'เปิดหน้า Payment (Omise) ตามวิธีที่ตั้งค่าไว้ เช่น บัตรเครดิต / PromptPay / Mobile Banking',
            'Omise ส่ง webhook กลับไป backend → อัปเดตสถานะ order = paid และบันทึก payment log',
            'ลูกค้าเห็นหน้าสำเร็จ + ลิงก์ไปดู “ประวัติคำสั่งซื้อ” เพื่อยืนยันสิทธิ์',
          ],
        }, {
          title: '4) ดูประวัติคำสั่งซื้อ + สิทธิ์เข้าเรียน',
          items: [
            'เรียก API /users/orders โดยส่ง user_id เพื่อดึงประวัติการซื้อทั้งหมด',
            'แสดงสถานะคำสั่งซื้อ (pending / paid / cancelled) + ราคา + วันที่สั่งซื้อ',
            'แสดงสิทธิ์เข้าเรียนที่เหลือ (access_times) และรายละเอียดการเข้าร่วม เช่น สาขา/ลิงก์ Zoom',
            'รองรับการคลิกย้อนกลับไปดูรายละเอียดคอร์สหรือคัดลอกรายละเอียดการเข้าร่วม',
          ],
        }, {
          title: '5) ติดต่อ / ขอความช่วยเหลือ',
          items: [
            'เปิดจาก Rich Menu ด้วย ?action=contact หรือกดปุ่ม “ติดต่อเรา” ในหน้าอื่น',
            'แสดงปุ่มโทรหาเรา / เปิดแชท LINE OA / แบบฟอร์มแจ้งปัญหา (ส่งเข้า DB หรืออีเมลแอดมิน)',
            'สามารถฝัง Google Map เพื่อบอกที่อยู่สาขาและลิงก์นำทาง',
            'ถ้ามี FAQ/คู่มือสั้น ๆ แนะนำให้ฝังไว้เพื่อให้ลูกค้าแก้ปัญหาเบื้องต้นได้เอง',
          ],
        }, {
          title: 'Checklist การเชื่อมต่อ Rich Menu → LIFF',
          items: [
            'กำหนด URL LIFF ให้ตรงกับ ngrok ที่เปิด เช่น https://dccd85b17f88.ngrok-free.app',
            'ปุ่ม Rich Menu ทุกปุ่มชี้ไป URL เดียวกัน แต่ส่งพารามิเตอร์ ?action=... เพื่อเลือกหน้า',
            'ในโค้ด LIFF อ่านค่า action จาก query string แล้ว navigate ไปยังหน้าเป้าหมาย (Home/Courses/HowTo/Contact)',
            'ฝัง LIFF ID ไว้ใน env: VITE_LIFF_ID เพื่อโหลด SDK และผูก Line User ID กับ user_id ใน DB',
          ],
        }].map((section) => (
          <div key={section.title} style={cardStyle}>
            <h3 style={{ margin: '0 0 6px', color: palette.ink }}>{section.title}</h3>
            <ul style={{ margin: 0, paddingLeft: '18px', lineHeight: 1.6, color: palette.muted }}>
              {section.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

export default HowTo;
