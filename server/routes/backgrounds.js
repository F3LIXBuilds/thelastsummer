import { Router } from 'express';
import { query } from '../db/pool.js';
import { ah, requireAuth } from '../middleware/http.js';

const r = Router();
r.use(requireAuth);

r.get('/', ah(async (_req, res) => {
  const { rows } = await query('SELECT name, sky, kind, stars FROM backgrounds');
  res.json({ backgrounds: Object.fromEntries(rows.map((b) => [b.name, { sky: b.sky, kind: b.kind, stars: b.stars }])) });
}));

export default r;
