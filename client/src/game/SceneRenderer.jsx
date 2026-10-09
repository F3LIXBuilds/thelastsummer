import { useRef } from 'react';
import Background from './Background.jsx';
import CharacterRenderer from './CharacterRenderer.jsx';

export default function SceneRenderer({ view, characters }) {
  const bgName = view.bg?.name ?? 'none';
  const ref = useRef({ cur: bgName, prev: null });
  if (ref.current.cur !== bgName) ref.current = { cur: bgName, prev: ref.current.cur };
  const { cam } = view;
  const speaker = view.line?.char;
  const shakeCls = cam.shake === 1 ? 'shake-a' : cam.shake === 2 ? 'shake-b' : '';

  return (
    <div className="stage">
      <div className="camera" style={{ transform: `translateX(${cam.x}%) scale(${cam.zoom})` }}>
        <div className={`shake ${shakeCls}`}>
          {ref.current.prev && <Background key={`p-${ref.current.prev}`} name={ref.current.prev} />}
          <Background key={`c-${view.bg?.k}`} name={bgName} className="bg-in" />
          {view.actors.map((a) => (
            <CharacterRenderer key={a.char} actor={a} def={characters[a.char]}
              speaking={speaker === a.char} dim={!!speaker && speaker !== a.char} />
          ))}
        </div>
      </div>
      {cam.flash > 0 && <div key={`f${cam.flash}`} className="flash" />}
      <div className="fade-layer" data-fade={cam.fade} />
    </div>
  );
}
