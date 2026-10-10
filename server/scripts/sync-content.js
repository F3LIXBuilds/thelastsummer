import pg from 'pg';

const { SOURCE_URL, TARGET_URL } = process.env;
const apply = process.argv.includes('--apply');
const j = JSON.stringify;

if (!SOURCE_URL || !TARGET_URL) {
  console.error('Set SOURCE_URL (where your content is now) and TARGET_URL (where it should go).');
  process.exit(1);
}
if (SOURCE_URL === TARGET_URL) {
  console.error('SOURCE_URL and TARGET_URL point at the same database.');
  process.exit(1);
}

async function connect(url) {
  const u = new URL(url);
  const local = ['localhost', '127.0.0.1'].includes(u.hostname);
  u.searchParams.delete('sslmode'); // we set SSL ourselves below
  const client = new pg.Client({ connectionString: u.toString(), ssl: local ? false : { rejectUnauthorized: false } });
  await client.connect();
  return client;
}

const src = await connect(SOURCE_URL);
const dst = await connect(TARGET_URL);
const done = async () => { await src.end(); await dst.end(); };

const read = async (sql) => (await src.query(sql)).rows;
const stories = await read('SELECT * FROM stories ORDER BY created_at');
const episodes = await read('SELECT * FROM episodes ORDER BY story_id, position, id');
const backgrounds = await read('SELECT * FROM backgrounds');
const media = await read('SELECT * FROM media');

console.log(`Found in source: ${stories.length} stories, ${episodes.length} episodes, ${backgrounds.length} colour backgrounds, ${media.length} images\n`);
for (const e of episodes)
  console.log(`  ${e.story_id}/${e.id}  ${e.published ? 'LIVE ' : 'draft'}  ${e.title}  (${e.script.length} characters)`);

if (!apply) {
  console.log('\nDry run: nothing was written. If this list looks right, run again with --apply.');
  await done();
  process.exit(0);
}

await dst.query('BEGIN');
try {
  for (const s of stories)
    await dst.query(
      `INSERT INTO stories (id, title, tagline, setting, genre, tags, characters, items, published, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
       ON CONFLICT (id) DO UPDATE SET title=EXCLUDED.title, tagline=EXCLUDED.tagline, setting=EXCLUDED.setting,
         genre=EXCLUDED.genre, tags=EXCLUDED.tags, characters=EXCLUDED.characters, items=EXCLUDED.items,
         published=EXCLUDED.published, updated_at=EXCLUDED.updated_at`,
      [s.id, s.title, s.tagline, s.setting, j(s.genre), j(s.tags), j(s.characters), j(s.items), s.published, s.created_at, s.updated_at]);

  for (const e of episodes)
    await dst.query(
      `INSERT INTO episodes (story_id, id, season_id, season_title, position, title, description, script, published, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       ON CONFLICT (story_id, id) DO UPDATE SET season_id=EXCLUDED.season_id, season_title=EXCLUDED.season_title,
         position=EXCLUDED.position, title=EXCLUDED.title, description=EXCLUDED.description,
         script=EXCLUDED.script, published=EXCLUDED.published, updated_at=EXCLUDED.updated_at`,
      [e.story_id, e.id, e.season_id, e.season_title, e.position, e.title, e.description, e.script, e.published, e.updated_at]);

  for (const b of backgrounds)
    await dst.query(
      `INSERT INTO backgrounds (name, sky, kind, stars, updated_at) VALUES ($1,$2,$3,$4,$5)
       ON CONFLICT (name) DO UPDATE SET sky=EXCLUDED.sky, kind=EXCLUDED.kind, stars=EXCLUDED.stars, updated_at=EXCLUDED.updated_at`,
      [b.name, j(b.sky), b.kind, b.stars, b.updated_at]);

  for (const m of media)
    await dst.query(
      `INSERT INTO media (name, mime, data, size, created_at) VALUES ($1,$2,$3,$4,$5)
       ON CONFLICT (name) DO UPDATE SET mime=EXCLUDED.mime, data=EXCLUDED.data, size=EXCLUDED.size`,
      [m.name, m.mime, m.data, m.size, m.created_at]);

  await dst.query('COMMIT');
  console.log('\nDone. The target database now has the same stories, episodes, backgrounds and images.');
} catch (err) {
  await dst.query('ROLLBACK');
  console.error('\nFailed, and nothing was changed in the target:', err.message);
  process.exitCode = 1;
} finally {
  await done();
}
