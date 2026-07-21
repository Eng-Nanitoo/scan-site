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
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS settings (
        id SERIAL PRIMARY KEY,
        logo_url TEXT,
        event_name VARCHAR(255) DEFAULT 'Graduation Party',
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS cards (
        id SERIAL PRIMARY KEY,
        unique_key VARCHAR(36) UNIQUE NOT NULL,
        guest_name VARCHAR(255) NOT NULL,
        scanned BOOLEAN DEFAULT FALSE,
        scanned_at TIMESTAMP,
        scanned_by INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS activity_log (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        username VARCHAR(255) NOT NULL,
        action VARCHAR(50) NOT NULL,
        guest_name VARCHAR(255),
        details TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Insert default settings if not exist
    const settingsExist = await client.query('SELECT COUNT(*) FROM settings');
    if (parseInt(settingsExist.rows[0].count) === 0) {
      await client.query("INSERT INTO settings (event_name) VALUES ('Graduation Party')");
    }

    // Fix foreign key constraints to allow user deletion
    await client.query(`
      DO $$
      BEGIN
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
