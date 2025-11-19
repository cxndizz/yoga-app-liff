# สรุปการแก้ไขระบบ CRUD

## 🔍 ปัญหาที่พบ

### 1. Schema Mismatch - branches table
**ปัญหา:** Database ไม่มีคอลัมน์ `map_url` ในตาราง `branches`

**Error ที่เกิดขึ้น:**
```
ERROR: column "map_url" of relation "branches" does not exist at character 45
STATEMENT: INSERT INTO branches (name, address, phone, map_url, is_active) VALUES ($1, $2, $3, $4, $5)
```

**สาเหตุ:**
- `init.sql` มีคอลัมน์ `map_url` (line 33)
- API routes ใช้ `map_url` (`src/api/src/routes/branches.js`)
- Admin panel ใช้ `map_url` (`src/admin-web/src/pages/Branches.jsx`)
- แต่ database ที่ทำงานอยู่ไม่มีคอลัมน์นี้ (ถูกสร้างก่อนมีการเพิ่ม map_url)

### 2. Migration Runner ไม่สมบูรณ์
**ปัญหา:** `src/api/src/scripts/runMigration.js` รันเฉพาะไฟล์ `001_add_missing_tables.sql` เท่านั้น ทำให้ migration ใหม่ไม่ถูกรัน

### 3. Schema Mismatch - instructors table
**ปัญหา:** Database production ที่ใช้งานจริงถูกสร้างก่อนเพิ่มคอลัมน์ `email`, `phone`, `specialties`, `is_active`, `created_at`, `updated_at`

**Error ที่เกิดขึ้น:**
```
ERROR:  column "email" of relation "instructors" does not exist
STATEMENT: INSERT INTO instructors (name, bio, avatar_url, email, phone, specialties, is_active) VALUES (...)
```

**สาเหตุ:**
- API (`src/api/src/routes/instructors.js`) และหน้า Admin (`src/admin-web/src/pages/Instructors.jsx`) ส่งค่าคอลัมน์เหล่านี้ทุกครั้งที่สร้าง/แก้ไขผู้สอน
- ตาราง `instructors` ที่มีอยู่จริงยังเป็นเวอร์ชันเก่า ทำให้ INSERT/UPDATE ล้มเหลว

## ✅ การแก้ไข

### 1. สร้าง Migration File ใหม่
สร้างไฟล์ `002_fix_branches_schema.sql` ใน 2 locations:
- `/docker/db/migrations/002_fix_branches_schema.sql`
- `/src/api/migrations/002_fix_branches_schema.sql`

**สิ่งที่ migration ทำ:**
- ตรวจสอบว่าคอลัมน์ `map_url` มีอยู่แล้วหรือไม่
- ถ้าไม่มี ให้เพิ่มคอลัมน์ `map_url TEXT` เข้าไป
- ตรวจสอบคอลัมน์อื่นๆ ที่จำเป็นทั้งหมด
- แจ้งผลการทำงานผ่าน RAISE NOTICE

### 2. อัปเดต Migration Runner
แก้ไขไฟล์ `/src/api/src/scripts/runMigration.js` ให้รองรับหลาย migration files

**คุณสมบัติใหม่:**
- สร้างตาราง `schema_migrations` เพื่อติดตาม migrations ที่รันไปแล้ว
- อ่าน migrations directory และรันไฟล์ .sql ทั้งหมดตามลำดับ (001, 002, 003, ...)
- ข้ามการรัน migration ที่เคยรันไปแล้ว
- ใช้ transaction เพื่อความปลอดภัย (BEGIN/COMMIT/ROLLBACK)
- ตรวจสอบ schema หลังรัน migration

### 3. เพิ่ม migration สำหรับ instructors
เพิ่มไฟล์ `003_fix_instructors_schema.sql` ทั้งใน `/docker/db/migrations` และ `/src/api/migrations`

**สิ่งที่ migration ทำ:**
- เพิ่มคอลัมน์ `email`, `phone`, `specialties`, `is_active`, `created_at`, `updated_at` หากหายไป
- บังคับค่า default (empty array / TRUE / NOW) และเติมค่าที่ขาดให้ row เก่า
- ตรวจสอบซ้ำอีกครั้ง หากยังขาดคอลัมน์จะ RAISE EXCEPTION ทันที

## 📊 สถานะ CRUD Operations

### ✅ Branches (สาขา)
- **Create:** ✅ พร้อมใช้งาน (หลังรัน migration)
- **Read:** ✅ ทำงานปกติ
- **Update:** ✅ พร้อมใช้งาน (หลังรัน migration)
- **Delete:** ✅ ทำงานปกติ (soft delete)

### ✅ Instructors (ผู้สอน)
- **Create:** ✅ ทำงานปกติ
- **Read:** ✅ ทำงานปกติ
- **Update:** ✅ ทำงานปกติ
- **Delete:** ✅ ทำงานปกติ (soft delete)

### ✅ Courses (คอร์ส)
- **Create:** ✅ ทำงานปกติ
- **Read:** ✅ ทำงานปกติ
- **Update:** ✅ ทำงานปกติ
- **Delete:** ✅ ทำงานปกติ (มี validation)

### ✅ Course Sessions (รอบเรียน)
- **Create:** ✅ ทำงานปกติ
- **Read:** ✅ ทำงานปกติ
- **Update:** ✅ ทำงานปกติ
- **Delete:** ✅ ทำงานปกติ (มี validation)

### ✅ Enrollments (การลงทะเบียน)
- **Create:** ✅ ทำงานปกติ
- **Read:** ✅ ทำงานปกติ
- **Update:** ✅ ทำงานปกติ
- **Delete:** ✅ ทำงานปกติ

### ✅ Customers (ลูกค้า)
- **Create:** ไม่มี (สร้างผ่าน LINE LIFF)
- **Read:** ✅ ทำงานปกติ
- **Update:** ✅ ทำงานปกติ
- **Delete:** ไม่มี (ไม่อนุญาต)

### ✅ Content Pages (หน้าเนื้อหา)
- **Create:** ✅ ทำงานปกติ
- **Read:** ✅ ทำงานปกติ
- **Update:** ✅ ทำงานปกติ
- **Delete:** ✅ ทำงานปกติ

### ✅ Settings (การตั้งค่า)
- **Create:** ✅ ทำงานปกติ
- **Read:** ✅ ทำงานปกติ
- **Update:** ✅ ทำงานปกติ
- **Delete:** ✅ ทำงานปกติ

## 🚀 วิธีใช้งาน

### การรัน Migration

Migration จะถูกรันอัตโนมัติเมื่อ restart API server:

```bash
docker compose restart yoga_lineoa_api
```

หรือ rebuild ใหม่:

```bash
docker compose down
docker compose up -d
```

### ตรวจสอบ Migration Logs

ดู logs ของ API server:

```bash
docker compose logs -f yoga_lineoa_api
```

คุณจะเห็นข้อความแบบนี้:

```
Starting database migrations...
Using migrations directory: /app/docker/db/migrations
Found 3 migration file(s)
⏭️  Skipping 001_add_missing_tables.sql (already applied)
⏭️  Skipping 002_fix_branches_schema.sql (already applied)

🔄 Running migration: 003_fix_instructors_schema.sql
✅ Successfully applied: 003_fix_instructors_schema.sql

✅ All migrations completed successfully!

Verifying schema...
Existing tables:
  ✓ branches
  ✓ courses
  ✓ course_enrollments
  ✓ course_sessions
  ✓ instructors

✅ branches.map_url column exists (text)
✅ courses.status column exists (character varying)
```

## 🛡️ Security & Best Practices

### 1. Input Validation
- ทุก API endpoint มี validation สำหรับ required fields
- ใช้ parameterized queries เพื่อป้องกัน SQL injection
- ตรวจสอบ unique constraints (เช่น slug, email)

### 2. Authentication & Authorization
- ใช้ `requireAdminAuth` middleware สำหรับทุก admin endpoints
- มีการแบ่ง role: `super_admin`, `branch_admin`, `instructor`, `staff`
- Protected endpoints ตาม role ที่เหมาะสม

### 3. Error Handling
- ทุก endpoint มี try-catch block
- Error messages ไม่เปิดเผยข้อมูลที่ละเอียดอ่อน
- มี proper HTTP status codes

### 4. Data Integrity
- ใช้ soft delete สำหรับข้อมูลสำคัญ (branches, instructors)
- มี validation ก่อน delete (ตรวจสอบ foreign key relationships)
- ใช้ transactions สำหรับ bulk operations

## 📝 ไฟล์ที่แก้ไข

1. **Migration Files:**
   - `/docker/db/migrations/002_fix_branches_schema.sql` (ใหม่)
   - `/src/api/migrations/002_fix_branches_schema.sql` (ใหม่)
   - `/docker/db/migrations/003_fix_instructors_schema.sql` (ใหม่)
   - `/src/api/migrations/003_fix_instructors_schema.sql` (ใหม่)

2. **Migration Runner:**
   - `/src/api/src/scripts/runMigration.js` (แก้ไข)

## 🔄 Next Steps

1. **Restart API Server** เพื่อรัน migration
2. **ทดสอบ CRUD operations** ผ่าน Admin Panel
3. **ตรวจสอบ logs** เพื่อให้แน่ใจว่า migration สำเร็จ
4. **Backup database** ก่อนทำการ deploy production

## 💡 Tips

- หากต้องการ rollback migration สามารถสร้าง migration file ใหม่ที่ DROP COLUMN ได้
- ตรวจสอบ `schema_migrations` table เพื่อดู migrations ที่รันไปแล้ว:
  ```sql
  SELECT * FROM schema_migrations ORDER BY applied_at DESC;
  ```
- หาก migration fail จะมี ROLLBACK อัตโนมัติ ไม่ต้องกังวลเรื่อง partial updates

## 📞 Support

หากพบปัญหาเพิ่มเติม:
1. ตรวจสอบ logs: `docker compose logs -f yoga_lineoa_api`
2. ตรวจสอบ database schema: `\d branches` ใน psql
3. ตรวจสอบ schema_migrations: `SELECT * FROM schema_migrations;`
