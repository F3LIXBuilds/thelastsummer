import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { api } from '../services/api.js';
import { queueSave } from '../services/progress.js';
import { useAuth } from '../hooks/useAuth.jsx';
import StoryEngine from '../game/StoryEngine.jsx';
import { createPlayerState, withFreshLog } from '../game/PlayerState.js';
import { setCustomBackgrounds } from '../game/Background.jsx';

export default function Play() {
  const { storyId, episodeId } = useParams();
  const [sp] = useSearchParams();
  const mode = sp.get('mode') ?? 'resume';
  const { profile } = useAuth();
  const nav = useNavigate();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let off = false;
    async function load() {
      const bg = await api('/backgrounds').catch(() => ({ backgrounds: {} }));
      setCustomBackgrounds(bg.backgrounds);
      if (mode === 'test') { // author preview: saved draft, nothing is stored
        const d = await api(`/admin/stories/${storyId}/episodes/${episodeId}/compiled`);
        return { story: d.story, episode: d.episode, initial: { state: withFreshLog(createPlayerState(d.story)), resume: false }, nextEpisode: null };
      }
      const [s, e, p] = await Promise.all([
        api(`/stories/${storyId}`), api(`/stories/${storyId}/episodes/${episodeId}`), api(`/progress/${storyId}`),
      ]);
      const story = s.story, prog = p.progress;
      const carry = prog && !prog.sceneId ? prog.state : null;
      const snap = prog?.snapshots?.[episodeId];
      let initial;
      if (mode === 'resume' && prog?.episodeId === episodeId && prog.sceneId)
        initial = { state: prog.state, sceneId: prog.sceneId, picks: prog.picks, resume: true };
      else {
        const base = mode === 'start' ? (carry ?? createPlayerState(story)) : (snap ?? carry ?? createPlayerState(story));
        initial = { state: withFreshLog(base), resume: false };
      }
      const eps = story.seasons.flatMap((x) => x.episodes);
      const idx = eps.findIndex((x) => x.id === episodeId);
      const nextEp = eps.slice(idx + 1).find((x) => x.published);
      return { story, episode: e.episode, initial, nextEpisode: nextEp?.id ?? null };
    }
    load().then((d) => !off && setData(d)).catch((err) => !off && setError(err.message));
    return () => { off = true; };
  }, [storyId, episodeId, mode]);

  const back = mode === 'test' ? `/admin/story/${storyId}/episode/${episodeId}` : `/story/${storyId}`;

  if (error)
    return (
      <div className="play intro">
        <h1 className="display">Couldn't load this episode</h1>
        <p className="muted" style={{ whiteSpace: 'pre-wrap' }}>{error}</p>
        <Link className="btn primary" to={back}>Back</Link>
      </div>
    );
  if (!data) return <div className="splash"><div className="spinner" /></div>;

  const readOnly = mode === 'replay' || mode === 'test';
  const callbacks = readOnly ? {} : {
    onSave: (cursor) => queueSave(storyId, { episodeId, ...cursor }),
    onPick: (p) => api('/choices', { method: 'POST', body: { storyId, episodeId, ...p } }).catch(() => {}),
    onEnd: (state) => queueSave(storyId, { episodeId, sceneId: null, picks: [], state: withFreshLog(state), completeEpisode: episodeId }),
  };

  return (
    <StoryEngine key={`${episodeId}-${mode}`} {...data} profile={profile} readOnly={readOnly} callbacks={callbacks}
      onNext={() => nav(`/play/${storyId}/${data.nextEpisode}?mode=start`)}
      onExit={() => nav(back)} nextEpisode={data.nextEpisode} />
  );
}
