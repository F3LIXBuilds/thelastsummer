import './env.js';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { pool } from '../db/pool.js';
import { Story, Episode } from '../../shared/story/schema.js';
import { decompileEpisode } from '../../shared/story/script.js';
import { newEpisodeTemplate } from '../services/storyStore.js';

const ROOT = fileURLToPath(new URL('../../shared/story/stories/', import.meta.url));
const force = process.argv.includes('--force'); // overwrites anything edited in the Studio!
const j = JSON.stringify;

for (const d of (await fs.readdir(ROOT, { withFileTypes: true })).filter((x) => x.isDirectory())) {
  const story = Story.parse(JSON.parse(await fs.readFile(path.join(ROOT, d.name, 'story.json'), 'utf8')));
  await pool.query(
    `INSERT INTO stories (id, title, tagline, setting, genre, tags, characters, items, published)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,true)
     ${force
       ? `ON CONFLICT (id) DO UPDATE SET title=EXCLUDED.title, tagline=EXCLUDED.tagline, setting=EXCLUDED.setting,
            genre=EXCLUDED.genre, tags=EXCLUDED.tags, characters=EXCLUDED.characters, items=EXCLUDED.items, updated_at=now()`
       : 'ON CONFLICT (id) DO NOTHING'}`,
    [story.id, story.title, story.tagline, story.setting, j(story.genre), j(story.tags), j(story.characters), j(story.items)]);

  let position = 0;
  for (const season of story.seasons)
    for (const ep of season.episodes) {
      let script;
      if (ep.file?.endsWith('.story')) script = await fs.readFile(path.join(ROOT, d.name, ep.file), 'utf8');
      else if (ep.file) script = decompileEpisode(Episode.parse(JSON.parse(await fs.readFile(path.join(ROOT, d.name, ep.file), 'utf8'))));
      else script = newEpisodeTemplate(ep.id, ep.title);
      await pool.query(
        `INSERT INTO episodes (story_id, id, season_id, season_title, position, title, description, script, published)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
         ${force
           ? `ON CONFLICT (story_id, id) DO UPDATE SET season_id=EXCLUDED.season_id, season_title=EXCLUDED.season_title,
                position=EXCLUDED.position, title=EXCLUDED.title, description=EXCLUDED.description,
                script=EXCLUDED.script, published=EXCLUDED.published, updated_at=now()`
           : 'ON CONFLICT (story_id, id) DO NOTHING'}`,
        [story.id, ep.id, season.id, season.title, position++, ep.title, ep.description, script, Boolean(ep.file) && ep.published]);
    }
  console.log(`Imported ${story.id}`);
}
await pool.end();
