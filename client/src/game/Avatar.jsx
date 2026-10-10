import { useId } from 'react';
import { DEFAULT_APPEARANCE } from './constants.js';

/* ---------- colour helpers ---------- */
const safe = (v) => (Number.isFinite(v) ? v : 128);
const rgb = (hex) => {
  let h = String(hex ?? '').replace('#', '');
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  if (!/^[0-9a-f]{6}$/i.test(h)) h = '888888';
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
};
const toHex = (c) => `#${c.map((v) => Math.max(0, Math.min(255, Math.round(safe(v)))).toString(16).padStart(2, '0')).join('')}`;
const mix = (a, b, t) => { const A = rgb(a); const B = rgb(b); return toHex(A.map((v, i) => v + (B[i] - v) * t)); };
const lighten = (c, t) => mix(c, '#ffffff', t);
const darken = (c, t) => mix(c, '#000000', t);

/* ---------- face shapes and expressions ---------- */
const FACES = {
  oval: { w: 41, top: 56, chin: 166, jaw: 24, k: 0.62 },
  round: { w: 46, top: 60, chin: 162, jaw: 38, k: 0.7 },
  square: { w: 44, top: 62, chin: 158, jaw: 40, k: 0.86 },
};
const headPath = ({ w, top, chin, jaw, k }) => {
  const mid = 108 + (chin - 108) * k;
  return `M${100 - w} 108 C${100 - w} ${top + 8} ${100 - w * 0.55} ${top} 100 ${top} C${100 + w * 0.55} ${top} ${100 + w} ${top + 8} ${100 + w} 108 C${100 + w} ${mid} ${100 + jaw} ${chin} 100 ${chin} C${100 - jaw} ${chin} ${100 - w} ${mid} ${100 - w} 108Z`;
};

const EXPR = {
  neutral: { brow: [0, 0], lift: 0, eye: 1, mouth: 'closed' },
  happy: { brow: [-2, 2], lift: -2, eye: 0.82, mouth: 'smile' },
  angry: { brow: [14, -14], lift: 3, eye: 0.72, mouth: 'frown' },
  sad: { brow: [-10, 10], lift: 0, eye: 0.8, mouth: 'frown' },
  surprised: { brow: [0, 0], lift: -8, eye: 1.25, mouth: 'open' },
  nervous: { brow: [-8, 8], lift: -2, eye: 1.05, mouth: 'wobble' },
  confident: { brow: [-3, -10], lift: -1, eye: 0.88, mouth: 'smirk' },
  embarrassed: { brow: [-6, 6], lift: 0, eye: 0.7, mouth: 'small', blush: true },
};

/* ---------- features ---------- */
function Mouth({ kind, lip, deep, talking }) {
  const line = { stroke: deep, strokeWidth: 1.3, fill: 'none', strokeLinecap: 'round' };
  const lower = mix(lip, '#ffffff', 0.12);
  if (talking) {
    return (
      <g className="av-talk">
        <path d="M90 144 Q100 141 110 144 Q100 155 90 144Z" fill="#3b1512" />
        <path d="M91.5 144.4 Q100 142.5 108.5 144.4 L108 146 Q100 144.5 92 146Z" fill="#f4eee6" />
        <path d="M89 143.5 Q100 140 111 143.5" {...line} stroke={lip} strokeWidth="2.2" />
      </g>
    );
  }
  switch (kind) {
    case 'smile':
      return (
        <g>
          <path d="M88 142.5 Q100 156 112 142.5Z" fill="#3b1512" />
          <path d="M90 143 Q100 149 110 143 L109 144.6 Q100 150.4 91 144.6Z" fill="#f4eee6" />
          <path d="M87 141.5 Q93 139 100 140.2 Q107 139 113 141.5" {...line} stroke={lip} strokeWidth="2.4" />
          <path d="M89 145 Q100 157 111 145" {...line} stroke={lip} strokeWidth="2.6" />
        </g>
      );
    case 'frown':
      return (
        <g>
          <path d="M88 148 Q94 142.5 100 143 Q106 142.5 112 148 Q100 144.4 88 148Z" fill={lip} />
          <path d="M89 148 Q100 152.4 111 148 Q100 146.5 89 148Z" fill={lip} opacity=".9" />
          <path d="M88 148 Q100 144 112 148" {...line} />
        </g>
      );
    case 'open':
      return (
        <g>
          <ellipse cx="100" cy="147" rx="7.4" ry="9.4" fill={lip} />
          <ellipse cx="100" cy="147" rx="5.4" ry="7.4" fill="#3b1512" />
          <ellipse cx="100" cy="151" rx="3.4" ry="2.2" fill="#a8453f" />
          <path d="M96 140.4 Q100 139.4 104 140.4 L103.6 142.6 Q100 141.8 96.4 142.6Z" fill="#f4eee6" />
        </g>
      );
    case 'wobble':
      return (
        <g>
          <path d="M89 144 Q94.5 140.6 100 144 T111 144" {...line} stroke={lip} strokeWidth="2.4" />
          <path d="M91 145.4 Q100 150.6 109 145.4" {...line} stroke={lip} strokeWidth="1.8" opacity=".8" />
        </g>
      );
    case 'smirk':
      return (
        <g>
          <path d="M88 144.6 Q95 141.6 101 141.8 Q108 141.2 113.4 139.8 Q101 145.4 88 144.6Z" fill={lip} />
          <path d="M90 145.6 Q101 151 112.6 140.6 Q101 148.4 90 145.6Z" fill={lower} />
          <path d="M88 144.6 Q101 146.4 113.4 139.8" {...line} />
        </g>
      );
    case 'small':
      return (
        <g>
          <path d="M92 144 Q100 148.6 108 144" {...line} stroke={lip} strokeWidth="2.2" />
          <path d="M93 145.2 Q100 149.4 107 145.2" {...line} stroke={lip} strokeWidth="1.4" opacity=".7" />
        </g>
      );
    default:
      return (
        <g>
          <path d="M88 144 Q94 140.6 100 141.6 Q106 140.6 112 144 Q100 145.6 88 144Z" fill={lip} />
          <path d="M89 144.4 Q100 153.4 111 144.4 Q100 146.4 89 144.4Z" fill={lower} />
          <path d="M88 144 Q100 146 112 144" {...line} />
          <ellipse cx="100" cy="149" rx="4" ry="1" fill="#fff" opacity=".18" />
        </g>
      );
  }
}

function Eye({ cx, i, e, iris, skin, deep, uid, delay }) {
  const cy = 109;
  const ry = 6.4 * e.eye;
  const id = `${uid}e${i}`;
  const dx = i ? -0.5 : 0.5;
  return (
    <g>
      <defs>
        <clipPath id={id}><ellipse cx={cx} cy={cy} rx="9.2" ry={ry} /></clipPath>
        <radialGradient id={`${id}i`} cx="50%" cy="42%" r="62%">
          <stop offset="0" stopColor={lighten(iris, 0.38)} />
          <stop offset="0.6" stopColor={iris} />
          <stop offset="1" stopColor={darken(iris, 0.55)} />
        </radialGradient>
      </defs>
      <ellipse cx={cx} cy={cy} rx="9.2" ry={ry} fill="#f4efe9" />
      <g clipPath={`url(#${id})`}>
        <circle cx={cx + dx} cy={cy + 0.5} r="5.2" fill={`url(#${id}i)`} />
        <circle cx={cx + dx} cy={cy + 0.5} r="2.3" fill="#0a0606" />
        <circle cx={cx - 1.7} cy={cy - 1.5} r="1.3" fill="#fff" opacity=".92" />
        <circle cx={cx + 1.9} cy={cy + 1.9} r=".65" fill="#fff" opacity=".6" />
        <rect x={cx - 10} y={cy - ry - 1} width="20" height={ry * 0.7} fill={deep} opacity=".28" />
        <rect className="av-lid" x={cx - 10} y={cy - ry - 2} width="20" height={ry * 2 + 4} fill={skin} style={{ animationDelay: `-${delay}s` }} />
      </g>
      <path d={`M${cx - 9.8} ${cy + 0.8} Q${cx} ${cy - ry * 1.45 - 1.4} ${cx + 9.8} ${cy + 0.8}`} stroke="#140d0b" strokeWidth="1.9" fill="none" strokeLinecap="round" />
      <path d={`M${cx - 8} ${cy + ry * 0.85} Q${cx} ${cy + ry + 1.7} ${cx + 8} ${cy + ry * 0.85}`} stroke={deep} strokeWidth=".7" fill="none" opacity=".5" />
      <path d={`M${cx - 8.6} ${cy - ry - 2.4} Q${cx} ${cy - ry - 5.6} ${cx + 8.6} ${cy - ry - 2.4}`} stroke={deep} strokeWidth=".8" fill="none" opacity=".4" />
    </g>
  );
}

function Brow({ cx, rot, y, kind, color }) {
  const t = { soft: 2.6, thick: 4.4, arched: 2.8 }[kind] ?? 2.6;
  const arch = kind === 'arched' ? 7.5 : 3.6;
  const d = `M${cx - 11} ${y + 1.6} Q${cx - 1} ${y - arch} ${cx + 11} ${y + (kind === 'arched' ? 3.4 : 1.4)}`;
  return (
    <g transform={`rotate(${rot} ${cx} ${y})`} fill="none" stroke={color} strokeLinecap="round">
      <path d={d} strokeWidth={t} opacity=".9" />
      <path d={d} strokeWidth={t * 0.5} transform="translate(0 -0.9)" opacity=".6" />
      <path d={d} strokeWidth={t * 0.3} transform="translate(0.5 0.7)" opacity=".45" />
    </g>
  );
}

/* ---------- hair: back (behind body), front (over forehead), over (in front of clothes) ---------- */
function hairLayers(style, color, f, uid) {
  const g = `url(#${uid}h)`;
  const dk = darken(color, 0.5);
  const strand = (d, o = 0.22, w = 0.8) => <path key={d} d={d} stroke={dk} strokeWidth={w} fill="none" opacity={o} strokeLinecap="round" />;
  const line = (lift = 0) => (
    <path d={`M${100 - f.w - 2} 110 C${100 - f.w - 3} 72 ${100 - f.w + 10} ${f.top - 7} 100 ${f.top - 7} C${100 + f.w - 10} ${f.top - 7} ${100 + f.w + 3} 72 ${100 + f.w + 2} 110 C${100 + f.w - 1} 94 ${100 + f.w - 9} ${80 - lift} 100 ${f.top + 19 - lift} C${100 - f.w + 9} ${80 - lift} ${100 - f.w + 1} 94 ${100 - f.w - 2} 110Z`} fill={g} />
  );
  const crown = [
    `M100 ${f.top - 3} Q${100 - 24} ${f.top + 4} ${100 - f.w + 4} 98`,
    `M100 ${f.top - 3} Q${100 + 24} ${f.top + 4} ${100 + f.w - 4} 98`,
    `M100 ${f.top - 3} Q${100 - 10} ${f.top + 10} ${100 - 22} 86`,
    `M100 ${f.top - 3} Q${100 + 10} ${f.top + 10} ${100 + 22} 86`,
  ].map((d) => strand(d));
  const sheen = <path d={`M${100 - 26} ${f.top + 4} Q100 ${f.top - 8} ${100 + 26} ${f.top + 4}`} stroke="#fff" strokeWidth="3" fill="none" opacity=".13" strokeLinecap="round" />;
  const cap = <g>{line(0)}{crown}{sheen}</g>;

  switch (style) {
    case 'bald':
      return { back: null, front: <ellipse cx="100" cy={f.top + 8} rx="26" ry="8" fill="#fff" opacity=".1" />, over: null };

    case 'afro': {
      const bumps = Array.from({ length: 18 }, (_, i) => {
        const t = (i / 18) * Math.PI * 2;
        return <circle key={i} cx={100 + Math.cos(t) * 58} cy={88 + Math.sin(t) * 58} r="13" fill={g} />;
      });
      return {
        back: <g><circle cx="100" cy="88" r="60" fill={g} />{bumps}<circle cx="100" cy="88" r="46" fill={darken(color, 0.25)} opacity=".35" /></g>,
        front: <g>{line(-3)}{crown}</g>,
        over: null,
      };
    }

    case 'braids': {
      const braid = (x) => Array.from({ length: 14 }, (_, k) => (
        <ellipse key={`${x}-${k}`} cx={x + (k % 2 ? 1.2 : -1.2)} cy={142 + k * 8.2} rx="3.8" ry="5" fill={k % 2 ? g : darken(color, 0.22)} />
      ));
      const xs = [-1, 1].flatMap((s) => [f.w + 4, f.w + 10, f.w + 16].map((d) => 100 + s * d));
      return {
        back: <path d={`M${100 - f.w - 6} 100 Q${100 - f.w - 12} 150 ${100 - f.w - 8} 200 L${100 + f.w + 8} 200 Q${100 + f.w + 12} 150 ${100 + f.w + 6} 100Z`} fill={darken(color, 0.3)} />,
        front: cap,
        over: <g>{xs.map((x) => <g key={x}>{braid(x)}</g>)}</g>,
      };
    }

    case 'twists': {
      const coils = Array.from({ length: 7 }, (_, i) => {
        const x = 62 + i * 12.7;
        const y = f.top - 2 - Math.sin((i / 6) * Math.PI) * 7;
        return (
          <g key={i}>
            <ellipse cx={x} cy={y} rx="7" ry="11" transform={`rotate(${(i - 3) * 9} ${x} ${y})`} fill={g} />
            <path d={`M${x - 4} ${y - 5} Q${x} ${y - 1} ${x + 4} ${y - 5} M${x - 4} ${y + 1} Q${x} ${y + 5} ${x + 4} ${y + 1}`} stroke={dk} strokeWidth="1" fill="none" opacity=".5" />
          </g>
        );
      });
      return { back: null, front: <g>{line(-6)}{coils}</g>, over: null };
    }

    case 'locs': {
      const locs = (xs, y0, y1) => xs.map((x, i) => (
        <g key={x}>
          <rect x={x - 3.6} y={y0} width="7.2" height={y1 - y0 - (i % 3) * 14} rx="3.6" fill={g} />
          <path d={`M${x - 1} ${y0 + 6} L${x - 1} ${y1 - 14 - (i % 3) * 14}`} stroke="#fff" strokeWidth=".8" opacity=".12" />
        </g>
      ));
      return { back: <g>{locs([46, 54, 62, 138, 146, 154], 80, 250)}</g>, front: cap, over: <g>{locs([50, 58, 142, 150], 138, 240)}</g> };
    }

    case 'bun':
      return {
        back: <g><circle cx="100" cy={f.top - 14} r="19" fill={g} />{strand(`M88 ${f.top - 18} Q100 ${f.top - 8} 112 ${f.top - 18}`)}{strand(`M90 ${f.top - 8} Q100 ${f.top - 2} 110 ${f.top - 8}`)}</g>,
        front: cap,
        over: null,
      };

    case 'gele': {
      const fold = (d, o, c) => <path key={d} d={d} stroke={c} strokeWidth="1.2" fill="none" opacity={o} strokeLinecap="round" />;
      return {
        back: null,
        front: (
          <g>
            <path d="M50 96 Q52 32 100 30 Q150 32 150 96 Q132 66 100 66 Q68 66 50 96Z" fill={g} />
            {fold('M58 84 Q100 52 142 84', 0.35, dk)}
            {fold('M62 72 Q100 40 138 72', 0.3, lighten(color, 0.5))}
            {fold('M70 90 Q100 62 130 90', 0.25, dk)}
            <path d="M112 38 Q170 2 176 54 Q144 62 112 38Z" fill={g} />
            {fold('M118 40 Q158 18 170 50', 0.4, dk)}
            {fold('M124 44 Q152 30 166 52', 0.3, lighten(color, 0.5))}
          </g>
        ),
        over: null,
      };
    }

    default:
      return { back: null, front: cap, over: null };
  }
}

/* ---------- clothing ---------- */
function outfitLayers({ name, color, uid, skin }) {
  const fill = name === 'ankara' || name === 'jersey' ? `url(#${uid}p)` : `url(#${uid}f)`;
  const body = 'M10 322 Q14 216 100 202 Q186 216 190 322Z';
  const necks = {
    dress: 'M66 208 Q100 256 134 208Z',
    kaftan: 'M80 203 L100 246 L120 203Z',
    hoodie: 'M82 205 Q100 224 118 205Z',
    jersey: 'M84 204 Q100 226 116 204Z',
  };
  const neckline = necks[name] ?? 'M80 204 Q100 230 120 204Z';
  const folds = (
    <g stroke={darken(color, 0.5)} strokeWidth="1.2" fill="none" opacity=".16">
      <path d="M44 250 Q56 282 46 320" />
      <path d="M156 250 Q144 282 154 320" />
      <path d="M100 250 Q96 286 100 320" opacity=".6" />
    </g>
  );
  const common = (
    <>
      <path d={body} fill={fill} />
      <path d={body} fill={`url(#${uid}d)`} />
      {folds}
      <path d={neckline} fill={`url(#${uid}n)`} />
      <path d={neckline} fill="none" stroke={darken(skin, 0.5)} strokeWidth="1" opacity=".35" />
    </>
  );
  switch (name) {
    case 'hoodie':
      return {
        hood: <path d="M46 226 Q52 166 100 162 Q148 166 154 226Z" fill={darken(color, 0.3)} />,
        body: <>{common}<path d="M92 214 L90 252 M108 214 L110 252" stroke="#f1f3f5" strokeWidth="1.8" strokeLinecap="round" /></>,
        over: null,
      };
    case 'kaftan':
      return {
        hood: null,
        body: <>{common}<path d="M80 203 L100 246 L120 203" stroke="#e9c46a" strokeWidth="2.6" fill="none" strokeLinejoin="round" /><path d="M100 248 L100 320" stroke="#e9c46a" strokeWidth="1.6" strokeDasharray="2 4" fill="none" /></>,
        over: null,
      };
    case 'jersey':
      return { hood: null, body: <>{common}<path d="M80 203 Q100 232 120 203" stroke="#0b4d2e" strokeWidth="4" fill="none" /></>, over: null };
    default:
      return { hood: null, body: <>{common}<path d="M80 204 Q100 230 120 204" stroke={darken(color, 0.45)} strokeWidth="2.2" fill="none" /></>, over: null };
  }
}

export default function Avatar({ appearance, expression = 'neutral', speaking = false, className = 'avatar' }) {
  const uid = `av${useId().replace(/:/g, '')}`;
  const a = { ...DEFAULT_APPEARANCE, ...(appearance ?? {}) };
  const f = FACES[a.face] ?? FACES.oval;
  const e = EXPR[expression] ?? EXPR.neutral;
  const skin = a.skin;
  const light = lighten(skin, 0.2);
  const shade = darken(skin, 0.22);
  const deep = darken(skin, 0.42);
  const warm = mix(skin, '#b5473a', 0.32);
  const lip = mix(skin, '#6e2530', 0.5);
  const browColor = a.hair === 'gele' || a.hair === 'bald' ? '#1b1210' : darken(a.hairColor, 0.25);
  const delay = ([...uid].reduce((s, c) => s + c.charCodeAt(0), 0) % 45) / 10;
  const hp = headPath(f);
  const hair = hairLayers(a.hair, a.hairColor, f, uid);
  const outfit = outfitLayers({ name: a.outfit, color: a.outfitColor, uid, skin });
  const browY = 96 + e.lift;

  return (
    <svg className={className} viewBox="0 0 200 320" role="img" aria-label="Character">
      <defs>
        <linearGradient id={`${uid}h`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={lighten(a.hairColor, 0.2)} />
          <stop offset="0.5" stopColor={a.hairColor} />
          <stop offset="1" stopColor={darken(a.hairColor, 0.35)} />
        </linearGradient>
        <radialGradient id={`${uid}s`} cx="46%" cy="38%" r="72%">
          <stop offset="0" stopColor={light} />
          <stop offset="0.55" stopColor={skin} />
          <stop offset="1" stopColor={shade} />
        </radialGradient>
        <linearGradient id={`${uid}v`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0.5" stopColor={deep} stopOpacity="0" />
          <stop offset="1" stopColor={deep} stopOpacity="0.38" />
        </linearGradient>
        <linearGradient id={`${uid}x`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor={deep} stopOpacity="0.34" />
          <stop offset="0.24" stopColor={deep} stopOpacity="0" />
          <stop offset="0.76" stopColor={deep} stopOpacity="0" />
          <stop offset="1" stopColor={deep} stopOpacity="0.34" />
        </linearGradient>
        <linearGradient id={`${uid}n`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={shade} />
          <stop offset="1" stopColor={skin} />
        </linearGradient>
        <radialGradient id={`${uid}c`}>
          <stop offset="0" stopColor={warm} stopOpacity="0.42" />
          <stop offset="1" stopColor={warm} stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${uid}f`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={lighten(a.outfitColor, 0.14)} />
          <stop offset="1" stopColor={darken(a.outfitColor, 0.25)} />
        </linearGradient>
        <linearGradient id={`${uid}d`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#000" stopOpacity="0.42" />
          <stop offset="0.26" stopColor="#000" stopOpacity="0" />
          <stop offset="0.74" stopColor="#000" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity="0.42" />
        </linearGradient>
        {a.outfit === 'ankara' && (
          <pattern id={`${uid}p`} patternUnits="userSpaceOnUse" width="26" height="26">
            <rect width="26" height="26" fill={a.outfitColor} />
            <circle cx="7" cy="7" r="4.5" fill="#ffd166" />
            <path d="M13 26 L26 13" stroke="#1b1b1b" strokeWidth="2.5" />
            <circle cx="20" cy="20" r="3" fill="#fff" opacity=".8" />
          </pattern>
        )}
        {a.outfit === 'jersey' && (
          <pattern id={`${uid}p`} patternUnits="userSpaceOnUse" width="24" height="24">
            <rect width="24" height="24" fill="#008751" />
            <rect width="12" height="24" fill="#f8f9fa" />
          </pattern>
        )}
      </defs>

      {hair.back}

      <g className="av-breathe">
        {outfit.hood}
        <path d="M85 146 L83 198 Q100 211 117 198 L115 146Z" fill={`url(#${uid}n)`} />
        <ellipse cx="100" cy={f.chin + 5} rx="25" ry="9" fill={deep} opacity=".4" />
        {outfit.body}
      </g>

      <g className="av-head">
        <ellipse cx={100 - f.w - 1} cy="117" rx="6.5" ry="11" fill={shade} />
        <ellipse cx={100 + f.w + 1} cy="117" rx="6.5" ry="11" fill={shade} />
        <ellipse cx={100 - f.w - 1} cy="118" rx="3" ry="6.5" fill={deep} opacity=".45" />
        <ellipse cx={100 + f.w + 1} cy="118" rx="3" ry="6.5" fill={deep} opacity=".45" />

        <path d={hp} fill={`url(#${uid}s)`} />
        <path d={hp} fill={`url(#${uid}x)`} />
        <path d={hp} fill={`url(#${uid}v)`} />
        <ellipse cx="97" cy={f.top + 24} rx="19" ry="9" fill="#fff" opacity=".1" />
        <circle cx="71" cy="127" r="13" fill={`url(#${uid}c)`} />
        <circle cx="129" cy="127" r="13" fill={`url(#${uid}c)`} />
        {e.blush && <g fill="#ff6b81" opacity=".28"><circle cx="72" cy="128" r="9" /><circle cx="128" cy="128" r="9" /></g>}
        <ellipse cx="81" cy="116.5" rx="9" ry="3" fill={deep} opacity=".1" />
        <ellipse cx="119" cy="116.5" rx="9" ry="3" fill={deep} opacity=".1" />

        <g>
          <path d="M97.5 106 Q96.5 124 94 130" stroke={deep} strokeWidth="1.2" fill="none" opacity=".3" />
          <path d="M102.5 106 Q103.5 124 106 130" stroke={deep} strokeWidth="1.2" fill="none" opacity=".3" />
          <path d="M100 108 L100 126" stroke={light} strokeWidth="2.6" opacity=".25" strokeLinecap="round" />
          <path d="M93.5 131 Q100 136.5 106.5 131" stroke={deep} strokeWidth="1.6" fill="none" opacity=".55" strokeLinecap="round" />
          <ellipse cx="96.6" cy="131.6" rx="2" ry="1.2" fill={deep} opacity=".6" />
          <ellipse cx="103.4" cy="131.6" rx="2" ry="1.2" fill={deep} opacity=".6" />
          <path d="M92.5 129 Q91 132 94.5 133.2" stroke={deep} strokeWidth="1" fill="none" opacity=".35" />
          <path d="M107.5 129 Q109 132 105.5 133.2" stroke={deep} strokeWidth="1" fill="none" opacity=".35" />
        </g>

        <Eye cx={81} i={0} e={e} iris={a.eyes} skin={skin} deep={deep} uid={uid} delay={delay} />
        <Eye cx={119} i={1} e={e} iris={a.eyes} skin={skin} deep={deep} uid={uid} delay={delay} />
        <Brow cx={81} rot={e.brow[0]} y={browY} kind={a.brows} color={browColor} />
        <Brow cx={119} rot={e.brow[1]} y={browY} kind={a.brows} color={browColor} />
        <Mouth kind={e.mouth} lip={lip} deep={darken(lip, 0.35)} talking={speaking} />

        {hair.front}

        {a.accessory === 'glasses' && (
          <g stroke="#1b1b1b" strokeWidth="2.2" fill="rgba(190,225,255,.12)">
            <circle cx="81" cy="109" r="13.5" />
            <circle cx="119" cy="109" r="13.5" />
            <path d="M94 108 Q100 105 106 108" fill="none" />
            <path d="M67.5 107 L58 108 M132.5 107 L142 108" fill="none" />
            <path d="M73 102 Q77 99 81 100" stroke="#fff" strokeWidth="1.4" fill="none" opacity=".6" />
          </g>
        )}
        {a.accessory === 'earrings' && (
          <g fill="#f2c94c" stroke="#b8860b" strokeWidth=".6">
            <circle cx={100 - f.w - 1} cy="131" r="3.8" />
            <circle cx={100 + f.w + 1} cy="131" r="3.8" />
            <circle cx={100 - f.w - 2} cy="130" r="1" fill="#fff" stroke="none" opacity=".7" />
            <circle cx={100 + f.w} cy="130" r="1" fill="#fff" stroke="none" opacity=".7" />
          </g>
        )}
        {a.accessory === 'cap' && (
          <g>
            <path d="M52 92 Q54 46 100 44 Q146 46 148 92 Q100 80 52 92Z" fill={a.outfitColor} />
            <path d="M52 92 Q54 46 100 44 Q146 46 148 92 Q100 80 52 92Z" fill={`url(#${uid}d)`} />
            <path d="M118 84 Q164 82 172 98 Q142 98 118 90Z" fill={darken(a.outfitColor, 0.25)} />
            <circle cx="100" cy="45" r="3" fill={darken(a.outfitColor, 0.3)} />
          </g>
        )}
      </g>

      {hair.over}
      {a.accessory === 'chain' && (
        <g>
          <path d="M76 206 Q100 240 124 206" stroke="#e9c46a" strokeWidth="3" fill="none" strokeDasharray="1.4 2.6" strokeLinecap="round" />
          <circle cx="100" cy="224" r="4" fill="#f2c94c" stroke="#b8860b" strokeWidth=".8" />
        </g>
      )}
    </svg>
  );
}
