import { api } from './api.js';

const pending = new Map();
const inflight = new Set();
const status = (detail) => window.dispatchEvent(new CustomEvent('save:status', { detail }));
const merge = (prev, next) => ({
  ...next,
  snapshot: next.snapshot ?? prev?.snapshot,
  completeEpisode: next.completeEpisode ?? prev?.completeEpisode,
});

export function queueSave(storyId, payload) {
  pending.set(storyId, merge(pending.get(storyId), payload));
  flush(storyId);
}

async function flush(storyId) {
  if (inflight.has(storyId) || !pending.has(storyId)) return;
  const payload = pending.get(storyId);
  pending.delete(storyId);
  inflight.add(storyId);
  status('saving');
  try {
    await api(`/progress/${storyId}`, { method: 'PUT', body: payload });
    status('saved');
  } catch (e) {
    if (e.status === 0 || e.status >= 500) {
      pending.set(storyId, pending.has(storyId) ? merge(payload, pending.get(storyId)) : payload);
      status('offline');
      setTimeout(() => flush(storyId), 8000);
    } else status('error');
  } finally {
    inflight.delete(storyId);
    if (pending.has(storyId) && !inflight.has(storyId)) flush(storyId);
  }
}

window.addEventListener('online', () => [...pending.keys()].forEach(flush));
