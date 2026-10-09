import { Router } from 'express';
import { query } from '../db/pool.js';
import { ah, requireAuth } from '../middleware/http.js';

const r = Router();
r.use(requireAuth);

r.get('/:name', ah(async (req, res) => {
  const { rows: [m] } = await query('SELECT mime, data FROM media WHERE name = $1', [req.params.name]);
  if (!m) return res.status(404).end();
  res.set('Cache-Control', 'private, max-age=3600').type(m.mime).send(m.data);
}));

export default r;
