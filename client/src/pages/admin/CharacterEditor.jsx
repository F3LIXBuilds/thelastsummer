import { useState } from 'react';
import Avatar from '../../game/Avatar.jsx';
import AvatarCustomizer from '../../game/AvatarCustomizer.jsx';
import { DEFAULT_APPEARANCE, REL_STATS, REL_LABELS } from '../../game/constants.js';

const EXPRESSIONS = ['neutral', 'happy', 'angry', 'sad', 'surprised', 'nervous', 'confident', 'embarrassed'];
const ID = /^[a-z][a-z0-9_-]*$/;

export default function CharacterEditor({ characters, onChange }) {
  const ids = Object.keys(characters);
  const [sel, setSel] = useState(ids[0] ?? null);
  const [expr, setExpr] = useState('happy');
  const [err, setErr] = useState('');
  const c = sel ? characters[sel] : null;

  const update = (patch) => onChange({ ...characters, [sel]: { ...c, ...patch } });

  const add = (e) => {
    e.preventDefault();
    const form = e.target;
    const id = String(new FormData(form).get('id')).trim().toLowerCase();
    if (!ID.test(id) || id === 'player') return setErr('Use lowercase letters, numbers, _ or -, starting with a letter. "player" is reserved.');
    if (characters[id]) return setErr('That id is already used.');
    setErr('');
    onChange({
      ...characters,
      [id]: { name: id[0].toUpperCase() + id.slice(1), color: '#ffffff', description: '', personality: '', appearance: { ...DEFAULT_APPEARANCE }, startRelationship: {}, hiddenStats: [] },
    });
    setSel(id);
    form.reset();
  };

  const remove = () => {
    if (!window.confirm(`Delete ${c.name}? Scripts that mention "${sel}" will stop compiling until you remove those lines.`)) return;
    const { [sel]: _gone, ...rest } = characters;
    onChange(rest);
    setSel(Object.keys(rest)[0] ?? null);
  };

  const setRel = (stat, v) => {
    const next = { ...(c.startRelationship ?? {}), [stat]: Number(v) || 0 };
    if (!next[stat]) delete next[stat];
    update({ startRelationship: next });
  };
  const toggleHidden = (stat) => {
    const h = c.hiddenStats ?? [];
    update({ hiddenStats: h.includes(stat) ? h.filter((x) => x !== stat) : [...h, stat] });
  };

  return (
    <div className="char-editor">
      <div className="char-list">
        {ids.map((id) => (
          <button key={id} type="button" className={sel === id ? 'on' : ''} onClick={() => setSel(id)}>
            <Avatar appearance={characters[id].appearance} />
            <span>{characters[id].name}</span>
            <small>{id}</small>
          </button>
        ))}
        <form onSubmit={add} className="stack">
          <input className="input" name="id" placeholder="new character id" />
          <button className="btn ghost">+ Add character</button>
          {err && <p className="error">{err}</p>}
        </form>
      </div>

      {c && (
        <div className="char-form stack">
          <p className="muted">Script id: <code>{sel}</code> (fixed, because scripts refer to it)</p>
          <div className="char-top">
            <div className="char-preview"><Avatar appearance={c.appearance} expression={expr} /></div>
            <div className="stack" style={{ flex: 1 }}>
              <input className="input" value={c.name} placeholder="Full name" onChange={(e) => update({ name: e.target.value })} />
              <label className="row">Name colour in dialogue
                <input type="color" value={/^#[0-9a-f]{6}$/i.test(c.color) ? c.color : '#ffffff'} onChange={(e) => update({ color: e.target.value })} />
              </label>
              <input className="input" value={c.personality} placeholder="Personality (e.g. Loyal, witty, stubborn)" onChange={(e) => update({ personality: e.target.value })} />
              <textarea className="json" rows={3} value={c.description} placeholder="Description shown on the Cast tab" onChange={(e) => update({ description: e.target.value })} />
            </div>
          </div>

          <h3>Look</h3>
          <AvatarCustomizer value={c.appearance} onChange={(appearance) => update({ appearance })} />
          <div className="expr-strip">
            {EXPRESSIONS.map((x) => (
              <button key={x} type="button" className={expr === x ? 'on' : ''} onClick={() => setExpr(x)}>
                <Avatar appearance={c.appearance} expression={x} /><small>{x}</small>
              </button>
            ))}
          </div>

          <h3>Starting relationship with the player</h3>
          <div className="rel-grid">
            {REL_STATS.map((s) => (
              <label key={s}>{REL_LABELS[s]}
                <input className="input" type="number" min="-100" max="100" value={c.startRelationship?.[s] ?? 0} onChange={(e) => setRel(s, e.target.value)} />
              </label>
            ))}
          </div>

          <h3>Hidden until strong</h3>
          <p className="muted">Hidden meters only appear on the Cast tab once they pass 20 in either direction.</p>
          <div className="row">
            {REL_STATS.map((s) => (
              <label key={s} className="check"><input type="checkbox" checked={(c.hiddenStats ?? []).includes(s)} onChange={() => toggleHidden(s)} /> {REL_LABELS[s]}</label>
            ))}
          </div>

          <button type="button" className="btn ghost danger" onClick={remove}>Delete this character</button>
        </div>
      )}
      {!c && <p className="muted">No characters yet. Add one on the left.</p>}
    </div>
  );
}
