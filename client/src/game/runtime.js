import { evaluate, applyEffects } from './engine.js';
import * as audio from './audio.js';

export function createRuntime({ episode, initial, vars, callbacks = {} }) {
  const scenes = new Map(episode.scenes.map((s) => [s.id, s]));
  const fmt = (t) => String(t).replace(/\{name\}/g, vars?.name ?? 'you');
  let n = 0;

  const R = {
    state: structuredClone(initial.state),
    sceneState: structuredClone(initial.state),
    sceneId: initial.sceneId ?? episode.start,
    index: 0, picks: [], replayPicks: [...(initial.picks ?? [])], replaying: false,
    queue: [], bg: null, actors: {}, cam: { zoom: 1, x: 0, shake: 0, flash: 0, fade: 'black' },
    line: null, choice: null, ended: null, error: null, wait: 0, endFired: false,
  };
  R.replaying = R.replayPicks.length > 0; // resuming mid-scene: fast-forward through choices already made

  const fail = (msg) => { R.error = msg; };

  function enterScene(id, snapshot) {
    R.sceneId = id; R.index = 0; R.queue = []; R.picks = []; R.sceneState = structuredClone(R.state);
    callbacks.onSave?.({ sceneId: id, state: R.sceneState, picks: [], snapshot });
  }

  function apply(step, opt) {
    R.state = applyEffects(R.state, opt.effects);
    R.state.decisions.push({ choice: step.id, option: opt.id, scene: R.sceneId });
    if (opt.summary) R.state.log.push({ kind: 'decision', text: opt.summary });
    R.picks.push(opt.id);
    const q = [...(opt.then ?? [])];
    if (opt.goto) q.push({ type: 'jump', scene: opt.goto });
    R.queue.unshift(...q);
  }

  function presentChoice(s) {
    if (R.replaying) {
      const opt = s.options.find((o) => o.id === R.replayPicks.shift());
      if (opt) { apply(s, opt); if (!R.replayPicks.length) R.replaying = false; return; }
      R.replaying = false; R.replayPicks = [];
    }
    const options = s.options
      .map((o) => { const met = evaluate(o.requires, R.state); return { id: o.id, text: fmt(o.text), premium: o.premium, locked: !met, hint: o.lockedHint, hidden: o.hidden && !met }; })
      .filter((o) => !o.hidden);
    if (!options.some((o) => !o.locked)) { apply(s, s.options[0]); return; } // never soft-lock the player
    R.choice = { id: s.id, prompt: fmt(s.prompt), options, src: s };
    return 'block';
  }

  function camera(s) {
    const c = R.cam;
    if (s.effect === 'zoom') c.zoom = s.amount ?? 1.15;
    else if (s.effect === 'pan') c.x = s.amount ?? -5;
    else if (s.effect === 'reset') { c.zoom = 1; c.x = 0; }
    else if (s.effect === 'fade') c.fade = s.to ?? 'black';
    else if (s.effect === 'shake' && !R.replaying) c.shake = c.shake === 1 ? 2 : 1;
    else if (s.effect === 'flash' && !R.replaying) c.flash++;
    if (s.wait && !R.replaying) { R.wait = s.wait; return 'block'; }
  }

  const setActor = (id, patch) => { if (R.actors[id]) R.actors[id] = { ...R.actors[id], ...patch }; };

  function run(s) {
    switch (s.type) {
      case 'bg': R.bg = { name: s.name, k: ++n }; return;
      case 'show': R.actors[s.char] = { char: s.char, position: s.position, expression: s.expression ?? 'neutral', enter: s.enter ?? 'fade', leaving: false, k: ++n }; return;
      case 'hide': setActor(s.char, { leaving: true, exit: s.exit ?? 'fade' }); return;
      case 'move': setActor(s.char, { position: s.position }); return;
      case 'expr': setActor(s.char, { expression: s.expression }); return;
      case 'say':
        if (s.expression) setActor(s.char, { expression: s.expression });
        if (R.replaying) return;
        R.line = { char: s.char, text: fmt(s.text), k: ++n };
        return 'block';
      case 'narrate':
        if (R.replaying) return;
        R.line = { narration: true, text: fmt(s.text), k: ++n };
        return 'block';
      case 'camera': return camera(s);
      case 'music': audio.playMusic(s.track); return;
      case 'sfx': if (!R.replaying) audio.sfx(s.name); return;
      case 'effects': R.state = applyEffects(R.state, s.effects); return;
      case 'jump': enterScene(s.scene); return;
      case 'choice': return presentChoice(s);
      case 'end':
        R.ended = { title: s.title ?? 'Episode Complete', text: s.text };
        if (!R.endFired) { R.endFired = true; callbacks.onEnd?.(R.state); }
        return 'block';
    }
  }

  return {
    start() { if (!initial.resume) enterScene(episode.start, structuredClone(initial.state)); },

    advance() {
      if (R.choice || R.ended || R.error) return;
      R.line = null; R.wait = 0;
      for (let guard = 0; guard < 2000; guard++) {
        let step = R.queue.shift();
        if (!step) {
          const scene = scenes.get(R.sceneId);
          if (!scene) return fail(`The scene "${R.sceneId}" is missing.`);
          if (R.index >= scene.steps.length) return fail(`The scene "${R.sceneId}" has no next step.`);
          step = scene.steps[R.index++];
        }
        if (step.if && !evaluate(step.if, R.state)) continue;
        if (run(step) === 'block') return;
      }
      fail('This scene seems to loop forever.');
    },

    choose(optionId) {
      const c = R.choice;
      const opt = c?.src.options.find((o) => o.id === optionId);
      if (!opt || c.options.find((o) => o.id === optionId)?.locked) return false;
      apply(c.src, opt);
      R.choice = null;
      callbacks.onPick?.({ choiceId: c.id, optionId, sceneId: R.sceneId });
      callbacks.onSave?.({ sceneId: R.sceneId, state: R.sceneState, picks: [...R.picks] });
      return true;
    },

    getView: () => ({
      bg: R.bg, actors: Object.values(R.actors), cam: { ...R.cam }, line: R.line,
      choice: R.choice ? { id: R.choice.id, prompt: R.choice.prompt, options: R.choice.options } : null,
      ended: R.ended, error: R.error, wait: R.wait, state: R.state,
    }),
  };
}
