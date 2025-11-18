const fs = require('fs');
const path = require('path');
const db = require('../db');

async function runMigration() {
  try {
    console.log('Starting database migration...');

    const migrationPath = path.join(__dirname, '../../../docker/db/migrations/001_add_missing_tables.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('Running migration script...');
    await db.query(migrationSQL);

    console.log(' Migration completed successfully!');
    console.log('\nVerifying tables...');

    // Verify tables exist
    const verifyQuery = `
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name IN ('courses', 'course_sessions', 'course_enrollments')
      ORDER BY table_name;
    `;

    const result = await db.query(verifyQuery);
    console.log('\nExisting tables:');
    result.rows.forEach(row => {
      console.log(`  - ${row.table_name}`);
    });

    // Verify courses.status column exists
    const verifyStatusQuery = `
      SELECT column_name, data_type, column_default
      FROM information_schema.columns
      WHERE table_name = 'courses' AND column_name = 'status';
    `;

    const statusResult = await db.query(verifyStatusQuery);
    if (statusResult.rows.length > 0) {
      console.log('\n courses.status column exists:', statusResult.rows[0]);
    } else {
      console.log('\n courses.status column NOT FOUND!');
    }

    await db.close();
    process.exit(0);
  } catch (error) {
    console.error(' Migration failed:', error.message);
    console.error(error);
    await db.close();
    process.exit(1);
  }
}

runMigration();
