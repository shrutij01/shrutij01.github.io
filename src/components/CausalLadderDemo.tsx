import { useState } from 'react';

/**
 * Interactive version of the paper's ladder animation:
 * pick the rung your evidence lives on; the cloud of answers
 * consistent with that evidence shrinks as you climb.
 */

const RUNGS = [
  {
    id: 1,
    badge: 'L1 · Association',
    color: '#4A6FA5',
    tint: 'rgba(74,111,165,0.10)',
    question: 'Do activations correlate with refusal?',
    method: 'probes, correlations, auto-interp scores',
    answers: 'many',
  },
  {
    id: 2,
    badge: 'L2 · Interventional',
    color: '#C07A18',
    tint: 'rgba(192,122,24,0.10)',
    question: 'Can we induce refusal by manipulating activations?',
    method: 'ablations, activation patching, steering',
    answers: 'fewer',
  },
  {
    id: 3,
    badge: 'L3 · Counterfactual',
    color: '#B0356B',
    tint: 'rgba(176,53,107,0.10)',
    question: 'For this jailbroken prompt, what change would have caused refusal?',
    method: 'structural models, interchange interventions',
    answers: 'unique, up to ~',
  },
] as const;

// Fixed dot cloud. survivesAt = highest rung at which this hypothesis
// is still consistent with the evidence (3 ⊂ 2 ⊂ 1).
const DOTS: { x: number; y: number; r: number; survivesAt: 1 | 2 | 3 }[] = [
  { x: 30, y: 38, r: 5, survivesAt: 1 }, { x: 52, y: 22, r: 7, survivesAt: 1 },
  { x: 78, y: 55, r: 4, survivesAt: 1 }, { x: 110, y: 25, r: 6, survivesAt: 1 },
  { x: 140, y: 48, r: 5, survivesAt: 1 }, { x: 176, y: 30, r: 4, survivesAt: 1 },
  { x: 205, y: 58, r: 6, survivesAt: 1 }, { x: 236, y: 24, r: 5, survivesAt: 1 },
  { x: 258, y: 62, r: 4, survivesAt: 1 }, { x: 24, y: 96, r: 4, survivesAt: 1 },
  { x: 60, y: 118, r: 6, survivesAt: 1 }, { x: 92, y: 88, r: 5, survivesAt: 1 },
  { x: 250, y: 108, r: 6, survivesAt: 1 }, { x: 272, y: 86, r: 4, survivesAt: 1 },
  { x: 40, y: 156, r: 5, survivesAt: 1 },
  { x: 120, y: 122, r: 6, survivesAt: 2 }, { x: 152, y: 92, r: 5, survivesAt: 2 },
  { x: 188, y: 118, r: 7, survivesAt: 2 }, { x: 214, y: 90, r: 4, survivesAt: 2 },
  { x: 108, y: 158, r: 4, survivesAt: 2 }, { x: 226, y: 150, r: 5, survivesAt: 2 },
  { x: 148, y: 128, r: 7, survivesAt: 3 }, { x: 168, y: 144, r: 6, survivesAt: 3 },
  { x: 158, y: 112, r: 5, survivesAt: 3 },
];

export default function CausalLadderDemo() {
  const [rung, setRung] = useState<1 | 2 | 3>(1);
  const active = RUNGS[rung - 1];
  const alive = DOTS.filter(d => d.survivesAt >= rung).length;

  return (
    <div className="not-prose my-8 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 p-4 sm:p-6">
      <div className="text-[11px] font-semibold tracking-widest uppercase text-zinc-400 dark:text-zinc-500 mb-4">
        Pick the rung your evidence lives on
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {/* rung cards */}
        <div className="flex flex-col gap-2">
          {RUNGS.map(r => (
            <button
              key={r.id}
              onClick={() => setRung(r.id)}
              aria-pressed={rung === r.id}
              className="text-left rounded-lg border px-3 py-2.5 transition-all duration-200"
              style={{
                borderColor: rung === r.id ? r.color : 'rgba(128,128,140,0.25)',
                background: rung === r.id ? r.tint : 'transparent',
                boxShadow: rung === r.id ? `0 0 0 1px ${r.color}` : 'none',
              }}
            >
              <span
                className="inline-block text-[10px] font-bold tracking-wide rounded-full px-2 py-0.5 mb-1"
                style={{ color: r.color, border: `1px solid ${r.color}55`, background: 'rgba(255,255,255,0.55)' }}
              >
                {r.badge}
              </span>
              <div className="text-[13px] leading-snug text-zinc-800 dark:text-zinc-200">{r.question}</div>
              <div className="text-[11px] mt-0.5 text-zinc-400 dark:text-zinc-500">{r.method}</div>
            </button>
          ))}
        </div>

        {/* hypothesis cloud */}
        <div className="flex flex-col">
          <div className="text-[11px] font-semibold tracking-widest uppercase text-zinc-400 dark:text-zinc-500 mb-2 text-center">
            Answers consistent with the evidence
          </div>
          <svg viewBox="0 0 296 190" className="w-full flex-1" role="img"
            aria-label={`Hypothesis cloud at ${active.badge}: ${active.answers} answers remain`}>
            {DOTS.map((d, i) => {
              const survives = d.survivesAt >= rung;
              return (
                <circle
                  key={i}
                  cx={d.x}
                  cy={d.y}
                  r={survives ? d.r : d.r * 0.75}
                  fill={survives ? '#8F7BC4' : 'currentColor'}
                  className="text-zinc-200 dark:text-zinc-700"
                  style={{ transition: 'all 500ms ease', opacity: survives ? 1 : 0.35 }}
                />
              );
            })}
          </svg>
          <div className="text-center text-[13px] mt-2 text-zinc-600 dark:text-zinc-300">
            <span className="font-semibold" style={{ color: active.color }}>{alive}</span> hypotheses remain — {active.answers}
          </div>
        </div>
      </div>

      {/* identifiability strip */}
      <div
        className="mt-4 rounded-lg px-3 py-2 text-[13px] transition-opacity duration-500 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700"
        style={{ opacity: rung === 3 ? 1 : 0.45 }}
      >
        <span className="font-bold tracking-wide text-accent-700 dark:text-accent-400">IDENTIFIABILITY</span>
        <span className="text-zinc-600 dark:text-zinc-300"> · Under what conditions are the learned answers unique (up to ~)? Even L3 evidence pins the answer only up to an equivalence class — say which one.</span>
      </div>
    </div>
  );
}
