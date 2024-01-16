import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'i-growth',
  waitForConnections: true,
  connectionLimit: 15,
  queueLimit: 0
});

export default pool;