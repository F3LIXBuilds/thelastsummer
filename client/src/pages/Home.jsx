import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, errText } from '../services/api.js';
import { useAuth } from '../hooks/useAuth.jsx';
import Avatar from '../game/Avatar.jsx';
import StoryCard from '../components/StoryCard.jsx';

function Shelf({ title, stories, progress, more }) {
  if (!stories.length) return null;
  return (
    <section>
      <div className="shelf-head"><h2>{title}</h2>{more && <Link to="/stories">See all</Link>}</div>
      <div className="shelf">{stories.map((s) => <StoryCard key={s.id} story={s} progress={progress[s.id]} />)}</div>
    </section>
  );
}

export default function Home() {
  const { profile } = useAuth();
  const nav = useNavigate();
  const [stories, setStories] = useState(null);
  const [progressList, setProgressList] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([api('/stories'), api('/progress')])
      .then(([s, p]) => { setStories(s.stories); setProgressList(p.progress); })
      .catch((e) => setError(errText(e)));
  }, []);

  const progress = useMemo(() => Object.fromEntries(progressList.map((p) => [p.storyId, p])), [progressList]);

  if (error) return <main className="page"><p className="error">{error}</p><button className="btn ghost" onClick={() => location.reload()}>Try again</button></main>;
  if (!stories) return <div className="splash"><div className="spinner" /></div>;

  const last = progressList.find((p) => stories.some((s) => s.id === p.storyId));
  const lastStory = last && stories.find((s) => s.id === last.storyId);
  const playing = progressList.map((p) => stories.find((s) => s.id === p.storyId)).filter(Boolean);
  const tag = (t) => stories.filter((s) => s.tags.includes(t));
  const cont = () => nav(last.sceneId ? `/play/${last.storyId}/${last.episodeId}?mode=resume` : `/story/${last.storyId}`);

  return (
    <main className="page">
      <section className="hero">
        <Avatar appearance={profile.appearance} expression="confident" />
        <div>
          <p className="eyebrow">{lastStory ? 'Welcome back' : 'Welcome'}, {profile.displayName}</p>
          {lastStory ? (
            <>
              <h1 className="display">{lastStory.title}</h1>
              <div className="row">
                <button className="btn primary big" onClick={cont}>CONTINUE</button>
                <Link className="btn ghost" to="/stories">Discover more</Link>
              </div>
            </>
          ) : (
            <>
              <h1 className="display">Pick your first story</h1>
              <p className="muted">{stories.length} {stories.length === 1 ? 'story is' : 'stories are'} waiting.</p>
              <Link className="btn primary big" to="/stories">BROWSE STORIES</Link>
            </>
          )}
        </div>
      </section>

      <Shelf title="Continue playing" stories={playing} progress={progress} />
      <Shelf title="Featured" stories={tag('featured')} progress={progress} more />
      <Shelf title="New releases" stories={tag('new')} progress={progress} more />
      <Shelf title="Popular" stories={tag('popular')} progress={progress} more />

      <section>
        <div className="shelf-head"><h2>Your character</h2><Link to="/create">Edit</Link></div>
        <p className="muted">{profile.displayName} · {profile.pronouns}</p>
      </section>
    </main>
  );
}
