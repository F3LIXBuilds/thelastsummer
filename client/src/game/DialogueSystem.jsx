import { useEffect, useRef, useState } from 'react';
import { useSettings } from './settings.js';
import * as audio from './audio.js';

export default function DialogueBox({ line, name, color, auto, skip, replayKey, onNext }) {
  const { textSpeed } = useSettings();
  const [shown, setShown] = useState(0);
  const nextRef = useRef(onNext);
  nextRef.current = onNext;
  const text = line.text;
  const done = shown >= text.length;

  useEffect(() => {
    if (skip || textSpeed >= 150) { setShown(text.length); return; }
    setShown(0);
    let i = 0;
    const id = setInterval(() => {
      i++; setShown(i);
      if (i % 3 === 0 && !line.narration) audio.sfx('blip');
      if (i >= text.length) clearInterval(id);
    }, 1000 / textSpeed);
    return () => clearInterval(id);
  }, [line.k, replayKey, skip, textSpeed]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!done) return;
    const delay = skip ? 70 : auto ? 1100 + text.length * 35 : null;
    if (delay == null) return;
    const t = setTimeout(() => nextRef.current(), delay);
    return () => clearTimeout(t);
  }, [done, auto, skip, line.k, replayKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const tap = () => (done ? nextRef.current() : setShown(text.length));

  useEffect(() => {
    const onKey = (e) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); tap(); } };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  return (
    <div className="dialogue" onClick={tap}>
      <div className={`dlg-card ${line.narration ? 'narration' : ''}`}>
        {!line.narration && <div className="dlg-name" style={{ color }}>{name}</div>}
        <p className="dlg-text">{text.slice(0, shown)}<span className="dlg-ghost">{text.slice(shown)}</span></p>
        <span className={`dlg-next ${done ? 'on' : ''}`}>▼</span>
      </div>
    </div>
  );
}
