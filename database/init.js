import dotenv from 'dotenv';
import pg from 'pg';
import fs from 'node:fs';

dotenv.config({ path: 'server/.env' });

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  console.error('Missing DATABASE_URL in server/.env');
  process.exit(1);
}

// Connect to default 'postgres' db first to ensure target database exists
try {
  const urlObj = new URL(dbUrl);
  const targetDb = urlObj.pathname.slice(1) || 'last_summer';
  urlObj.pathname = '/postgres';

  const adminClient = new pg.Client({ connectionString: urlObj.toString() });
  await adminClient.connect();
  try {
    await adminClient.query(`CREATE DATABASE "${targetDb}"`);
    console.log(`Database "${targetDb}" created.`);
  } catch (err) {
    if (err.code !== '42P04') console.log(`Notice during database check: ${err.message}`);
  } finally {
    await adminClient.end().catch(() => {});
  }
} catch {
  /* proceed directly to connection if URL parsing was not needed */
}

const sql = fs.readFileSync(new URL('./schema.sql', import.meta.url), 'utf8');
const client = new pg.Client({ connectionString: dbUrl });
await client.connect();
await client.query(sql);
await client.end();
console.log('Database ready.');

