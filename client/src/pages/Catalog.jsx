import { useEffect, useMemo, useState } from 'react';
import { api, errText } from '../services/api.js';
import StoryCard from '../components/StoryCard.jsx';

export default function Catalog() {
  const [stories, setStories] = useState(null);
  const [progress, setProgress] = useState({});
  const [q, setQ] = useState('');
  const [genre, setGenre] = useState('all');
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([api('/stories'), api('/progress')])
      .then(([s, p]) => {
        setStories([...s.stories].reverse()); // newest first
        setProgress(Object.fromEntries(p.progress.map((x) => [x.storyId, x])));
      })
      .catch((e) => setError(errText(e)));
  }, []);

  const genres = useMemo(() => ['all', ...new Set((stories ?? []).flatMap((s) => s.genre))], [stories]);
  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return (stories ?? []).filter((s) =>
      (genre === 'all' || s.genre.includes(genre))
      && `${s.title} ${s.tagline} ${s.setting} ${s.genre.join(' ')}`.toLowerCase().includes(needle));
  }, [stories, q, genre]);

  if (error) return <main className="page"><p className="error">{error}</p></main>;
  if (!stories) return <div className="splash"><div className="spinner" /></div>;

  return (
    <main className="page">
      <h1 className="display">Discover</h1>
      <p className="muted">Pick a story. Every choice you make is saved, in every story, separately.</p>
      <input className="input search" type="search" placeholder="Search stories" value={q} onChange={(e) => setQ(e.target.value)} />
      <div className="tabs">
        {genres.map((g) => (
          <button key={g} className={genre === g ? 'on' : ''} onClick={() => setGenre(g)}>{g === 'all' ? 'All' : g}</button>
        ))}
      </div>
      {shown.length === 0
        ? <p className="muted">No stories match that search.</p>
        : <div className="catalog-grid">{shown.map((s) => <StoryCard key={s.id} story={s} progress={progress[s.id]} />)}</div>}
    </main>
  );
}
