import { useMemo, useState } from 'react';

const NW = 170, NH = 62, CW = 260, RH = 100, PAD = 36;
const trunc = (s, n) => (s.length > n ? `${s.slice(0, n - 1)}…` : s);

// Layer scenes by distance from the start, then order each layer by where its parents sit.
function layout(graph) {
  const { nodes, edges } = graph;
  const out = new Map(nodes.map((n) => [n.id, []]));
  const inc = new Map(nodes.map((n) => [n.id, []]));
  for (const e of edges) { out.get(e.from).push(e.to); inc.get(e.to).push(e.from); }

  const start = (nodes.find((n) => n.start) ?? nodes[0]).id;
  const layerOf = new Map([[start, 0]]);
  const queue = [start];
  while (queue.length) {
    const id = queue.shift();
    for (const t of out.get(id)) if (!layerOf.has(t)) { layerOf.set(t, layerOf.get(id) + 1); queue.push(t); }
  }
  const maxLayer = Math.max(...layerOf.values());
  for (const n of nodes) if (!layerOf.has(n.id)) layerOf.set(n.id, maxLayer + 1); // unreachable scenes: last column

  const layers = [];
  for (const n of nodes) { const l = layerOf.get(n.id); (layers[l] ??= []).push(n.id); }

  const row = new Map();
  layers.forEach((ids, l) => {
    if (l > 0) {
      const bary = (id) => {
        const ps = inc.get(id).filter((p) => layerOf.get(p) < l && row.has(p));
        return ps.length ? ps.reduce((a, p) => a + row.get(p), 0) / ps.length : Infinity;
      };
      ids.sort((a, b) => { const A = bary(a), B = bary(b); return A === B ? 0 : A - B; });
    }
    ids.forEach((id, i) => row.set(id, i));
  });

  const tallest = Math.max(...layers.map((l) => l.length));
  const pos = new Map();
  layers.forEach((ids, l) => {
    const offset = ((tallest - ids.length) / 2) * RH;
    ids.forEach((id, i) => pos.set(id, { x: PAD + l * CW, y: PAD + offset + i * RH }));
  });
  return { pos, layerOf, width: PAD * 2 + (layers.length - 1) * CW + NW, height: PAD * 2 + tallest * RH + 80 };
}

function route(a, b, forward, k, self) {
  if (self) {
    const x = a.x + NW / 2, y = a.y + NH;
    return { d: `M${x - 20} ${y} C${x - 20} ${y + 44}, ${x + 20} ${y + 44}, ${x + 20} ${y}`, mx: x, my: y + 38 };
  }
  if (forward) {
    const sx = a.x + NW, sy = a.y + NH / 2, tx = b.x, ty = b.y + NH / 2;
    const dx = Math.max(40, (tx - sx) / 2);
    return { d: `M${sx} ${sy} C${sx + dx} ${sy}, ${tx - dx} ${ty}, ${tx} ${ty}`, mx: (sx + tx) / 2, my: (sy + ty) / 2 - 6 };
  }
  // backwards or sideways: loop underneath the nodes
  const sx = a.x + NW / 2 + k * 8, sy = a.y + NH, tx = b.x + NW / 2 + k * 8, ty = b.y + NH, drop = 50 + k * 16;
  return { d: `M${sx} ${sy} C${sx} ${sy + drop}, ${tx} ${ty + drop}, ${tx} ${ty}`, mx: (sx + tx) / 2, my: (sy + ty) / 2 + drop * 0.75 + 12 };
}

export default function StoryGraph({ graph, stale, onSelect }) {
  const [hover, setHover] = useState(null);
  const L = useMemo(() => (graph?.nodes.length ? layout(graph) : null), [graph]);

  if (!L) return <div className="graph-wrap"><p className="muted">Fix the script errors and the graph will appear here.</p></div>;

  const backCount = {};
  const edges = graph.edges.map((e) => {
    const forward = L.layerOf.get(e.to) > L.layerOf.get(e.from);
    const k = forward ? 0 : (backCount[e.from] = (backCount[e.from] ?? -1) + 1);
    return { ...e, ...route(L.pos.get(e.from), L.pos.get(e.to), forward, k, e.from === e.to) };
  });

  return (
    <div className="graph-wrap">
      {stale && <p className="issue warn">The script has errors, so this shows the last version that compiled.</p>}
      <svg width={L.width} height={L.height} role="img" aria-label="Scene graph">
        <defs>
          {['choice', 'jump'].map((k) => (
            <marker key={k} id={`arr-${k}`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto">
              <path d="M0 0L10 5L0 10z" className={`arr ${k}`} />
            </marker>
          ))}
        </defs>

        {edges.map((e, i) => (
          <g key={i} className={`gedge ${e.kind} ${hover && e.from !== hover && e.to !== hover ? 'dim' : ''}`}>
            <path d={e.d} className={e.label.startsWith('if ') ? 'cond' : ''} markerEnd={`url(#arr-${e.kind})`} />
            {e.label && <text x={e.mx} y={e.my} textAnchor="middle">{trunc(e.label, 30)}<title>{e.label}</title></text>}
          </g>
        ))}

        {graph.nodes.map((n) => {
          const p = L.pos.get(n.id);
          const cls = ['gnode', n.start && 'start', n.ends && 'end', n.deadEnd && 'dead', !n.reachable && 'orphan'].filter(Boolean).join(' ');
          return (
            <g key={n.id} className={cls} transform={`translate(${p.x} ${p.y})`} tabIndex={0} role="button"
              onClick={() => onSelect(n)} onKeyDown={(e) => e.key === 'Enter' && onSelect(n)}
              onMouseEnter={() => setHover(n.id)} onMouseLeave={() => setHover(null)}>
              <title>{`${n.id}${n.deadEnd ? ' (can run out of steps)' : ''}${n.reachable ? '' : ' (unreachable)'}`}</title>
              <rect width={NW} height={NH} rx="14" />
              <text x="12" y="25" className="gname">{trunc(n.id, 18)}</text>
              <text x="12" y="46" className="gmeta">
                {n.steps} steps{n.choices ? ` · ${n.choices} choice${n.choices > 1 ? 's' : ''}` : ''}{n.ends ? ' · END' : ''}
              </text>
              {n.start && <text x={NW - 10} y="18" textAnchor="end" className="gtag">START</text>}
            </g>
          );
        })}
      </svg>
      <p className="graph-legend">
        <span className="lg choice">gold</span> choice option · <span className="lg jump">grey</span> GOTO · dashed = conditional ·
        green outline = start · red dashes = can run out of steps · faded = unreachable · click a scene to open it
      </p>
    </div>
  );
}
