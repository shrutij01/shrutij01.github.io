import { useState } from 'react';
import { emitArc } from './arc';

/**
 * The causal ladder, claim-first: three experiment vignettes; place each on
 * the rung its evidence lives on, then explore freely. The hypothesis cloud
 * shrinks as you climb — what remains is the equivalence class.
 */

const RUNGS = [
  {
    id: 1,
    badge: 'L1 · Association',
    color: '#4A6FA5',
    tint: 'rgba(74,111,165,0.10)',
    question: 'Do activations correlate with refusal?',
    method: 'probes, correlations, auto-interp scores',
  },
  {
    id: 2,
    badge: 'L2 · Interventional',
    color: '#C07A18',
    tint: 'rgba(192,122,24,0.10)',
    question: 'Can we induce refusal by manipulating activations?',
    method: 'ablations, activation patching, steering',
  },
  {
    id: 3,
    badge: 'L3 · Counterfactual',
    color: '#B0356B',
    tint: 'rgba(176,53,107,0.10)',
    question: 'For this jailbroken prompt, what change would have caused refusal?',
    method: 'structural models, interchange interventions',
  },
] as const;

const QUIZ: { vignette: string; correct: 1 | 2 | 3; note: string }[] = [
  {
    vignette: 'We trained a linear probe on layer-8 activations; it predicts refusal at 98% accuracy on held-out prompts.',
    correct: 1,
    note: 'Forward passes only, with no manipulation. However high the accuracy, this is observation. The probe may read the concept or anything that co-varies with it.',
  },
  {
    vignette: 'We patched head 9.6’s activation in from a corrupted run; the output flipped from "John" to "Mary" on 78% of test prompts.',
    correct: 2,
    note: 'The experimenter set the value, which makes the evidence interventional. It licenses "patching this head changes the output under these conditions" and nothing about the head being the mechanism.',
  },
  {
    vignette: 'Had layer 5 taken the value from the Colosseum prompt on this exact forward pass, the model would have output "Rome".',
    correct: 3,
    note: 'A same-instance "would have" is counterfactual. It requires abduction, action, and prediction under a structural model, which the ability to patch does not provide on its own.',
  },
];

export default function CausalLadderDemo() {
  const [rung, setRung] = useState<1 | 2 | 3>(1);
  const [phase, setPhase] = useState<'quiz' | 'free'>('quiz');
  const [qi, setQi] = useState(0);
  const [answered, setAnswered] = useState<1 | 2 | 3 | null>(null);
  const [score, setScore] = useState(0);

  const active = RUNGS[rung - 1];
  const q = QUIZ[qi];

  const pick = (id: 1 | 2 | 3) => {
    if (phase === 'free') { setRung(id); return; }
    if (answered) return;
    setAnswered(id);
    setRung(q.correct); // cloud shows the true rung
    if (id === q.correct) setScore(s => s + 1);
  };

  const next = () => {
    if (qi + 1 >= QUIZ.length) { setPhase('free'); emitArc('ladder'); }
    else { setQi(i => i + 1); setAnswered(null); }
  };

  const replay = () => { setPhase('quiz'); setQi(0); setAnswered(null); setScore(0); setRung(1); };

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

  return (
    <div className="not-prose my-8 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 p-4 sm:p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2 mb-4">
        <div className="text-[11px] font-semibold tracking-widest uppercase text-zinc-400 dark:text-zinc-500">
          {phase === 'quiz' ? 'Place the evidence on its rung' : 'Pick the rung your evidence lives on'}
        </div>
        {phase === 'quiz'
          ? <div className="text-[11px] text-zinc-400">experiment {qi + 1}/{QUIZ.length} · score <span className="font-mono">{score}</span></div>
          : <button onClick={replay} className="text-[11px] text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors">replay the quiz</button>}
      </div>

      {phase === 'quiz' && (
        <div className="rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 px-3 py-2.5 mb-3 text-[13.5px] leading-relaxed">
          “{q.vignette}”
          <span className="block text-[11px] text-zinc-400 mt-1">Which rung does this evidence live on?</span>
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-4">
        {/* rung cards */}
        <div className="flex flex-col gap-2">
          {RUNGS.map(r => {
            const isSelected = phase === 'free' ? rung === r.id : answered === r.id;
            const isCorrect = phase === 'quiz' && answered !== null && r.id === q.correct;
            const isWrongPick = phase === 'quiz' && answered === r.id && answered !== q.correct;
            return (
              <button
                key={r.id}
                onClick={() => pick(r.id)}
                aria-pressed={isSelected}
                className="text-left rounded-lg border px-3 py-2.5 transition-all duration-200"
                style={{
                  borderColor: isCorrect ? '#10B981' : isWrongPick ? '#EF4444' : isSelected || (phase === 'free' && rung === r.id) ? r.color : 'rgba(128,128,140,0.25)',
                  background: (phase === 'free' && rung === r.id) || isCorrect ? r.tint : 'transparent',
                  boxShadow: isCorrect ? '0 0 0 1px #10B981' : isWrongPick ? '0 0 0 1px #EF4444' : (phase === 'free' && rung === r.id) ? `0 0 0 1px ${r.color}` : 'none',
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
            );
          })}
        </div>

        {/* hypothesis cloud */}
        <div className="flex flex-col">
          <div className="text-[11px] font-semibold tracking-widest uppercase text-zinc-400 dark:text-zinc-500 mb-2 text-center">
            Answers consistent with the evidence
          </div>
          <svg viewBox="0 0 296 190" className="w-full flex-1" role="img"
            aria-label={`Hypothesis cloud at ${active.badge}`}>
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
        </div>
      </div>

      {phase === 'quiz' && answered !== null && (
        <div className="mt-3 rounded-lg px-3 py-2 text-[13px] leading-relaxed"
          style={{ background: answered === q.correct ? 'rgba(16,185,129,0.08)' : 'rgba(176,53,107,0.08)' }}>
          <strong>{answered === q.correct ? 'Right' : `It's ${RUNGS[q.correct - 1].badge}`}.</strong> {q.note}
          <button onClick={next} className="mt-2 block rounded-lg border border-accent-500 text-accent-700 dark:text-accent-300 px-3 py-1 text-[12px] font-medium hover:bg-accent-50 dark:hover:bg-accent-950/40 transition-colors">
            {qi + 1 >= QUIZ.length ? 'explore freely →' : 'next experiment →'}
          </button>
        </div>
      )}

      {phase === 'free' && (
        <div
          className="mt-4 rounded-lg px-3 py-2 text-[13px] transition-opacity duration-500 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700"
          style={{ opacity: rung === 3 ? 1 : 0.45 }}
        >
          <span className="font-bold tracking-wide text-accent-700 dark:text-accent-400">IDENTIFIABILITY</span>
          <span className="text-zinc-600 dark:text-zinc-300"> · Under what conditions are the learned answers unique? Even L3 evidence pins the answer only to an equivalence class — say which one.</span>
        </div>
      )}
    </div>
  );
}
