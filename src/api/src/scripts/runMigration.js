const fs = require('fs');
const path = require('path');
const db = require('../db');

async function runMigrations() {
  try {
    console.log('Starting database migrations...');

    // Create schema_migrations table if it doesn't exist
    await db.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version VARCHAR(255) PRIMARY KEY,
        applied_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // Find migrations directory
    const migrationDirCandidates = [
      // When the project is copied to /app (Docker image)
      path.resolve(__dirname, '../../docker/db/migrations'),
      // When the source lives under /app/src (some local setups)
      path.resolve(__dirname, '../../../docker/db/migrations'),
      // When running directly from the repository root (e.g. /workspace/yoga-app-liff)
      path.resolve(__dirname, '../../../../docker/db/migrations'),
      // Fallback to local migrations folder inside the API project
      path.resolve(__dirname, '../migrations'),
      path.resolve(__dirname, '../../migrations'),
      // As a last resort, try resolving from the current working directory
      path.resolve(process.cwd(), 'docker/db/migrations'),
      path.resolve(process.cwd(), 'src/api/migrations')
    ];

    const migrationDir = migrationDirCandidates.find(candidate => fs.existsSync(candidate));

    if (!migrationDir) {
      throw new Error(`Migrations directory not found. Looked for: ${migrationDirCandidates.join(', ')}`);
    }

    console.log(`Using migrations directory: ${migrationDir}`);

    // Get all .sql files in the migrations directory
    const migrationFiles = fs.readdirSync(migrationDir)
      .filter(file => file.endsWith('.sql'))
      .sort(); // Sort to ensure they run in order (001, 002, 003, etc.)

    console.log(`Found ${migrationFiles.length} migration file(s)`);

    // Get already applied migrations
    const appliedResult = await db.query('SELECT version FROM schema_migrations ORDER BY version');
    const appliedMigrations = new Set(appliedResult.rows.map(row => row.version));

    // Run migrations that haven't been applied yet
    for (const file of migrationFiles) {
      const version = file.replace('.sql', '');

      if (appliedMigrations.has(version)) {
        console.log(`⏭️  Skipping ${file} (already applied)`);
        continue;
      }

      console.log(`\n🔄 Running migration: ${file}`);
      const migrationPath = path.join(migrationDir, file);
      const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

      try {
        // Run the migration in a transaction
        await db.query('BEGIN');
        await db.query(migrationSQL);
        await db.query('INSERT INTO schema_migrations (version) VALUES ($1)', [version]);
        await db.query('COMMIT');
        console.log(`✅ Successfully applied: ${file}`);
      } catch (error) {
        await db.query('ROLLBACK');
        throw new Error(`Failed to apply migration ${file}: ${error.message}`);
      }
    }

    console.log('\n✅ All migrations completed successfully!');
    console.log('\nVerifying schema...');

    // Verify key tables exist
    const verifyTablesQuery = `
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name IN ('branches', 'courses', 'course_sessions', 'course_enrollments', 'instructors')
      ORDER BY table_name;
    `;

    const tablesResult = await db.query(verifyTablesQuery);
    console.log('\nExisting tables:');
    tablesResult.rows.forEach(row => {
      console.log(`  ✓ ${row.table_name}`);
    });

    // Verify branches.map_url column exists
    const verifyMapUrlQuery = `
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'branches' AND column_name = 'map_url';
    `;

    const mapUrlResult = await db.query(verifyMapUrlQuery);
    if (mapUrlResult.rows.length > 0) {
      console.log(`\n✅ branches.map_url column exists (${mapUrlResult.rows[0].data_type})`);
    } else {
      console.log('\n⚠️  branches.map_url column NOT FOUND!');
    }

    // Verify courses.status column exists
    const verifyStatusQuery = `
      SELECT column_name, data_type, column_default
      FROM information_schema.columns
      WHERE table_name = 'courses' AND column_name = 'status';
    `;

    const statusResult = await db.query(verifyStatusQuery);
    if (statusResult.rows.length > 0) {
      console.log(`✅ courses.status column exists (${statusResult.rows[0].data_type})`);
    } else {
      console.log('⚠️  courses.status column NOT FOUND!');
    }

    await db.close();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error(error);
    await db.close();
    process.exit(1);
  }
}

runMigrations();
