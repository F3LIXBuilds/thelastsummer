// Built-in presets. Backgrounds made in Story Studio (Media tab) are layered on top at runtime,
// and a Studio background with the same name overrides a preset.
export const BACKGROUND_KINDS = ['none', 'city', 'stalls', 'house', 'beach', 'dock', 'room'];

const PRESETS = {
  obalende_busstop: { sky: ['#ff7a3d', '#8a2a6b', '#1b1440'], kind: 'city' },
  suya_spot: { sky: ['#1b1440', '#2a1346', '#0b0f1a'], kind: 'stalls', stars: true },
  beach_house_night: { sky: ['#0d1b3a', '#142a52', '#0a1226'], kind: 'house', stars: true },
  beach_house_morning: { sky: ['#ffd37a', '#ff9a6b', '#5fb3d9'], kind: 'house' },
  beach_party: { sky: ['#2b0f4a', '#a3216b', '#ff7a3d'], kind: 'beach' },
  boathouse_exterior: { sky: ['#0a1226', '#1a2f5c', '#0b0f1a'], kind: 'dock', stars: true },
  boathouse_inside: { sky: ['#20150d', '#3d2614', '#0e0905'], kind: 'room' },
  compound_morning: { sky: ['#ffe29a', '#ffb36b', '#7fb8e6'], kind: 'city' },
  market_day: { sky: ['#ffd37a', '#ff9a6b', '#7a2a6b'], kind: 'stalls' },
  bakare_tower: { sky: ['#0b1230', '#1d2b66', '#0a0f1f'], kind: 'city', stars: true },
  harmattan_house: { sky: ['#e9dcc0', '#cdb88e', '#8a7a5e'], kind: 'house' },
  sitting_room: { sky: ['#3b2a1a', '#5a3d22', '#1b120a'], kind: 'room' },
  bank_vault: { sky: ['#171d2b', '#27324a', '#0b0f18'], kind: 'room' },
};
export const BACKGROUND_PRESETS = PRESETS;
export const BACKGROUND_NAMES = Object.keys(PRESETS);

let custom = {};
export const setCustomBackgrounds = (map) => { custom = map ?? {}; };

const FALLBACK = { sky: ['#1b1440', '#2a1346', '#0b0f1a'], kind: 'none' };
const dark = 'rgba(4,6,16,.62)';

const Palm = ({ x, s = 1 }) => (
  <g transform={`translate(${x} 60) scale(${s})`} fill={dark} stroke={dark}>
    <path d="M0 0 Q2 -14 -1 -26" strokeWidth="1.4" fill="none" />
    <path d="M-1 -26 Q-10 -30 -14 -22 M-1 -26 Q8 -32 14 -24 M-1 -26 Q-4 -36 -12 -36 M-1 -26 Q4 -36 11 -35" strokeWidth="1.2" fill="none" />
  </g>
);

function Shapes({ kind }) {
  if (kind === 'city') {
    const hs = [30, 42, 26, 50, 36, 28, 46, 34, 40, 24];
    return <g fill={dark}>{hs.map((h, i) => <rect key={i} x={i * 10} y={60 - h} width="9" height={h} />)}
      {hs.map((h, i) => [0, 1, 2].map((j) => <rect key={`${i}-${j}`} x={i * 10 + 2 + j * 2.4} y={60 - h + 4 + j * 6} width="1.2" height="1.6" fill="#ffd166" opacity=".8" />))}</g>;
  }
  if (kind === 'stalls') {
    return <g><rect y="48" width="100" height="12" fill={dark} />{[10, 34, 60, 86].map((x) => <g key={x}><path d={`M${x - 10} 46 L${x} 32 L${x + 10} 46Z`} fill={dark} /><circle cx={x} cy="44" r="5" fill="#ff7a3d" opacity=".75" /><circle cx={x} cy="44" r="9" fill="#ff7a3d" opacity=".15" /></g>)}</g>;
  }
  if (kind === 'house') {
    return <g><rect y="44" width="100" height="16" fill="rgba(20,60,110,.55)" /><path d="M8 60 L8 36 L26 26 L44 36 L44 60Z" fill={dark} /><rect x="22" y="40" width="5" height="6" fill="#ffd166" opacity=".85" /><Palm x={60} s={1.1} /><Palm x={80} s={0.9} /><Palm x={92} s={1.2} /></g>;
  }
  if (kind === 'beach') {
    return <g><rect y="42" width="100" height="18" fill="rgba(20,40,90,.5)" /><rect y="52" width="100" height="8" fill="rgba(10,10,20,.5)" /><Palm x={10} s={1.3} /><Palm x={92} s={1.2} />
      {Array.from({ length: 14 }, (_, i) => <circle key={i} cx={4 + i * 7.2} cy={10 + Math.sin(i) * 3} r="1" fill="#ffd166" />)}</g>;
  }
  if (kind === 'dock') {
    return <g><rect y="46" width="100" height="14" fill="rgba(10,30,70,.6)" /><rect x="0" y="50" width="70" height="3" fill={dark} />
      <path d="M50 50 L50 28 L72 20 L94 28 L94 50Z" fill={dark} /><rect x="66" y="34" width="12" height="16" fill="#1c64f2" /><circle cx="76" cy="43" r="0.8" fill="#ffd166" /></g>;
  }
  if (kind === 'room') {
    return <g>{Array.from({ length: 20 }, (_, i) => <rect key={i} x={i * 5} y="0" width="0.4" height="60" fill="rgba(0,0,0,.35)" />)}<circle cx="78" cy="18" r="22" fill="#ffb703" opacity=".12" /><rect y="52" width="100" height="8" fill="rgba(0,0,0,.5)" /></g>;
  }
  return null;
}

// `def` lets the Studio preview an unsaved background.
export default function Background({ name, def, className = '' }) {
  const known = def ?? custom[name] ?? PRESETS[name];
  const s = known ?? FALLBACK; // a missing background never breaks the scene
  return (
    <div className={`bg ${className}`} style={{ background: `linear-gradient(180deg, ${s.sky[0]}, ${s.sky[1]} 55%, ${s.sky[2]})` }}>
      <svg viewBox="0 0 100 60" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
        {s.stars && Array.from({ length: 24 }, (_, i) => <circle key={i} cx={(i * 37) % 100} cy={(i * 17) % 28} r="0.3" fill="#fff" opacity={0.4 + (i % 4) * 0.15} />)}
        <Shapes kind={s.kind} />
      </svg>
      {!known && name !== 'none' && (
        <img className="bg-img" src={`/api/media/${encodeURIComponent(name)}`} alt=""
          onError={(e) => { e.currentTarget.style.display = 'none'; }} />
      )}
    </div>
  );
}
