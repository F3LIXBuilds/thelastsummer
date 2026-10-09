import { getSettings, subscribe } from './settings.js';

let ctx, musicGain, sfxGain, nodes = [], timer = null, current = null;

const TRACKS = {
  lagos_evening: { notes: [220, 277.2, 329.6], type: 'sine' },
  waves_night: { notes: [110, 164.8], type: 'triangle' },
  party: { notes: [196, 246.9, 293.7], type: 'sawtooth', beat: 480 },
  tense: { notes: [73.4, 77.8], type: 'sawtooth' },
  quiet: { notes: [174.6, 220], type: 'sine' },
    harmattan: { notes: [130.8, 196, 261.6], type: 'triangle' },
};

function volumes() {
  if (!ctx) return;
  const s = getSettings();
  musicGain.gain.value = s.muted ? 0 : s.musicVol * 0.22;
  sfxGain.gain.value = s.muted ? 0 : s.sfxVol * 0.5;
}
subscribe(volumes);

function ensure() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    musicGain = ctx.createGain(); sfxGain = ctx.createGain();
    musicGain.connect(ctx.destination); sfxGain.connect(ctx.destination);
    volumes();
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

export const unlock = () => { ensure(); if (current) { const t = current; current = null; playMusic(t); } };

function tone(freq, dur, type = 'square', vol = 0.3, slide = 0) {
  if (!ensure()) return;
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.type = type; o.frequency.value = freq;
  if (slide) o.frequency.linearRampToValueAtTime(slide, ctx.currentTime + dur);
  g.gain.setValueAtTime(vol, ctx.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
  o.connect(g); g.connect(sfxGain); o.start(); o.stop(ctx.currentTime + dur);
}

export function sfx(name) {
  try {
    if (name === 'blip') tone(520 + Math.random() * 120, 0.035, 'square', 0.08);
    else if (name === 'ui') tone(660, 0.08, 'triangle', 0.3);
    else if (name === 'horn') { tone(311, 0.35, 'sawtooth', 0.25); tone(392, 0.35, 'sawtooth', 0.2); }
    else if (name === 'car') tone(90, 0.8, 'sawtooth', 0.25, 60);
    else if (name === 'door') tone(140, 0.4, 'square', 0.3, 50);
    else if (name === 'whoosh') tone(800, 0.3, 'sine', 0.2, 200);
  } catch { /* audio must never crash the game */ }
}

export function stopMusic() {
  nodes.forEach((n) => { try { n.stop(); } catch { /* already stopped */ } });
  nodes = []; clearInterval(timer);
}

export function playMusic(name) {
  if (name === current) return;
  current = name;
  try {
    if (!ensure()) return;
    stopMusic();
    const t = TRACKS[name];
    if (!t) return;
    t.notes.forEach((f) => {
      const o = ctx.createOscillator(), lp = ctx.createBiquadFilter(), g = ctx.createGain();
      o.type = t.type; o.frequency.value = f; lp.type = 'lowpass'; lp.frequency.value = 600; g.gain.value = 0.35;
      o.connect(lp); lp.connect(g); g.connect(musicGain); o.start(); nodes.push(o);
    });
    if (t.beat) timer = setInterval(() => tone(110, 0.18, 'sine', 0.5, 40), t.beat);
  } catch { /* ignore */ }
}
