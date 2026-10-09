import './env.js';
import { pool } from '../db/pool.js';

const email = process.argv[2];
if (!email) { console.error('Usage: npm run admin:promote -- you@example.com'); process.exit(1); }
const { rowCount } = await pool.query("UPDATE users SET role = 'admin' WHERE lower(email) = lower($1)", [email]);
console.log(rowCount ? `${email} is now an admin.` : 'No user with that email.');
await pool.end();
