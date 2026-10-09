import { summarizeEpisode, REL_LABELS } from './engine.js';

const sign = (n) => (n > 0 ? `+${n}` : `${n}`);

export default function EpisodeSummary({ ended, state, story, nextEpisode, readOnly, onNext, onExit }) {
  const s = summarizeEpisode(state, story);
  return (
    <div className="summary">
      <div className="summary-card">
        <p className="eyebrow">{ended.title}</p>
        <h2 className="display">{ended.text ?? 'Well played.'}</h2>
        {s.decisions.length > 0 && <><h3>Major choices</h3><ul>{s.decisions.map((d, i) => <li key={i}>{d}</li>)}</ul></>}
        {(s.relationships.length > 0 || s.reputation !== 0) && (
          <><h3>Relationships</h3>
            <div className="chips">
              {s.relationships.map((r) => <span key={r.char + r.stat} className={`chip ${r.delta < 0 ? 'neg' : 'pos'}`}>{r.name.split(' ')[0]} · {REL_LABELS[r.stat]} {sign(r.delta)}</span>)}
              {s.reputation !== 0 && <span className={`chip ${s.reputation < 0 ? 'neg' : 'pos'}`}>Reputation {sign(s.reputation)}</span>}
            </div></>
        )}
        {s.items.length > 0 && <><h3>Collected</h3><div className="chips">{s.items.map((i) => <span key={i} className="chip">{i}</span>)}</div></>}
        {readOnly && <p className="muted">Replay mode: your saved progress was not changed.</p>}
        <div className="row">
          {nextEpisode
            ? <button className="btn primary" onClick={onNext}>NEXT EPISODE</button>
            : <p className="muted">More episodes are coming soon.</p>}
          <button className="btn ghost" onClick={onExit}>Back to story</button>
        </div>
      </div>
    </div>
  );
}
