import { useMemo, useState } from 'react';

/**
 * The fold (Figure 1 of the paper, interactive). Latents z with k ≤ 2 active
 * concepts, label t = 1{z₁ > 0.5} — a linear rule in latent space. Project
 * through y = Az. With d_z = d_y the boundary stays linear; add one concept
 * beyond the activation dimension and the classes fold over each other:
 * the best achievable linear probe drops below 100%, computed live.
 */

const PURPLE = '#A855D6';
const GREEN = '#10B981';

function mulberry32(a: number) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Sample = { y: [number, number]; t: 0 | 1 };

function makeData(dz: 2 | 3, rotDeg: number) {
  const rnd = mulberry32(7);
  const rot = (rotDeg * Math.PI) / 180;
  const baseAngles = dz === 3 ? [90, 210, 330] : [90, 210];
  const cols = baseAngles.map(d => {
    const a = (d * Math.PI) / 180 + rot;
    return [Math.cos(a), Math.sin(a)] as [number, number];
  });
  const supports: number[][] = dz === 3
    ? [[0, 1], [1, 2], [0, 2]]
    : [[0], [1], [0, 1]];
  const pts: Sample[] = [];
  for (let i = 0; i < 700; i++) {
    const S = supports[i % supports.length];
    const z = new Array(dz).fill(0);
    for (const j of S) z[j] = rnd();
    const y: [number, number] = [0, 0];
    for (let j = 0; j < dz; j++) { y[0] += z[j] * cols[j][0]; y[1] += z[j] * cols[j][1]; }
    pts.push({ y, t: z[0] > 0.5 ? 1 : 0 });
  }
  return { pts, cols };
}

// best linear probe: sweep directions × thresholds
function bestLinear(pts: Sample[]) {
  let best = 0, bu: [number, number] = [1, 0], bc = 0;
  const n1 = pts.filter(s => s.t === 1).length, n0 = pts.length - n1;
  for (let d = 0; d < 120; d++) {
    const th = (d * Math.PI) / 120;
    const u: [number, number] = [Math.cos(th), Math.sin(th)];
    const proj = pts.map(s => ({ p: s.y[0] * u[0] + s.y[1] * u[1], t: s.t })).sort((a, b) => a.p - b.p);
    let c0 = 0, c1 = 0;
    for (let i = 0; i < proj.length; i++) {
      if (proj[i].t === 0) c0++; else c1++;
      const acc = Math.max((c0 + (n1 - c1)) / proj.length, (c1 + (n0 - c0)) / proj.length);
      if (acc > best) {
        best = acc; bu = u;
        bc = i + 1 < proj.length ? (proj[i].p + proj[i + 1].p) / 2 : proj[i].p;
      }
    }
  }
  return { best, u: bu, c: bc };
}

export default function TheFold() {
  const [dz, setDz] = useState<2 | 3>(3);
  const [rot, setRot] = useState(0);
  const { pts, cols } = useMemo(() => makeData(dz, rot), [dz, rot]);
  const probe = useMemo(() => bestLinear(pts), [pts]);

  const W = 320, H = 300, S = 92, cx = W / 2, cy = H / 2 + 20;
  const px = (y: [number, number]) => cx + y[0] * S;
  const py = (y: [number, number]) => cy - y[1] * S;

  // separator line: u·y = c → draw perpendicular to u through point c·u
  const { u, c } = probe;
  const mid: [number, number] = [c * u[0], c * u[1]];
  const perp: [number, number] = [-u[1], u[0]];

  const perfect = probe.best > 0.999;

  return (
    <div className="not-prose rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 my-6 text-zinc-800 dark:text-zinc-200">
      <div className="flex flex-wrap items-baseline justify-between gap-2 mb-3">
        <div className="text-sm font-semibold">The fold</div>
        <div className="text-[11px] text-zinc-400">label is linear in latent space: t = 𝟙{'{z₁ > 0.5}'} · k ≤ 2 concepts active</div>
      </div>

      <div className="flex flex-wrap gap-5">
        <div>
          <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800">
            {/* dictionary columns */}
            {cols.map((a, j) => (
              <g key={j}>
                <line x1={cx} y1={cy} x2={cx + a[0] * S} y2={cy - a[1] * S}
                  stroke="currentColor" strokeOpacity="0.35" strokeWidth="1.3" markerEnd="url(#colArrow)" />
                <text x={cx + a[0] * (S + 14)} y={cy - a[1] * (S + 14) + 3} textAnchor="middle" fontSize="10" fill="currentColor" fillOpacity="0.55">
                  a{j + 1}
                </text>
              </g>
            ))}
            <defs>
              <marker id="colArrow" markerWidth="7" markerHeight="7" refX="5" refY="2.5" orient="auto">
                <path d="M0,0 L5,2.5 L0,5 z" fill="currentColor" fillOpacity="0.4" />
              </marker>
            </defs>
            {pts.map((s, i) => (
              <circle key={i} cx={px(s.y)} cy={py(s.y)} r={2.2}
                fill={s.t ? PURPLE : GREEN} fillOpacity={0.55} />
            ))}
            {/* best linear separator */}
            <line
              x1={cx + (mid[0] + perp[0] * 2.2) * S} y1={cy - (mid[1] + perp[1] * 2.2) * S}
              x2={cx + (mid[0] - perp[0] * 2.2) * S} y2={cy - (mid[1] - perp[1] * 2.2) * S}
              stroke="currentColor" strokeWidth="1.8" strokeDasharray={perfect ? undefined : '6 4'} />
            <text x={8} y={14} fontSize="10" fill="currentColor" fillOpacity="0.5">activation space y = Az (d_y = 2)</text>
          </svg>
          <div className="text-[11px] mt-1.5 text-zinc-500 dark:text-zinc-400">
            <span style={{ color: PURPLE }}>●</span> z₁ &gt; 0.5&ensp;<span style={{ color: GREEN }}>●</span> z₁ ≤ 0.5&ensp;· black line: best linear probe
          </div>
        </div>

        <div className="flex-1 min-w-[240px]">
          <div className="text-xs text-zinc-500 dark:text-zinc-400 mb-1.5">latent concepts d_z (activation dimension stays 2)</div>
          <div className="flex gap-1.5 mb-4">
            {([2, 3] as const).map(v => (
              <button key={v} onClick={() => setDz(v)}
                className={`rounded-lg border px-3 py-1.5 text-[13px] font-medium transition-colors ${
                  dz === v ? 'border-accent-500 bg-accent-50 dark:bg-accent-950/40 text-accent-700 dark:text-accent-300'
                           : 'border-zinc-300 dark:border-zinc-700 hover:border-accent-400'}`}>
                d_z = {v} {v === 2 ? '(no superposition)' : '(overcomplete)'}
              </button>
            ))}
          </div>

          <label className="text-xs text-zinc-500 dark:text-zinc-400 block mb-1">
            rotate the mixing&ensp;<span className="font-mono">{rot}°</span>
            <span className="text-zinc-400"> (the fold is not specific to one projection)</span>
          </label>
          <input type="range" min={0} max={120} value={rot} onChange={e => setRot(+e.target.value)}
            className="w-full accent-accent-600 mb-4" />

          <div className="rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800 px-3 py-2 text-center">
            <div className="text-[10px] uppercase tracking-wide text-zinc-400">best achievable linear probe</div>
            <div className="font-mono text-2xl font-bold" style={{ color: perfect ? GREEN : '#B0356B' }}>
              {(probe.best * 100).toFixed(1)}%
            </div>
            <div className="text-[10px] text-zinc-400">exhaustive sweep over directions and thresholds</div>
          </div>
        </div>
      </div>

      <div className="mt-3 rounded-lg px-3 py-2 text-[13px] leading-relaxed"
        style={{ background: perfect ? 'rgba(16,185,129,0.08)' : 'rgba(176,53,107,0.08)' }}>
        {perfect
          ? <>With d_z = d_y the mixing is invertible. A boundary that is linear in z stays linear in y, and a probe recovers it exactly.
            In this regime, linear encoding and linear decodability coincide.</>
          : <>One concept more than the activation dimension, and regions of latent space with opposite labels stack onto
            overlapping regions of activation space. The concept is still linearly encoded, since y = Az involves nothing
            nonlinear, yet no linear readout can separate the classes.</>}
      </div>
    </div>
  );
}
