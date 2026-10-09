import { REL_STATS, EXPRESSIONS, Episode } from './schema.js';

export class ScriptError extends Error {
  constructor(errors) {
    super(errors.map((e) => (e.line ? `Line ${e.line}: ${e.message}` : e.message)).join('\n'));
    this.errors = errors;
    this.status = 422; // shown to the author instead of a generic 500
  }
}

const POSITIONS = ['left', 'center', 'right'];
const ENTERS = ['fade', 'left', 'right'];
const COMMANDS = new Set([
  'EPISODE', 'START', 'SCENE', 'BACKGROUND', 'BG', 'MUSIC', 'SFX', 'FADE', 'CAMERA', 'SHOW', 'HIDE',
  'MOVE', 'EXPRESSION', 'NARRATE', 'EFFECT', 'GOTO', 'END',
]);
const CMP = /^([\w-]+)(?:\.(\w+))?\s*(>=|<=|==|!=|>|<)\s*(-?\d+(?:\.\d+)?)$/;
const DELTA = /^([\w-]+)(?:\.(\w+))?\s*([+-])\s*(\d+(?:\.\d+)?)$/;
const REL_SUFFIX = new RegExp(`^(.+)_(${REL_STATS.join('|')})$`);

// "maya.trust" and "maya_trust" both mean character maya, stat trust
function splitRel(a, b) {
  if (!b) { const m = a.match(REL_SUFFIX); if (m) return [m[1], m[2]]; }
  return [a, b];
}

/* ---------- conditions: "knowsSecret", "not tookOffer", "has mysterious_key",
   "adaeze.trust >= 20", "courage > 10", joined with "and" / "or" (and binds tighter) ---------- */
function parseTerm(text, fail) {
  let t = text.trim();
  let neg = false;
  let m;
  if ((m = t.match(/^(?:not\s+|!\s*)(.+)$/i))) { neg = true; t = m[1].trim(); }
  let c;
  if ((m = t.match(/^has\s+([\w-]+)$/i))) c = { item: m[1], has: true };
  else if ((m = t.match(CMP))) {
    const [a, b] = splitRel(m[1], m[2]);
    if (b) {
      if (!REL_STATS.includes(b)) return fail(`"${b}" is not a relationship stat (${REL_STATS.join(', ')})`);
      c = { rel: a, stat: b, op: m[3], value: Number(m[4]) };
    } else c = { stat: a, op: m[3], value: Number(m[4]) };
  } else if (/^[\w-]+$/.test(t)) c = { flag: t, is: true };
  else return fail(`Can't read the condition "${text.trim()}"`);
  if (neg) {
    if ('flag' in c) c.is = false;
    else if ('item' in c) c.has = false;
    else c = { not: c };
  }
  return c;
}

export function parseCondition(text, fail) {
  const ors = text.split(/\s+or\s+/i).map((chunk) => {
    const terms = chunk.split(/\s+and\s+/i).map((t) => parseTerm(t, fail));
    if (terms.some((t) => !t)) return null;
    return terms.length === 1 ? terms[0] : { all: terms };
  });
  if (ors.some((x) => !x)) return undefined;
  return ors.length === 1 ? ors[0] : { any: ors };
}

/* ---------- effects: "adaeze.friendship +8, courage -2, flag hasKey, give mysterious_key" ---------- */
function parseEffects(text, fail) {
  const out = [];
  for (const raw of text.split(',').map((s) => s.trim()).filter(Boolean)) {
    let m;
    if ((m = raw.match(/^(flag|unflag)\s+([\w-]+)$/i))) out.push({ type: 'flag', key: m[2], value: m[1].toLowerCase() === 'flag' });
    else if ((m = raw.match(/^(give|take)\s+([\w-]+)$/i))) out.push({ type: 'item', id: m[2], op: m[1].toLowerCase() === 'give' ? 'add' : 'remove' });
    else if ((m = raw.match(DELTA))) {
      const [a, b] = splitRel(m[1], m[2]);
      const delta = Number(m[4]) * (m[3] === '-' ? -1 : 1);
      if (b) {
        if (!REL_STATS.includes(b)) { fail(`"${b}" is not a relationship stat (${REL_STATS.join(', ')})`); continue; }
        out.push({ type: 'rel', char: a, stat: b, delta });
      } else out.push({ type: 'stat', stat: a, delta });
    } else fail(`Can't read the effect "${raw}"`);
  }
  return out;
}

/* ---------- single lines ---------- */
function splitIf(raw, fail) {
  const m = raw.match(/^(.*?)\s+@if\s+(.+)$/);
  if (!m) return [raw, undefined];
  return [m[1], parseCondition(m[2], fail)];
}

function command(cmd, arg, fail) {
  const t = arg.split(/\s+/).filter(Boolean);
  const num = (x) => { const n = Number(x); if (!Number.isFinite(n)) { fail(`"${x}" is not a number`); return undefined; } return n; };
  switch (cmd) {
    case 'BACKGROUND': case 'BG': return arg ? { type: 'bg', name: arg } : fail('BACKGROUND needs a name');
    case 'MUSIC': return arg ? { type: 'music', track: arg } : fail('MUSIC needs a track name');
    case 'SFX': return arg ? { type: 'sfx', name: arg } : fail('SFX needs a sound name');
    case 'NARRATE': return arg ? { type: 'narrate', text: arg } : fail('NARRATE needs some text');
    case 'GOTO': return arg ? { type: 'jump', scene: arg } : fail('GOTO needs a scene id');
    case 'EFFECT': {
      const effects = parseEffects(arg, fail);
      return effects.length ? { type: 'effects', effects } : fail('EFFECT needs at least one effect');
    }
    case 'FADE': {
      if (!['black', 'clear'].includes(t[0])) return fail('Use FADE: black|clear [milliseconds to wait]');
      const s = { type: 'camera', effect: 'fade', to: t[0] };
      if (t[1]) s.wait = num(t[1]);
      return s;
    }
    case 'CAMERA': {
      if (!['zoom', 'pan', 'shake', 'flash', 'reset'].includes(t[0])) return fail('Use CAMERA: zoom|pan|shake|flash|reset [amount] [wait ms]');
      const s = { type: 'camera', effect: t[0] };
      for (let i = 1; i < t.length; i++) { if (t[i] === 'wait') s.wait = num(t[++i]); else s.amount = num(t[i]); }
      return s;
    }
    case 'SHOW': {
      const [char, pos, ...rest] = t;
      if (!char || !POSITIONS.includes(pos)) return fail('Use SHOW: name left|center|right [expression] [from left|right]');
      const s = { type: 'show', char: char.toLowerCase(), position: pos };
      for (let i = 0; i < rest.length; i++) {
        if (rest[i] === 'from') {
          s.enter = rest[++i];
          if (!ENTERS.includes(s.enter)) return fail(`"from" must be one of ${ENTERS.join(', ')}`);
        } else if (EXPRESSIONS.includes(rest[i])) s.expression = rest[i];
        else return fail(`"${rest[i]}" is not an expression (${EXPRESSIONS.join(', ')})`);
      }
      return s;
    }
    case 'HIDE': {
      if (!t[0]) return fail('Use HIDE: name [to left|right]');
      const s = { type: 'hide', char: t[0].toLowerCase() };
      if (t[1] === 'to') { s.exit = t[2]; if (!ENTERS.includes(s.exit)) return fail(`"to" must be one of ${ENTERS.join(', ')}`); }
      return s;
    }
    case 'MOVE':
      if (!t[0] || !POSITIONS.includes(t[1])) return fail('Use MOVE: name left|center|right');
      return { type: 'move', char: t[0].toLowerCase(), position: t[1] };
    case 'EXPRESSION':
      if (!t[0] || !EXPRESSIONS.includes(t[1])) return fail(`Use EXPRESSION: name ${EXPRESSIONS.join('|')}`);
      return { type: 'expr', char: t[0].toLowerCase(), expression: t[1] };
    case 'END': {
      const i = arg.indexOf('|');
      const title = (i < 0 ? arg : arg.slice(0, i)).trim();
      const text = i < 0 ? '' : arg.slice(i + 1).trim();
      const s = { type: 'end' };
      if (title) s.title = title;
      if (text) s.text = text;
      return s;
    }
    default: return fail(`${cmd} isn't allowed here`);
  }
}

function parseBody(body, fail) {
  const cm = body.match(/^([A-Z]+):\s*(.*)$/);
  if (cm) return COMMANDS.has(cm[1]) ? command(cm[1], cm[2].trim(), fail) : fail(`Unknown command ${cm[1]}:`);
  if (body.startsWith('>')) return { type: 'narrate', text: body.slice(1).trim() };
  // name: text   |   name (expression): text   |   "Name": "text"
  const m = body.match(/^(")?([A-Za-z][\w-]*)\1?\s*(?:\(\s*(\w+)\s*\))?\s*:\s*(.+)$/);
  if (!m) return fail('Can\'t understand this line. Use "name: text", "> narration" or a COMMAND:');
  const [, quoted, who, expr] = m;
  let text = m[4].trim();
  if (quoted && text.length > 1 && text.startsWith('"') && text.endsWith('"')) text = text.slice(1, -1);
  if (expr && !EXPRESSIONS.includes(expr)) return fail(`"${expr}" is not an expression (${EXPRESSIONS.join(', ')})`);
  const step = { type: 'say', char: who.toLowerCase(), text };
  if (expr) step.expression = expr;
  return step;
}

function parseStep(raw, fail) {
  const [body, cond] = splitIf(raw, fail);
  const step = parseBody(body, fail);
  if (step && cond) step.if = cond;
  return step;
}

/* ---------- whole file ---------- */
export function parseScript(source) {
  const errors = [];
  const err = (line, message) => { errors.push({ line, message }); };
  const ep = { id: '', title: '', start: '', scenes: [] };
  const lineMap = {};
  const sceneLines = [];
  let startLine;
  let scene = null, choice = null, opt = null, inThen = false;

  const closeChoice = () => {
    if (choice.step.options.length < 2) err(choice.line, `CHOICE "${choice.step.id}" needs at least two options`);
    lineMap[`${ep.scenes.length - 1}.${scene.steps.length}`] = choice.line;
    scene.steps.push(choice.step);
    choice = opt = null;
    inThen = false;
  };

  source.replace(/^\uFEFF/, '').split(/\r?\n/).forEach((text, idx) => {
    const n = idx + 1;
    const raw = text.trim();
    if (!raw || raw.startsWith('#') || raw.startsWith('//')) return;
    const fail = (msg) => err(n, msg);
    let m;

    if (choice) {
      if (/^(ENDCHOICE|END CHOICE)$/i.test(raw)) return closeChoice();
      if (/^SCENE:/.test(raw)) { err(n, 'Missing ENDCHOICE before this SCENE'); closeChoice(); }
      else {
        if ((m = raw.match(/^\*\s*([\w-]+)\s*:\s*(.+)$/))) {
          opt = { id: m[1], text: m[2].trim(), effects: [], then: [] };
          choice.step.options.push(opt);
          inThen = false;
          return;
        }
        if (!opt) return fail('Start an option with "* id: text"');
        if ((m = raw.match(/^(summary|effects|requires|locked|goto|then)\s*:\s*(.*)$/))) {
          const [, key, val] = m;
          inThen = key === 'then';
          if (key === 'summary') opt.summary = val;
          else if (key === 'effects') opt.effects = parseEffects(val, fail);
          else if (key === 'requires') opt.requires = parseCondition(val, fail);
          else if (key === 'locked') opt.lockedHint = val;
          else if (key === 'goto') opt.goto = val;
        } else if (raw === 'hidden' || raw === 'premium') opt[raw] = true;
        else if (inThen) { const s = parseStep(raw, fail); if (s) opt.then.push(s); }
        else fail('Unexpected line inside an option (did you forget "then:"?)');
        return;
      }
    }

    if ((m = raw.match(/^EPISODE:\s*([\w-]+)\s*\|\s*(.+)$/))) { ep.id = m[1]; ep.title = m[2].trim(); return; }
    if (raw.startsWith('EPISODE:')) return fail('Use "EPISODE: id | Title"');
    if ((m = raw.match(/^START:\s*([\w-]+)$/))) { ep.start = m[1]; startLine = n; return; }
    if ((m = raw.match(/^SCENE:\s*([\w-]+)$/))) { scene = { id: m[1], steps: [] }; ep.scenes.push(scene); sceneLines.push(n); return; }
    if ((m = raw.match(/^CHOICE\s+([\w-]+)\s*:\s*(.*)$/))) {
      if (!scene) return fail('CHOICE must be inside a SCENE');
      const [prompt, cond] = splitIf(m[2], fail);
      const step = { type: 'choice', id: m[1], prompt: prompt.trim() || 'What will you do?', options: [] };
      if (cond) step.if = cond;
      choice = { step, line: n };
      return;
    }
    if (/^(ENDCHOICE|END CHOICE)$/i.test(raw)) return fail('ENDCHOICE without a CHOICE');
    if (!scene) return fail('This line is outside any SCENE');
    const step = parseStep(raw, fail);
    if (step) { lineMap[`${ep.scenes.length - 1}.${scene.steps.length}`] = n; scene.steps.push(step); }
  });

  if (choice) { err(choice.line, 'This CHOICE is never closed with ENDCHOICE'); closeChoice(); }
  if (!ep.id) err(0, 'Missing "EPISODE: id | Title" line');
  if (!ep.start && ep.scenes.length) ep.start = ep.scenes[0].id;
  return { episode: ep, errors, lineMap, sceneLines, startLine };
}

// script text -> validated episode (throws ScriptError with line numbers)
export function compileEpisodeScript(source) {
  const { episode, errors, lineMap, sceneLines, startLine } = parseScript(source);
  if (errors.length) throw new ScriptError(errors);
  const result = Episode.safeParse(episode);
  if (result.success) return result.data;
  throw new ScriptError(result.error.issues.map((issue) => {
    const p = issue.path;
    let line;
    if (p[0] === 'scenes' && typeof p[1] === 'number')
      line = (p[2] === 'steps' && typeof p[3] === 'number' && lineMap[`${p[1]}.${p[3]}`]) || sceneLines[p[1]];
    else if (p[0] === 'start') line = startLine;
    return { line, message: `${issue.message} (${p.join('.')})` };
  }));
}

/* ---------- episode -> script text (used to convert existing JSON) ---------- */
const sign = (n) => (n < 0 ? `-${-n}` : `+${n}`);
const effText = (e) => (e.type === 'rel' ? `${e.char}.${e.stat} ${sign(e.delta)}`
  : e.type === 'stat' ? `${e.stat} ${sign(e.delta)}`
  : e.type === 'flag' ? `${e.value === false ? 'unflag' : 'flag'} ${e.key}`
  : `${e.op === 'remove' ? 'take' : 'give'} ${e.id}`);

function term(c) {
  if ('all' in c || 'any' in c) throw new Error('Nested and/or conditions cannot be written in script format. Split the logic across scenes.');
  if ('not' in c) return `not ${term(c.not)}`;
  if ('flag' in c) return `${c.is === false ? 'not ' : ''}${c.flag}`;
  if ('item' in c) return `${c.has === false ? 'not ' : ''}has ${c.item}`;
  if ('rel' in c) return `${c.rel}.${c.stat} ${c.op} ${c.value}`;
  return `${c.stat} ${c.op} ${c.value}`;
}
export function condText(c) {
  if ('all' in c) return c.all.map(term).join(' and ');
  if ('any' in c) return c.any.map((x) => ('all' in x ? condText(x) : term(x))).join(' or ');
  return term(c);
}

function stepLines(s, pad = '') {
  const e = s.if ? ` @if ${condText(s.if)}` : '';
  switch (s.type) {
    case 'bg': return [`${pad}BACKGROUND: ${s.name}${e}`];
    case 'show': return [`${pad}SHOW: ${s.char} ${s.position}${s.expression && s.expression !== 'neutral' ? ` ${s.expression}` : ''}${s.enter && s.enter !== 'fade' ? ` from ${s.enter}` : ''}${e}`];
    case 'hide': return [`${pad}HIDE: ${s.char}${s.exit && s.exit !== 'fade' ? ` to ${s.exit}` : ''}${e}`];
    case 'move': return [`${pad}MOVE: ${s.char} ${s.position}${e}`];
    case 'expr': return [`${pad}EXPRESSION: ${s.char} ${s.expression}${e}`];
    case 'say': return [`${pad}${s.char}${s.expression ? ` (${s.expression})` : ''}: ${s.text}${e}`];
    case 'narrate': return [`${pad}NARRATE: ${s.text}${e}`];
    case 'camera':
      if (s.effect === 'fade') return [`${pad}FADE: ${s.to ?? 'black'}${s.wait ? ` ${s.wait}` : ''}${e}`];
      return [`${pad}CAMERA: ${s.effect}${s.amount != null ? ` ${s.amount}` : ''}${s.wait ? ` wait ${s.wait}` : ''}${e}`];
    case 'music': return [`${pad}MUSIC: ${s.track}${e}`];
    case 'sfx': return [`${pad}SFX: ${s.name}${e}`];
    case 'effects': return [`${pad}EFFECT: ${s.effects.map(effText).join(', ')}${e}`];
    case 'jump': return [`${pad}GOTO: ${s.scene}${e}`];
    case 'end': return [`${pad}END: ${s.text ? `${s.title ?? ''} | ${s.text}` : (s.title ?? '')}${e}`];
    case 'choice': {
      const out = [`CHOICE ${s.id}: ${s.prompt}${e}`];
      for (const o of s.options) {
        out.push(`* ${o.id}: ${o.text}`);
        if (o.summary) out.push(`    summary: ${o.summary}`);
        if (o.effects?.length) out.push(`    effects: ${o.effects.map(effText).join(', ')}`);
        if (o.requires) out.push(`    requires: ${condText(o.requires)}`);
        if (o.lockedHint) out.push(`    locked: ${o.lockedHint}`);
        if (o.hidden) out.push('    hidden');
        if (o.premium) out.push('    premium');
        if (o.goto) out.push(`    goto: ${o.goto}`);
        if (o.then?.length) { out.push('    then:'); o.then.forEach((t) => out.push(...stepLines(t, '        '))); }
        out.push('');
      }
      out.push('ENDCHOICE');
      return out;
    }
    default: throw new Error(`Unknown step type "${s.type}"`);
  }
}

export function decompileEpisode(ep) {
  const out = [`EPISODE: ${ep.id} | ${ep.title}`, `START: ${ep.start}`, ''];
  for (const sc of ep.scenes) {
    out.push(`SCENE: ${sc.id}`);
    sc.steps.forEach((s) => out.push(...stepLines(s)));
    out.push('');
  }
  return out.join('\n');
}
