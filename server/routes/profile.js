import { Router } from 'express';
import { z } from 'zod';
import { query } from '../db/pool.js';
import { ah, requireAuth } from '../middleware/http.js';
import { loadMe } from '../services/users.js';

const r = Router();
const s = z.string().max(24);
const Body = z.object({
  displayName: z.string().trim().min(1).max(24),
  pronouns: z.enum(['she/her', 'he/him', 'they/them']),
  appearance: z.object({ skin: s, hair: s, hairColor: s, eyes: s, brows: s, face: s, outfit: s, outfitColor: s, accessory: s }),
  onboarded: z.boolean().default(true),
});

r.get('/', requireAuth, ah(async (req, res) => res.json(await loadMe(req.userId))));

r.put('/', requireAuth, ah(async (req, res) => {
  const b = Body.parse(req.body);
  await query(
    `UPDATE player_profiles SET display_name=$2, pronouns=$3, appearance=$4, onboarded=$5, updated_at=now() WHERE user_id=$1`,
    [req.userId, b.displayName, b.pronouns, JSON.stringify(b.appearance), b.onboarded]);
  await query('UPDATE users SET avatar=$2, updated_at=now() WHERE id=$1', [req.userId, JSON.stringify(b.appearance)]);
  res.json(await loadMe(req.userId));
}));

export default r;
