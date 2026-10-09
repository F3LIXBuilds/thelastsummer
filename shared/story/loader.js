import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Story, Episode } from './schema.js';
import { compileEpisodeScript } from './script.js';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), 'stories');
const ID = /^[a-z0-9-]+$/;
const cache = new Map();
const useCache = process.env.NODE_ENV === 'production';

export class StoryError extends Error {
  constructor(message, status = 500) { super(message); this.status = status; }
}

const readJson = async (...p) => JSON.parse(await fs.readFile(path.join(ROOT, ...p), 'utf8'));

export async function getStory(id) {
  if (!ID.test(id)) throw new StoryError('Story not found', 404);
  if (useCache && cache.has(id)) return cache.get(id);
  let raw;
  try { raw = await readJson(id, 'story.json'); } catch { throw new StoryError('Story not found', 404); }
  const story = Story.parse(raw);
  cache.set(id, story);
  return story;
}

export async function listStories() {
  const dirs = (await fs.readdir(ROOT, { withFileTypes: true })).filter((d) => d.isDirectory());
  const out = [];
  for (const d of dirs) {
    try {
      const s = await getStory(d.name);
      out.push({
        id: s.id, title: s.title, tagline: s.tagline, genre: s.genre, tags: s.tags, setting: s.setting,
        episodeCount: s.seasons.flatMap((x) => x.episodes).filter((e) => e.published).length,
        cast: Object.entries(s.characters).map(([id, c]) => ({ id, name: c.name, appearance: c.appearance })),
      });
    } catch (e) {
      console.error(`[stories] skipped "${d.name}": ${e.message}`);
    }
  }
  return out;
}

export async function getEpisode(storyId, episodeId) {
  const key = `${storyId}/${episodeId}`;
  if (useCache && cache.has(key)) return cache.get(key);
  const story = await getStory(storyId);
  const meta = story.seasons.flatMap((s) => s.episodes).find((e) => e.id === episodeId);
  if (!meta || !meta.published || !meta.file) throw new StoryError('Episode not found', 404);
  const episode = meta.file.endsWith('.story')
    ? compileEpisodeScript(await fs.readFile(path.join(ROOT, storyId, meta.file), 'utf8'))
    : Episode.parse(await readJson(storyId, meta.file));
  // every speaker/actor must exist (the special id "player" is always allowed)
  const missing = new Set();
  for (const sc of episode.scenes)
    for (const st of sc.steps) {
      const steps = [st, ...(st.type === 'choice' ? st.options.flatMap((o) => o.then) : [])];
      for (const x of steps) if (x.char && x.char !== 'player' && !story.characters[x.char]) missing.add(x.char);
    }
  if (missing.size) throw new StoryError(`Episode references unknown characters: ${[...missing].join(', ')}`);
  cache.set(key, episode);
  return episode;
}
