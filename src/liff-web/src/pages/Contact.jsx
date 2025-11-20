import React, { useState } from 'react';

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
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '0 16px 32px',
  },
  gridContainer: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '32px',
    '@media (max-width: 768px)': {
      gridTemplateColumns: '1fr',
    },
  },
  section: {
    backgroundColor: palette.surface,
    borderRadius: '12px',
    border: `1px solid ${palette.border}`,
    padding: '24px',
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
  icon: {
    width: '20px',
    height: '20px',
    fill: 'currentColor',
  },
  contactMethod: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '16px',
    padding: '16px',
    backgroundColor: palette.borderLight,
    borderRadius: '8px',
    marginBottom: '16px',
    transition: 'all 0.2s',
    cursor: 'pointer',
  },
  contactIcon: {
    width: '40px',
    height: '40px',
    backgroundColor: palette.accent,
    color: '#fff',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  contactContent: {
    flex: 1,
  },
  contactTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: palette.text,
    marginBottom: '4px',
  },
  contactDetail: {
    fontSize: '14px',
    color: palette.textMuted,
    marginBottom: '4px',
  },
  contactNote: {
    fontSize: '12px',
    color: palette.textLight,
  },
  form: {
    display: 'grid',
    gap: '16px',
  },
  inputGroup: {
    display: 'grid',
    gap: '4px',
  },
  label: {
    fontSize: '14px',
    fontWeight: '500',
    color: palette.text,
  },
  input: {
    width: '100%',
    padding: '8px 12px',
    borderRadius: '6px',
    border: `1px solid ${palette.border}`,
    backgroundColor: palette.surface,
    fontSize: '14px',
    color: palette.text,
    boxSizing: 'border-box',
  },
  textarea: {
    width: '100%',
    padding: '8px 12px',
    borderRadius: '6px',
    border: `1px solid ${palette.border}`,
    backgroundColor: palette.surface,
    fontSize: '14px',
    color: palette.text,
    resize: 'vertical',
    minHeight: '100px',
    boxSizing: 'border-box',
  },
  select: {
    width: '100%',
    padding: '8px 12px',
    borderRadius: '6px',
    border: `1px solid ${palette.border}`,
    backgroundColor: palette.surface,
    fontSize: '14px',
    color: palette.text,
  },
  button: {
    padding: '12px 24px',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    border: 'none',
    transition: 'all 0.2s',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
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
  infoBox: {
    backgroundColor: '#eff6ff',
    border: `1px solid #bfdbfe`,
    borderRadius: '8px',
    padding: '16px',
    marginTop: '16px',
  },
  successBox: {
    backgroundColor: '#ecfdf5',
    border: `1px solid #bbf7d0`,
    borderRadius: '8px',
    padding: '16px',
    marginBottom: '16px',
  },
  branchCard: {
    backgroundColor: palette.surface,
    borderRadius: '8px',
    border: `1px solid ${palette.border}`,
    padding: '20px',
    marginBottom: '16px',
  },
  branchName: {
    fontSize: '18px',
    fontWeight: '600',
    color: palette.text,
    marginBottom: '8px',
  },
  branchDetail: {
    fontSize: '14px',
    color: palette.textMuted,
    marginBottom: '4px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  operatingHours: {
    backgroundColor: palette.borderLight,
    padding: '12px',
    borderRadius: '6px',
    marginTop: '12px',
    fontSize: '13px',
  },
  quickActions: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px',
    marginBottom: '32px',
  },
  actionCard: {
    backgroundColor: palette.surface,
    borderRadius: '8px',
    border: `1px solid ${palette.border}`,
    padding: '20px',
    textAlign: 'center',
    transition: 'all 0.2s',
    cursor: 'pointer',
  },
  actionIcon: {
    width: '48px',
    height: '48px',
    margin: '0 auto 12px',
    backgroundColor: palette.accent,
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#fff',
  },
  actionTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: palette.text,
    marginBottom: '4px',
  },
  actionDescription: {
    fontSize: '12px',
    color: palette.textMuted,
  },
  disabled: {
    opacity: 0.6,
    cursor: 'not-allowed',
  },
};

// Icon components
const PhoneIcon = () => (
  <svg style={styles.icon} viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M2 3.5A1.5 1.5 0 013.5 2h1.148a1.5 1.5 0 011.465 1.175l.716 3.223a1.5 1.5 0 01-1.052 1.767l-.933.267c-.41.117-.643.555-.48.95a11.542 11.542 0 006.254 6.254c.395.163.833-.07.95-.48l.267-.933a1.5 1.5 0 011.767-1.052l3.223.716A1.5 1.5 0 0118 15.352V16.5a1.5 1.5 0 01-1.5 1.5H15c-1.149 0-2.263-.15-3.326-.43A13.022 13.022 0 012.43 8.326 13.019 13.019 0 012 5V3.5z" clipRule="evenodd" />
  </svg>
);

const ChatBubbleIcon = () => (
  <svg style={styles.icon} viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M10 2c-2.236 0-4.43.18-6.57.524C1.993 2.755 1 4.014 1 5.426v5.148c0 1.413.993 2.67 2.43 2.902.848.137 1.705.248 2.57.331v3.334a.75.75 0 001.28.53l3.58-3.58h.14c2.236 0 4.43-.18 6.57-.524 1.437-.232 2.43-1.49 2.43-2.902V5.426c0-1.413-.993-2.67-2.43-2.902A51.23 51.23 0 0010 2z" clipRule="evenodd" />
  </svg>
);

const EnvelopeIcon = () => (
  <svg style={styles.icon} viewBox="0 0 20 20">
    <path d="M3 4a2 2 0 00-2 2v1.161l8.441 4.221a1.25 1.25 0 001.118 0L19 7.162V6a2 2 0 00-2-2H3z" />
    <path d="m19 8.839-7.77 3.885a2.75 2.75 0 01-2.46 0L1 8.839V14a2 2 0 002 2h14a2 2 0 002-2V8.839z" />
  </svg>
);

const MapPinIcon = () => (
  <svg style={styles.icon} viewBox="0 0 20 20">
    <path fillRule="evenodd" d="m9.69 18.933.003.001C9.89 19.02 10 19 10 19s.11.02.308-.066l.002-.001.006-.003.018-.008a5.741 5.741 0 00.281-.14c.186-.096.446-.24.757-.433.62-.384 1.445-.966 2.274-1.765C15.302 14.988 17 12.493 17 9A7 7 0 103 9c0 3.492 1.698 5.988 3.646 7.584.829.799 1.654 1.381 2.274 1.765a11.334 11.334 0 00.757.433 5.896 5.896 0 00.281.14l.018.008.006.003zM10 11.25a2.25 2.25 0 100-4.5 2.25 2.25 0 000 4.5z" clipRule="evenodd" />
  </svg>
);

const ClockIcon = () => (
  <svg style={styles.icon} viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-13a.75.75 0 00-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 000-1.5h-3.25V5z" clipRule="evenodd" />
  </svg>
);

const PaperAirplaneIcon = () => (
  <svg style={styles.icon} viewBox="0 0 20 20">
    <path d="M3.105 2.289a.75.75 0 00-.826.95l1.414 4.925A1.5 1.5 0 005.135 9.25h6.115a.75.75 0 010 1.5H5.135a1.5 1.5 0 00-1.442 1.086l-1.414 4.926a.75.75 0 00.826.95 28.896 28.896 0 0015.293-7.154.75.75 0 000-1.115A28.897 28.897 0 003.105 2.289z" />
  </svg>
);

function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    branch: '',
    subject: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate form submission
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitSuccess(true);
      setFormData({
        name: '',
        email: '',
        phone: '',
        branch: '',
        subject: '',
        message: '',
      });
      
      setTimeout(() => setSubmitSuccess(false), 5000);
    }, 2000);
  };

  const contactMethods = [
    {
      icon: <PhoneIcon />,
      title: 'โทรศัพท์',
      detail: '02-xxx-xxxx',
      note: 'จันทร์-ศุกร์ 9:00-18:00 น.',
      action: () => window.open('tel:02xxxxxxx'),
      color: palette.success,
    },
    {
      icon: <ChatBubbleIcon />,
      title: 'LINE Official Account',
      detail: '@yogastudio',
      note: 'ตอบกลับอัตโนมัติ 24 ชั่วโมง',
      action: () => window.open('https://line.me/R/ti/p/@yogastudio'),
      color: palette.warning,
    },
    {
      icon: <EnvelopeIcon />,
      title: 'อีเมล',
      detail: 'info@yogastudio.com',
      note: 'ตอบกลับภายใน 24 ชั่วโมง',
      action: () => window.open('mailto:info@yogastudio.com'),
      color: palette.accent,
    },
  ];

  const branches = [
    {
      name: 'สาขาหลัก - สยาม',
      address: '123/4 ถนนพระราม 1 แขวงปทุมวัน เขตปทุมวัน กรุงเทพฯ 10330',
      phone: '02-xxx-xxxx',
      hours: 'จันทร์-อาทิตย์ 6:00-21:00 น.',
    },
    {
      name: 'สาขาทองหล่อ',
      address: '456/7 ถนนทองหล่อ แขวงคลองเตย เขตวัฒนา กรุงเทพฯ 10110',
      phone: '02-yyy-yyyy',
      hours: 'จันทร์-อาทิตย์ 6:30-20:30 น.',
    },
  ];

  const quickActions = [
    {
      icon: <PhoneIcon />,
      title: 'โทรด่วน',
      description: 'สำหรับเรื่องเร่งด่วน',
      action: () => window.open('tel:02xxxxxxx'),
    },
    {
      icon: <ChatBubbleIcon />,
      title: 'แชท LINE',
      description: 'สอบถามทั่วไป',
      action: () => window.open('https://line.me/R/ti/p/@yogastudio'),
    },
    {
      icon: <MapPinIcon />,
      title: 'ดูแผนที่',
      description: 'เส้นทางมาสาขา',
      action: () => window.open('https://maps.google.com'),
    },
  ];

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerContent}>
          <h1 style={styles.title}>ติดต่อเรา</h1>
          <p style={styles.subtitle}>
            เรายินดีให้บริการและตอบคำถามของคุณ
          </p>
        </div>
      </div>

      <div style={styles.mainContent}>
        {/* Success Message */}
        {submitSuccess && (
          <div style={styles.successBox}>
            <strong>ส่งข้อความสำเร็จ!</strong> เราได้รับข้อความของคุณแล้วและจะติดต่อกลับภายใน 24 ชั่วโมง
          </div>
        )}

        {/* Quick Actions */}
        <div style={styles.quickActions}>
          {quickActions.map((action, index) => (
            <div
              key={index}
              style={styles.actionCard}
              onClick={action.action}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div style={styles.actionIcon}>
                {action.icon}
              </div>
              <div style={styles.actionTitle}>{action.title}</div>
              <div style={styles.actionDescription}>{action.description}</div>
            </div>
          ))}
        </div>

        {/* Main Content Grid */}
        <div style={{
          ...styles.gridContainer,
          '@media (max-width: 768px)': {
            gridTemplateColumns: '1fr',
          },
        }}>
          {/* Contact Form */}
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>
              <EnvelopeIcon />
              ส่งข้อความหาเรา
            </h2>
            <form style={styles.form} onSubmit={handleSubmit}>
              <div style={styles.inputGroup}>
                <label style={styles.label}>ชื่อ-นามสกุล *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  style={styles.input}
                  required
                  placeholder="กรุณาระบุชื่อ-นามสกุล"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>อีเมล *</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    style={styles.input}
                    required
                    placeholder="example@email.com"
                  />
                </div>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>เบอร์โทร</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    style={styles.input}
                    placeholder="08x-xxx-xxxx"
                  />
                </div>
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>สาขาที่สนใจ</label>
                <select
                  name="branch"
                  value={formData.branch}
                  onChange={handleInputChange}
                  style={styles.select}
                >
                  <option value="">เลือกสาขา</option>
                  <option value="siam">สาขาสยาม</option>
                  <option value="thonglor">สาขาทองหล่อ</option>
                  <option value="other">อื่นๆ</option>
                </select>
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>เรื่อง</label>
                <select
                  name="subject"
                  value={formData.subject}
                  onChange={handleInputChange}
                  style={styles.select}
                >
                  <option value="">เลือกหัวข้อ</option>
                  <option value="booking">การจองคอร์ส</option>
                  <option value="payment">การชำระเงิน</option>
                  <option value="schedule">ตารางเรียน</option>
                  <option value="general">สอบถามทั่วไป</option>
                  <option value="complaint">แจ้งปัญหา</option>
                </select>
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>ข้อความ *</label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleInputChange}
                  style={styles.textarea}
                  required
                  placeholder="กรุณาระบุรายละเอียดข้อความของคุณ..."
                  rows="4"
                />
              </div>

              <button
                type="submit"
                style={{
                  ...styles.button,
                  ...styles.buttonPrimary,
                  ...(isSubmitting ? styles.disabled : {}),
                }}
                disabled={isSubmitting}
                onMouseEnter={(e) => {
                  if (!isSubmitting) {
                    e.currentTarget.style.backgroundColor = palette.primaryDark;
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSubmitting) {
                    e.currentTarget.style.backgroundColor = palette.accent;
                  }
                }}
              >
                {isSubmitting ? (
                  <>
                    <div style={{
                      width: '16px',
                      height: '16px',
                      border: '2px solid rgba(255,255,255,0.3)',
                      borderTop: '2px solid #fff',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite',
                    }} />
                    กำลังส่ง...
                  </>
                ) : (
                  <>
                    <PaperAirplaneIcon />
                    ส่งข้อความ
                  </>
                )}
              </button>
            </form>

            <div style={styles.infoBox}>
              <strong>หมายเหตุ:</strong> กรอกข้อมูลให้ครบถ้วนเพื่อให้เราสามารถตอบกลับได้อย่างถูกต้อง
              ข้อความที่มีเครื่องหมาย * จำเป็นต้องกรอก
            </div>
          </div>

          {/* Contact Information */}
          <div>
            {/* Contact Methods */}
            <div style={styles.section}>
              <h2 style={styles.sectionTitle}>
                <PhoneIcon />
                ช่องทางติดต่อ
              </h2>
              {contactMethods.map((method, index) => (
                <div
                  key={index}
                  style={{
                    ...styles.contactMethod,
                    borderLeft: `4px solid ${method.color}`,
                  }}
                  onClick={method.action}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = palette.border;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = palette.borderLight;
                  }}
                >
                  <div style={{
                    ...styles.contactIcon,
                    backgroundColor: method.color,
                  }}>
                    {method.icon}
                  </div>
                  <div style={styles.contactContent}>
                    <div style={styles.contactTitle}>{method.title}</div>
                    <div style={styles.contactDetail}>{method.detail}</div>
                    <div style={styles.contactNote}>{method.note}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Operating Hours */}
            <div style={{ ...styles.section, marginTop: '24px' }}>
              <h2 style={styles.sectionTitle}>
                <ClockIcon />
                เวลาทำการ
              </h2>
              <div style={styles.operatingHours}>
                <div style={{ fontWeight: '600', marginBottom: '8px' }}>เวลาให้บริการ</div>
                <div style={{ marginBottom: '4px' }}>
                  <strong>จันทร์ - ศุกร์:</strong> 6:00 - 21:00 น.
                </div>
                <div style={{ marginBottom: '4px' }}>
                  <strong>เสาร์ - อาทิตย์:</strong> 7:00 - 20:00 น.
                </div>
                <div style={{ marginTop: '8px', fontSize: '12px', color: palette.textMuted }}>
                  * วันหยุดนักขัตฤกษ์ อาจมีการปรับเปลี่ยนเวลาทำการ
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Branch Information */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>
            <MapPinIcon />
            ข้อมูลสาขา
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '20px',
          }}>
            {branches.map((branch, index) => (
              <div key={index} style={styles.branchCard}>
                <div style={styles.branchName}>{branch.name}</div>
                <div style={styles.branchDetail}>
                  <MapPinIcon />
                  {branch.address}
                </div>
                <div style={styles.branchDetail}>
                  <PhoneIcon />
                  {branch.phone}
                </div>
                <div style={styles.branchDetail}>
                  <ClockIcon />
                  {branch.hours}
                </div>
                <button
                  style={{
                    ...styles.button,
                    ...styles.buttonSecondary,
                    marginTop: '12px',
                    justifyContent: 'center',
                  }}
                  onClick={() => window.open('https://maps.google.com')}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = palette.borderLight;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = palette.surface;
                  }}
                >
                  <MapPinIcon />
                  ดูแผนที่
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Inline CSS for animations */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        @media (max-width: 768px) {
          .grid-container {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}

export default Contact;