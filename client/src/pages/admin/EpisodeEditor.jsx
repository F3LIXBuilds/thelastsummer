import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api, errText } from '../../services/api.js';
import { BACKGROUND_NAMES } from '../../game/Background.jsx';
import StoryGraph from './StoryGraph.jsx';

const LH = 21; // line height in px; must match .ed-wrap in the CSS

export default function EpisodeEditor() {
  const { storyId, episodeId } = useParams();
  const nav = useNavigate();
  const [loaded, setLoaded] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [script, setScript] = useState('');
  const [published, setPublished] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [msg, setMsg] = useState('');
  const [result, setResult] = useState(null);
  const [graph, setGraph] = useState(null);
  const [view, setView] = useState('script');
  const [pending, setPending] = useState(null);
  const [media, setMedia] = useState([]);
  const [customBgs, setCustomBgs] = useState([]);
  const ta = useRef(null);
  const gutter = useRef(null);

  useEffect(() => {
    Promise.all([api(`/admin/stories/${storyId}/episodes/${episodeId}`), api('/admin/media'), api('/admin/backgrounds')]).then(([d, m, b]) => {
      const e = d.episode;
      setTitle(e.title); setDescription(e.description); setScript(e.script); setPublished(e.published);
      setMedia(m.media); setCustomBgs(b.backgrounds.map((x) => x.name)); setLoaded(true);
    }).catch((e) => setMsg(errText(e)));
  }, [storyId, episodeId]);

  // live compile, debounced
  useEffect(() => {
    if (!loaded) return;
    const t = setTimeout(() => {
      api('/admin/compile', { method: 'POST', body: { storyId, script } }).then(setResult).catch((e) => setMsg(errText(e)));
    }, 500);
    return () => clearTimeout(t);
  }, [script, loaded, storyId]);

  // keep the last graph that compiled
  useEffect(() => { if (result?.graph) setGraph(result.graph); }, [result]);

  useEffect(() => {
    if (!dirty) return;
    const h = (e) => e.preventDefault();
    window.addEventListener('beforeunload', h);
    return () => window.removeEventListener('beforeunload', h);
  }, [dirty]);

  const save = async (patch = {}) => {
    const body = { title, description, script, published, ...patch };
    setMsg('Saving…');
    try {
      const r = await api(`/admin/stories/${storyId}/episodes/${episodeId}`, { method: 'PUT', body });
      setPublished(body.published); setDirty(false); setResult(r); setMsg('Saved');
      return true;
    } catch (e) { setMsg(errText(e)); return false; }
  };

  const saveRef = useRef(save);
  saveRef.current = save;
  useEffect(() => {
    const onKey = (e) => { if ((e.ctrlKey || e.metaKey) && e.key === 's') { e.preventDefault(); saveRef.current(); } };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const jump = (line) => {
    if (!line || !ta.current) return;
    const offset = script.split('\n').slice(0, line - 1).join('\n').length + (line > 1 ? 1 : 0);
    ta.current.focus();
    ta.current.setSelectionRange(offset, offset);
    ta.current.scrollTop = Math.max(0, line - 4) * LH;
  };

  // from anywhere (errors list, graph node): switch to the script and jump once the textarea exists
  const goLine = (line) => { setView('script'); setPending({ line }); };
  useEffect(() => {
    if (view === 'script' && pending) { jump(pending.line); setPending(null); }
  });

  const onKeyDown = (e) => {
    if (e.key !== 'Tab') return;
    e.preventDefault();
    const s = e.target.selectionStart;
    e.target.setRangeText('    ', s, e.target.selectionEnd, 'end');
    setScript(e.target.value); setDirty(true);
  };

  const testPlay = async () => { if (!dirty || (await save())) nav(`/play/${storyId}/${episodeId}?mode=test`); };

  if (!loaded) return <div className="splash">{msg ? <p className="error">{msg}</p> : <div className="spinner" />}</div>;

  const known = new Set([...BACKGROUND_NAMES, ...media.map((m) => m.name), ...customBgs]);
  const errLines = new Set((result?.errors ?? []).map((e) => e.line));
  const lineCount = script.split('\n').length;

  return (
    <div className="studio">
      <header className="studio-bar">
        <Link to={`/admin/story/${storyId}`}>← Story</Link>
        <input className="input" value={title} onChange={(e) => { setTitle(e.target.value); setDirty(true); }} />
        <span className={`badge-state ${published ? 'live' : ''}`}>{published ? 'Live' : 'Draft'}</span>
        <button className="btn ghost" onClick={testPlay}>▶ Test play</button>
        <button className="btn ghost" onClick={() => save()} disabled={!dirty}>{dirty ? 'Save' : 'Saved'}</button>
        <button className="btn primary" onClick={() => save({ published: !published })}>{published ? 'Unpublish' : 'Publish'}</button>
      </header>
      {msg && msg !== 'Saved' && <p className={msg === 'Saving…' ? 'muted' : 'error'} style={{ padding: '0 1rem', margin: '.4rem 0' }}>{msg}</p>}

      <div className="view-tabs">
        <button className={view === 'script' ? 'on' : ''} onClick={() => setView('script')}>Script</button>
        <button className={view === 'graph' ? 'on' : ''} onClick={() => setView('graph')}>Graph</button>
      </div>

      <div className="studio-body">
        {view === 'script' ? (
          <div className="ed-wrap">
            <div className="gutter" ref={gutter}>
              {Array.from({ length: lineCount }, (_, i) => <div key={i} className={errLines.has(i + 1) ? 'bad' : ''}>{i + 1}</div>)}
            </div>
            <textarea ref={ta} value={script} spellCheck={false} wrap="off" onKeyDown={onKeyDown}
              onScroll={(e) => { gutter.current.scrollTop = e.target.scrollTop; }}
              onChange={(e) => { setScript(e.target.value); setDirty(true); }} />
          </div>
        ) : (
          <StoryGraph graph={graph} stale={!!result && !result.ok} onSelect={(n) => goLine(n.line)} />
        )}

        <aside className="studio-side">
          <input className="input" value={description} placeholder="Episode description" onChange={(e) => { setDescription(e.target.value); setDirty(true); }} />
          {result && (
            <>
              <p className={result.ok ? 'ok' : 'error'}>{result.ok ? '✓ Compiles' : `✕ ${result.errors.length} problem${result.errors.length > 1 ? 's' : ''}`}</p>
              {result.errors.map((e, i) => (
                <button key={i} className="issue err" onClick={() => goLine(e.line)}>{e.line ? `Line ${e.line}: ` : ''}{e.message}</button>
              ))}
              {result.warnings.map((w, i) => <p key={i} className="issue warn">⚠ {w}</p>)}
              {result.stats && (
                <div className="stats">
                  <p>{result.stats.scenes} scenes · {result.stats.steps} steps</p>
                  <p>Cast: {result.stats.characters.join(', ') || 'none'}</p>
                  <p>Backgrounds: {result.stats.backgrounds.map((b) => <span key={b} className={known.has(b) ? '' : 'warn'}>{b}{known.has(b) ? '' : ' ⚠ not uploaded'} </span>)}</p>
                </div>
              )}
            </>
          )}
          <details>
            <summary>Syntax reminder</summary>
            <pre className="cheat">{`SCENE: id
BACKGROUND: name   MUSIC: track   SFX: name
FADE: black 800    CAMERA: shake
SHOW: adaeze right happy from right
HIDE: tunde to right
adaeze (happy): Hello {name}!
> Narration line
EFFECT: adaeze.trust +5, flag x, give key
GOTO: scene   (add  @if cond  to any line)
END: Title | text

CHOICE id: prompt
* opt: Text
    summary: ...   effects: ...
    requires: ...  locked: hint
    hidden  premium  goto: scene
    then:
        adaeze (sad): reaction
ENDCHOICE`}</pre>
          </details>
        </aside>
      </div>
    </div>
  );
}
