const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function initDB() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(20) NOT NULL DEFAULT 'scanner',
        subadmin_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS settings (
        id SERIAL PRIMARY KEY,
        subadmin_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        logo_url TEXT,
        event_name VARCHAR(255) DEFAULT 'Graduation Party',
        event_subtitle VARCHAR(255) DEFAULT '',
        event_date VARCHAR(100) DEFAULT '',
        event_time VARCHAR(100) DEFAULT '',
        event_location_line1 VARCHAR(255) DEFAULT '',
        event_location_line2 VARCHAR(255) DEFAULT '',
        org_logo_text VARCHAR(50) DEFAULT '',
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(subadmin_id)
      );

      CREATE TABLE IF NOT EXISTS cards (
        id SERIAL PRIMARY KEY,
        unique_key VARCHAR(36) UNIQUE NOT NULL,
        guest_name VARCHAR(255) NOT NULL,
        scanned BOOLEAN DEFAULT FALSE,
        scanned_at TIMESTAMP,
        scanned_by INTEGER REFERENCES users(id),
        subadmin_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS activity_log (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        username VARCHAR(255) NOT NULL,
        action VARCHAR(50) NOT NULL,
        guest_name VARCHAR(255),
        details TEXT,
        subadmin_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Add subadmin_id column to users if not exists
    await client.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='subadmin_id') THEN
          ALTER TABLE users ADD COLUMN subadmin_id INTEGER REFERENCES users(id) ON DELETE SET NULL;
        END IF;
      END $$;
    `);

    // Add active column to users if not exists
    await client.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='active') THEN
          ALTER TABLE users ADD COLUMN active BOOLEAN DEFAULT TRUE;
        END IF;
      END $$;
    `);

    // Add subadmin_id to settings if not exists
    await client.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='settings' AND column_name='subadmin_id') THEN
          ALTER TABLE settings ADD COLUMN subadmin_id INTEGER REFERENCES users(id) ON DELETE SET NULL;
        END IF;
      END $$;
    `);

    // Add unique constraint on subadmin_id for settings if not exists
    await client.query(`
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'settings_subadmin_id_key'
        ) THEN
          ALTER TABLE settings ADD CONSTRAINT settings_subadmin_id_key UNIQUE (subadmin_id);
        END IF;
      END $$;
    `);

    // Add subadmin_id to cards if not exists
    await client.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='cards' AND column_name='subadmin_id') THEN
          ALTER TABLE cards ADD COLUMN subadmin_id INTEGER REFERENCES users(id) ON DELETE SET NULL;
        END IF;
      END $$;
    `);

    // Add subadmin_id to activity_log if not exists
    await client.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='activity_log' AND column_name='subadmin_id') THEN
          ALTER TABLE activity_log ADD COLUMN subadmin_id INTEGER REFERENCES users(id) ON DELETE SET NULL;
        END IF;
      END $$;
    `);

    // Fix foreign key constraints to allow user deletion
    await client.query(`
      DO $$ BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.table_constraints
          WHERE constraint_name = 'activity_log_user_id_fkey'
        ) THEN
          ALTER TABLE activity_log DROP CONSTRAINT activity_log_user_id_fkey;
          ALTER TABLE activity_log ADD CONSTRAINT activity_log_user_id_fkey
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;
        END IF;

        IF EXISTS (
          SELECT 1 FROM information_schema.table_constraints
          WHERE constraint_name = 'cards_scanned_by_fkey'
        ) THEN
          ALTER TABLE cards DROP CONSTRAINT cards_scanned_by_fkey;
          ALTER TABLE cards ADD CONSTRAINT cards_scanned_by_fkey
            FOREIGN KEY (scanned_by) REFERENCES users(id) ON DELETE SET NULL;
        END IF;
      END $$;
    `);

    console.log('Database initialized successfully');
  } finally {
    client.release();
  }
}

module.exports = { pool, initDB };
