import { useState } from 'react';

/**
 * The eight estimand–evidence gaps (Table 2 of arXiv:2602.16698),
 * as expandable cards: implied claim vs. what the evidence supports.
 */

const GAPS: { name: string; implied: string; actual: string }[] = [
  {
    name: 'Existence → Uniqueness',
    implied: 'This is THE circuit causing the behaviour.',
    actual: 'A circuit aligned with the behaviour was found; the solution is generically non-unique — other circuits can implement equivalent input–output behaviour.',
  },
  {
    name: 'Correlation → Causation',
    implied: 'This feature causally mediates the behaviour.',
    actual: 'Without targeted interventions, feature and concept are only correlated — possibly through a confounder rather than a causal pathway.',
  },
  {
    name: 'Decodability → Model Use',
    implied: 'The model represents and computes with concept c.',
    actual: 'A probe can decode c from activations. That does not imply the model\'s computations depend on c — the information may be present but unused.',
  },
  {
    name: 'Local Sensitivity → Global Causal Role',
    implied: 'The mechanism generalises beyond tested prompts.',
    actual: 'Sensitivity holds for specific inputs; local attributions are input-dependent and may not transfer to held-out distributions.',
  },
  {
    name: 'Subspace → Direction',
    implied: 'Concept c is encoded along this single direction.',
    actual: 'Probes recover the most predictive direction in their training data; the concept may occupy a subspace, each probe a valid lossy projection of it.',
  },
  {
    name: 'Sufficiency → Necessity',
    implied: 'This component is necessary for the behaviour.',
    actual: 'The intervention was sufficient to produce the effect; alternative pathways for the same behaviour may exist (and often do).',
  },
  {
    name: 'Low Loss → Identifiability',
    implied: 'The canonical factorisation has been recovered.',
    actual: 'The objective identifies a solution only up to an equivalence class; without structural constraints, unsupervised methods cannot pin down a unique factorisation.',
  },
  {
    name: 'Alignment → Ontological Identity',
    implied: 'This feature IS honesty.',
    actual: 'The feature aligns with "honesty" labels under one contrast set; under a different contrast set the same feature may earn a different name.',
  },
];

export default function GapTaxonomy() {
  const [open, setOpen] = useState<number | null>(2);
  return (
    <div className="not-prose my-6 grid gap-2 sm:grid-cols-2">
      {GAPS.map((g, i) => {
        const isOpen = open === i;
        return (
          <button key={i} onClick={() => setOpen(isOpen ? null : i)} aria-expanded={isOpen}
            className={`text-left rounded-xl border p-3 transition-colors ${
              isOpen ? 'border-accent-400 bg-accent-50/60 dark:bg-accent-950/30 sm:col-span-2'
                     : 'border-zinc-200 dark:border-zinc-800 hover:border-accent-300 bg-white dark:bg-zinc-900'}`}>
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-[13px] font-semibold text-zinc-900 dark:text-zinc-100">{g.name}</span>
              <span className="text-[11px] text-zinc-400">{isOpen ? '−' : '+'}</span>
            </div>
            <div className="text-[12px] mt-1" style={{ color: '#B0356B' }}>
              <span className="font-semibold uppercase text-[10px] tracking-wide">implied&ensp;</span>
              "{g.implied}"
            </div>
            {isOpen && (
              <div className="text-[12px] mt-1.5 text-zinc-600 dark:text-zinc-300 leading-relaxed">
                <span className="font-semibold uppercase text-[10px] tracking-wide" style={{ color: '#C07A18' }}>actual scope&ensp;</span>
                {g.actual}
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}
