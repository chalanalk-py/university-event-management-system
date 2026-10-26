import pg from 'pg';
const { Pool } = pg;

// Create connection pool using environment variables
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT, 10) || 5432,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

// Export query helper and pool instance
export const query = (text, params) => pool.query(text, params);
export { pool };
export default { query, pool };
