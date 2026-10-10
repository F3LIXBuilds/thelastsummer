import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../services/api.js';
import Avatar from '../game/Avatar.jsx';
import { createPlayerState } from '../game/PlayerState.js';
import { relationshipView } from '../game/RelationshipSystem.js';
import { REL_ICONS, REL_LABELS } from '../game/constants.js';

export default function StoryOverview() {
  const { storyId } = useParams();
  const nav = useNavigate();
  const [story, setStory] = useState(null);
  const [progress, setProgress] = useState(null);
  const [tab, setTab] = useState('episodes');
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([api(`/stories/${storyId}`), api(`/progress/${storyId}`)])
      .then(([s, p]) => { setStory(s.story); setProgress(p.progress); })
      .catch((e) => setError(e.message));
  }, [storyId]);

  if (error) return <main className="page"><p className="error">{error}</p><Link className="btn ghost" to="/home">Home</Link></main>;
  if (!story) return <div className="splash"><div className="spinner" /></div>;

  const eps = story.seasons.flatMap((s) => s.episodes.map((e) => ({ ...e, season: s.title })));
  const done = new Set(progress?.completed ?? []);
  const inProgress = progress?.sceneId ? progress.episodeId : null;
  const status = (e, i) => {
    if (!e.published) return 'soon';
    if (done.has(e.id)) return 'done';
    if (e.id === inProgress) return 'current';
    return i === 0 || done.has(eps[i - 1].id) ? 'ready' : 'locked';
  };
  const mainEp = eps.find((e, i) => ['current', 'ready'].includes(status(e, i)));
  const go = (ep, mode) => nav(`/play/${storyId}/${ep}?mode=${mode}`);
  const state = progress?.state ?? createPlayerState(story);

  return (
    <main className="page">
      <section className="overview-hero cover-hero" style={{ '--cover': `url(/api/media/cover_${story.id})` }}>
        <p className="eyebrow">{story.genre.join(' · ')} · {story.setting}</p>
        <h1 className="display huge">{story.title}</h1>
        <p className="lede">{story.tagline}</p>
        {mainEp && <button className="btn primary big" onClick={() => go(mainEp.id, mainEp.id === inProgress ? 'resume' : 'start')}>
          {mainEp.id === inProgress ? 'CONTINUE' : progress ? 'NEXT EPISODE' : 'START'}</button>}
      </section>

      <div className="tabs"><button className={tab === 'episodes' ? 'on' : ''} onClick={() => setTab('episodes')}>Episodes</button>
        <button className={tab === 'cast' ? 'on' : ''} onClick={() => setTab('cast')}>Cast</button></div>

      {tab === 'episodes' ? (
        <div className="episodes">
          {eps.map((e, i) => { const st = status(e, i); return (
            <article key={e.id} className={`episode ${st}`}>
              <div className="ep-icon">{{ done: '✓', current: '▶', ready: '▶', locked: '🔒', soon: '🔒' }[st]}</div>
              <div className="ep-body">
                <small>{e.season} · Episode {i + 1}</small>
                <h3>{e.title}</h3>
                <p>{e.description}</p>
                <div className="row">
                  {st === 'current' && <><button className="btn primary" onClick={() => go(e.id, 'resume')}>Continue</button><button className="btn ghost" onClick={() => go(e.id, 'restart')}>Restart</button></>}
                  {st === 'ready' && <button className="btn primary" onClick={() => go(e.id, 'start')}>Play</button>}
                  {st === 'done' && <><button className="btn ghost" onClick={() => go(e.id, 'replay')}>Replay</button><button className="btn ghost" onClick={() => go(e.id, 'restart')}>Restart</button></>}
                  {st === 'soon' && <span className="muted">Coming soon</span>}
                  {st === 'locked' && <span className="muted">Finish the previous episode</span>}
                </div>
              </div>
            </article>); })}
        </div>
      ) : (
        <div className="cast-list">
          {relationshipView(state, story.characters).map(({ id, def, stats }) => (
            <article key={id} className="cast-row">
              <Avatar appearance={def.appearance} />
              <div>
                <h3 style={{ color: def.color }}>{def.name}</h3>
                <p>{def.description}</p>
                <small className="muted">{def.personality}</small>
                {stats.map((s) => (
                  <div key={s.stat} className="meter"><span>{REL_ICONS[s.stat]} {REL_LABELS[s.stat]}</span>
                    <div><i className={s.value < 0 ? 'neg' : ''} style={{ width: `${Math.min(100, Math.abs(s.value))}%` }} /></div></div>
                ))}
              </div>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
