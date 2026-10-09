import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, errText } from '../../services/api.js';

export default function AdminHome() {
  const nav = useNavigate();
  const [stories, setStories] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => { api('/admin/stories').then((d) => setStories(d.stories)).catch((e) => setError(errText(e))); }, []);

  const create = async (e) => {
    e.preventDefault(); setError('');
    const body = Object.fromEntries(new FormData(e.target));
    try { await api('/admin/stories', { method: 'POST', body }); nav(`/admin/story/${body.id}`); }
    catch (err) { setError(errText(err)); }
  };

  return (
    <main className="page">
      <header className="topbar"><Link to="/home">← Game</Link><strong className="display">Story Studio</strong></header>
      {error && <p className="error">{error}</p>}
      <div className="episodes">
        {stories?.map((s) => (
          <Link key={s.id} to={`/admin/story/${s.id}`} className="episode">
            <div className="ep-body">
              <small>{s.published ? 'Published' : 'Draft'} · {s.published_episodes}/{s.episodes} episodes live</small>
              <h3>{s.title}</h3>
            </div>
          </Link>
        ))}
        {stories?.length === 0 && <p className="muted">No stories yet. Create one below, or run <code>npm run stories:import</code>.</p>}
      </div>
      <h2>New story</h2>
      <form className="stack" onSubmit={create}>
        <input className="input" name="id" placeholder="id (e.g. harmattan-nights)" required />
        <input className="input" name="title" placeholder="Title" required />
        <button className="btn primary">Create story</button>
      </form>
    </main>
  );
}
