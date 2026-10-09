import { Router } from 'express';
import { z } from 'zod';
import { query } from '../db/pool.js';
import { ah, requireAuth } from '../middleware/http.js';

const r = Router();
r.use(requireAuth);

const Id = z.string().regex(/^[a-zA-Z0-9_-]{1,60}$/);
const State = z.object({
  relationships: z.record(z.record(z.number())),
  stats: z.record(z.number()),
  inventory: z.array(z.string().max(60)).max(200),
  flags: z.record(z.boolean()),
  decisions: z.array(z.object({}).passthrough()).max(1000),
  log: z.array(z.object({}).passthrough()).max(1000),
});
const Save = z.object({
  episodeId: Id,
  sceneId: Id.nullable(),
  picks: z.array(Id).max(200).default([]),
  state: State,
  snapshot: State.optional(),
  completeEpisode: Id.optional(),
});
const map = (x) => x && ({
  storyId: x.story_id, episodeId: x.episode_id, sceneId: x.scene_id, picks: x.picks,
  state: x.state, snapshots: x.snapshots, completed: x.completed, updatedAt: x.updated_at,
});

r.get('/progress', ah(async (req, res) => {
  const { rows } = await query('SELECT * FROM player_progress WHERE user_id=$1 ORDER BY updated_at DESC', [req.userId]);
  res.json({ progress: rows.map(map) });
}));

r.get('/progress/:storyId', ah(async (req, res) => {
  const { rows: [row] } = await query('SELECT * FROM player_progress WHERE user_id=$1 AND story_id=$2', [req.userId, Id.parse(req.params.storyId)]);
  res.json({ progress: map(row) ?? null });
}));

r.put('/progress/:storyId', ah(async (req, res) => {
  const storyId = Id.parse(req.params.storyId);
  const b = Save.parse(req.body);
  const snapshots = b.snapshot ? { [b.episodeId]: b.snapshot } : {};
  const completed = b.completeEpisode ? [b.completeEpisode] : [];
  const { rows: [row] } = await query(
    `INSERT INTO player_progress (user_id, story_id, episode_id, scene_id, picks, state, snapshots, completed)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
     ON CONFLICT (user_id, story_id) DO UPDATE SET
       episode_id = EXCLUDED.episode_id, scene_id = EXCLUDED.scene_id, picks = EXCLUDED.picks, state = EXCLUDED.state,
       snapshots = player_progress.snapshots || EXCLUDED.snapshots,
       completed = (SELECT ARRAY(SELECT DISTINCT unnest(player_progress.completed || EXCLUDED.completed))),
       updated_at = now()
     RETURNING *`,
    [req.userId, storyId, b.episodeId, b.sceneId, JSON.stringify(b.picks), JSON.stringify(b.state), JSON.stringify(snapshots), completed]);
  res.json({ progress: map(row) });
}));

r.post('/choices', ah(async (req, res) => {
  const b = z.object({ storyId: Id, episodeId: Id, sceneId: Id, choiceId: Id, optionId: Id }).parse(req.body);
  await query(
    'INSERT INTO player_decisions (user_id, story_id, episode_id, scene_id, choice_id, option_id) VALUES ($1,$2,$3,$4,$5,$6)',
    [req.userId, b.storyId, b.episodeId, b.sceneId, b.choiceId, b.optionId]);
  res.status(201).json({ ok: true });
}));

r.get('/relationships', ah(async (req, res) => {
  const { rows } = await query('SELECT story_id, state->\'relationships\' AS relationships FROM player_progress WHERE user_id=$1', [req.userId]);
  res.json({ relationships: Object.fromEntries(rows.map((x) => [x.story_id, x.relationships])) });
}));

export default r;
