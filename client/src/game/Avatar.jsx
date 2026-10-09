import { useId } from 'react';
import { DEFAULT_APPEARANCE } from './constants.js';

const FACE = { round: { rx: 46, ry: 48, c: 46 }, oval: { rx: 41, ry: 52, c: 41 }, square: { rx: 43, ry: 46, c: 16 } };
const EXPR = {
  neutral: { brow: [0, 0], lift: 0, eye: 1, mouth: 'M88 141 Q100 145 112 141' },
  happy: { brow: [-2, 2], lift: -2, eye: 0.8, mouth: 'M86 137 Q100 157 114 137' },
  angry: { brow: [12, -12], lift: 3, eye: 0.7, mouth: 'M88 147 Q100 138 112 147' },
  sad: { brow: [-9, 9], lift: 0, eye: 0.85, mouth: 'M89 147 Q100 138 111 147' },
  surprised: { brow: [0, 0], lift: -7, eye: 1.3, mouth: 'O' },
  nervous: { brow: [-7, 7], lift: -2, eye: 1, mouth: 'M88 144 Q94 139 100 144 T112 144' },
  confident: { brow: [-3, -9], lift: -1, eye: 0.85, mouth: 'M88 140 Q103 151 115 136' },
  embarrassed: { brow: [-6, 6], lift: 0, eye: 0.7, mouth: 'M90 143 Q100 148 110 143', blush: true },
};

function Hair({ style, color }) {
  const cap = <path d="M58 100 Q58 56 100 54 Q142 56 142 100 Q130 78 100 76 Q70 78 58 100Z" fill={color} />;
  switch (style) {
    case 'afro':
      return { back: <circle cx="100" cy="88" r="66" fill={color} />, front: <path d="M58 98 Q60 64 100 62 Q140 64 142 98 Q128 80 100 78 Q72 80 58 98Z" fill={color} /> };
    case 'braids':
      return {
        back: <g fill={color}><path d="M50 100 Q46 190 60 262 L76 262 L70 110Z M150 100 Q154 190 140 262 L124 262 L130 110Z" />
          {[0, 1, 2, 3, 4].map((i) => <rect key={i} x={52 + i * 0} y={140 + i * 22} width="22" height="3" fill="rgba(0,0,0,.35)" />)}</g>,
        front: cap,
      };
    case 'twists':
      return { back: null, front: <g fill={color}>{cap}{[62, 76, 90, 104, 118, 132].map((x, i) => <circle key={x} cx={x} cy={66 - (i % 2) * 6} r="13" />)}</g> };
    case 'locs':
      return { back: <g fill={color}>{[54, 64, 74, 126, 136, 146].map((x) => <rect key={x} x={x - 4} y="80" width="9" height={110 + (x % 3) * 20} rx="4" />)}</g>, front: cap };
    case 'bun':
      return { back: <circle cx="100" cy="42" r="22" fill={color} />, front: cap };
    case 'gele':
      return {
        back: null,
        front: <g fill={color}><path d="M52 94 Q54 36 100 34 Q148 36 148 94 Q130 68 100 68 Q70 68 52 94Z" />
          <path d="M112 40 Q168 6 172 50 Q142 58 112 40Z" /><path d="M60 60 Q100 44 140 60" stroke="rgba(255,255,255,.35)" strokeWidth="3" fill="none" /></g>,
      };
    case 'bald': return { back: null, front: null };
    default: return { back: null, front: cap };
  }
}

function Outfit({ id, name, color }) {
  const body = 'M18 320 Q22 214 100 202 Q178 214 182 320Z';
  let fill = color;
  let defs = null;
  if (name === 'ankara') {
    fill = `url(#${id}-p)`;
    defs = <pattern id={`${id}-p`} patternUnits="userSpaceOnUse" width="26" height="26"><rect width="26" height="26" fill={color} /><circle cx="7" cy="7" r="4.5" fill="#ffd166" /><path d="M13 26 L26 13" stroke="#1b1b1b" strokeWidth="2.5" /><circle cx="20" cy="20" r="3" fill="#fff" opacity=".8" /></pattern>;
  } else if (name === 'jersey') {
    fill = `url(#${id}-p)`;
    defs = <pattern id={`${id}-p`} patternUnits="userSpaceOnUse" width="24" height="24"><rect width="24" height="24" fill="#008751" /><rect width="12" height="24" fill="#f8f9fa" /></pattern>;
  }
  const neck = { dress: 'M70 206 Q100 250 130 206Z', kaftan: 'M82 203 L100 240 L118 203Z', hoodie: 'M84 204 Q100 216 116 204Z' }[name] ?? 'M80 204 Q100 226 120 204Z';
  return <g>{defs && <defs>{defs}</defs>}<path d={body} fill={fill} /><path d={neck} className="skin" />
    {name === 'hoodie' && <path d="M70 210 Q100 232 130 210" stroke="rgba(255,255,255,.4)" strokeWidth="3" fill="none" />}
    {name === 'kaftan' && <path d="M82 203 L100 240 L118 203" stroke="#ffd166" strokeWidth="3" fill="none" />}</g>;
}

export default function Avatar({ appearance, expression = 'neutral', className = 'avatar' }) {
  const uid = useId().replace(/:/g, '');
  const a = { ...DEFAULT_APPEARANCE, ...(appearance ?? {}) };
  const f = FACE[a.face] ?? FACE.oval;
  const e = EXPR[expression] ?? EXPR.neutral;
  const hair = Hair({ style: a.hair, color: a.hairColor });
  const brow = { soft: 3, arched: 3, thick: 5.5 }[a.brows] ?? 3;
  const browY = 96 + e.lift;
  const eye = (cx, i) => (
    <g key={cx}>
      <ellipse cx={cx} cy="110" rx="9" ry={7 * e.eye} fill="#fff" />
      <circle cx={cx} cy="110" r={4.2 * Math.min(e.eye, 1.1)} fill={a.eyes} />
      <circle cx={cx + 1.5} cy="108.5" r="1.4" fill="#fff" />
      <path d={`M${cx - 6} ${browY} Q${cx} ${browY - (a.brows === 'arched' ? 8 : 3)} ${cx + 6} ${browY}`} stroke={a.hairColor === '#8c8c8c' ? '#555' : a.hairColor} strokeWidth={brow} strokeLinecap="round" fill="none"
        transform={`rotate(${e.brow[i]} ${cx} ${browY})`} />
    </g>
  );
  return (
    <svg className={className} viewBox="0 0 200 320" role="img" aria-label="Character" style={{ '--skin': a.skin }}>
      <style>{`.skin{fill:${a.skin}}`}</style>
      {hair.back}
      <rect x="86" y="150" width="28" height="62" fill={a.skin} />
      <path d="M86 190 Q100 204 114 190 L114 212 L86 212Z" fill="rgba(0,0,0,.18)" />
      <Outfit id={uid} name={a.outfit} color={a.outfitColor} />
      {a.accessory === 'chain' && <path d="M78 206 Q100 238 122 206" stroke="#ffd166" strokeWidth="3.5" fill="none" />}
      <ellipse cx={100 - f.rx} cy="116" rx="7" ry="11" fill={a.skin} /><ellipse cx={100 + f.rx} cy="116" rx="7" ry="11" fill={a.skin} />
      <rect x={100 - f.rx} y={110 - f.ry} width={f.rx * 2} height={f.ry * 2} rx={f.c} ry={f.c} fill={a.skin} />
      <path d={`M${100 - f.rx + 6} ${110 + f.ry - 14} Q100 ${110 + f.ry + 8} ${100 + f.rx - 6} ${110 + f.ry - 14}`} fill="rgba(0,0,0,.08)" />
      {hair.front}
      {[82, 118].map((cx, i) => eye(cx, i))}
      <path d="M100 118 Q95 132 100 133 Q106 132 102 120" fill="rgba(0,0,0,.14)" />
      {e.mouth === 'O'
        ? <ellipse cx="100" cy="145" rx="6" ry="8" fill="#4a1d18" />
        : <path d={e.mouth} stroke="#4a1d18" strokeWidth="3.4" strokeLinecap="round" fill="none" />}
      {e.blush && <g fill="#ff6b81" opacity=".35"><circle cx="72" cy="130" r="9" /><circle cx="128" cy="130" r="9" /></g>}
      {a.accessory === 'glasses' && <g stroke="#1b1b1b" strokeWidth="3" fill="rgba(180,220,255,.12)"><circle cx="82" cy="110" r="14" /><circle cx="118" cy="110" r="14" /><path d="M96 108 L104 108" /></g>}
      {a.accessory === 'earrings' && <g fill="#ffd166"><circle cx={100 - f.rx} cy="130" r="4.5" /><circle cx={100 + f.rx} cy="130" r="4.5" /></g>}
      {a.accessory === 'cap' && <g fill={a.outfitColor}><path d="M56 92 Q60 50 100 48 Q140 50 144 92 Q100 80 56 92Z" /><path d="M118 84 Q162 84 170 98 Q140 96 118 90Z" /></g>}
    </svg>
  );
}
