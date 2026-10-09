import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createRuntime } from './runtime.js';
import SceneRenderer from './SceneRenderer.jsx';
import DialogueBox from './DialogueSystem.jsx';
import ChoiceSystem from './ChoiceSystem.jsx';
import EpisodeSummary from './EpisodeSummary.jsx';
import * as audio from './audio.js';
import { useSettings, setSettings } from './settings.js';

const SPEEDS = [25, 45, 90, 200];
const SPEED_LABEL = { 25: 'Slow', 45: 'Normal', 90: 'Fast', 200: 'Instant' };

export default function StoryEngine({ story, episode, profile, initial, readOnly, nextEpisode, callbacks, onNext, onExit }) {
  const rt = useRef(null);
  const [view, setView] = useState(null);
  const [started, setStarted] = useState(false);
  const [auto, setAuto] = useState(false);
  const [skip, setSkip] = useState(false);
  const [bag, setBag] = useState(false);
  const [replayKey, setReplayKey] = useState(0);
  const [saveStatus, setSaveStatus] = useState('');
  const { textSpeed, muted } = useSettings();

  const characters = useMemo(() => ({
    ...story.characters,
    player: { name: profile.displayName, color: '#ffd166', appearance: profile.appearance },
  }), [story, profile]);

  const sync = () => setView(rt.current.getView());
  const next = useCallback(() => { rt.current?.advance(); sync(); }, []);

  const begin = () => {
    audio.unlock();
    rt.current = createRuntime({ episode, initial, vars: { name: profile.displayName }, callbacks });
    rt.current.start();
    rt.current.advance();
    sync();
    setStarted(true);
  };

  useEffect(() => () => audio.stopMusic(), []);
  useEffect(() => {
    const on = (e) => setSaveStatus(e.detail);
    window.addEventListener('save:status', on);
    return () => window.removeEventListener('save:status', on);
  }, []);
  useEffect(() => { if (view && (view.choice || view.ended || view.error)) { setSkip(false); setAuto(false); } }, [view]);
  useEffect(() => {
    if (!view?.wait) return;
    const t = setTimeout(next, skip ? 0 : view.wait);
    return () => clearTimeout(t);
  }, [view, skip, next]);

  const pick = (id) => { if (rt.current.choose(id)) { audio.sfx('ui'); rt.current.advance(); sync(); } };
  const speakerName = (c) => characters[c]?.name?.split(' ')[0] ?? (c ? c[0].toUpperCase() + c.slice(1) : '');

  if (!started)
    return (
      <div className="play intro" onClick={begin}>
        <p className="eyebrow">{story.title}</p>
        <h1 className="display">{episode.title}</h1>
        <p className="muted">Tap to begin{initial.resume ? ' (continuing where you left off)' : ''}</p>
      </div>
    );

  if (!view) return null;
  if (view.error)
    return (
      <div className="play intro">
        <h1 className="display">Something went wrong with this scene</h1>
        <p className="muted">{view.error}</p>
        <button className="btn primary" onClick={onExit}>Back to story</button>
      </div>
    );

  const inventory = view.state.inventory.map((id) => ({ id, ...(story.items?.[id] ?? { name: id, icon: '📦', description: '' }) }));

  return (
    <div className="play">
      <SceneRenderer view={view} characters={characters} />

      <div className="hud">
        <button onClick={onExit} aria-label="Exit">✕</button>
        <div className="hud-right">
          {saveStatus && <span className="save-status">{saveStatus === 'saved' ? '✓ Saved' : saveStatus === 'saving' ? 'Saving…' : 'Offline, will retry'}</span>}
          <button className={auto ? 'on' : ''} onClick={() => setAuto((v) => !v)}>Auto</button>
          <button className={skip ? 'on' : ''} onClick={() => setSkip((v) => !v)}>Skip</button>
          <button onClick={() => setSettings({ textSpeed: SPEEDS[(SPEEDS.indexOf(textSpeed) + 1) % SPEEDS.length] ?? 45 })}>{SPEED_LABEL[textSpeed] ?? 'Aa'}</button>
          <button onClick={() => setReplayKey((k) => k + 1)} aria-label="Replay line">↻</button>
          <button onClick={() => setSettings({ muted: !muted })}>{muted ? '🔇' : '🔊'}</button>
          <button onClick={() => setBag((v) => !v)}>🎒{inventory.length > 0 && <b>{inventory.length}</b>}</button>
        </div>
      </div>

      {bag && (
        <div className="bag" onClick={() => setBag(false)}>
          <h3>Inventory</h3>
          {inventory.length === 0 ? <p className="muted">Nothing yet.</p> : inventory.map((i) => (
            <div key={i.id} className="bag-item"><span>{i.icon}</span><div><strong>{i.name}</strong><p>{i.description}</p></div></div>
          ))}
        </div>
      )}

      {view.line && !view.choice && !view.ended && (
        <DialogueBox line={view.line} name={speakerName(view.line.char)} color={characters[view.line.char]?.color}
          auto={auto} skip={skip} replayKey={replayKey} onNext={next} />
      )}
      {view.choice && <ChoiceSystem choice={view.choice} onPick={pick} />}
      {view.ended && <EpisodeSummary ended={view.ended} state={view.state} story={story} nextEpisode={nextEpisode} readOnly={readOnly} onNext={onNext} onExit={onExit} />}
    </div>
  );
}
