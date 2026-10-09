import { compileEpisodeScript, parseScript, condText, ScriptError } from '../../shared/story/script.js';

const walkCond = (c, f) => {
  if (!c) return;
  if (c.all) c.all.forEach((x) => walkCond(x, f));
  else if (c.any) c.any.forEach((x) => walkCond(x, f));
  else if (c.not) walkCond(c.not, f);
  else f(c);
};

export function* allSteps(ep) {
  for (const sc of ep.scenes)
    for (const st of sc.steps) {
      yield st;
      if (st.type === 'choice') for (const o of st.options) yield* o.then;
    }
}

export function unknownCharacters(ep, characters) {
  const out = new Set();
  for (const st of allSteps(ep)) if (st.char && st.char !== 'player' && !characters[st.char]) out.add(st.char);
  return [...out];
}

const short = (s, n = 30) => (s.length > n ? `${s.slice(0, n - 1)}…` : s);
const ctext = (c) => { try { return condText(c); } catch { return '…'; } };

function closesOf(sc) {
  const last = sc.steps[sc.steps.length - 1];
  return last.type === 'end'
    || (last.type === 'jump' && !last.if)
    || (last.type === 'choice' && last.options.every((o) => o.goto || o.then.some((t) => t.type === 'jump' && !t.if)));
}

export function analyze(script, story) {
  let ep;
  try { ep = compileEpisodeScript(script); }
  catch (e) {
    if (e instanceof ScriptError) return { ok: false, errors: e.errors, warnings: [], stats: null, graph: null };
    throw e;
  }
  const { sceneLines } = parseScript(script); // same order as ep.scenes

  const chars = story.characters;
  const errors = [];
  const warnings = new Set();
  const used = { characters: new Set(), backgrounds: new Set() };
  const flagsRead = new Set(), flagsSet = new Set(), itemsRead = new Set(), itemsGiven = new Set();
  const edges = new Map(ep.scenes.map((s) => [s.id, new Set()]));
  const edgeList = [];
  let steps = 0;

  const link = (from, to, kind, label = '') => {
    edges.get(from).add(to);
    if (!edgeList.some((e) => e.from === from && e.to === to && e.kind === kind && e.label === label))
      edgeList.push({ from, to, kind, label });
  };

  const missing = unknownCharacters(ep, chars);
  if (missing.length) errors.push({ line: 0, message: `These characters aren't in the cast: ${missing.join(', ')}` });

  const effects = (list = []) => {
    for (const e of list) {
      if (e.type === 'flag' && e.value !== false) flagsSet.add(e.key);
      if (e.type === 'item' && e.op !== 'remove') itemsGiven.add(e.id);
      if (e.type === 'rel' && !chars[e.char]) warnings.add(`An effect changes your relationship with "${e.char}", who isn't in the cast (it does nothing).`);
    }
  };
  const cond = (c) => walkCond(c, (t) => {
    if (t.flag) flagsRead.add(t.flag);
    if (t.item) itemsRead.add(t.item);
    if (t.rel && !chars[t.rel]) warnings.add(`A condition checks "${t.rel}", who isn't in the cast.`);
  });
  const visit = (st, sceneId, via) => {
    steps++;
    cond(st.if);
    if (st.char) used.characters.add(st.char);
    if (st.type === 'bg') used.backgrounds.add(st.name);
    if (st.type === 'effects') effects(st.effects);
    if (st.type === 'jump')
      link(sceneId, st.scene, via ? 'choice' : 'jump', via ?? (st.if ? `if ${short(ctext(st.if))}` : ''));
  };

  for (const sc of ep.scenes) {
    for (const st of sc.steps) {
      if (st.type === 'choice') {
        steps++;
        cond(st.if);
        for (const o of st.options) {
          const via = `${st.id} › ${o.id}`;
          cond(o.requires);
          effects(o.effects);
          if (o.goto) link(sc.id, o.goto, 'choice', via);
          o.then.forEach((t) => visit(t, sc.id, via));
        }
      } else visit(st, sc.id);
    }
    if (!closesOf(sc)) warnings.add(`Scene "${sc.id}" can run out of steps. End it with GOTO, END, or a CHOICE where every option has goto.`);
  }

  const seen = new Set([ep.start]);
  const queue = [ep.start];
  while (queue.length)
    for (const t of edges.get(queue.shift()) ?? []) if (!seen.has(t) && edges.has(t)) { seen.add(t); queue.push(t); }
  for (const id of edges.keys()) if (!seen.has(id)) warnings.add(`Scene "${id}" can't be reached from the start.`);

  for (const f of flagsRead) if (!flagsSet.has(f)) warnings.add(`Flag "${f}" is checked but never set. Typo?`);
  for (const i of itemsRead) if (!itemsGiven.has(i)) warnings.add(`Item "${i}" is checked but never given.`);
  for (const i of itemsGiven) if (!story.items[i]) warnings.add(`Item "${i}" isn't defined in the story's items (it shows as a plain box).`);

  const nodes = ep.scenes.map((sc, i) => ({
    id: sc.id,
    line: sceneLines[i],
    steps: sc.steps.length,
    choices: sc.steps.filter((s) => s.type === 'choice').length,
    ends: sc.steps.some((s) => s.type === 'end'),
    deadEnd: !closesOf(sc),
    start: sc.id === ep.start,
    reachable: seen.has(sc.id),
  }));

  return {
    ok: errors.length === 0,
    errors,
    warnings: [...warnings],
    stats: { scenes: ep.scenes.length, steps, characters: [...used.characters], backgrounds: [...used.backgrounds] },
    graph: { nodes, edges: edgeList },
  };
}
