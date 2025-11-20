import React from 'react';

// Professional design system
const palette = {
  primary: '#1e40af',
  primaryDark: '#1e3a8a',
  secondary: '#64748b',
  accent: '#3b82f6',
  success: '#059669',
  warning: '#d97706',
  danger: '#dc2626',
  text: '#1f2937',
  textMuted: '#6b7280',
  textLight: '#9ca3af',
  background: '#f8fafc',
  surface: '#ffffff',
  border: '#e2e8f0',
  borderLight: '#f1f5f9',
};

const styles = {
  container: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    backgroundColor: palette.background,
    minHeight: '100vh',
    color: palette.text,
  },
  header: {
    backgroundColor: palette.primary,
    color: '#fff',
    padding: '32px 0',
    marginBottom: '32px',
  },
  headerContent: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '0 16px',
  },
  title: {
    fontSize: '32px',
    fontWeight: '700',
    marginBottom: '8px',
    lineHeight: '1.2',
  },
  subtitle: {
    fontSize: '16px',
    color: 'rgba(255,255,255,0.8)',
    lineHeight: '1.5',
    maxWidth: '600px',
  },
  mainContent: {
    maxWidth: '1000px',
    margin: '0 auto',
    padding: '0 16px 32px',
  },
  section: {
    backgroundColor: palette.surface,
    borderRadius: '12px',
    border: `1px solid ${palette.border}`,
    padding: '24px',
    marginBottom: '24px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
  sectionTitle: {
    fontSize: '20px',
    fontWeight: '600',
    color: palette.text,
    marginBottom: '16px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  stepContainer: {
    display: 'grid',
    gap: '16px',
  },
  step: {
    display: 'flex',
    gap: '12px',
    padding: '16px',
    backgroundColor: palette.borderLight,
    borderRadius: '8px',
    border: `1px solid ${palette.border}`,
  },
  stepNumber: {
    flexShrink: 0,
    width: '32px',
    height: '32px',
    backgroundColor: palette.accent,
    color: '#fff',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '14px',
    fontWeight: '600',
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: palette.text,
    marginBottom: '4px',
  },
  stepDescription: {
    fontSize: '14px',
    color: palette.textMuted,
    lineHeight: '1.5',
  },
  icon: {
    width: '20px',
    height: '20px',
    fill: 'currentColor',
  },
  infoBox: {
    backgroundColor: '#eff6ff',
    border: `1px solid #bfdbfe`,
    borderRadius: '8px',
    padding: '16px',
    marginTop: '16px',
  },
  warningBox: {
    backgroundColor: '#fef3c7',
    border: `1px solid #fde68a`,
    borderRadius: '8px',
    padding: '16px',
    marginTop: '16px',
  },
  successBox: {
    backgroundColor: '#ecfdf5',
    border: `1px solid #bbf7d0`,
    borderRadius: '8px',
    padding: '16px',
    marginTop: '16px',
  },
  list: {
    paddingLeft: '20px',
    margin: '8px 0',
  },
  listItem: {
    marginBottom: '8px',
    lineHeight: '1.5',
  },
  button: {
    padding: '8px 16px',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    border: 'none',
    transition: 'all 0.2s',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    textDecoration: 'none',
  },
  buttonPrimary: {
    backgroundColor: palette.accent,
    color: '#fff',
  },
  buttonSecondary: {
    backgroundColor: palette.surface,
    color: palette.text,
    border: `1px solid ${palette.border}`,
  },
  quickAccess: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px',
    marginBottom: '32px',
  },
  quickAccessCard: {
    backgroundColor: palette.surface,
    borderRadius: '8px',
    border: `1px solid ${palette.border}`,
    padding: '20px',
    textAlign: 'center',
    transition: 'all 0.2s',
    cursor: 'pointer',
  },
  quickAccessIcon: {
    width: '40px',
    height: '40px',
    margin: '0 auto 12px',
    backgroundColor: palette.borderLight,
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: palette.accent,
  },
  quickAccessTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: palette.text,
    marginBottom: '4px',
  },
  quickAccessDescription: {
    fontSize: '12px',
    color: palette.textMuted,
  },
};

// Icon components
const UserIcon = () => (
  <svg style={styles.icon} viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
  </svg>
);

const BookOpenIcon = () => (
  <svg style={styles.icon} viewBox="0 0 20 20">
    <path d="M10.75 16.82A7.462 7.462 0 0115 15.5c.71 0 1.396.098 2.046.282A1 1 0 0018 15V4a1 1 0 00-.732-.957C16.184 2.369 15.123 2 14 2c-1.12 0-2.185.369-3.268 1.043A1 1 0 0010 4v12.82zM9.25 4a1 1 0 00-.732-.957C7.184 2.369 6.123 2 5 2c-1.12 0-2.185.369-3.268 1.043A1 1 0 001 4v11a1 1 0 001.046.957A9.462 9.462 0 015 15.5c1.652 0 3.174.43 4.5 1.178V4z" />
  </svg>
);

const CreditCardIcon = () => (
  <svg style={styles.icon} viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M2.5 4A1.5 1.5 0 001 5.5V6h18v-.5A1.5 1.5 0 0017.5 4h-15zM19 8.5H1v6A1.5 1.5 0 002.5 16h15a1.5 1.5 0 001.5-1.5v-6zM3 13.25a.75.75 0 01.75-.75h1.5a.75.75 0 010 1.5h-1.5a.75.75 0 01-.75-.75zm4.75-.75a.75.75 0 000 1.5h3.5a.75.75 0 000-1.5h-3.5z" clipRule="evenodd" />
  </svg>
);

const QuestionMarkCircleIcon = () => (
  <svg style={styles.icon} viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
  </svg>
);

const ClockIcon = () => (
  <svg style={styles.icon} viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-13a.75.75 0 00-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 000-1.5h-3.25V5z" clipRule="evenodd" />
  </svg>
);

const PhoneIcon = () => (
  <svg style={styles.icon} viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M2 3.5A1.5 1.5 0 013.5 2h1.148a1.5 1.5 0 011.465 1.175l.716 3.223a1.5 1.5 0 01-1.052 1.767l-.933.267c-.41.117-.643.555-.48.95a11.542 11.542 0 006.254 6.254c.395.163.833-.07.95-.48l.267-.933a1.5 1.5 0 011.767-1.052l3.223.716A1.5 1.5 0 0118 15.352V16.5a1.5 1.5 0 01-1.5 1.5H15c-1.149 0-2.263-.15-3.326-.43A13.022 13.022 0 012.43 8.326 13.019 13.019 0 012 5V3.5z" clipRule="evenodd" />
  </svg>
);

function HowTo() {
  const quickAccessItems = [
    {
      icon: <UserIcon />,
      title: 'สมัครสมาชิก',
      description: 'วิธีการลงทะเบียนใช้งาน',
      onClick: () => document.getElementById('register')?.scrollIntoView({ behavior: 'smooth' }),
    },
    {
      icon: <BookOpenIcon />,
      title: 'การจองคอร์ส',
      description: 'ขั้นตอนการจองและชำระเงิน',
      onClick: () => document.getElementById('booking')?.scrollIntoView({ behavior: 'smooth' }),
    },
    {
      icon: <CreditCardIcon />,
      title: 'การชำระเงิน',
      description: 'วิธีการชำระเงินผ่านระบบ',
      onClick: () => document.getElementById('payment')?.scrollIntoView({ behavior: 'smooth' }),
    },
    {
      icon: <QuestionMarkCircleIcon />,
      title: 'คำถามที่พบบ่อย',
      description: 'ปัญหาและการแก้ไขทั่วไป',
      onClick: () => document.getElementById('faq')?.scrollIntoView({ behavior: 'smooth' }),
    },
  ];

  const registrationSteps = [
    {
      title: 'เข้าสู่ระบบผ่าน LINE',
      description: 'กดปุ่ม "สมัครสมาชิก" จาก Rich Menu ใน LINE Official Account',
    },
    {
      title: 'ยืนยันข้อมูลโปรไฟล์',
      description: 'ระบบจะดึงข้อมูลพื้นฐานจาก LINE Profile ของคุณ (ชื่อและรูปโปรไฟล์)',
    },
    {
      title: 'กรอกข้อมูลเพิ่มเติม',
      description: 'ระบุข้อมูลที่จำเป็น เช่น ชื่อ-นามสกุลจริง, อีเมล, เบอร์โทรศัพท์',
    },
    {
      title: 'ยอมรับเงื่อนไขการใช้งาน',
      description: 'อ่านและยอมรับเงื่อนไขการให้บริการและนโยบายความเป็นส่วนตัว',
    },
    {
      title: 'เสร็จสิ้นการสมัครสมาชิก',
      description: 'ระบบจะพาคุณเข้าสู่หน้าหลักและสามารถเริ่มใช้งานได้ทันที',
    },
  ];

  const bookingSteps = [
    {
      title: 'เลือกคอร์สที่ต้องการ',
      description: 'เรียกดูรายการคอร์สและรายละเอียด รวมถึงตารางรอบเรียนที่เปิดให้จอง',
    },
    {
      title: 'เลือกรอบเรียน',
      description: 'เลือกวันและเวลาที่เหมาะสม ดูจำนวนที่นั่งว่างและข้อมูลผู้สอน',
    },
    {
      title: 'ตรวจสอบข้อมูลการจอง',
      description: 'ยืนยันรายละเอียดคอร์ส วันเวลา และราคาก่อนดำเนินการชำระเงิน',
    },
    {
      title: 'ชำระเงิน',
      description: 'เลือกวิธีการชำระเงินผ่านระบบ Omise (บัตรเครดิต/เดบิต หรือ PromptPay)',
    },
    {
      title: 'รับการยืนยัน',
      description: 'หลังชำระเงินสำเร็จ คุณจะได้รับการยืนยันและข้อมูลการเข้าร่วมคอร์ส',
    },
  ];

  const paymentMethods = [
    {
      title: 'บัตรเครดิต/เดบิต',
      description: 'รองรับบัตร Visa, MasterCard, JCB และบัตรในประเทศไทย',
    },
    {
      title: 'PromptPay QR Code',
      description: 'สแกน QR Code เพื่อชำระผ่านแอปธนาคารหรือกระเป๋าเงินอิเล็กทรอนิกส์',
    },
    {
      title: 'Mobile Banking',
      description: 'ชำระผ่านแอปธนาคารโดยตรง รองรับธนาคารหลักในประเทศไทย',
    },
  ];

  const faqItems = [
    {
      question: 'ฉันสามารถยกเลิกการจองได้หรือไม่?',
      answer: 'สามารถยกเลิกได้ภายใน 24 ชั่วโมงก่อนเวลาเรียน โดยติดต่อผ่าน LINE หรือโทรศัพท์',
    },
    {
      question: 'ถ้าไม่สามารถเข้าเรียนในรอบที่จองไว้ได้จะทำอย่างไร?',
      answer: 'คุณสามารถขอเลื่อนไปรอบอื่นได้ โดยแจ้งล่วงหน้าอย่างน้อย 4 ชั่วโมง',
    },
    {
      question: 'การชำระเงินผ่านระบบปลอดภัยหรือไม่?',
      answer: 'ระบบใช้ Omise ซึ่งได้มาตรฐาน PCI DSS และเข้ารหัสข้อมูลทุกขั้นตอน',
    },
    {
      question: 'ฉันสามารถดูประวัติการจองได้ที่ไหน?',
      answer: 'เข้าดูได้ในส่วน "ประวัติการจอง" ผ่านเมนูหลังจากเข้าสู่ระบบ',
    },
  ];

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerContent}>
          <h1 style={styles.title}>วิธีใช้งานระบบ</h1>
          <p style={styles.subtitle}>
            คู่มือการใช้งานสำหรับการสมัครสมาชิก การจองคอร์ส และการชำระเงิน
          </p>
        </div>
      </div>

      <div style={styles.mainContent}>
        {/* Quick Access */}
        <div style={styles.quickAccess}>
          {quickAccessItems.map((item, index) => (
            <div
              key={index}
              style={styles.quickAccessCard}
              onClick={item.onClick}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div style={styles.quickAccessIcon}>
                {item.icon}
              </div>
              <div style={styles.quickAccessTitle}>{item.title}</div>
              <div style={styles.quickAccessDescription}>{item.description}</div>
            </div>
          ))}
        </div>

        {/* Registration Section */}
        <div id="register" style={styles.section}>
          <h2 style={styles.sectionTitle}>
            <UserIcon />
            การสมัครสมาชิก
          </h2>
          <div style={styles.stepContainer}>
            {registrationSteps.map((step, index) => (
              <div key={index} style={styles.step}>
                <div style={styles.stepNumber}>{index + 1}</div>
                <div style={styles.stepContent}>
                  <div style={styles.stepTitle}>{step.title}</div>
                  <div style={styles.stepDescription}>{step.description}</div>
                </div>
              </div>
            ))}
          </div>
          <div style={styles.successBox}>
            <strong>หมายเหตุ:</strong> การสมัครสมาชิกใช้ข้อมูลจาก LINE Account ของคุณ 
            ไม่ต้องจำรหัสผ่านแยก และสามารถเข้าใช้งานได้ทันทีหลังสมัครเสร็จ
          </div>
        </div>

        {/* Booking Section */}
        <div id="booking" style={styles.section}>
          <h2 style={styles.sectionTitle}>
            <BookOpenIcon />
            การจองคอร์ส
          </h2>
          <div style={styles.stepContainer}>
            {bookingSteps.map((step, index) => (
              <div key={index} style={styles.step}>
                <div style={styles.stepNumber}>{index + 1}</div>
                <div style={styles.stepContent}>
                  <div style={styles.stepTitle}>{step.title}</div>
                  <div style={styles.stepDescription}>{step.description}</div>
                </div>
              </div>
            ))}
          </div>
          <div style={styles.infoBox}>
            <strong>ข้อมูลสำคัญ:</strong>
            <ul style={styles.list}>
              <li style={styles.listItem}>คอร์สฟรีสามารถลงทะเบียนได้ทันทีโดยไม่ต้องชำระเงิน</li>
              <li style={styles.listItem}>สิทธิ์การเข้าเรียนจะแสดงในส่วน "ประวัติการจอง"</li>
              <li style={styles.listItem}>สามารถเข้าเรียนได้ตามจำนวนครั้งที่กำหนดในแต่ละคอร์ส</li>
            </ul>
          </div>
        </div>

        {/* Payment Section */}
        <div id="payment" style={styles.section}>
          <h2 style={styles.sectionTitle}>
            <CreditCardIcon />
            การชำระเงิน
          </h2>
          <p style={{ color: palette.textMuted, marginBottom: '20px' }}>
            ระบบรองรับการชำระเงินหลายวิธีผ่าน Omise Payment Gateway ที่ปลอดภัย
          </p>
          <div style={styles.stepContainer}>
            {paymentMethods.map((method, index) => (
              <div key={index} style={styles.step}>
                <div style={styles.stepNumber}>{index + 1}</div>
                <div style={styles.stepContent}>
                  <div style={styles.stepTitle}>{method.title}</div>
                  <div style={styles.stepDescription}>{method.description}</div>
                </div>
              </div>
            ))}
          </div>
          <div style={styles.warningBox}>
            <strong>ข้อควรระวัง:</strong> กรุณาตรวจสอบข้อมูลการจองให้ถูกต้องก่อนชำระเงิน 
            หากมีปัญหาในการชำระเงินให้ติดต่อเจ้าหน้าที่ทันที
          </div>
        </div>

        {/* FAQ Section */}
        <div id="faq" style={styles.section}>
          <h2 style={styles.sectionTitle}>
            <QuestionMarkCircleIcon />
            คำถามที่พบบ่อย
          </h2>
          <div style={styles.stepContainer}>
            {faqItems.map((item, index) => (
              <div key={index} style={styles.step}>
                <div style={styles.stepNumber}>?</div>
                <div style={styles.stepContent}>
                  <div style={styles.stepTitle}>{item.question}</div>
                  <div style={styles.stepDescription}>{item.answer}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Support Section */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>
            <PhoneIcon />
            ช่องทางการติดต่อ
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
            <div style={styles.step}>
              <div style={{ ...styles.stepNumber, backgroundColor: palette.success }}>
                <PhoneIcon />
              </div>
              <div style={styles.stepContent}>
                <div style={styles.stepTitle}>โทรศัพท์</div>
                <div style={styles.stepDescription}>
                  02-xxx-xxxx<br />
                  เปิดบริการ จันทร์-ศุกร์ 9:00-18:00 น.
                </div>
              </div>
            </div>
            <div style={styles.step}>
              <div style={{ ...styles.stepNumber, backgroundColor: palette.warning }}>
                💬
              </div>
              <div style={styles.stepContent}>
                <div style={styles.stepTitle}>LINE Official Account</div>
                <div style={styles.stepDescription}>
                  @yogastudio<br />
                  ตอบกลับอัตโนมัติ 24 ชั่วโมง
                </div>
              </div>
            </div>
          </div>

          <div style={styles.successBox}>
            <ClockIcon />
            <span style={{ marginLeft: '8px' }}>
              <strong>เวลาทำการ:</strong> จันทร์ - อาทิตย์ 6:00 - 21:00 น. 
              สำหรับการจองและยกเลิกคอร์ส
            </span>
          </div>
        </div>

        {/* Navigation */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '16px',
          marginTop: '32px',
          paddingTop: '24px',
          borderTop: `1px solid ${palette.border}`,
        }}>
          <button 
            style={styles.button}
            onClick={() => window.location.href = '/courses'}
          >
            ดูคอร์สทั้งหมด
          </button>
          <button 
            style={{ ...styles.button, ...styles.buttonSecondary }}
            onClick={() => window.location.href = '/contact'}
          >
            ติดต่อเรา
          </button>
        </div>
      </div>
    </div>
  );
}

export default HowTo;