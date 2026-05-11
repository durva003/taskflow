const { Pool } = require('pg');

console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Found' : 'NOT FOUND');

const pool = new Pool(
  process.env.DATABASE_URL
    ? {
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
      }
    : {
        user: process.env.USER,
        host: 'localhost',
        database: 'taskflow',
        password: '',
        port: 5432,
      }
);

pool.connect((err, client, release) => {
  if (err) {
    console.error('Database connection error:', err.message);
  } else {
    console.log('Database connected successfully!');
    release();
  }
});

module.exports = pool;