import { useEffect, useMemo, useState } from 'react';
import { emitArc } from './arc';

/**
 * "Same loss, different story" — the non-identifiability of reconstruction.
 * Phase 1 (the hunt): find the true concept axes with only the dial and the
 * loss. You can't — the loss is exactly invariant. Lock in a guess to see.
 * Phase 2: sparsity as inductive bias — works iff latents are independent
 * and sparse; prefers the wrong basis when concepts are correlated.
 * Phase 3: paired interventions (SSAE-style) put minima at the true axes,
 * up to permutation & sign — the P·Λ equivalence class, made visible.
 */

const C1 = '#4A6FA5';
const C2 = '#C07A18';
const BOTH = '#9CA3AF';
const SHIFT = '#B0356B';

type Regime = 'correlated' | 'independent';

function mulberry32(a: number) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Pt = { c: [number, number]; kind: 0 | 1 | 2 };

function makeData(regime: Regime) {
  const rnd = mulberry32(42);
  const lap = () => (rnd() < 0.5 ? -1 : 1) * -Math.log(1 - rnd()) * 0.7;
  const pts: Pt[] = [];
  const a = (38 * Math.PI) / 180;
  for (let i = 0; i < 260; i++) {
    const u = rnd();
    if (regime === 'correlated') {
      if (u < 0.15) pts.push({ c: [lap(), 0], kind: 0 });
      else if (u < 0.3) pts.push({ c: [0, lap()], kind: 1 });
      else {
        const z = lap(); const w = 0.25 * lap();
        pts.push({ c: [Math.cos(a) * z - Math.sin(a) * w, Math.sin(a) * z + Math.cos(a) * w], kind: 2 });
      }
    } else {
      if (u < 0.45) pts.push({ c: [lap(), 0], kind: 0 });
      else if (u < 0.9) pts.push({ c: [0, lap()], kind: 1 });
      else pts.push({ c: [lap(), lap()], kind: 2 });
    }
  }
  const shifts: [number, number][] = [];
  for (let i = 0; i < 300; i++) {
    const d = lap();
    shifts.push(rnd() < 0.5 ? [d, 0] : [0, d]);
  }
  return { pts, shifts };
}

function l1AtTheta(pairs: [number, number][], th: number) {
  const c = Math.cos(th), s = Math.sin(th);
  let t = 0;
  for (const [x, y] of pairs) t += Math.abs(c * x + s * y) + Math.abs(-s * x + c * y);
  return t / pairs.length;
}

type Objective = 'recon' | 'sparsity' | 'shifts';

export default function RotationDial() {
  const [deg, setDeg] = useState(24);
  const [phase, setPhase] = useState<'hunt' | 'revealed'>('hunt');
  const [regime, setRegime] = useState<Regime>('correlated');
  const [objective, setObjective] = useState<Objective>('recon');
  const { pts, shifts } = useMemo(() => makeData(regime), [regime]);

  const curves = useMemo(() => {
    const code: number[] = [], shift: number[] = [];
    for (let d = 0; d <= 180; d++) {
      const th = (d * Math.PI) / 180;
      code.push(l1AtTheta(pts.map(p => p.c), th));
      shift.push(l1AtTheta(shifts, th));
    }
    return { code, shift };
  }, [pts, shifts]);

  const th = (deg * Math.PI) / 180;
  const cos = Math.cos(th), sin = Math.sin(th);
  const codes = pts.map(p => ({
    x: cos * p.c[0] + sin * p.c[1],
    y: -sin * p.c[0] + cos * p.c[1],
    kind: p.kind,
  }));

  const codeMin = useMemo(() => curves.code.indexOf(Math.min(...curves.code)), [curves]);
  const onAxes = deg % 90 <= 4 || deg % 90 >= 86;
  const identified = objective === 'shifts' && onAxes;

  useEffect(() => { if (identified) emitArc('dial'); }, [identified]);

  const W = 250, H = 250, S = 34;
  const CW = 300, CH = 110;
  const norm = (arr: number[]) => {
    const mn = Math.min(...arr), mx = Math.max(...arr);
    return arr.map(v => (v - mn) / (mx - mn || 1));
  };
  const toPath = (arr: number[]) =>
    norm(arr).map((v, i) => `${i === 0 ? 'M' : 'L'}${(i / 180) * CW},${8 + (1 - v) * (CH - 16)}`).join('');

  const activeCurve = objective === 'sparsity' ? curves.code : curves.shift;
  const activeNorm = norm(activeCurve);
  const sparsityWorks = regime === 'independent';

  const lockGuess = () => setPhase('revealed');
  const meaning = (fx: number, fy: number) => {
    const p1 = Math.round((Math.abs(fx) / (Math.abs(fx) + Math.abs(fy))) * 100);
    return `${p1}% refusal + ${100 - p1}% politeness`;
  };

  return (
    <div className="not-prose rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 my-6 text-zinc-800 dark:text-zinc-200">
      <div className="flex flex-wrap items-baseline justify-between gap-2 mb-3">
        <div className="text-sm font-semibold">
          {phase === 'hunt' ? 'Challenge: find the true concept axes' : 'Same loss, different story'}
        </div>
        <div className="text-[11px] text-zinc-400">a toy SAE's leftover freedom · 2 concepts</div>
      </div>

      {phase === 'hunt' && (
        <p className="text-[13px] text-zinc-500 dark:text-zinc-400 mb-3">
          These are learned codes for two concepts (say <span style={{ color: C1 }}>refusal</span> and <span style={{ color: C2 }}>politeness</span>),
          in some basis the autoencoder happened to converge to. Rotate the basis until the axes align with the true concepts.
          Your only instruments: the picture and the loss.
        </p>
      )}

      <div className="flex flex-wrap gap-5">
        {/* scatter */}
        <div>
          <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800">
            <line x1={W / 2} y1={4} x2={W / 2} y2={H - 4} stroke="currentColor" strokeOpacity="0.15" />
            <line x1={4} y1={H / 2} x2={W - 4} y2={H / 2} stroke="currentColor" strokeOpacity="0.15" />
            {phase === 'revealed' && (
              <g style={{ transition: 'all 300ms' }}>
                {/* true axes appear rotated by -θ in the current learned basis */}
                <line x1={W / 2 - Math.cos(-th) * 110} y1={H / 2 + Math.sin(-th) * 110}
                  x2={W / 2 + Math.cos(-th) * 110} y2={H / 2 - Math.sin(-th) * 110}
                  stroke={C1} strokeWidth="1.5" strokeDasharray="5 4" strokeOpacity="0.8" />
                <line x1={W / 2 + Math.sin(-th) * 110} y1={H / 2 + Math.cos(-th) * 110}
                  x2={W / 2 - Math.sin(-th) * 110} y2={H / 2 - Math.cos(-th) * 110}
                  stroke={C2} strokeWidth="1.5" strokeDasharray="5 4" strokeOpacity="0.8" />
              </g>
            )}
            {codes.map((p, i) => (
              <circle key={i} cx={W / 2 + p.x * S} cy={H / 2 - p.y * S} r={2.4}
                fill={phase === 'hunt' ? BOTH : p.kind === 0 ? C1 : p.kind === 1 ? C2 : BOTH}
                fillOpacity={phase === 'hunt' ? 0.6 : 0.75} />
            ))}
            <text x={W - 8} y={H / 2 - 6} textAnchor="end" fontSize="10" fill="currentColor" fillOpacity="0.5">learned feature 1</text>
            <text x={W / 2 + 6} y={14} fontSize="10" fill="currentColor" fillOpacity="0.5">learned feature 2</text>
          </svg>
          <div className="text-[11px] mt-1.5 text-zinc-500 dark:text-zinc-400 max-w-[250px]">
            {phase === 'hunt'
              ? <><span style={{ color: BOTH }}>●</span> activations, unlabelled, as in practice</>
              : <><span style={{ color: C1 }}>●</span> concept 1 only&ensp;<span style={{ color: C2 }}>●</span> concept 2 only&ensp;<span style={{ color: BOTH }}>●</span> both&ensp;· dashed = true axes</>}
          </div>
        </div>

        {/* controls */}
        <div className="flex-1 min-w-[260px]">
          <label className="text-xs text-zinc-500 dark:text-zinc-400 block mb-1">
            rotation of the learned basis&ensp;θ = <span className="font-mono font-semibold text-zinc-800 dark:text-zinc-100">{deg}°</span>
          </label>
          <input type="range" min={0} max={180} value={deg} onChange={e => setDeg(+e.target.value)}
            className="w-full accent-accent-600" />

          <div className="grid grid-cols-2 gap-2 my-3 text-center">
            <div className="rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800 px-2 py-1.5">
              <div className="text-[10px] uppercase tracking-wide text-zinc-400">reconstruction loss</div>
              <div className="font-mono text-sm font-semibold">0.000000</div>
              <div className="text-[10px] text-zinc-400">at every θ — exactly flat</div>
            </div>
            <div className="rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800 px-2 py-1.5">
              {phase === 'hunt' ? (
                <>
                  <div className="text-[10px] uppercase tracking-wide text-zinc-400">your instruments</div>
                  <div className="text-sm font-semibold">that's it.</div>
                  <div className="text-[10px] text-zinc-400">no labels, no interventions</div>
                </>
              ) : (
                <>
                  <div className="text-[10px] uppercase tracking-wide text-zinc-400">{objective === 'shifts' ? 'ℓ₁ of encoded shifts' : objective === 'sparsity' ? 'ℓ₁ of codes' : 'objective value'}</div>
                  <div className="font-mono text-sm font-semibold">{objective === 'recon' ? '0.000000' : activeCurve[deg].toFixed(3)}</div>
                  <div className="text-[10px] text-zinc-400">
                    {objective === 'recon' ? 'flat — pick any θ' : objective === 'sparsity' ? `min at ${codeMin}° ${sparsityWorks ? '✓' : '✗'}` : 'min at 0°, 90° ✓'}
                  </div>
                </>
              )}
            </div>
          </div>

          {phase === 'hunt' ? (
            <button onClick={lockGuess}
              className="w-full rounded-lg border border-accent-500 text-accent-700 dark:text-accent-300 px-3 py-2 text-[13px] font-medium hover:bg-accent-50 dark:hover:bg-accent-950/40 transition-colors">
              lock in my guess: θ = {deg}°
            </button>
          ) : (
            <>
              <svg width="100%" viewBox={`0 0 ${CW} ${CH}`} className="rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800">
                <path d={`M0,14 L${CW},14`} stroke="#10B981" strokeWidth="1.5" strokeDasharray="4 3" />
                <text x={4} y={10} fontSize="9" fill="#10B981">reconstruction (all θ equal)</text>
                {objective !== 'recon' && (
                  <>
                    <path d={toPath(activeCurve)} fill="none" stroke={objective === 'shifts' ? SHIFT : '#71717A'} strokeWidth="1.5" />
                    <circle cx={(deg / 180) * CW} cy={8 + (1 - activeNorm[deg]) * (CH - 16)} r={4}
                      fill={objective === 'shifts' ? SHIFT : '#71717A'} />
                  </>
                )}
                {[0, 90, 180].map(d => (
                  <g key={d}>
                    <line x1={(d / 180) * CW} y1={CH - 8} x2={(d / 180) * CW} y2={CH - 3} stroke="currentColor" strokeOpacity="0.4" />
                    <text x={(d / 180) * CW + (d === 180 ? -18 : 3)} y={CH - 1} fontSize="8" fill="currentColor" fillOpacity="0.5">{d}°</text>
                  </g>
                ))}
              </svg>

              <div className="flex flex-wrap gap-1.5 mt-2">
                {(['recon', 'sparsity', 'shifts'] as const).map(o => (
                  <button key={o} onClick={() => setObjective(o)}
                    className={`rounded-full px-2.5 py-1 text-[11px] font-medium border transition-colors ${
                      objective === o ? 'border-accent-500 text-accent-700 dark:text-accent-300 bg-accent-50 dark:bg-accent-950/40'
                                      : 'border-zinc-200 dark:border-zinc-700 text-zinc-400 hover:border-accent-300'}`}>
                    {o === 'recon' ? 'reconstruction only' : o === 'sparsity' ? '+ ℓ₁ on codes' : '+ paired interventions'}
                  </button>
                ))}
                <button onClick={() => { setRegime(r => r === 'correlated' ? 'independent' : 'correlated'); }}
                  className="ml-auto rounded-full px-2.5 py-1 text-[11px] font-medium border border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:border-accent-300 transition-colors">
                  data: {regime} ⇄
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="mt-3 rounded-lg px-3 py-2 text-[13px] leading-relaxed"
        style={{ background: identified ? 'rgba(16,185,129,0.08)' : 'rgba(113,113,122,0.08)' }}>
        {phase === 'hunt' && (
          <>At the current rotation, learned feature 1 reads as <em>{meaning(cos, sin)}</em>. Every θ reconstructs the data
          exactly, so the objective is silent. When you are ready, lock in a guess.</>
        )}
        {phase === 'revealed' && objective === 'recon' && (
          <>{onAxes ? <><strong>You landed on the true axes.</strong> Note that the loss was identical everywhere, so nothing in the objective told you this was the right answer.</>
            : <><strong>You missed{Math.min(deg % 90, 90 - (deg % 90)) > 20 ? ' by a wide margin' : ''}</strong>, and nothing in the loss could have told you. This is Hyvärinen and Pajunen (1999). Without additional structure, every rotation is an equally good solution.</>}
          {' '}Now add structure with the objective buttons.</>
        )}
        {phase === 'revealed' && objective === 'sparsity' && sparsityWorks && (
          <><strong>Sparsity works here.</strong> The minima sit at 0° and 90° because these latents are independent and sparse.
          Sparsity is an assumption about the data, and when it holds, ℓ₁ identifies the axes. Now switch the data to <em>correlated</em>.</>
        )}
        {phase === 'revealed' && objective === 'sparsity' && !sparsityWorks && (
          <><strong>Sparsity prefers θ ≈ {codeMin}°, the wrong basis.</strong> These concepts co-occur, as real concepts do, and ℓ₁ favours
          the correlation direction of the data over the true axes. The same objective that worked on independent data fails here,
          and the loss value alone gives no warning.</>
        )}
        {phase === 'revealed' && objective === 'shifts' && !identified && (
          <>With paired samples in which one concept changes at a time, encoded shifts are 1-sparse only in the right basis,
          in both data regimes. The objective now has minima at 0° and 90°. Drag θ there.</>
        )}
        {identified && (
          <><strong>Identified.</strong> At θ ∈ {'{0°, 90°}'} the axes are recovered up to permutation and sign,
          the ĉ = <strong>P Λ</strong> c equivalence class. The remaining ambiguity is harmless relabelling. Unlike sparsity,
          this holds whether or not the concepts correlate.</>
        )}
      </div>

      <details className="mt-3 text-[12px] text-zinc-500 dark:text-zinc-400">
        <summary className="cursor-pointer font-medium text-zinc-600 dark:text-zinc-300">The exact generative process (check our work)</summary>
        <div className="mt-1.5 leading-relaxed space-y-1">
          <p><strong>Latents.</strong> Laplace magnitudes (scale 0.7, seeded PRNG, n=260). <em>Correlated regime:</em> 15% concept-1 only,
          15% concept-2 only, 70% co-occurring along the 38° direction with orthogonal jitter 0.25. <em>Independent regime:</em> 45% / 45% / 10% with independent magnitudes.</p>
          <p><strong>Mixing & encoder.</strong> x = A·c with A invertible; the encoder family is R(θ)⁻¹A⁻¹, decoder A·R(θ) — so x̂ = x exactly and reconstruction
          is invariant in θ (footnote 4 of the paper: any invertible v gives (v∘φ, ψ∘v⁻¹) the same objective value).</p>
          <p><strong>Objectives.</strong> ℓ₁(codes) = mean |R(−θ)c|₁; ℓ₁(shifts) = mean |R(−θ)Δ|₁ over 300 pairs with 1-sparse Δ, one concept changing per pair (Joshi et al. 2025).</p>
        </div>
      </details>
    </div>
  );
}
