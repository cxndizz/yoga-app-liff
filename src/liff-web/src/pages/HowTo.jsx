import React from 'react';

function HowTo() {
  return (
    <div style={{ padding: '16px', fontFamily: 'system-ui, sans-serif' }}>
      <h2>วิธีใช้งาน</h2>
      <ol>
        <li>กดสมัครสมาชิก / เข้าสู่ระบบผ่าน Rich Menu</li>
        <li>เลือกคอร์สที่สนใจ</li>
        <li>ชำระเงิน (ถ้าเป็นคอร์สเสียเงิน)</li>
        <li>เข้าร่วมเรียนตามรายละเอียดที่ได้รับ</li>
      </ol>
      <p>หน้านี้สามารถปรับแก้เป็น CMS จากหลังบ้านได้ภายหลัง</p>
    </div>
  );
}

export default HowTo;
