import { useCallback, useEffect, useState } from 'react';
import Background, { BACKGROUND_KINDS, BACKGROUND_PRESETS } from '../../game/Background.jsx';
import { api, errText } from '../../services/api.js';

const BLANK = { name: '', sky: ['#ffd37a', '#ff9a6b', '#5fb3d9'], kind: 'city', stars: false };

export default function BackgroundsPanel() {
  const [list, setList] = useState([]);
  const [form, setForm] = useState(BLANK);
  const [msg, setMsg] = useState('');

  const load = useCallback(() => api('/admin/backgrounds').then((d) => setList(d.backgrounds)).catch((e) => setMsg(errText(e))), []);
  useEffect(() => { load(); }, [load]);

  const setSky = (i, v) => setForm((f) => ({ ...f, sky: f.sky.map((c, j) => (j === i ? v : c)) }));
  const pick = (name, def) => { setForm({ name, sky: [...def.sky], kind: def.kind, stars: !!def.stars }); setMsg(''); };

  const save = async (e) => {
    e.preventDefault(); setMsg('');
    try {
      await api(`/admin/backgrounds/${form.name}`, { method: 'PUT', body: { sky: form.sky, kind: form.kind, stars: form.stars } });
      setMsg(`Saved. In a script, write: BACKGROUND: ${form.name}`);
      load();
    } catch (x) { setMsg(errText(x)); }
  };
  const remove = async (name) => { await api(`/admin/backgrounds/${name}`, { method: 'DELETE' }); load(); };

  return (
    <section className="stack">
      <h3>Colour backgrounds</h3>
      <p className="muted">Pick three sky colours (top, middle, bottom) and a silhouette. Saving a name that matches a built-in preset overrides that preset.</p>

      <form className="bg-form" onSubmit={save}>
        <div className="bg-preview">
          <Background name={form.name || 'preview'} def={{ sky: form.sky, kind: form.kind, stars: form.stars }} />
        </div>
        <div className="stack">
          <input className="input" required pattern="[a-z0-9_-]{2,40}" placeholder="name (e.g. courtroom)"
            value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <div className="row">
            {form.sky.map((c, i) => (
              <label key={i} className="row">{['Top', 'Middle', 'Bottom'][i]}
                <input type="color" value={c} onChange={(e) => setSky(i, e.target.value)} />
              </label>
            ))}
          </div>
          <select className="input" value={form.kind} onChange={(e) => setForm({ ...form, kind: e.target.value })}>
            {BACKGROUND_KINDS.map((k) => <option key={k} value={k}>{k === 'none' ? 'plain gradient (no silhouette)' : k}</option>)}
          </select>
          <label className="check"><input type="checkbox" checked={form.stars} onChange={(e) => setForm({ ...form, stars: e.target.checked })} /> Stars</label>
          <button className="btn primary">Save background</button>
          {msg && <p className={msg.startsWith('Saved') ? 'notice' : 'error'}>{msg}</p>}
        </div>
      </form>

      {list.length > 0 && (
        <>
          <h3>Your backgrounds</h3>
          <div className="chip-row">
            {list.map((b) => (
              <span key={b.name} className="pill">{b.name}
                <button type="button" className="pill" onClick={() => pick(b.name, b)}>Edit</button>
                <button type="button" className="pill" onClick={() => remove(b.name)}>Delete</button>
              </span>
            ))}
          </div>
        </>
      )}

      <h3>Built-in presets</h3>
      <div className="chip-row">
        {Object.entries(BACKGROUND_PRESETS).map(([name, def]) => (
          <button key={name} type="button" className="pill" onClick={() => pick(name, def)}>{name}</button>
        ))}
      </div>
      <p className="muted">Click a preset to load it as a template.</p>
    </section>
  );
}
