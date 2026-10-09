import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api, errText } from '../../services/api.js';
import CharacterEditor from './CharacterEditor.jsx';
import BackgroundsPanel from './BackgroundsPanel.jsx';
const metaOf = (s) => ({ title: s.title, tagline: s.tagline, setting: s.setting, genre: s.genre, tags: s.tags, characters: s.characters, items: s.items, published: s.published });

export default function StoryEditor() {
  const { storyId } = useParams();
  const [data, setData] = useState(null);
  const [media, setMedia] = useState([]);
  const [tab, setTab] = useState('episodes');
  const [msg, setMsg] = useState('');

  const load = useCallback(() => Promise.all([api(`/admin/stories/${storyId}`), api('/admin/media')])
    .then(([d, m]) => { setData(d); setMedia(m.media); })
    .catch((e) => setMsg(errText(e))), [storyId]);
  useEffect(() => { load(); }, [load]);

  if (!data) return <div className="splash">{msg ? <p className="error">{msg}</p> : <div className="spinner" />}</div>;
  const { story, episodes } = data;

  const save = async (patch) => {
    setMsg('');
    try { await api(`/admin/stories/${storyId}`, { method: 'PUT', body: { ...metaOf(story), ...patch } }); setMsg('Saved'); await load(); return true; }
    catch (e) { setMsg(errText(e)); return false; }
  };

  return (
    <main className="page">
      <header className="topbar"><Link to="/admin">← Studio</Link><strong className="display">{story.title}</strong></header>
      <div className="tabs">
        {['episodes', 'details', 'cast', 'media'].map((t) => <button key={t} className={tab === t ? 'on' : ''} onClick={() => setTab(t)}>{t}</button>)}
      </div>
      {msg && <p className={msg === 'Saved' ? 'notice' : 'error'}>{msg}</p>}
      {tab === 'episodes' && <EpisodesTab storyId={storyId} episodes={episodes} reload={load} setMsg={setMsg} />}
      {tab === 'details' && <DetailsTab story={story} save={save} />}
      {tab === 'cast' && <CastTab story={story} save={save} />}
      {tab === 'media' && <MediaTab media={media} reload={load} />}
    </main>
  );
}

function EpisodesTab({ storyId, episodes, reload, setMsg }) {
  const add = async (e) => {
    e.preventDefault();
    const body = Object.fromEntries(Object.entries(Object.fromEntries(new FormData(e.target))).filter(([, v]) => v));
    try { await api(`/admin/stories/${storyId}/episodes`, { method: 'POST', body }); e.target.reset(); setMsg(''); reload(); }
    catch (x) { setMsg(errText(x)); }
  };
  return (
    <>
      <div className="episodes">
        {episodes.map((e, i) => (
          <Link key={e.id} to={`/admin/story/${storyId}/episode/${e.id}`} className="episode">
            <div className="ep-icon">{e.published ? '●' : '○'}</div>
            <div className="ep-body"><small>{e.season_title} · Episode {i + 1} · {e.published ? 'Live' : 'Draft'}</small><h3>{e.title}</h3><p>{e.description}</p></div>
          </Link>
        ))}
        {episodes.length === 0 && <p className="muted">No episodes yet.</p>}
      </div>
      <h2>New episode</h2>
      <form className="stack" onSubmit={add}>
        <input className="input" name="id" placeholder="id (e.g. ep2)" required />
        <input className="input" name="title" placeholder="Title" required />
        <input className="input" name="description" placeholder="Short description (shown on the story page)" />
        <div className="row">
          <input className="input" name="seasonId" placeholder="Season id (default season-1)" style={{ flex: 1 }} />
          <input className="input" name="seasonTitle" placeholder="Season title" style={{ flex: 1 }} />
        </div>
        <button className="btn primary">Create episode</button>
      </form>
    </>
  );
}

function DetailsTab({ story, save }) {
  const submit = (e) => {
    e.preventDefault();
    const f = new FormData(e.target);
    const list = (k) => String(f.get(k)).split(',').map((x) => x.trim()).filter(Boolean);
    save({ title: f.get('title'), tagline: f.get('tagline'), setting: f.get('setting'), genre: list('genre'), tags: list('tags'), published: f.get('published') === 'on' });
  };
  return (
    <form className="stack" onSubmit={submit}>
      <input className="input" name="title" defaultValue={story.title} placeholder="Title" required />
      <input className="input" name="tagline" defaultValue={story.tagline} placeholder="Tagline" />
      <input className="input" name="setting" defaultValue={story.setting} placeholder="Setting (e.g. Lagos, Nigeria)" />
      <input className="input" name="genre" defaultValue={story.genre.join(', ')} placeholder="Genres, comma separated" />
      <input className="input" name="tags" defaultValue={story.tags.join(', ')} placeholder="Shelves: featured, popular, new" />
      <label className="check"><input type="checkbox" name="published" defaultChecked={story.published} /> Story is visible to players</label>
      <button className="btn primary">Save details</button>
    </form>
  );
}

function CastTab({ story, save }) {
  const [chars, setChars] = useState(story.characters);
  const [items, setItems] = useState(JSON.stringify(story.items, null, 2));
  const [err, setErr] = useState('');

  const submit = async () => {
    let parsedItems;
    try { parsedItems = JSON.parse(items); } catch { return setErr('Items must be valid JSON.'); }
    setErr('');
    await save({ characters: chars, items: parsedItems });
  };

  return (
    <div className="stack">
      <CharacterEditor characters={chars} onChange={setChars} />
      <h3>Items (JSON)</h3>
      <p className="muted">Shape: <code>{'{ "item_id": { "name": "…", "icon": "🗝️", "description": "…" } }'}</code></p>
      <textarea className="json" rows={8} value={items} onChange={(e) => setItems(e.target.value)} spellCheck={false} />
      {err && <p className="error">{err}</p>}
      <button className="btn primary" onClick={submit}>Save cast and items</button>
    </div>
  );
}

function MediaTab({ media, reload }) {
  const [err, setErr] = useState('');
  const upload = async (e) => {
    e.preventDefault(); setErr('');
    const form = e.target;
    const f = new FormData(form);
    const file = f.get('file');
    if (!file?.size) return setErr('Choose an image first.');
    const data = await new Promise((res, rej) => {
      const r = new FileReader();
      r.onload = () => res(String(r.result).split(',')[1]);
      r.onerror = rej;
      r.readAsDataURL(file);
    });
    try { await api('/admin/media', { method: 'POST', body: { name: String(f.get('name')).trim(), mime: file.type, data } }); form.reset(); reload(); }
    catch (x) { setErr(errText(x)); }
  };
  const remove = async (name) => { await api(`/admin/media/${name}`, { method: 'DELETE' }); reload(); };

  return (
    <div className="stack">
      <p className="muted">Upload a PNG, JPG or WebP (max 1.5 MB). In a script, use <code>BACKGROUND: the-name</code>.</p>
      <form className="stack" onSubmit={upload}>
        <input className="input" name="name" placeholder="name (e.g. lekki_beach_dawn)" required />
        <input className="input" type="file" name="file" accept="image/png,image/jpeg,image/webp" />
        {err && <p className="error">{err}</p>}
        <button className="btn primary">Upload</button>
      </form>
      <div className="media-grid">
        {media.map((m) => (
          <figure key={m.name}>
            <img src={`/api/media/${m.name}`} alt={m.name} />
            <figcaption>{m.name} <button className="pill" onClick={() => remove(m.name)}>Delete</button></figcaption>
          </figure>
        ))}
      </div>
      <BackgroundsPanel />
    </div>
  );
}
