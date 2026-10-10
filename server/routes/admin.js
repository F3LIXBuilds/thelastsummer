import { Router } from 'express';
import { z } from 'zod';
import { query } from '../db/pool.js';
import { ah, requireAuth } from '../middleware/http.js';
import { Story } from '../../shared/story/schema.js';
import { loadStory, loadEpisode, newEpisodeTemplate } from '../services/storyStore.js';
import { compileEpisodeScript } from '../../shared/story/script.js';
import { analyze, unknownCharacters } from '../services/analyze.js';

const r = Router();

// role is checked in the database on every request, so removing admin takes effect immediately
async function requireAdmin(req, res, next) {
  try {
    const { rows: [u] } = await query('SELECT role FROM users WHERE id = $1', [req.userId]);
    if (u?.role !== 'admin') return res.status(403).json({ error: 'Admins only' });
    next();
  } catch (e) { next(e); }
}
r.use(requireAuth, requireAdmin);

const Id = z.string().regex(/^[a-z0-9-]{2,40}$/, 'use lowercase letters, numbers and dashes (2-40 characters)');
const Meta = Story.pick({ title: true, tagline: true, setting: true, genre: true, tags: true, characters: true, items: true })
  .extend({ published: z.boolean() })
  .superRefine((m, ctx) => {
    for (const k of Object.keys(m.characters))
      if (!/^[a-z][a-z0-9_-]*$/.test(k) || k === 'player')
        ctx.addIssue({ code: 'custom', message: `Character id "${k}" must be lowercase letters, numbers, _ or - (and can't be "player")` });
  });

/* ---- stories ---- */
r.get('/stories', ah(async (_req, res) => {
  const { rows } = await query(
    `SELECT s.id, s.title, s.published, s.updated_at,
            (SELECT count(*)::int FROM episodes e WHERE e.story_id = s.id) AS episodes,
            (SELECT count(*)::int FROM episodes e WHERE e.story_id = s.id AND e.published) AS published_episodes
       FROM stories s ORDER BY s.created_at`);
  res.json({ stories: rows });
}));

r.post('/stories', ah(async (req, res) => {
  const b = z.object({ id: Id, title: z.string().trim().min(1).max(80) }).parse(req.body);
  try { await query('INSERT INTO stories (id, title) VALUES ($1, $2)', [b.id, b.title]); }
  catch (e) {
    if (e.code === '23505') return res.status(409).json({ error: 'A story with that id already exists' });
    throw e;
  }
  res.status(201).json({ id: b.id });
}));

r.get('/stories/:id', ah(async (req, res) => {
  const { rows: [s] } = await query('SELECT * FROM stories WHERE id = $1', [req.params.id]);
  if (!s) return res.status(404).json({ error: 'Story not found' });
  const { rows: episodes } = await query(
    `SELECT id, season_id, season_title, position, title, description, published, updated_at
       FROM episodes WHERE story_id = $1 ORDER BY position, id`, [s.id]);
  res.json({
    story: { id: s.id, title: s.title, tagline: s.tagline, setting: s.setting, genre: s.genre, tags: s.tags, characters: s.characters, items: s.items, published: s.published },
    episodes,
  });
}));

r.put('/stories/:id', ah(async (req, res) => {
  const m = Meta.parse(req.body);

  // a character can't be removed while a live episode still uses it
  const { rows: live } = await query('SELECT id, script FROM episodes WHERE story_id = $1 AND published', [req.params.id]);
  const broken = [];
  for (const e of live) {
    try {
      const missing = unknownCharacters(compileEpisodeScript(e.script), m.characters);
      if (missing.length) broken.push(`${e.id} (${missing.join(', ')})`);
    } catch { /* an episode that was already broken isn't this edit's fault */ }
  }
  if (broken.length)
    return res.status(409).json({ error: `Live episodes still use these characters: ${broken.join('; ')}. Unpublish or edit them first.` });

  const { rowCount } = await query(
    `UPDATE stories SET title=$2, tagline=$3, setting=$4, genre=$5, tags=$6, characters=$7, items=$8, published=$9, updated_at=now() WHERE id=$1`,
    [req.params.id, m.title, m.tagline, m.setting, JSON.stringify(m.genre), JSON.stringify(m.tags), JSON.stringify(m.characters), JSON.stringify(m.items), m.published]);
  if (!rowCount) return res.status(404).json({ error: 'Story not found' });
  res.json({ ok: true });
}));

/* ---- episodes ---- */
r.post('/stories/:id/episodes', ah(async (req, res) => {
  const b = z.object({
    id: Id, title: z.string().trim().min(1).max(80), description: z.string().max(400).default(''),
    seasonId: Id.default('season-1'), seasonTitle: z.string().max(60).default('Season 1'),
  }).parse(req.body);
  try {
    await query(
      `INSERT INTO episodes (story_id, id, season_id, season_title, position, title, description, script)
       VALUES ($1, $2, $3,
               COALESCE((SELECT season_title FROM episodes WHERE story_id = $1 AND season_id = $3 LIMIT 1), $4),
               COALESCE((SELECT max(position) + 1 FROM episodes WHERE story_id = $1), 0), $5, $6, $7)`,
      [req.params.id, b.id, b.seasonId, b.seasonTitle, b.title, b.description, newEpisodeTemplate(b.id, b.title)]);
  } catch (e) {
    if (e.code === '23505') return res.status(409).json({ error: 'An episode with that id already exists' });
    if (e.code === '23503') return res.status(404).json({ error: 'Story not found' });
    throw e;
  }
  res.status(201).json({ id: b.id });
}));

r.get('/stories/:id/episodes/:ep', ah(async (req, res) => {
  const { rows: [e] } = await query(
    `SELECT id, season_id, season_title, title, description, script, published, updated_at
       FROM episodes WHERE story_id = $1 AND id = $2`, [req.params.id, req.params.ep]);
  if (!e) return res.status(404).json({ error: 'Episode not found' });
  res.json({ episode: e });
}));

r.put('/stories/:id/episodes/:ep', ah(async (req, res) => {
  const b = z.object({
    title: z.string().trim().min(1).max(80), description: z.string().max(400),
    script: z.string().max(150_000), published: z.boolean(),
  }).parse(req.body);
  const story = await loadStory(req.params.id, { admin: true });
  const result = analyze(b.script, story);
  // a draft may be saved broken, but nothing broken can go live
  if (b.published && !result.ok)
    return res.status(422).json({ error: 'Fix the script errors before publishing', errors: result.errors });
  const { rowCount } = await query(
    `UPDATE episodes SET title=$3, description=$4, script=$5, published=$6, updated_at=now() WHERE story_id=$1 AND id=$2`,
    [req.params.id, req.params.ep, b.title, b.description, b.script, b.published]);
  if (!rowCount) return res.status(404).json({ error: 'Episode not found' });
  res.json({ ok: true, ...result });
}));

// compiled episode for the author's test play (works on drafts too)
r.get('/stories/:id/episodes/:ep/compiled', ah(async (req, res) =>
  res.json(await loadEpisode(req.params.id, req.params.ep, { admin: true }))));

r.post('/compile', ah(async (req, res) => {
  const b = z.object({ storyId: Id, script: z.string().max(150_000) }).parse(req.body);
  res.json(analyze(b.script, await loadStory(b.storyId, { admin: true })));
}));

/* ---- background images ---- */
r.get('/media', ah(async (_req, res) => {
  const { rows } = await query('SELECT name, mime, size, created_at FROM media ORDER BY name');
  res.json({ media: rows });
}));

r.post('/media', ah(async (req, res) => {
  const b = z.object({
    name: z.string().regex(/^[a-z0-9_-]{2,60}$/, 'use lowercase letters, numbers, _ or -'),
    mime: z.enum(['image/png', 'image/jpeg', 'image/webp']),
    data: z.string().min(1),
  }).parse(req.body);
  const buf = Buffer.from(b.data, 'base64');
  if (!buf.length || buf.length > 2_000_000) return res.status(400).json({ error: 'Image must be under 2 MB' });
  await query(
    `INSERT INTO media (name, mime, data, size) VALUES ($1,$2,$3,$4)
     ON CONFLICT (name) DO UPDATE SET mime = EXCLUDED.mime, data = EXCLUDED.data, size = EXCLUDED.size`,
    [b.name, b.mime, buf, buf.length]);
  res.status(201).json({ ok: true });
}));

/* ---- colour backgrounds ---- */
const Hex = z.string().regex(/^#[0-9a-fA-F]{6}$/);
const BgName = z.string().regex(/^[a-z0-9_-]{2,40}$/, 'use lowercase letters, numbers, _ or -');
const BgBody = z.object({
  sky: z.tuple([Hex, Hex, Hex]),
  kind: z.enum(['none', 'city', 'stalls', 'house', 'beach', 'dock', 'room']),
  stars: z.boolean(),
});

r.get('/backgrounds', ah(async (_req, res) => {
  const { rows } = await query('SELECT name, sky, kind, stars FROM backgrounds ORDER BY name');
  res.json({ backgrounds: rows });
}));

r.put('/backgrounds/:name', ah(async (req, res) => {
  const name = BgName.parse(req.params.name);
  const b = BgBody.parse(req.body);
  await query(
    `INSERT INTO backgrounds (name, sky, kind, stars) VALUES ($1,$2,$3,$4)
     ON CONFLICT (name) DO UPDATE SET sky = EXCLUDED.sky, kind = EXCLUDED.kind, stars = EXCLUDED.stars, updated_at = now()`,
    [name, JSON.stringify(b.sky), b.kind, b.stars]);
  res.json({ ok: true });
}));

r.delete('/backgrounds/:name', ah(async (req, res) => {
  await query('DELETE FROM backgrounds WHERE name = $1', [req.params.name]);
  res.json({ ok: true });
}));

export default r;

