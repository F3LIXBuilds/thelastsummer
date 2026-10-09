import { REL_STATS } from './constants.js';

export function createPlayerState(story) {
  const relationships = {};
  for (const [id, c] of Object.entries(story.characters)) {
    relationships[id] = Object.fromEntries(REL_STATS.map((s) => [s, 0]));
    Object.assign(relationships[id], c.startRelationship ?? {});
  }
  return { relationships, stats: { reputation: 0, courage: 10, money: 20000 }, inventory: [], flags: {}, decisions: [], log: [] };
}

export const withFreshLog = (state) => ({ ...structuredClone(state), log: [] });
