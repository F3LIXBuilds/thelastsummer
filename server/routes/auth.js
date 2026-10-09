import { Router } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import { z } from 'zod';
import { pool, query } from '../db/pool.js';
import { ah, issueSession, requireAuth } from '../middleware/http.js';
import { loadMe } from '../services/users.js';

const r = Router();
const sha = (s) => crypto.createHash('sha256').update(s).digest('hex');
const Password = z.string().min(8).max(100);
const Register = z.object({
  email: z.string().email().max(120),
  username: z.string().regex(/^[a-zA-Z0-9_]{3,20}$/, '3-20 letters, numbers or underscores'),
  password: Password,
});

r.post('/register', ah(async (req, res) => {
  const { email, username, password } = Register.parse(req.body);
  const hash = await bcrypt.hash(password, 12);
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows: [u] } = await client.query(
      'INSERT INTO users (email, username, password_hash) VALUES ($1,$2,$3) RETURNING id', [email, username, hash]);
    await client.query('INSERT INTO player_profiles (user_id, display_name) VALUES ($1,$2)', [u.id, username]);
    await client.query('COMMIT');
    issueSession(res, u.id);
    res.status(201).json(await loadMe(u.id));
  } catch (e) {
    await client.query('ROLLBACK');
    if (e.code === '23505') return res.status(409).json({ error: 'That email or username is already taken' });
    throw e;
  } finally {
    client.release();
  }
}));

r.post('/login', ah(async (req, res) => {
  const { email, password } = z.object({ email: z.string().email(), password: z.string().min(1) }).parse(req.body);
  const { rows: [u] } = await query('SELECT id, password_hash FROM users WHERE lower(email) = lower($1)', [email]);
  if (!u || !(await bcrypt.compare(password, u.password_hash)))
    return res.status(401).json({ error: 'Wrong email or password' });
  issueSession(res, u.id);
  res.json(await loadMe(u.id));
}));

r.post('/logout', (_req, res) => { res.clearCookie('token'); res.json({ ok: true }); });

r.get('/me', requireAuth, ah(async (req, res) => {
  const me = await loadMe(req.userId);
  if (!me) return res.status(401).json({ error: 'Account not found' });
  res.json(me);
}));

r.post('/forgot', ah(async (req, res) => {
  const { email } = z.object({ email: z.string().email() }).parse(req.body);
  const { rows: [u] } = await query('SELECT id FROM users WHERE lower(email) = lower($1)', [email]);
  if (u) {
    const token = crypto.randomBytes(32).toString('hex');
    await query(`INSERT INTO password_resets (user_id, token_hash, expires_at) VALUES ($1,$2, now() + interval '1 hour')`, [u.id, sha(token)]);
    // No email provider wired up yet: the link prints in the server console.
    console.log(`[dev] Password reset link: ${process.env.CLIENT_ORIGIN}/reset?token=${token}`);
  }
  res.json({ ok: true }); // same answer whether or not the email exists
}));

r.post('/reset', ah(async (req, res) => {
  const { token, password } = z.object({ token: z.string().length(64), password: Password }).parse(req.body);
  const { rows: [row] } = await query(
    'SELECT id, user_id FROM password_resets WHERE token_hash = $1 AND used_at IS NULL AND expires_at > now()', [sha(token)]);
  if (!row) return res.status(400).json({ error: 'This reset link is invalid or has expired' });
  await query('UPDATE users SET password_hash = $2, updated_at = now() WHERE id = $1', [row.user_id, await bcrypt.hash(password, 12)]);
  await query('UPDATE password_resets SET used_at = now() WHERE id = $1', [row.id]);
  res.json({ ok: true });
}));

export default r;
