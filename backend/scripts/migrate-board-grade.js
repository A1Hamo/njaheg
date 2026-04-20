'use strict';
const dotenv = require('dotenv');
dotenv.config({ path: '.env.development' });
const { pool } = require('../src/config/postgres');

async function migrate() {
  try {
    const client = await pool.connect();
    await client.query('ALTER TABLE board_posts ADD COLUMN IF NOT EXISTS grade VARCHAR(50)');
    console.log('✅ grade column added to board_posts');
    client.release();
    await pool.end();
    process.exit(0);
  } catch (e) {
    console.error('❌ Migration failed:', e.message);
    process.exit(1);
  }
}
migrate();
