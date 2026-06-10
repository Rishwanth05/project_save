const { Pool } = require('pg');
require('dotenv').config();

function getConnectionConfig() {
  const isProd = process.env.NODE_ENV === 'production';
  const url = isProd ? process.env.DB_PROD_URL : process.env.DB_DEV_URL;

  if (url) return { connectionString: url };
  if (process.env.DATABASE_URL) return { connectionString: process.env.DATABASE_URL };

  return {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
  };
}

const pool = new Pool(getConnectionConfig());

pool.connect((err, client, release) => {
  if (err) {
    console.error('❌ PostgreSQL connection failed:', err.message);
  } else {
    console.log('✅ PostgreSQL connected successfully');
    release();
  }
});

module.exports = pool;
