import { useState } from 'react';

/**
 * "Diagnose your claim" — interactive version of the paper's
 * Interpretability Claims Checklist (§G.6, arXiv:2602.16698).
 */

type Rung = 1 | 2 | 3;
const RUNG_NAME: Record<Rung, string> = { 1: 'L1 · associational', 2: 'L2 · interventional', 3: 'L3 · counterfactual' };
const RUNG_COLOR: Record<Rung, string> = { 1: '#4A6FA5', 2: '#C07A18', 3: '#B0356B' };

const CLAIM_OPTS: { rung: Rung; label: string; hint: string }[] = [
  { rung: 1, label: '“encodes” / “correlates with” / “is decodable”', hint: 'an associational commitment' },
  { rung: 2, label: '“causes” / “mediates” / “controls”', hint: 'an interventional commitment' },
  { rung: 3, label: '“THE circuit” / “would have changed” / “means”', hint: 'uniqueness or counterfactuals — the strongest commitment' },
];
const METHOD_OPTS: { rung: Rung; label: string; hint: string }[] = [
  { rung: 1, label: 'probing, correlation, auto-interp scores', hint: 'observational data only' },
  { rung: 2, label: 'ablation, activation patching, steering', hint: 'controlled manipulation' },
  { rung: 3, label: 'interchange interventions under a structural model', hint: 'requires stating what is held fixed' },
];

function Chip({ text, color }: { text: string; color: string }) {
  return (
    <span className="inline-block text-[11px] font-bold rounded-full px-2 py-0.5 mr-1.5 mb-1"
      style={{ color, border: `1px solid ${color}55`, background: `${color}14` }}>
      {text}
    </span>
  );
}

function OptionGroup<T extends { label: string; hint: string }>(
  { options, value, onPick }: { options: T[]; value: T | null; onPick: (o: T) => void }
) {
  return (
    <div className="flex flex-col gap-1.5">
      {options.map((o, i) => (
        <button key={i} onClick={() => onPick(o)} aria-pressed={value === o}
          className={`text-left rounded-lg border px-3 py-2 text-[13px] transition-colors ${
            value === o
              ? 'border-accent-500 bg-accent-50 dark:bg-accent-950/40 text-zinc-900 dark:text-zinc-100'
              : 'border-zinc-200 dark:border-zinc-700 hover:border-accent-300 text-zinc-700 dark:text-zinc-300'
          }`}>
          <div>{o.label}</div>
          <div className="text-[11px] text-zinc-400 dark:text-zinc-500">{o.hint}</div>
        </button>
      ))}
    </div>
  );
}

function YesNo({ value, onPick, yes, no }: { value: boolean | null; onPick: (v: boolean) => void; yes: string; no: string }) {
  return (
    <div className="flex gap-2">
      {[{ v: true, t: yes }, { v: false, t: no }].map(({ v, t }) => (
        <button key={String(v)} onClick={() => onPick(v)} aria-pressed={value === v}
          className={`flex-1 rounded-lg border px-3 py-2 text-[13px] transition-colors ${
            value === v
              ? 'border-accent-500 bg-accent-50 dark:bg-accent-950/40 text-zinc-900 dark:text-zinc-100'
              : 'border-zinc-200 dark:border-zinc-700 hover:border-accent-300 text-zinc-700 dark:text-zinc-300'
          }`}>
          {t}
        </button>
      ))}
    </div>
  );
}

function Step({ n, title, children, active }: { n: number; title: string; children: React.ReactNode; active: boolean }) {
  return (
    <div className={`transition-opacity duration-300 ${active ? 'opacity-100' : 'opacity-35 pointer-events-none'}`}>
      <div className="text-[13px] font-semibold text-zinc-800 dark:text-zinc-200 mb-2">
        <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-accent-600 text-white text-[11px] font-bold mr-2">{n}</span>
        {title}
      </div>
      {children}
    </div>
  );
}

export default function ClaimDiagnosis() {
  const [claim, setClaim] = useState<(typeof CLAIM_OPTS)[number] | null>(null);
  const [method, setMethod] = useState<(typeof METHOD_OPTS)[number] | null>(null);
  const [alternatives, setAlternatives] = useState<boolean | null>(null);
  const [scope, setScope] = useState<boolean | null>(null);

  const done = claim && method && alternatives !== null && scope !== null;
  const gap = claim && method ? claim.rung - method.rung : 0;

  const verdicts: { kind: 'fail' | 'warn' | 'pass'; title: string; body: string }[] = [];
  if (done) {
    if (gap > 0) {
      verdicts.push({
        kind: 'fail',
        title: `Rung gap: claim is ${RUNG_NAME[claim!.rung]}, evidence is ${RUNG_NAME[method!.rung]}`,
        body: method!.rung === 1
          ? 'Either strengthen the method — add interventions (ablate, patch, steer) — or weaken the verb: “correlates with”, not “implements”.'
          : 'Counterfactual and uniqueness claims need a structural model stating what is held fixed, or a weaker verb: “is sufficient to shift”, not “THE circuit”.',
      });
    } else {
      verdicts.push({ kind: 'pass', title: 'Rung check passes', body: 'Evidence rung ≥ claim rung. The claim verbs match what the experiment can license.' });
    }
    verdicts.push(alternatives
      ? { kind: 'pass', title: 'Alternatives addressed', body: 'You state what would count as an equally-good explanation and have tested against it.' }
      : { kind: 'fail', title: 'Identification gap', body: 'Nothing rules out alternatives: other directions or circuits may produce the same evidence (probes can exploit token length; other components can match the patching effect). Name the equivalence class; vary seeds, decompositions, and ablation strategies (zero / mean / resample).' });
    verdicts.push(scope
      ? { kind: 'pass', title: 'Scope bounded or tested', body: 'The claim states where it applies — and, implicitly, where it does not.' }
      : { kind: 'warn', title: 'Scope unbounded', body: 'Single-distribution findings transfer only under transportability assumptions. Bound the claim (model, task, language, distribution) or test the shift.' });
  }
  const allPass = done && verdicts.every(v => v.kind === 'pass');

  const reset = () => { setClaim(null); setMethod(null); setAlternatives(null); setScope(null); };

  return (
    <div className="not-prose my-8 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 p-4 sm:p-6">
      <div className="flex items-baseline justify-between mb-5">
        <div className="text-[11px] font-semibold tracking-widest uppercase text-zinc-400 dark:text-zinc-500">
          Diagnose your claim · 60 seconds
        </div>
        {done && (
          <button onClick={reset} className="text-[12px] text-accent-600 dark:text-accent-400 hover:underline">start over</button>
        )}
      </div>

      <div className="grid sm:grid-cols-2 gap-5">
        <Step n={1} title="Your claim says…" active={true}>
          <OptionGroup options={CLAIM_OPTS} value={claim} onPick={setClaim} />
        </Step>
        <Step n={2} title="Your evidence is…" active={!!claim}>
          <OptionGroup options={METHOD_OPTS} value={method} onPick={setMethod} />
        </Step>
        <Step n={3} title="Did anything rule out alternative explanations?" active={!!claim && !!method}>
          <YesNo value={alternatives} onPick={setAlternatives}
            yes="Yes — alternatives tested" no="No / not sure" />
        </Step>
        <Step n={4} title="Does the claim state where it applies (and not beyond)?" active={!!claim && !!method && alternatives !== null}>
          <YesNo value={scope} onPick={setScope}
            yes="Yes — scope is bounded" no="No — it reads as general" />
        </Step>
      </div>

      {done && (
        <div className="mt-6 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-4">
          <div className="mb-2">
            <Chip text={`claim ${RUNG_NAME[claim!.rung]}`} color={RUNG_COLOR[claim!.rung]} />
            <Chip text={`evidence ${RUNG_NAME[method!.rung]}`} color={RUNG_COLOR[method!.rung]} />
            <Chip text={alternatives ? 'alternatives ✓' : 'alternatives ✗'} color={alternatives ? '#3E8E5A' : '#B04A4A'} />
            <Chip text={scope ? 'scope ✓' : 'scope ✗'} color={scope ? '#3E8E5A' : '#C07A18'} />
          </div>
          {verdicts.map((v, i) => (
            <div key={i} className="py-2 border-t border-zinc-100 dark:border-zinc-700/60 first:border-t-0">
              <div className="text-[13px] font-semibold" style={{ color: v.kind === 'pass' ? '#3E8E5A' : v.kind === 'warn' ? '#C07A18' : '#B04A4A' }}>
                {v.kind === 'pass' ? '✓' : v.kind === 'warn' ? '△' : '✗'} {v.title}
              </div>
              <div className="text-[13px] text-zinc-600 dark:text-zinc-300 mt-0.5">{v.body}</div>
            </div>
          ))}
          <div className="mt-3 text-[12px] text-zinc-400 dark:text-zinc-500 italic">
            {allPass
              ? 'A paper that states its rung, names its equivalence class, and bounds its scope contributes more than one whose language implies stronger evidence than reported.'
              : 'None of this discourages exploratory work — narrower, calibrated claims contribute more than over-read ones. Full checklist in §G.6 of the paper.'}
          </div>
        </div>
      )}
    </div>
  );
}
