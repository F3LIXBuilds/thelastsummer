import { REL_STATS } from './constants.js';
import { isStatVisible } from './engine.js';

export function relationshipView(state, characters) {
  return Object.entries(characters).map(([id, c]) => ({
    id, def: c,
    stats: REL_STATS
      .map((stat) => ({ stat, value: state.relationships?.[id]?.[stat] ?? 0 }))
      .filter((x) => isStatVisible(c, x.stat, x.value)),
  }));
}
