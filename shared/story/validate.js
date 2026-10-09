import { getStory, getEpisode, listStories } from './loader.js';

let bad = 0;
for (const s of await listStories()) {
  const story = await getStory(s.id);
  for (const ep of story.seasons.flatMap((x) => x.episodes).filter((e) => e.published)) {
    try { await getEpisode(s.id, ep.id); console.log(`ok   ${s.id}/${ep.id}`); }
    catch (e) { bad++; console.error(`FAIL ${s.id}/${ep.id}\n`, e.issues ?? e.message); }
  }
}
process.exit(bad ? 1 : 0);
