/**
 * Change 2 — Create staging admin account
 * Usage: node backend/scripts/create-staging-admin.js
 * Safe to run multiple times — uses ON CONFLICT DO NOTHING.
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const pool = require('../src/db');
const bcrypt = require('bcrypt');

async function createStagingAdmin() {
  const email = 'staging-admin@saveapp.internal';
  const password = 'StagingAdmin2026!';
  const name = 'Staging Admin';
  const note = 'Staging test account — never use in production';

  // Add notes column if it doesn't exist
  await pool.query(`
    ALTER TABLE users ADD COLUMN IF NOT EXISTS notes TEXT
  `);

  const exists = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
  if (exists.rows.length > 0) {
    console.log(`ℹ️  Staging admin already exists (id=${exists.rows[0].id}). Nothing changed.`);
    await pool.end();
    return;
  }

  const password_hash = await bcrypt.hash(password, 12);

  const result = await pool.query(
    `INSERT INTO users (name, email, password_hash, is_verified, role, notes)
     VALUES ($1, $2, $3, true, 'admin', $4)
     RETURNING id`,
    [name, email, password_hash, note]
  );

  console.log(`✅ Staging admin created (id=${result.rows[0].id})`);
  console.log(`   Email:    ${email}`);
  console.log(`   Password: ${password}`);
  console.log(`   Role:     admin`);
  console.log(`   Note:     ${note}`);

  await pool.end();
}

createStagingAdmin().catch(err => {
  console.error('❌ Failed:', err.message);
  process.exit(1);
});
