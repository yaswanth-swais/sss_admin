import { sql } from '@vercel/postgres';

// Option 1: Using postgres.js library (recommended for Next.js)
// If you installed 'postgres' package
// import postgres from 'postgres';
// const sql = postgres(process.env.DATABASE_URL, { ssl: 'require' });

// Option 2: Using pg library
// const { Pool } = require('pg');
// const pool = new Pool({
//   connectionString: process.env.DATABASE_URL,
//   ssl: { rejectUnauthorized: false }
// });

// For now, we'll set up the connection string format
// In Next.js, we can use Server Components to query directly [citation:3][citation:8]
export { sql };
