import { query } from '../db/pool.js';
import { Story } from '../../shared/story/schema.js';
import { compileEpisodeScript } from '../../shared/story/script.js';
import { StoryError } from '../../shared/story/loader.js';
import { unknownCharacters } from './analyze.js';

export const newEpisodeTemplate = (id, title) => `EPISODE: ${id} | ${title}
START: opening

SCENE: opening
BACKGROUND: beach_house_morning
FADE: clear
> Write your first line here.
END: Episode Complete | To be continued.
`;

function assemble(s, eps) {
  const seasons = [];
  for (const e of eps) {
    let se = seasons.find((x) => x.id === e.season_id);
    if (!se) { se = { id: e.season_id, title: e.season_title, episodes: [] }; seasons.push(se); }
    se.episodes.push({ id: e.id, title: e.title, description: e.description, published: e.published });
  }
  return Story.parse({
    id: s.id, title: s.title, tagline: s.tagline, setting: s.setting, genre: s.genre, tags: s.tags,
    characters: s.characters, items: s.items, seasons,
  });
}

export async function loadStory(id, { admin = false } = {}) {
  const { rows: [s] } = await query(`SELECT * FROM stories WHERE id = $1${admin ? '' : ' AND published'}`, [id]);
  if (!s) throw new StoryError('Story not found', 404);
  const { rows: eps } = await query(
    'SELECT id, season_id, season_title, title, description, published FROM episodes WHERE story_id = $1 ORDER BY position, id', [id]);
  return assemble(s, eps);
}

export async function listPublished() {
  const { rows } = await query('SELECT id FROM stories WHERE published ORDER BY created_at');
  const out = [];
  for (const { id } of rows) {
    try {
      const s = await loadStory(id);
      out.push({
        id: s.id, title: s.title, tagline: s.tagline, genre: s.genre, tags: s.tags, setting: s.setting,
        episodeCount: s.seasons.flatMap((x) => x.episodes).filter((e) => e.published).length,
        cast: Object.entries(s.characters).map(([cid, c]) => ({ id: cid, name: c.name, appearance: c.appearance })),
      });
    } catch (e) { console.error(`[stories] skipped "${id}": ${e.message}`); }
  }
  return out;
}

const cache = new Map(); // compiled episodes keyed by id + last-modified time

export async function loadEpisode(storyId, episodeId, { admin = false } = {}) {
  const story = await loadStory(storyId, { admin });
  const { rows: [e] } = await query('SELECT script, published, updated_at FROM episodes WHERE story_id = $1 AND id = $2', [storyId, episodeId]);
  if (!e || (!admin && !e.published)) throw new StoryError('Episode not found', 404);
  const key = `${storyId}/${episodeId}/${new Date(e.updated_at).getTime()}`;
  let episode = cache.get(key);
  if (!episode) {
    episode = compileEpisodeScript(e.script);
    cache.set(key, episode);
    if (cache.size > 200) cache.delete(cache.keys().next().value);
  }
  const missing = unknownCharacters(episode, story.characters);
  if (missing.length) throw new StoryError(`This episode uses characters that aren't in the cast: ${missing.join(', ')}`, 422);
  return { story, episode };
}
