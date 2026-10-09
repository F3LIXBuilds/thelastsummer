import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { isDeepStrictEqual } from 'node:util';
import { Episode } from './schema.js';
import { compileEpisodeScript, decompileEpisode, ScriptError } from './script.js';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), 'stories');
const [cmd, story, name] = process.argv.slice(2);

if (!['export', 'build'].includes(cmd) || !story || !name) {
  console.error('Usage: npm run story:export -- <story-id> <file-name-without-extension>\n       npm run story:build  -- <story-id> <file-name-without-extension>');
  process.exit(1);
}

const base = path.join(ROOT, story, name);
try {
  if (cmd === 'export') {
    // episode-1.json  ->  episode-1.story
    const ep = Episode.parse(JSON.parse(await fs.readFile(`${base}.json`, 'utf8')));
    const text = decompileEpisode(ep);
    await fs.writeFile(`${base}.story`, text);
    const same = isDeepStrictEqual(compileEpisodeScript(text), ep);
    console.log(`Wrote ${name}.story ${same ? '(round-trip identical)' : '(round-trip differs slightly, so review the file)'}`);
  } else {
    // episode-1.story  ->  episode-1.json
    const ep = compileEpisodeScript(await fs.readFile(`${base}.story`, 'utf8'));
    await fs.writeFile(`${base}.json`, JSON.stringify(ep, null, 2));
    console.log(`Wrote ${name}.json`);
  }
} catch (e) {
  console.error(e instanceof ScriptError ? e.message : e);
  process.exit(1);
}
