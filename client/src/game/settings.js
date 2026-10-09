import { useSyncExternalStore } from 'react';

const KEY = 'ls.settings';
const defaults = { textSpeed: 45, musicVol: 0.7, sfxVol: 0.8, muted: false };
let cur = defaults;
try { cur = { ...defaults, ...JSON.parse(localStorage.getItem(KEY) || '{}') }; } catch { /* ignore */ }
const listeners = new Set();

export const getSettings = () => cur;
export const subscribe = (fn) => { listeners.add(fn); return () => listeners.delete(fn); };
export function setSettings(patch) {
  cur = { ...cur, ...patch };
  try { localStorage.setItem(KEY, JSON.stringify(cur)); } catch { /* ignore */ }
  listeners.forEach((fn) => fn());
}
export const useSettings = () => useSyncExternalStore(subscribe, getSettings);
