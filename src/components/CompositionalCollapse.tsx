import { useMemo, useState } from 'react';

/**
 * Compositional collapse (Figure 2 + Figure 4 of the paper). Training data
 * covers the concept pairs (z₁,z₂) and (z₂,z₃); the pair (z₁,z₃) is withheld.
 * A logistic probe trained live on the in-distribution activations reaches
 * ~99% — then the withheld combination arrives.
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

const ANGLES = [90, 210, 330].map(d => (d * Math.PI) / 180);
const COLS = ANGLES.map(a => [Math.cos(a), Math.sin(a)] as [number, number]);

type Sample = { z: number[]; y: [number, number]; t: 0 | 1 };

function proj(z: number[]): [number, number] {
  const y: [number, number] = [0, 0];
  for (let j = 0; j < 3; j++) { y[0] += z[j] * COLS[j][0]; y[1] += z[j] * COLS[j][1]; }
  return y;
}

function makeAll(seed: number) {
  const rnd = mulberry32(seed);
  const mk = (S: number[]): Sample => {
    const z = [0, 0, 0];
    for (const j of S) z[j] = rnd();
    return { z, y: proj(z), t: z[0] > 0.5 ? 1 : 0 };
  };
  const id: Sample[] = [], ood: Sample[] = [];
  for (let i = 0; i < 500; i++) id.push(mk(i % 2 ? [0, 1] : [1, 2]));
  for (let i = 0; i < 300; i++) ood.push(mk([0, 2]));
  return { id, ood };
}

function trainProbe(data: Sample[]) {
  let w: [number, number] = [0, 0], b = 0;
  for (let e = 0; e < 800; e++) {
    let g0 = 0, g1 = 0, gb = 0;
    for (const s of data) {
      const p = 1 / (1 + Math.exp(-(w[0] * s.y[0] + w[1] * s.y[1] + b)));
      const d = p - s.t;
      g0 += d * s.y[0]; g1 += d * s.y[1]; gb += d;
    }
    w[0] -= (2 * g0) / data.length; w[1] -= (2 * g1) / data.length; b -= (2 * gb) / data.length;
  }
  return { w, b };
}

export default function CompositionalCollapse() {
  const [seed, setSeed] = useState(7);
  const [deployed, setDeployed] = useState(false);
  const { id, ood } = useMemo(() => makeAll(seed), [seed]);
  const probe = useMemo(() => trainProbe(id), [id]);

  const classify = (s: Sample) => (probe.w[0] * s.y[0] + probe.w[1] * s.y[1] + probe.b > 0 ? 1 : 0);
  const idAcc = useMemo(() => id.filter(s => classify(s) === s.t).length / id.length, [id, probe]);
  const oodAcc = useMemo(() => ood.filter(s => classify(s) === s.t).length / ood.length, [ood, probe]);

  const W = 320, H = 300, S = 92, cx = W / 2, cy = H / 2 + 20;
  const px = (y: [number, number]) => cx + y[0] * S;
  const py = (y: [number, number]) => cy - y[1] * S;

  // boundary: w·y + b = 0
  const wn = Math.hypot(probe.w[0], probe.w[1]) || 1;
  const u: [number, number] = [probe.w[0] / wn, probe.w[1] / wn];
  const mid: [number, number] = [(-probe.b / wn) * u[0], (-probe.b / wn) * u[1]];
  const perp: [number, number] = [-u[1], u[0]];

  return (
    <div className="not-prose rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 my-6 text-zinc-800 dark:text-zinc-200">
      <div className="flex flex-wrap items-baseline justify-between gap-2 mb-3">
        <div className="text-sm font-semibold">A probe meets a novel combination</div>
        <div className="text-[11px] text-zinc-400">trained on (z₁,z₂) and (z₂,z₃) · withheld: (z₁,z₃) · probe fits live</div>
      </div>

      <div className="flex flex-wrap gap-5">
        <div>
          <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800">
            {id.map((s, i) => (
              <circle key={i} cx={px(s.y)} cy={py(s.y)} r={2.2}
                fill={s.t ? PURPLE : GREEN} fillOpacity={deployed ? 0.25 : 0.55} />
            ))}
            {deployed && ood.map((s, i) => {
              const wrong = classify(s) !== s.t;
              return (
                <g key={`o${i}`}>
                  <rect x={px(s.y) - 2.6} y={py(s.y) - 2.6} width={5.2} height={5.2}
                    transform={`rotate(45 ${px(s.y)} ${py(s.y)})`}
                    fill={s.t ? PURPLE : GREEN} fillOpacity={0.85} />
                  {wrong && <circle cx={px(s.y)} cy={py(s.y)} r={5.5} fill="none" stroke="#EF4444" strokeWidth="1.2" />}
                </g>
              );
            })}
            <line
              x1={cx + (mid[0] + perp[0] * 2.4) * S} y1={cy - (mid[1] + perp[1] * 2.4) * S}
              x2={cx + (mid[0] - perp[0] * 2.4) * S} y2={cy - (mid[1] - perp[1] * 2.4) * S}
              stroke="currentColor" strokeWidth="1.8" />
            <text x={8} y={14} fontSize="10" fill="currentColor" fillOpacity="0.5">activation space · black line: the trained probe</text>
          </svg>
          <div className="text-[11px] mt-1.5 text-zinc-500 dark:text-zinc-400 max-w-[320px]">
            <span style={{ color: PURPLE }}>●</span> z₁ &gt; 0.5&ensp;<span style={{ color: GREEN }}>●</span> z₁ ≤ 0.5&ensp;
            {deployed && <>· ◆ withheld combination · <span className="text-red-500">○</span> misclassified</>}
          </div>
        </div>

        <div className="flex-1 min-w-[240px]">
          <div className="grid grid-cols-2 gap-2 mb-3">
            <div className="rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800 px-2.5 py-2 text-center">
              <div className="text-[10px] uppercase tracking-wide text-zinc-400">in-distribution accuracy</div>
              <div className="font-mono text-xl font-bold" style={{ color: GREEN }}>{(idAcc * 100).toFixed(1)}%</div>
            </div>
            <div className="rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800 px-2.5 py-2 text-center">
              <div className="text-[10px] uppercase tracking-wide text-zinc-400">withheld combination</div>
              <div className="font-mono text-xl font-bold" style={{ color: deployed ? '#B0356B' : undefined }}>
                {deployed ? `${(oodAcc * 100).toFixed(1)}%` : '—'}
              </div>
            </div>
          </div>

          <button onClick={() => setDeployed(true)} disabled={deployed}
            className="w-full rounded-lg border border-accent-500 text-accent-700 dark:text-accent-300 px-3 py-2 text-[13px] font-medium hover:bg-accent-50 dark:hover:bg-accent-950/40 disabled:opacity-50 transition-colors">
            evaluate on the withheld combination (z₁, z₃)
          </button>
          <button onClick={() => { setSeed(s => s + 1); setDeployed(false); }}
            className="mt-1.5 w-full rounded-lg border border-zinc-200 dark:border-zinc-700 px-3 py-1.5 text-[12px] text-zinc-500 hover:border-accent-300 transition-colors">
            resample data & retrain
          </button>

          <p className="text-[12px] text-zinc-500 dark:text-zinc-400 mt-3 leading-relaxed">
            The label depends only on z₁, but in training z₁ only ever appears alongside z₂. The probe is free to lean
            on that co-occurrence, and gradient descent takes the shortcut.
          </p>
        </div>
      </div>

      {deployed && (
        <div className="mt-3 rounded-lg px-3 py-2 text-[13px] leading-relaxed" style={{ background: 'rgba(176,53,107,0.08)' }}>
          The boundary did not move. The data did. On the withheld support, the evidence for z₁ arrives mixed with a₃
          instead of a₂ and lands on the wrong side of a hyperplane that was optimal in distribution. In-distribution
          accuracy carries no warning, because the failure only exists where the composition shifts.
        </div>
      )}
    </div>
  );
}
