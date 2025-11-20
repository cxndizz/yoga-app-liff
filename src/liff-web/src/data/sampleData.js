export const courseData = [
  {
    id: 'yoga-lux-01',
    title: 'Serenity Flow for Stressed Professionals',
    price: 3200,
    currency: 'THB',
    isFree: false,
    category: 'Mindfulness',
    branch: 'Bangkok Sukhumvit',
    thumbnail:
      'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=1200&q=80',
    description:
      'คอร์สยืดเหยียดและสมาธิที่ออกแบบสำหรับคนทำงาน เน้นผ่อนคลายกล้ามเนื้อส่วนลึก พร้อมการหายใจแบบ Pranayama.',
    instructor: {
      name: 'Araya Lert',
      title: 'Lead Wellness Coach',
      avatar:
        'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=256&q=80',
    },
    tags: ['Premium Studio', 'Evening Class', 'In-person'],
    level: 'Beginner–Intermediate',
    capacity: 18,
    seatsLeft: 6,
    accessCount: '2 sessions',
    sessions: [
      {
        id: 'sess-001',
        date: '2024-09-12',
        time: '18:30',
        mode: 'Onsite',
        topic: 'Deep Stretch & Breath Work',
      },
      {
        id: 'sess-002',
        date: '2024-09-19',
        time: '18:30',
        mode: 'Onsite',
        topic: 'Mindful Balance & Core',
      },
    ],
  },
  {
    id: 'yoga-lux-02',
    title: 'Sunrise Power Sculpt',
    price: 0,
    currency: 'THB',
    isFree: true,
    category: 'Strength',
    branch: 'Chiang Mai Old Town',
    thumbnail:
      'https://images.unsplash.com/photo-1549570652-97324981a6fd?auto=format&fit=crop&w=1200&q=80',
    description: 'ตื่นเช้ามารับแสงแดดพร้อม Flow ที่เพิ่มความแข็งแรงและความยืดหยุ่น เน้นกล้ามเนื้อแกนกลาง',
    instructor: {
      name: 'Kenji Watanabe',
      title: 'Performance Specialist',
      avatar:
        'https://images.unsplash.com/photo-1508216310972-0d0b18a8f6c9?auto=format&fit=crop&w=256&q=80',
    },
    tags: ['Sunrise', 'Outdoor Deck', 'Live-stream'],
    level: 'Intermediate',
    capacity: 24,
    seatsLeft: 12,
    accessCount: 'Single session',
    sessions: [
      {
        id: 'sess-101',
        date: '2024-09-15',
        time: '06:30',
        mode: 'Hybrid',
        topic: 'Power Vinyasa & Sculpt',
      },
    ],
  },
  {
    id: 'yoga-lux-03',
    title: 'Deep Rest Yin & Sound Bath',
    price: 2800,
    currency: 'THB',
    isFree: false,
    category: 'Recovery',
    branch: 'Phuket Marina',
    thumbnail:
      'https://images.unsplash.com/photo-1552053566-2955caaa1e8c?auto=format&fit=crop&w=1200&q=80',
    description: 'ปลดล็อกความตึงลึกด้วย Yin Yoga และ Sound Bath จาก Crystal Bowl เพื่อการพักผ่อนระดับสปา',
    instructor: {
      name: 'Maya Kittisak',
      title: 'Restorative Therapist',
      avatar:
        'https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&w=256&q=80',
    },
    tags: ['Candle Light', 'Aromatherapy', 'Waterfront Studio'],
    level: 'All levels',
    capacity: 14,
    seatsLeft: 2,
    accessCount: '2 sessions',
    sessions: [
      {
        id: 'sess-201',
        date: '2024-09-20',
        time: '19:00',
        mode: 'Onsite',
        topic: 'Yin for Deep Fascia Release',
      },
      {
        id: 'sess-202',
        date: '2024-09-27',
        time: '19:00',
        mode: 'Onsite',
        topic: 'Sound Bath Meditation',
      },
    ],
  },
  {
    id: 'yoga-lux-04',
    title: 'Executive Mobility Lab',
    price: 3600,
    currency: 'THB',
    isFree: false,
    category: 'Performance',
    branch: 'Bangkok Riverside',
    thumbnail:
      'https://images.unsplash.com/photo-1550345332-09e3ac987658?auto=format&fit=crop&w=1200&q=80',
    description: 'โปรแกรม 3 สัปดาห์สำหรับผู้บริหาร เพิ่มความยืดหยุ่น ปรับท่าทาง และฟื้นฟูหลังการนั่งทำงานหนัก',
    instructor: {
      name: 'Nina Vorajit',
      title: 'Clinical Yoga Specialist',
      avatar:
        'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=256&q=80',
    },
    tags: ['Small Group', 'Online replay', 'Assessment'],
    level: 'Beginner–Intermediate',
    capacity: 10,
    seatsLeft: 4,
    accessCount: '3 sessions',
    sessions: [
      {
        id: 'sess-301',
        date: '2024-09-18',
        time: '07:30',
        mode: 'Hybrid',
        topic: 'Mobility Screen & Reset',
      },
      {
        id: 'sess-302',
        date: '2024-09-25',
        time: '07:30',
        mode: 'Hybrid',
        topic: 'Posture & Core Conditioning',
      },
      {
        id: 'sess-303',
        date: '2024-10-02',
        time: '07:30',
        mode: 'Hybrid',
        topic: 'Dynamic Mobility Flow',
      },
    ],
  },
];

export const heroSlides = [
  {
    id: 'slide-1',
    title: 'Boutique Yoga Curated for You',
    subtitle: 'สัมผัสคลาสไลฟ์สไตล์ระดับโรงแรม 5 ดาว พร้อมโค้ชประจำสาขาและสตรีมแบบ Hybrid',
    ctaLabel: 'ดูคอร์สยอดนิยม',
    image:
      'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=1400&q=80',
  },
  {
    id: 'slide-2',
    title: 'Private & Small Group Experiences',
    subtitle: 'เลือกรูปแบบที่ใช่ ตั้งแต่ One-on-One จนถึง Small Group พร้อม Aroma & Sound Bath',
    ctaLabel: 'เลือกสาขาใกล้คุณ',
    image:
      'https://images.unsplash.com/photo-1545239351-1141bd82e8a6?auto=format&fit=crop&w=1400&q=80',
  },
  {
    id: 'slide-3',
    title: 'Seamless Booking with Omise',
    subtitle: 'จอง จ่าย และรับสิทธิ์เรียนทันทีผ่านระบบ Omise Payment ที่เชื่อมต่อกับฐานข้อมูลเดิม',
    ctaLabel: 'เริ่มต้นประสบการณ์',
    image:
      'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=1400&q=80',
  },
];
