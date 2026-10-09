import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api.js';
import { useAuth } from '../hooks/useAuth.jsx';
import Avatar from '../game/Avatar.jsx';

const hue = (s) => [...s].reduce((a, c) => a + c.charCodeAt(0), 0) % 360;

function StoryCard({ s }) {
  return (
    <Link to={`/story/${s.id}`} className="story-card" style={{ '--h': hue(s.id) }}>
      <div className="story-cover"><span className="display">{s.title}</span></div>
      <p>{s.tagline}</p>
      <small>{s.genre.join(' · ')} · {s.episodeCount} ep</small>
    </Link>
  );
}

function Shelf({ title, items }) {
  if (!items.length) return null;
  return <section><h2>{title}</h2><div className="shelf">{items.map((s) => <StoryCard key={s.id} s={s} />)}</div></section>;
}

export default function Home() {
  const { profile, user } = useAuth();
  const nav = useNavigate();
  const [stories, setStories] = useState(null);
  const [progress, setProgress] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([api('/stories'), api('/progress')])
      .then(([s, p]) => { setStories(s.stories); setProgress(p.progress); })
      .catch((e) => setError(e.message));
  }, []);

  if (error) return <main className="page"><p className="error">{error}</p><button className="btn ghost" onClick={() => location.reload()}>Try again</button></main>;
  if (!stories) return <div className="splash"><div className="spinner" /></div>;

  const last = progress[0];
  const lastStory = last && stories.find((s) => s.id === last.storyId);
  const cont = () => nav(last.sceneId ? `/play/${last.storyId}/${last.episodeId}?mode=resume` : `/story/${last.storyId}`);
  const tag = (t) => stories.filter((s) => s.tags.includes(t));
  const mine = stories.filter((s) => progress.some((p) => p.storyId === s.id));

  return (
    <main className="page">
      <header className="topbar">
        <strong className="display">The Last Summer</strong>
        <nav>
          {user.role === 'admin' && <Link to="/admin">Story Studio</Link>}{' '}
          <Link to="/profile">{profile.displayName}</Link>
        </nav>
      </header>

      <section className="hero">
        <Avatar appearance={profile.appearance} expression="confident" />
        <div>
          <p className="eyebrow">{lastStory ? 'Welcome back' : 'Welcome'}, {profile.displayName}</p>
          <h1 className="display">{lastStory ? lastStory.title : stories[0]?.title}</h1>
          {lastStory
            ? <button className="btn primary big" onClick={cont}>CONTINUE</button>
            : stories[0] && <Link className="btn primary big" to={`/story/${stories[0].id}`}>START STORY</Link>}
        </div>
      </section>

      <Shelf title="Featured Stories" items={tag('featured')} />
      <Shelf title="Popular Stories" items={tag('popular')} />
      <Shelf title="New Releases" items={tag('new')} />
      <Shelf title="My Stories" items={mine} />

      <section>
        <h2>Characters</h2>
        <div className="shelf">
          <Link to="/create" className="cast-card"><Avatar appearance={profile.appearance} /><small>You · Edit</small></Link>
          {stories.flatMap((s) => s.cast).map((c) => <div key={c.id} className="cast-card"><Avatar appearance={c.appearance} /><small>{c.name.split(' ')[0]}</small></div>)}
        </div>
      </section>
    </main>
  );
}
