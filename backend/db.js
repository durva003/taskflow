const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.USER,
  host: 'localhost',
  database: 'taskflow',
  password: '',
  port: 5432,
});

pool.connect((err, client, release) => {
  if (err) {
    console.error('Database connection error:', err.message);
  } else {
    console.log('Database connected successfully!');
    release();
  }
});

module.exports = pool;