import { Router } from 'express';
import { ah, requireAuth } from '../middleware/http.js';
import { listPublished, loadStory, loadEpisode } from '../services/storyStore.js';

const r = Router();
r.use(requireAuth);

r.get('/', ah(async (_req, res) => res.json({ stories: await listPublished() })));
r.get('/:storyId', ah(async (req, res) => res.json({ story: await loadStory(req.params.storyId) })));
r.get('/:storyId/episodes/:episodeId', ah(async (req, res) =>
  res.json({ episode: (await loadEpisode(req.params.storyId, req.params.episodeId)).episode })));

export default r;
