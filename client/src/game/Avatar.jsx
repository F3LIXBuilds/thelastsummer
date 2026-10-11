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

/* ---------- head ---------- */
const FACES = {
  oval: { W: 46, J: 33, C: 160, T: 34 },
  round: { W: 50, J: 43, C: 157, T: 36 },
  square: { W: 48, J: 44, C: 156, T: 36 },
};
function headPath({ W, J, C, T }) {
  const k = 98 + (C - 98) * 0.5;
  return `M100 ${T} C${100 + W * 0.6} ${T} ${100 + W} ${T + 20} ${100 + W} 98 C${100 + W} ${k} ${100 + J + 2} ${C - 22} ${100 + J} ${C - 18} C${100 + J - 4} ${C - 8} ${100 + 14} ${C} 100 ${C} C${100 - 14} ${C} ${100 - J + 4} ${C - 8} ${100 - J} ${C - 18} C${100 - J - 2} ${C - 22} ${100 - W} ${k} ${100 - W} 98 C${100 - W} ${T + 20} ${100 - W * 0.6} ${T} 100 ${T}Z`;
}

const EXPR = {
  neutral: { brow: [0, 0], lift: 0, eye: 1, mouth: 'closed' },
  happy: { brow: [-2, 2], lift: -2, eye: 0.8, mouth: 'smile' },
  angry: { brow: [14, -14], lift: 3, eye: 0.7, mouth: 'frown' },
  sad: { brow: [-10, 10], lift: 0, eye: 0.8, mouth: 'frown' },
  surprised: { brow: [0, 0], lift: -8, eye: 1.3, mouth: 'open' },
  nervous: { brow: [-8, 8], lift: -2, eye: 1.05, mouth: 'wobble' },
  confident: { brow: [-3, -10], lift: -1, eye: 0.88, mouth: 'smirk' },
  embarrassed: { brow: [-6, 6], lift: 0, eye: 0.7, mouth: 'small', blush: true },
};

/* ---------- features ---------- */
function Mouth({ kind, lip, deep, talking }) {
  const line = { stroke: deep, strokeWidth: 1.4, fill: 'none', strokeLinecap: 'round' };
  const lower = mix(lip, '#ffffff', 0.14);
  if (talking) {
    return (
      <g className="av-talk">
        <path d="M87 140 Q100 136 113 140 Q100 154 87 140Z" fill="#3b1512" />
        <path d="M89 140.6 Q100 138.5 111 140.6 L110.4 143 Q100 141 89.6 143Z" fill="#f4eee6" />
        <path d="M85.5 139.6 Q100 134 114.5 139.6" {...line} stroke={lip} strokeWidth="3" />
        <path d="M88 143 Q100 153 112 143" {...line} stroke={lower} strokeWidth="3.4" />
      </g>
    );
  }
  switch (kind) {
    case 'smile':
      return (
        <g>
          <path d="M87 138.6 Q100 157 113 138.6 Q100 143 87 138.6Z" fill="#3b1512" />
          <path d="M89.4 139.2 Q100 149 110.6 139.2 Q100 143.2 89.4 139.2Z" fill="#f6f0e8" />
          <path d="M85.5 138 Q92 133.4 100 135.4 Q108 133.4 114.5 138" {...line} stroke={lip} strokeWidth="3.2" />
          <path d="M87.4 139.2 Q100 160.6 112.6 139.2 Q100 155.6 87.4 139.2Z" fill={lip} />
        </g>
      );
    case 'frown':
      return (
        <g>
          <path d="M86 146 Q93 139.5 100 140.4 Q107 139.5 114 146 Q100 142 86 146Z" fill={lip} />
          <path d="M87 146 Q100 152.6 113 146 Q100 144 87 146Z" fill={lower} />
          <path d="M86 146 Q100 141.4 114 146" {...line} />
        </g>
      );
    case 'open':
      return (
        <g>
          <ellipse cx="100" cy="144" rx="8.6" ry="10.4" fill={lip} />
          <ellipse cx="100" cy="144" rx="6.4" ry="8.2" fill="#3b1512" />
          <ellipse cx="100" cy="148.6" rx="4" ry="2.6" fill="#a8453f" />
          <path d="M95 136.8 Q100 135.6 105 136.8 L104.6 139.4 Q100 138.4 95.4 139.4Z" fill="#f4eee6" />
        </g>
      );
    case 'wobble':
      return (
        <g>
          <path d="M87 141 Q93.5 136.4 100 141 T113 141" {...line} stroke={lip} strokeWidth="3" />
          <path d="M89 143 Q100 149 111 143" {...line} stroke={lower} strokeWidth="2.4" />
        </g>
      );
    case 'smirk':
      return (
        <g>
          <path d="M86 141.6 Q94 137.6 101 138 Q109 137.4 115.4 134.8 Q101 143.6 86 141.6Z" fill={lip} />
          <path d="M88 142.6 Q101 150.4 114.4 135.6 Q101 146.6 88 142.6Z" fill={lower} />
          <path d="M86 141.6 Q101 144.4 115.4 134.8" {...line} />
        </g>
      );
    case 'small':
      return (
        <g>
          <path d="M91 141 Q100 146.4 109 141" {...line} stroke={lip} strokeWidth="2.8" />
          <path d="M92.5 142.6 Q100 147 107.5 142.6" {...line} stroke={lower} strokeWidth="1.8" opacity=".8" />
        </g>
      );
    default:
      return (
        <g>
          <path d="M86 140.4 Q93 135 100 136.8 Q107 135 114 140.4 Q100 142.6 86 140.4Z" fill={lip} />
          <path d="M87 141.2 Q100 152 113 141.2 Q100 143.8 87 141.2Z" fill={lower} />
          <path d="M86 140.4 Q100 143.4 114 140.4" {...line} />
          <ellipse cx="100" cy="146.4" rx="5" ry="1.2" fill="#fff" opacity=".28" />
        </g>
      );
  }
}

// s = +1 for the viewer's left eye, -1 for the right eye (inner corner is toward the nose)
function Eye({ cx, s, e, iris, skin, shadow, uid, delay }) {
  const cy = 99;
  const ht = 6.4 * e.eye;
  const ox = cx - s * 10.8;
  const ix = cx + s * 10.8;
  const oy = cy - 1.4;
  const iy = cy + 1;
  const top = `C${cx - s * 6} ${cy - ht * 1.9} ${cx + s * 4} ${cy - ht * 1.75} ${ix} ${iy}`;
  const shape = `M${ox} ${oy} ${top} C${cx + s * 6} ${cy + ht * 1.0} ${cx - s * 5} ${cy + ht * 1.05} ${ox} ${oy}Z`;
  const id = `${uid}e${s > 0 ? 0 : 1}`;
  return (
    <g>
      <defs>
        <clipPath id={id}><path d={shape} /></clipPath>
        <radialGradient id={`${id}i`} cx="50%" cy="38%" r="68%">
          <stop offset="0" stopColor={lighten(iris, 0.42)} />
          <stop offset="0.55" stopColor={iris} />
          <stop offset="1" stopColor={darken(iris, 0.6)} />
        </radialGradient>
        <linearGradient id={`${id}w`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#cfc6bd" />
          <stop offset="0.35" stopColor="#f7f2eb" />
          <stop offset="1" stopColor="#ece3d9" />
        </linearGradient>
      </defs>
      <path d={shape} fill={`url(#${id}w)`} />
      <g clipPath={`url(#${id})`}>
        <circle cx={cx} cy={cy + 0.4} r="5.7" fill={`url(#${id}i)`} />
        <circle cx={cx} cy={cy + 0.4} r="5.7" fill="none" stroke={darken(iris, 0.7)} strokeWidth="1" opacity=".7" />
        <circle cx={cx} cy={cy + 0.5} r="2.8" fill="#080505" />
        <circle cx={cx - 2.4} cy={cy - 2} r="1.7" fill="#fff" opacity=".95" />
        <circle cx={cx + 2.5} cy={cy + 2.3} r=".8" fill="#fff" opacity=".65" />
        <path d={`M${ox - 1} ${oy - 1} ${top} L${ix + 2} ${cy - 12} L${ox - 2} ${cy - 12}Z`} fill={shadow} opacity=".32" />
        <rect className="av-lid" x={cx - 13} y={cy - 12} width="26" height="24" fill={skin} style={{ animationDelay: `-${delay}s` }} />
      </g>
      <path d={`M${ox} ${oy} ${top}`} stroke="#120a08" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <path d={`M${ox} ${oy} Q${ox - s * 2.6} ${oy - 0.6} ${ox - s * 4} ${oy - 2.6}`} stroke="#120a08" strokeWidth="1.7" fill="none" strokeLinecap="round" />
      <path d={`M${ox + s * 2} ${oy + 2.4} C${cx - s * 5} ${cy + ht * 1.15} ${cx + s * 5} ${cy + ht * 1.1} ${ix - s * 1} ${iy + 0.8}`} stroke={shadow} strokeWidth=".9" fill="none" opacity=".55" />
      <path d={`M${ox + s * 1} ${oy - 4.6} Q${cx - s * 1} ${cy - ht * 2.6 - 3} ${ix - s * 1.5} ${iy - 5.4}`} stroke={shadow} strokeWidth="1" fill="none" opacity=".5" />
      <circle cx={ix - s * 0.4} cy={iy + 0.3} r="1.3" fill="#d98a82" opacity=".7" />
    </g>
  );
}

function Brow({ cx, s, rot, y, kind, color }) {
  const t = { soft: 3.2, thick: 5.2, arched: 3.2 }[kind] ?? 3.2;
  const arch = kind === 'arched' ? 8.5 : 4.2;
  const ix = cx + s * 12.5;
  const tx = cx - s * 16;
  const px = cx - s * 2;
  const iy = y + 2.4;
  const ty = y + (kind === 'arched' ? 5 : 2.4);
  const py = y - arch;
  const d = `M${ix} ${iy - t * 0.55} Q${px} ${py - t * 0.9} ${tx} ${ty - 0.4} Q${px} ${py + t * 0.55} ${ix} ${iy + t * 0.55}Z`;
  return (
    <g transform={`rotate(${rot} ${cx} ${y})`}>
      <path d={d} fill={color} opacity=".93" />
      <path d={`M${ix - s * 2} ${iy - 0.4} Q${px} ${py - t * 0.2} ${tx + s * 4} ${ty - 0.4}`} stroke={lighten(color, 0.3)} strokeWidth=".7" fill="none" opacity=".35" />
    </g>
  );
}

/* ---------- hair: back (behind body), mid (under the front hair), front (over forehead), over ---------- */
function hairLayers(style, color, f, uid) {
  const { W, T } = f;
  const g = `url(#${uid}h)`;
  const dk = darken(color, 0.45);
  const hi = lighten(color, 0.4);
  const strand = (d, o = 0.25, w = 0.9, c = dk) => <path key={d} d={d} stroke={c} strokeWidth={w} fill="none" opacity={o} strokeLinecap="round" />;
  const outer = (sy) => `M${100 - W - 4} ${sy} C${100 - W - 8} ${T + 8} ${100 - W * 0.55} ${T - 12} 100 ${T - 12} C${100 + W * 0.55} ${T - 12} ${100 + W + 8} ${T + 8} ${100 + W + 4} ${sy}`;
  const inner = (hy, sy) => ` C${100 + W + 1} ${sy - 12} ${100 + W - 6} 74 ${100 + W * 0.55} ${hy + 4} C${100 + W * 0.3} ${hy - 2} ${100 + W * 0.1} ${hy} 100 ${hy + 1} C${100 - W * 0.1} ${hy} ${100 - W * 0.3} ${hy - 2} ${100 - W * 0.55} ${hy + 4} C${100 - W + 6} 74 ${100 - W - 1} ${sy - 12} ${100 - W - 4} ${sy}Z`;
  const cap = (hy = 62, extra = 0, sy = 106, waves = false) => (
    <g>
      {waves && (
        <defs><clipPath id={`${uid}cp`}><path d={outer(sy).replace(/-12/g, `-${12 + extra}`) + inner(hy, sy)} /></clipPath></defs>
      )}
      <path d={outer(sy).replace(/-12/g, `-${12 + extra}`) + inner(hy, sy)} fill={g} />
      <path d={`M${100 + 4} ${T - 10} C${100 + W * 0.7} ${T - 8} ${100 + W + 6} ${T + 10} ${100 + W + 4} ${sy} C${100 + W - 2} ${sy - 16} ${100 + W - 8} 74 ${100 + W * 0.55} ${hy + 4} Z`} fill={darken(color, 0.4)} opacity=".35" />
      {waves && (
        <g clipPath={`url(#${uid}cp)`}>
          {[16, 27, 38, 49, 60].map((r) => <path key={r} d={`M${100 - r * 1.15} ${T + 26} Q100 ${T - 4 - r * 0.55} ${100 + r * 1.15} ${T + 26}`} stroke={hi} strokeWidth="1.2" fill="none" opacity=".16" />)}
        </g>
      )}
      {strand(`M${100 - W * 0.5} ${T + 2} Q${100 - W * 0.15} ${T - 8} ${100 + W * 0.3} ${T - 6}`, 0.28, 3, hi)}
      {strand(`M${100 - 5} ${T - 10} Q${100 - 30} ${T + 2} ${100 - W + 1} 92`, 0.26)}
      {strand(`M${100 + 5} ${T - 10} Q${100 + 30} ${T + 2} ${100 + W - 1} 92`, 0.26)}
      {strand(`M${100 - 5} ${T - 8} Q${100 - 20} ${T + 14} ${100 - W + 12} 84`, 0.18)}
      {strand(`M${100 + 5} ${T - 8} Q${100 + 20} ${T + 14} ${100 + W - 12} 84`, 0.18)}
    </g>
  );

  switch (style) {
    case 'bald':
      return { back: null, front: <ellipse cx="94" cy={T + 8} rx="24" ry="8" fill="#fff" opacity=".12" />, over: null };

    case 'afro': {
      const bumps = Array.from({ length: 22 }, (_, i) => {
        const t = (i / 22) * Math.PI * 2;
        return <circle key={i} cx={100 + Math.cos(t) * 66} cy={74 + Math.sin(t) * 62} r="14" fill={g} />;
      });
      return {
        back: (
          <g>
            <ellipse cx="100" cy="74" rx="68" ry="64" fill={g} />{bumps}
            <ellipse cx="116" cy="82" rx="52" ry="52" fill={darken(color, 0.35)} opacity=".28" />
            {strand('M60 40 Q80 20 108 22', 0.5, 5, hi)}
          </g>
        ),
        front: cap(58, 4),
        over: null,
      };
    }

    case 'braids': {
      const plait = (x, y0, len, ang, key) => (
        <g key={key} transform={`rotate(${ang} ${x} ${y0})`}>
          <path d={`M${x - 4.2} ${y0} L${x - 2.6} ${y0 + len} Q${x} ${y0 + len + 5} ${x + 2.6} ${y0 + len} L${x + 4.2} ${y0}Z`} fill={g} />
          <path d={`M${x - 3} ${y0} L${x - 1.8} ${y0 + len}`} stroke={hi} strokeWidth="1" opacity=".22" />
          {Array.from({ length: Math.floor(len / 7) }, (_, i) => (
            <path key={i} d={`M${x - 3} ${y0 + 4 + i * 7} L${x} ${y0 + 8 + i * 7} L${x + 3} ${y0 + 4 + i * 7}`} stroke={dk} strokeWidth="1.1" fill="none" opacity=".55" strokeLinecap="round" />
          ))}
          <circle cx={x} cy={y0 + len + 5} r="2.6" fill={darken(color, 0.1)} />
        </g>
      );
      const strands = [-1, 1].flatMap((s) => [[3, 132], [11, 120], [19, 108]].map(([d, len]) => ({ key: `${s}${d}`, x: 100 + s * (W + 1), len, ang: -s * (Math.atan2(d - 1, len) * 180) / Math.PI })));
      return {
        back: <path d={`M${100 - W - 2} 92 Q${100 - W - 6} 124 ${100 - W + 4} 146 L${100 + W - 4} 146 Q${100 + W + 6} 124 ${100 + W + 2} 92Z`} fill={darken(color, 0.3)} />,
        mid: <g>{strands.map((o) => plait(o.x, 96, o.len, o.ang, o.key))}</g>,
        front: cap(60, 2),
        over: null,
      };
    }

    case 'twists': {
      const coils = Array.from({ length: 8 }, (_, i) => {
        const x = 58 + i * 12;
        const y = T - 4 - Math.sin((i / 7) * Math.PI) * 10;
        return (
          <g key={i}>
            <ellipse cx={x} cy={y} rx="8.6" ry="15" transform={`rotate(${(i - 3.5) * 9} ${x} ${y})`} fill={g} />
            <path d={`M${x - 4} ${y - 6} Q${x} ${y - 2} ${x + 4} ${y - 6} M${x - 4} ${y + 1} Q${x} ${y + 5} ${x + 4} ${y + 1}`} stroke={dk} strokeWidth="1.1" fill="none" opacity=".5" />
          </g>
        );
      });
      return { back: null, front: <g>{cap(60, 0)}{coils}</g>, over: null };
    }

    case 'locs': {
      const locs = (xs, y0, y1) => xs.map((x, i) => (
        <g key={x}>
          <rect x={x - 4} y={y0} width="8" height={y1 - y0 - (i % 3) * 14} rx="4" fill={g} />
          <path d={`M${x - 1.4} ${y0 + 6} L${x - 1.4} ${y1 - 14 - (i % 3) * 14}`} stroke="#fff" strokeWidth=".9" opacity=".14" />
        </g>
      ));
      return { back: <g>{locs([42, 50, 58, 142, 150, 158], 70, 250)}</g>, mid: <g>{locs([46, 54, 146, 154], 90, 240)}</g>, front: cap(60, 2), over: null };
    }

    case 'bun':
      return {
        back: <g><circle cx="100" cy={T - 18} r="21" fill={g} />{strand(`M86 ${T - 22} Q100 ${T - 10} 114 ${T - 22}`)}{strand(`M88 ${T - 12} Q100 ${T - 5} 112 ${T - 12}`)}</g>,
        front: cap(62, 0),
        over: null,
      };

    case 'gele': {
      const fold = (d, o, c) => <path key={d} d={d} stroke={c} strokeWidth="1.3" fill="none" opacity={o} strokeLinecap="round" />;
      return {
        back: null,
        front: (
          <g>
            <path d={`M${100 - W - 4} 92 Q${100 - W - 2} ${T - 22} 100 ${T - 24} Q${100 + W + 2} ${T - 22} ${100 + W + 4} 92 Q${100 + W - 14} 62 100 62 Q${100 - W + 14} 62 ${100 - W - 4} 92Z`} fill={g} />
            {fold(`M${100 - W + 2} 80 Q100 ${T + 6} ${100 + W - 2} 80`, 0.35, dk)}
            {fold(`M${100 - W + 6} 68 Q100 ${T - 8} ${100 + W - 6} 68`, 0.3, hi)}
            {fold(`M${100 - W + 12} 86 Q100 ${T + 18} ${100 + W - 12} 86`, 0.25, dk)}
            <path d="M114 36 Q176 -4 184 52 Q148 62 114 36Z" fill={g} />
            {fold('M120 38 Q162 14 178 50', 0.4, dk)}
            {fold('M126 42 Q156 28 172 52', 0.3, hi)}
          </g>
        ),
        over: null,
      };
    }

    default:
      return { back: null, front: cap(64, 0, 97, true), over: null };
  }
}

/* ---------- clothing ---------- */
const TORSO = 'M-2 324 L-2 256 C0 232 24 216 56 208 C70 204 75 198 77 190 L123 190 C125 198 130 204 144 208 C176 216 200 232 202 256 L202 324Z';

function outfitLayers({ name, color, uid, skin }) {
  const fill = name === 'ankara' || name === 'jersey' ? `url(#${uid}p)` : `url(#${uid}f)`;
  const necks = {
    dress: 'M74 192 Q100 244 126 192Z',
    kaftan: 'M78 190 L100 238 L122 190Z',
    hoodie: 'M78 192 Q100 216 122 192Z',
    jersey: 'M80 190 Q100 220 120 190Z',
  };
  const neckline = necks[name] ?? 'M78 190 Q100 222 122 190Z';
  const common = (
    <>
      <path d={TORSO} fill={fill} />
      <path d={TORSO} fill={`url(#${uid}d)`} />
      <path d="M40 232 Q56 270 44 324 M160 232 Q144 270 156 324 M100 240 Q96 284 100 324" stroke={darken(color, 0.5)} strokeWidth="1.4" fill="none" opacity=".15" />
      <path d={neckline} fill={`url(#${uid}n)`} />
      <path d={neckline} fill="none" stroke={darken(skin, 0.55)} strokeWidth="1.1" opacity=".4" />
    </>
  );
  switch (name) {
    case 'hoodie':
      return {
        hood: <path d="M40 232 Q46 160 100 156 Q154 160 160 232Z" fill={darken(color, 0.3)} />,
        body: <>{common}<path d="M92 204 L90 246 M108 204 L110 246" stroke="#f1f3f5" strokeWidth="2" strokeLinecap="round" /></>,
        over: null,
      };
    case 'kaftan':
      return {
        hood: null,
        body: <>{common}<path d="M78 190 L100 238 L122 190" stroke="#e9c46a" strokeWidth="3" fill="none" strokeLinejoin="round" /><path d="M100 240 L100 324" stroke="#e9c46a" strokeWidth="1.8" strokeDasharray="2 4" fill="none" /></>,
        over: null,
      };
    case 'jersey':
      return { hood: null, body: <>{common}<path d="M80 190 Q100 224 120 190" stroke="#0b4d2e" strokeWidth="4.4" fill="none" /></>, over: null };
    default:
      return { hood: null, body: <>{common}<path d="M78 190 Q100 224 122 190" stroke={darken(color, 0.45)} strokeWidth="2.4" fill="none" /></>, over: null };
  }
}

export default function Avatar({ appearance, expression = 'neutral', speaking = false, className = 'avatar' }) {
  const uid = `av${useId().replace(/:/g, '')}`;
  const a = { ...DEFAULT_APPEARANCE, ...(appearance ?? {}) };
  const f = FACES[a.face] ?? FACES.oval;
  const e = EXPR[expression] ?? EXPR.neutral;
  const skin = a.skin;
  const luma = (([r, g, b]) => r * 0.3 + g * 0.59 + b * 0.11)(rgb(skin));
  const deepSkin = luma < 100;
  const hiC = mix(skin, '#ffd2a0', deepSkin ? 0.42 : 0.34);
  const lightC = mix(skin, '#ffd9b3', deepSkin ? 0.3 : 0.2);
  const midC = mix(skin, '#2a0f08', 0.16);
  const shadow = mix(skin, '#2a0f08', 0.4);
  const warm = mix(skin, '#e0705a', 0.45);
  const lip = mix(skin, '#7b2a2e', 0.55);
  const browColor = a.hair === 'gele' || a.hair === 'bald' ? '#1b1210' : darken(a.hairColor, 0.2);
  const delay = ([...uid].reduce((s, c) => s + c.charCodeAt(0), 0) % 45) / 10;
  const hp = headPath(f);
  const hair = hairLayers(a.hair, a.hairColor, f, uid);
  const outfit = outfitLayers({ name: a.outfit, color: a.outfitColor, uid, skin });
  const browY = 84 + e.lift;
  const neckPath = 'M72 134 L70 192 Q100 206 130 192 L128 134Z';

  return (
    <svg className={className} viewBox="0 0 200 320" role="img" aria-label="Character">
      <defs>
        <linearGradient id={`${uid}h`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={lighten(a.hairColor, 0.16)} />
          <stop offset="0.55" stopColor={a.hairColor} />
          <stop offset="1" stopColor={darken(a.hairColor, 0.3)} />
        </linearGradient>
        <radialGradient id={`${uid}s`} cx="42%" cy="34%" r="78%">
          <stop offset="0" stopColor={lightC} />
          <stop offset="0.5" stopColor={skin} />
          <stop offset="1" stopColor={midC} />
        </radialGradient>
        <radialGradient id={`${uid}r`} cx="108%" cy="52%" r="62%">
          <stop offset="0" stopColor={shadow} stopOpacity="0.62" />
          <stop offset="0.7" stopColor={shadow} stopOpacity="0.1" />
          <stop offset="1" stopColor={shadow} stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${uid}v`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0.72" stopColor={shadow} stopOpacity="0" />
          <stop offset="1" stopColor={shadow} stopOpacity="0.22" />
        </linearGradient>
        <linearGradient id={`${uid}n`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={midC} />
          <stop offset="1" stopColor={skin} />
        </linearGradient>
        <radialGradient id={`${uid}c`}>
          <stop offset="0" stopColor={warm} stopOpacity="0.2" />
          <stop offset="1" stopColor={warm} stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`${uid}b`}>
          <stop offset="0" stopColor="#ff5d73" stopOpacity="0.5" />
          <stop offset="1" stopColor="#ff5d73" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`${uid}k`}>
          <stop offset="0" stopColor={hiC} stopOpacity="0.8" />
          <stop offset="1" stopColor={hiC} stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${uid}f`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={lighten(a.outfitColor, 0.12)} />
          <stop offset="1" stopColor={darken(a.outfitColor, 0.28)} />
        </linearGradient>
        <linearGradient id={`${uid}d`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#000" stopOpacity="0.3" />
          <stop offset="0.22" stopColor="#000" stopOpacity="0" />
          <stop offset="0.62" stopColor="#000" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity="0.5" />
        </linearGradient>
        <clipPath id={`${uid}hc`}><path d={hp} /></clipPath>
        <clipPath id={`${uid}nc`}><path d={neckPath} /></clipPath>
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
        <path d={neckPath} fill={`url(#${uid}n)`} />
        <g clipPath={`url(#${uid}nc)`}>
          <ellipse cx="102" cy={f.C + 2} rx="34" ry="13" fill={shadow} opacity=".42" />
          <rect x="114" y="130" width="30" height="80" fill={shadow} opacity=".14" />
        </g>
        <g transform="translate(0 -6)">{outfit.hood}{outfit.body}</g>
      </g>

      <g className="av-head">
        <ellipse cx={100 - f.W - 1} cy="106" rx="7" ry="12.5" fill={midC} />
        <ellipse cx={100 + f.W + 1} cy="106" rx="7" ry="12.5" fill={shadow} />
        <ellipse cx={100 - f.W - 1} cy="108" rx="3.4" ry="7" fill={shadow} opacity=".5" />
        <ellipse cx={100 + f.W + 1} cy="108" rx="3.4" ry="7" fill={shadow} opacity=".6" />

        <path d={hp} fill={`url(#${uid}s)`} />
        <path d={hp} fill={`url(#${uid}r)`} />
        <path d={hp} fill={`url(#${uid}v)`} />
        <g clipPath={`url(#${uid}hc)`}>
          <ellipse cx="96" cy={f.T + 30} rx="22" ry="12" fill={`url(#${uid}k)`} />
          <ellipse cx="70" cy="122" rx="15" ry="11" fill={`url(#${uid}k)`} />
          <ellipse cx="100" cy={f.C - 6} rx="10" ry="5" fill={`url(#${uid}k)`} />
          <circle cx="68" cy="122" r="15" fill={`url(#${uid}c)`} />
          <circle cx="132" cy="122" r="15" fill={`url(#${uid}c)`} />
          <ellipse cx="78" cy="111" rx="11" ry="3" fill={shadow} opacity=".07" />
          <ellipse cx="122" cy="111" rx="11" ry="3" fill={shadow} opacity=".1" />
        </g>
        <path d={hp} fill="none" stroke={shadow} strokeWidth="1.1" opacity=".35" />
        {e.blush && <g fill={`url(#${uid}b)`}><circle cx="68" cy="124" r="14" /><circle cx="132" cy="124" r="14" /></g>}

        <g>
          <path d="M102 90 Q105 106 108 118" stroke={shadow} strokeWidth="3.2" fill="none" opacity=".2" strokeLinecap="round" />
          <ellipse cx="99.4" cy="108" rx="4.6" ry="14" fill={`url(#${uid}k)`} />
          <ellipse cx="99" cy="118" rx="5" ry="3.6" fill={hiC} opacity=".5" />
          <path d="M100 101 L99.6 113" stroke={hiC} strokeWidth="2.4" opacity=".3" strokeLinecap="round" />
          <path d="M89.5 121 Q88.6 126 92 128" stroke={shadow} strokeWidth="1.2" fill="none" opacity=".28" strokeLinecap="round" />
          <path d="M110.5 121 Q111.4 126 108 128" stroke={shadow} strokeWidth="1.2" fill="none" opacity=".34" strokeLinecap="round" />
          <ellipse cx="94.8" cy="125.8" rx="2.4" ry="1.4" fill={shadow} opacity=".7" />
          <ellipse cx="105.2" cy="125.8" rx="2.4" ry="1.4" fill={shadow} opacity=".75" />
          <path d="M93 131 Q100 134.6 107 131" stroke={shadow} strokeWidth="1.4" fill="none" opacity=".4" strokeLinecap="round" />
          <path d="M97 133 L97 136 M103 133 L103 136" stroke={shadow} strokeWidth="1" opacity=".18" />
        </g>

        <Eye cx={78} s={1} e={e} iris={a.eyes} skin={skin} shadow={shadow} uid={uid} delay={delay} />
        <Eye cx={122} s={-1} e={e} iris={a.eyes} skin={skin} shadow={shadow} uid={uid} delay={delay} />
        <Brow cx={78} s={1} rot={e.brow[0]} y={browY} kind={a.brows} color={browColor} />
        <Brow cx={122} s={-1} rot={e.brow[1]} y={browY} kind={a.brows} color={browColor} />
        <g transform="translate(100 140) scale(1.12 1.18) translate(-100 -140)">
          <Mouth kind={e.mouth} lip={lip} deep={mix(lip, '#000', 0.4)} talking={speaking} />
        </g>

        {hair.mid}
        {hair.front}

        {a.accessory === 'glasses' && (
          <g stroke="#1b1b1b" strokeWidth="2.4" fill="rgba(190,225,255,.12)">
            <rect x="62" y="88" width="32" height="23" rx="9" />
            <rect x="106" y="88" width="32" height="23" rx="9" />
            <path d="M94 97 Q100 94 106 97" fill="none" />
            <path d="M62 95 L52 96 M138 95 L148 96" fill="none" />
            <path d="M68 92 Q73 90 78 91" stroke="#fff" strokeWidth="1.4" fill="none" opacity=".6" />
          </g>
        )}
        {a.accessory === 'earrings' && (
          <g fill="#f2c94c" stroke="#b8860b" strokeWidth=".7">
            <circle cx={100 - f.W - 1} cy="121" r="4.2" />
            <circle cx={100 + f.W + 1} cy="121" r="4.2" />
            <circle cx={100 - f.W - 2} cy="120" r="1.1" fill="#fff" stroke="none" opacity=".75" />
          </g>
        )}
        {a.accessory === 'cap' && (
          <g>
            <path d={`M${100 - f.W - 3} 84 Q${100 - f.W} 30 100 28 Q${100 + f.W} 30 ${100 + f.W + 3} 84 Q100 70 ${100 - f.W - 3} 84Z`} fill={a.outfitColor} />
            <path d="M118 74 Q166 72 176 90 Q144 90 118 80Z" fill={darken(a.outfitColor, 0.25)} />
            <circle cx="100" cy="29" r="3.4" fill={darken(a.outfitColor, 0.3)} />
          </g>
        )}
      </g>

      {hair.over}
      {a.accessory === 'chain' && (
        <g>
          <path d="M76 186 Q100 212 124 186" stroke="#e9c46a" strokeWidth="3.2" fill="none" strokeDasharray="1.6 2.6" strokeLinecap="round" />
          <circle cx="100" cy="200" r="4.2" fill="#f2c94c" stroke="#b8860b" strokeWidth=".9" />
        </g>
      )}
    </svg>
  );
}
