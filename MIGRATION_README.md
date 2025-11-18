# Database Migration Guide

## ปัญหาที่แก้ไข

แก้ไข error ฐานข้อมูลที่เกิดจาก:
1. ตาราง `course_enrollments` ไม่มีในฐานข้อมูล
2. ตาราง `course_sessions` ไม่มีในฐานข้อมูล
3. คอลัมน์ `status` ไม่มีในตาราง `courses`

## วิธีรัน Migration

### วิธีที่ 1: รันผ่าน Node.js Script (แนะนำ)

```bash
cd src/api
node src/scripts/runMigration.js
```

Script นี้จะ:
- ตรวจสอบและสร้างตารางที่ขาดหายไป
- ตรวจสอบและเพิ่มคอลัมน์ที่จำเป็น
- แสดงผลการตรวจสอบหลังจากรัน migration

### วิธีที่ 2: รันโดยตรงผ่าน psql

```bash
psql -U your_db_user -d your_db_name -f docker/db/migrations/001_add_missing_tables.sql
```

### วิธีที่ 3: รันผ่าน Docker (ถ้าใช้ Docker)

```bash
docker exec -i yoga_lineoa_db psql -U postgres -d yoga_db < docker/db/migrations/001_add_missing_tables.sql
```

## การตรวจสอบหลังรัน Migration

ตรวจสอบว่าตารางถูกสร้างแล้ว:

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('courses', 'course_sessions', 'course_enrollments')
ORDER BY table_name;
```

ตรวจสอบคอลัมน์ status ในตาราง courses:

```sql
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'courses' AND column_name = 'status';
```

## ฟีเจอร์ใหม่ที่เพิ่ม

### เมนูใหม่ใน Admin Sidebar:
1. **Dashboard** - แดชบอร์ดหลัก
2. **Courses** - จัดการคอร์สเรียน
3. **Sessions** - จัดการรอบเรียน (ใหม่)
4. **Enrollments** - จัดการการลงทะเบียน (ใหม่)
5. **Branches** - จัดการสาขา (ใหม่)
6. **Instructors** - จัดการผู้สอน (ใหม่)
7. **Users** - จัดการผู้ใช้

### API Endpoints ใหม่:
- `GET /api/admin/enrollments` - ดึงข้อมูลการลงทะเบียนทั้งหมด
- `GET /api/admin/enrollments/:id` - ดึงข้อมูลการลงทะเบียนรายการเดียว
- `POST /api/admin/enrollments` - สร้างการลงทะเบียนใหม่
- `PATCH /api/admin/enrollments/:id` - อัพเดทสถานะการลงทะเบียน
- `DELETE /api/admin/enrollments/:id` - ลบการลงทะเบียน
- `POST /api/admin/enrollments/:id/attend` - บันทึกการเข้าร่วม

## หมายเหตุ

- Migration script ใช้ `CREATE TABLE IF NOT EXISTS` เพื่อความปลอดภัย
- จะไม่มีผลกับข้อมูลเดิมที่มีอยู่แล้ว
- สามารถรันซ้ำได้โดยไม่เกิด error
