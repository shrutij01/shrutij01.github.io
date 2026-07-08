import { useEffect, useState } from 'react';
import { ARC_STEPS, completedSteps, resetArc, type ArcStep } from './arc';

/**
 * The narrative thread: four stations, completed by interacting with the
 * demos downstream. variant="tracker" renders the strip; variant="finale"
 * stays silent until all four are done, then delivers the payoff.
 */

export default function ArcProgress({ variant = 'tracker' }: { variant?: 'tracker' | 'finale' }) {
  const [done, setDone] = useState<ArcStep[]>([]);

  useEffect(() => {
    setDone(completedSteps());
    const onStep = () => setDone([...completedSteps()]);
    window.addEventListener('arc:step', onStep);
    return () => window.removeEventListener('arc:step', onStep);
  }, []);

  const allDone = ARC_STEPS.every(s => done.includes(s.id));

  if (variant === 'finale') {
    if (!allDone) return null;
    return (
      <div className="not-prose rounded-xl border border-emerald-300 dark:border-emerald-900 bg-emerald-50/60 dark:bg-emerald-950/30 px-5 py-4 my-6 text-[14px] leading-relaxed text-zinc-800 dark:text-zinc-200">
        <div className="text-[11px] font-semibold tracking-widest uppercase text-emerald-700 dark:text-emerald-400 mb-1">all four complete</div>
        You have now worked through the full framework. A good next step is to run the checklist on your own most recent abstract.
        <button onClick={resetArc} className="block mt-2 text-[11px] text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors">reset the trail</button>
      </div>
    );
  }

  return (
    <div className="not-prose rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 px-4 py-3 my-6">
      <div className="text-[11px] font-semibold tracking-widest uppercase text-zinc-400 dark:text-zinc-500 mb-2">
        Four exercises
      </div>
      <div className="flex flex-wrap items-center gap-x-1 gap-y-2">
        {ARC_STEPS.map((s, i) => {
          const isDone = done.includes(s.id);
          return (
            <span key={s.id} className="flex items-center gap-1">
              <span className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-medium border transition-colors ${
                isDone ? 'border-emerald-400/60 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                       : 'border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400'}`}>
                <span className={`inline-block w-3.5 h-3.5 rounded-full text-[9px] leading-[14px] text-center font-bold ${
                  isDone ? 'bg-emerald-500 text-white' : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-500 dark:text-zinc-300'}`}>
                  {isDone ? '✓' : i + 1}
                </span>
                {s.label}
              </span>
              {i < ARC_STEPS.length - 1 && <span className="text-zinc-300 dark:text-zinc-600 text-[11px]">→</span>}
            </span>
          );
        })}
      </div>
    </div>
  );
}
