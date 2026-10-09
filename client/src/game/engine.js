import { REL_STATS, REL_LABELS } from './constants.js';

const OPS = { '>=': (a, b) => a >= b, '<=': (a, b) => a <= b, '>': (a, b) => a > b, '<': (a, b) => a < b, '==': (a, b) => a === b, '!=': (a, b) => a !== b };
const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));

export function evaluate(c, s) {
  if (!c) return true;
  if ('all' in c) return c.all.every((x) => evaluate(x, s));
  if ('any' in c) return c.any.some((x) => evaluate(x, s));
  if ('not' in c) return !evaluate(c.not, s);
  if ('flag' in c) return !!s.flags[c.flag] === (c.is !== false);
  if ('item' in c) return s.inventory.includes(c.item) === (c.has !== false);
  if ('rel' in c) return OPS[c.op](s.relationships[c.rel]?.[c.stat] ?? 0, c.value);
  if ('stat' in c) return OPS[c.op](s.stats[c.stat] ?? 0, c.value);
  return false;
}

export function applyEffects(state, effects = []) {
  const s = structuredClone(state);
  for (const e of effects) {
    if (e.type === 'rel') {
      const r = s.relationships[e.char];
      if (!r) continue;
      r[e.stat] = clamp((r[e.stat] ?? 0) + e.delta, -100, 100);
      s.log.push({ kind: 'rel', char: e.char, stat: e.stat, delta: e.delta });
    } else if (e.type === 'stat') {
      s.stats[e.stat] = (s.stats[e.stat] ?? 0) + e.delta;
      s.log.push({ kind: 'stat', stat: e.stat, delta: e.delta });
    } else if (e.type === 'flag') {
      s.flags[e.key] = e.value !== false;
    } else if (e.type === 'item') {
      if (e.op === 'remove') s.inventory = s.inventory.filter((i) => i !== e.id);
      else if (!s.inventory.includes(e.id)) { s.inventory.push(e.id); s.log.push({ kind: 'item', id: e.id }); }
    }
  }
  return s;
}

export const isStatVisible = (def, stat, value) => !(def?.hiddenStats?.includes(stat) && Math.abs(value) < 20);

export function summarizeEpisode(state, story) {
  const decisions = state.log.filter((l) => l.kind === 'decision').map((l) => l.text);
  const totals = {};
  for (const l of state.log) if (l.kind === 'rel') totals[`${l.char}|${l.stat}`] = (totals[`${l.char}|${l.stat}`] ?? 0) + l.delta;
  const relationships = Object.entries(totals)
    .map(([k, delta]) => { const [char, stat] = k.split('|'); return { char, stat, delta, name: story.characters[char]?.name ?? char }; })
    .filter((x) => x.delta !== 0 && isStatVisible(story.characters[x.char], x.stat, state.relationships[x.char]?.[x.stat] ?? 0));
  const reputation = state.log.filter((l) => l.kind === 'stat' && l.stat === 'reputation').reduce((a, l) => a + l.delta, 0);
  const items = state.log.filter((l) => l.kind === 'item').map((l) => story.items?.[l.id]?.name ?? l.id);
  return { decisions, relationships, reputation, items };
}

export { REL_STATS, REL_LABELS };
