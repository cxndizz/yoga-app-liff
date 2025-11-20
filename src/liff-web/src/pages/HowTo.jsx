import React from 'react';

const cardStyle = {
  background: '#fff',
  borderRadius: '12px',
  padding: '16px',
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
  border: '1px solid #e8eeeb',
};

function HowTo() {
  return (
    <div style={{ padding: '16px', fontFamily: 'system-ui, sans-serif', background: '#f6f8f7', minHeight: '100vh' }}>
      <div style={{ ...cardStyle, background: 'linear-gradient(120deg, #e4fff1, #f7fffb)' }}>
        <h2 style={{ margin: '0 0 8px' }}>วิธีใช้งาน (Customer - LIFF)</h2>
        <p style={{ margin: 0, color: '#2a3d33' }}>
          Flow ฉบับละเอียดสำหรับลูกค้าที่เข้าใช้งานผ่าน Rich Menu LINE OA ครอบคลุมสมัครสมาชิก ดูคอร์ส และชำระเงิน
        </p>
      </div>

      <div style={{ marginTop: '12px', display: 'grid', gap: '12px' }}>
        <div style={cardStyle}>
          <h3 style={{ margin: '0 0 6px' }}>1) สมัคร / เข้าสู่ระบบ</h3>
          <ol style={{ margin: 0, paddingLeft: '18px', lineHeight: 1.6 }}>
            <li>ลูกค้ากด Rich Menu “สมัครสมาชิก” หรือ “เข้าสู่ระบบ” → เปิด LIFF ด้วย <code>?action=register|login</code></li>
            <li>LIFF เรียก LINE SDK (หรือ fallback) เพื่อดึง Line User ID + โปรไฟล์พื้นฐาน</li>
            <li>ส่งข้อมูลไปที่ API <code>/auth/line-login</code> เพื่อสร้าง/อัปเดตบัญชีลูกค้าในฐานข้อมูลกลาง</li>
            <li>ถ้าลูกค้าเคยกรอก full name / email / phone แล้ว ระบบดึงกลับมาแสดงและให้แก้ไขได้</li>
            <li>หลังบันทึก → พาไปหน้า Home/Courses และเริ่มใช้งานได้ทันที (ไม่ต้องรหัสผ่านแยก)</li>
          </ol>
        </div>

        <div style={cardStyle}>
          <h3 style={{ margin: '0 0 6px' }}>2) ดูคอร์ส + ตารางรอบเรียน</h3>
          <ol style={{ margin: 0, paddingLeft: '18px', lineHeight: 1.6 }}>
            <li>ลูกค้ากดปุ่ม “ดูคอร์ส” หรือใช้ Rich Menu ที่แนบ <code>?action=courses</code></li>
            <li>LIFF เรียก API <code>/courses/list</code> เพื่อดึงข้อมูลคอร์สทั้งหมด (รวมสาขา/ผู้สอน/ราคา/สิทธิ์เข้าเรียน)</li>
            <li>แสดง “ตารางรอบเรียน” (ตัวอย่าง) และสามารถเชื่อม endpoint <code>/api/admin/course-sessions</code> เพื่อดึงรอบจริง</li>
            <li>หากคอร์สฟรี ให้ขึ้นปุ่ม “ลงทะเบียน” ทันที; หากคอร์สเสียเงิน ให้แสดงราคาและปุ่ม “ซื้อ/จองคอร์ส”</li>
          </ol>
        </div>

        <div style={cardStyle}>
          <h3 style={{ margin: '0 0 6px' }}>3) สั่งซื้อ + ชำระเงิน (Omise)</h3>
          <ol style={{ margin: 0, paddingLeft: '18px', lineHeight: 1.6 }}>
            <li>เมื่อกด “ซื้อ/จองคอร์ส” → LIFF สร้างคำสั่งซื้อผ่าน API <code>/orders</code> (ผูกกับ user_id & course_id)</li>
            <li>เปิดหน้า Payment (Omise) ตามวิธีที่ตั้งค่าไว้ เช่น บัตรเครดิต / PromptPay / Mobile Banking</li>
            <li>Omise ส่ง webhook ไปยัง backend → อัปเดตสถานะ order = paid และบันทึก payment log</li>
            <li>ลูกค้าเห็นหน้าสำเร็จ + ลิงก์ไปดู “ประวัติคำสั่งซื้อ” เพื่อยืนยันสิทธิ์</li>
          </ol>
        </div>

        <div style={cardStyle}>
          <h3 style={{ margin: '0 0 6px' }}>4) ดูประวัติคำสั่งซื้อ + สิทธิ์เข้าเรียน</h3>
          <ol style={{ margin: 0, paddingLeft: '18px', lineHeight: 1.6 }}>
            <li>เรียก API <code>/users/orders</code> โดยส่ง <code>user_id</code> เพื่อดึงประวัติการซื้อทั้งหมด</li>
            <li>แสดงสถานะคำสั่งซื้อ (pending / paid / cancelled) + ราคา + วันที่สั่งซื้อ</li>
            <li>แสดงสิทธิ์เข้าเรียนที่เหลือ (access_times) และรายละเอียดการเข้าร่วม เช่น สาขา/ลิงก์ Zoom</li>
            <li>รองรับการคลิกย้อนกลับไปดูรายละเอียดคอร์สหรือคัดลอกรายละเอียดการเข้าร่วม</li>
          </ol>
        </div>

        <div style={cardStyle}>
          <h3 style={{ margin: '0 0 6px' }}>5) ติดต่อ / ขอความช่วยเหลือ</h3>
          <ol style={{ margin: 0, paddingLeft: '18px', lineHeight: 1.6 }}>
            <li>เปิดจาก Rich Menu ด้วย <code>?action=contact</code> หรือกดปุ่ม “ติดต่อเรา” ในหน้าอื่น</li>
            <li>แสดงปุ่มโทรหาเรา / เปิดแชท LINE OA / แบบฟอร์มแจ้งปัญหา (ส่งเข้า DB หรืออีเมลแอดมิน)</li>
            <li>สามารถฝัง Google Map เพื่อบอกที่อยู่สาขาและลิงก์นำทาง</li>
            <li>ถ้ามี FAQ/คู่มือสั้น ๆ แนะนำให้ฝังไว้เพื่อให้ลูกค้าแก้ปัญหาเบื้องต้นได้เอง</li>
          </ol>
        </div>

        <div style={cardStyle}>
          <h3 style={{ margin: '0 0 6px' }}>Checklist การเชื่อมต่อ Rich Menu → LIFF</h3>
          <ul style={{ margin: 0, paddingLeft: '18px', lineHeight: 1.6 }}>
            <li>กำหนด URL LIFF ให้ตรงกับ ngrok ที่เปิด เช่น <code>https://dccd85b17f88.ngrok-free.app</code></li>
            <li>ปุ่ม Rich Menu ทุกปุ่มชี้ไป URL เดียวกัน แต่ส่งพารามิเตอร์ <code>?action=...</code> เพื่อเลือกหน้า</li>
            <li>ในโค้ด LIFF อ่านค่า <code>action</code> จาก query string แล้ว <em>navigate</em> ไปยังหน้าเป้าหมาย (Home/Courses/HowTo/Contact)</li>
            <li>ฝัง LIFF ID ไว้ใน env: <code>VITE_LIFF_ID</code> เพื่อโหลด SDK และผูก Line User ID กับ user_id ใน DB</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default HowTo;
