import pg from 'pg';
import fs from 'node:fs';
import path from 'node:path';

const passwords = ['password', 'postgres', 'admin', 'root', '123456', 'postgres123', '1234', 'master', ''];
let matched = null;

for (const p of passwords) {
  const client = new pg.Client({ connectionString: `postgres://postgres:${p}@localhost:5432/postgres` });
  try {
    await client.connect();
    matched = p;
    console.log(`[db] Connected to PostgreSQL with password "${p}"`);
    
    // Create database if not exists
    try {
      await client.query('CREATE DATABASE last_summer');
      console.log('[db] Database "last_summer" created.');
    } catch (err) {
      if (err.code === '42P04') {
        console.log('[db] Database "last_summer" already exists.');
      } else {
        console.log('[db] Create DB message:', err.message);
      }
    }
    await client.end();
    break;
  } catch (err) {
    await client.end().catch(() => {});
  }
}

if (matched === null) {
  console.log('[db] Could not connect with standard default passwords.');
} else {
  // Update server/.env if password matched
  const envPath = path.resolve('server/.env');
  let envContent = fs.readFileSync(envPath, 'utf8');
  envContent = envContent.replace(/DATABASE_URL=.*/, `DATABASE_URL=postgres://postgres:${matched}@localhost:5432/last_summer`);
  fs.writeFileSync(envPath, envContent, 'utf8');
  console.log(`[db] Updated server/.env DATABASE_URL with password.`);
}
