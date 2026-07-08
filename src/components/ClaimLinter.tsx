import { useEffect, useMemo, useState } from 'react';
import { emitArc } from './arc';

/**
 * Claim Linter — paste a sentence from your paper; the verb lexicon from the
 * annotation codebook (§G.3, arXiv:2602.16698) flags rung-1/2/3 markers,
 * compares against your method's rung, and drafts a rung-appropriate rewrite.
 */

type Rung = 1 | 2 | 3;
const RUNG_COLOR: Record<Rung, string> = { 1: '#4A6FA5', 2: '#C07A18', 3: '#B0356B' };
const RUNG_NAME: Record<Rung, string> = { 1: 'L1 · associational', 2: 'L2 · interventional', 3: 'L3 · counterfactual / mechanistic' };

// §G.3 linguistic markers (+ common variants). Order matters: longest match wins.
const LEXICON: { rx: RegExp; rung: Rung; rewrite?: [string, string] }[] = [
  { rx: /\bis responsible for\b/gi, rung: 3, rewrite: ['is decodable alongside (L1)', 'mediates under tested interventions (L2)'] },
  { rx: /\bthe (circuit|mechanism|feature|direction) (for|computing|underlying)\b/gi, rung: 3, rewrite: ['a direction predictive of (L1)', 'a circuit sufficient for (L2)'] },
  { rx: /\bthe (circuit|mechanism)\b/gi, rung: 3, rewrite: ['a candidate circuit (L1)', 'a circuit sufficient under our ablations (L2)'] },
  { rx: /\bwould have (changed|been|produced)\b/gi, rung: 3 },
  { rx: /\bencodes?\b/gi, rung: 3, rewrite: ['is decodable from (L1)', 'is manipulable via (L2)'] },
  { rx: /\brepresents?\b/gi, rung: 3, rewrite: ['is predictive of (L1)', 'shifts behaviour when steered (L2)'] },
  { rx: /\bcomputes?\b/gi, rung: 3, rewrite: ['correlates with the computation of (L1)', 'is causally implicated in (L2)'] },
  { rx: /\bperforms?\b/gi, rung: 3, rewrite: ['is active during (L1)', 'contributes causally to (L2)'] },
  { rx: /\bstores?\b/gi, rung: 3, rewrite: ['is decodable from (L1)', 'is where edits change recall of (L2)'] },
  { rx: /\bcontains?\b/gi, rung: 3, rewrite: ['carries decodable information about (L1)', 'is causally implicated in (L2)'] },
  { rx: /\bcontrols?\b/gi, rung: 3, rewrite: ['predicts (L1)', 'shifts the output distribution for (L2)'] },
  { rx: /\bunderlies\b/gi, rung: 3, rewrite: ['co-varies with (L1)', 'mediates under tested interventions (L2)'] },
  { rx: /\bmeans\b/gi, rung: 3, rewrite: ['aligns with the label (L1)', 'behaves as … under interventions (L2)'] },
  { rx: /\bcausally affects?\b/gi, rung: 2 },
  { rx: /\bhas a causal effect\b/gi, rung: 2 },
  { rx: /\bmediates?\b/gi, rung: 2 },
  { rx: /\binfluences?\b/gi, rung: 2 },
  { rx: /\bis sufficient for\b/gi, rung: 2 },
  { rx: /\bcan produce\b/gi, rung: 2 },
  { rx: /\benables?\b/gi, rung: 2 },
  { rx: /\bintervening on\b/gi, rung: 2 },
  { rx: /\bablating\b/gi, rung: 2 },
  { rx: /\bsteering\b/gi, rung: 2 },
  { rx: /\bcorrelates? with\b/gi, rung: 1 },
  { rx: /\bis associated with\b/gi, rung: 1 },
  { rx: /\bpredicts?\b/gi, rung: 1 },
  { rx: /\bco-?occurs? with\b/gi, rung: 1 },
  { rx: /\bis decodable( from)?\b/gi, rung: 1 },
  { rx: /\bcan be extracted\b/gi, rung: 1 },
  { rx: /\bactivates? on\b/gi, rung: 1 },
  { rx: /\bfires? when\b/gi, rung: 1 },
];
const HEDGES = /\b(may|might|suggests?|preliminary|consistent with|appears? to)\b/gi;

const METHODS: { label: string; rung: Rung }[] = [
  { label: 'linear probing / logit lens / SAE feature attribution / attention visualisation', rung: 1 },
  { label: 'activation patching / ablation / steering / causal tracing / ROME-style edits', rung: 2 },
  { label: 'interchange interventions under a structural model / causal scrubbing / necessity tests', rung: 3 },
];

type Span = { text: string; rung?: Rung; rewrite?: [string, string] };

function lint(text: string): { spans: Span[]; claimRung: Rung | 0; hedged: boolean } {
  const marks: { s: number; e: number; rung: Rung; rewrite?: [string, string] }[] = [];
  for (const { rx, rung, rewrite } of LEXICON) {
    rx.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = rx.exec(text))) {
      const s = m.index, e = m.index + m[0].length;
      if (!marks.some(k => s < k.e && e > k.s)) marks.push({ s, e, rung, rewrite });
    }
  }
  marks.sort((a, b) => a.s - b.s);
  const spans: Span[] = [];
  let i = 0;
  for (const k of marks) {
    if (k.s > i) spans.push({ text: text.slice(i, k.s) });
    spans.push({ text: text.slice(k.s, k.e), rung: k.rung, rewrite: k.rewrite });
    i = k.e;
  }
  if (i < text.length) spans.push({ text: text.slice(i) });
  const claimRung = (marks.length ? Math.max(...marks.map(k => k.rung)) : 0) as Rung | 0;
  HEDGES.lastIndex = 0;
  return { spans, claimRung, hedged: HEDGES.test(text) };
}

export default function ClaimLinter() {
  const [text, setText] = useState('The model encodes refusal in layer 12; ablating these heads shows this circuit performs the task.');
  const [method, setMethod] = useState(0);
  const [scopeModel, setScopeModel] = useState('');
  const [scopeData, setScopeData] = useState('');
  const [copied, setCopied] = useState(false);
  const { spans, claimRung, hedged } = useMemo(() => lint(text), [text]);
  const methodRung = METHODS[method].rung;
  const gap = claimRung === 0 ? 0 : Math.max(0, claimRung - methodRung);
  const rewrites = spans.filter(s => s.rung === 3 && s.rewrite && s.rung > methodRung);

  useEffect(() => { if (claimRung > 0 && gap === 0) emitArc('language'); }, [claimRung, gap]);

  const scopeStatement = `${text.trim().replace(/[.?!]*$/, '')}. This applies to ${scopeModel.trim() || '⟨model⟩'} on ${scopeData.trim() || '⟨data distribution⟩'}, and not beyond.`;
  const copyScope = () => {
    navigator.clipboard?.writeText(scopeStatement).then(() => {
      setCopied(true); emitArc('language');
      setTimeout(() => setCopied(false), 1600);
    });
  };

  return (
    <div className="not-prose rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 my-6 text-zinc-800 dark:text-zinc-200">
      <div className="flex flex-wrap items-baseline justify-between gap-2 mb-3">
        <div className="text-sm font-semibold">Claim linter</div>
        <div className="text-[11px] text-zinc-400">verb lexicon from the annotation codebook (§G.3)</div>
      </div>

      <textarea value={text} onChange={e => setText(e.target.value)} rows={3}
        className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 px-3 py-2 text-[13px] focus:outline-none focus:border-accent-500"
        placeholder="Paste a claim sentence from your paper…" />

      <label className="text-xs text-zinc-500 dark:text-zinc-400 block mt-3 mb-1">my evidence comes from…</label>
      <select value={method} onChange={e => setMethod(+e.target.value)}
        className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 px-3 py-2 text-[13px] focus:outline-none focus:border-accent-500">
        {METHODS.map((m, i) => (
          <option key={i} value={i}>{m.label} — {RUNG_NAME[m.rung]}</option>
        ))}
      </select>

      <div className="mt-3 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800 px-3 py-2.5 text-[14px] leading-relaxed">
        {spans.length === 0 && <span className="text-zinc-400">…</span>}
        {spans.map((s, i) =>
          s.rung ? (
            <mark key={i} className="rounded px-1 py-0.5 font-medium"
              style={{ background: `${RUNG_COLOR[s.rung]}22`, color: RUNG_COLOR[s.rung] }}
              title={RUNG_NAME[s.rung]}>{s.text}</mark>
          ) : (
            <span key={i}>{s.text}</span>
          )
        )}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2 text-[12px]">
        <span className="rounded-full px-2.5 py-1 font-semibold"
          style={{ background: `${RUNG_COLOR[(claimRung || 1) as Rung]}18`, color: claimRung ? RUNG_COLOR[claimRung as Rung] : '#71717A' }}>
          claim language: {claimRung ? RUNG_NAME[claimRung as Rung] : 'no causal markers found'}
        </span>
        <span className="rounded-full px-2.5 py-1 font-semibold"
          style={{ background: `${RUNG_COLOR[methodRung]}18`, color: RUNG_COLOR[methodRung] }}>
          method: {RUNG_NAME[methodRung]}
        </span>
        <span className={`rounded-full px-2.5 py-1 font-bold ${gap > 0 ? 'bg-red-500/10 text-red-600 dark:text-red-400' : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'}`}>
          {gap > 0 ? `gap: +${gap} rung${gap > 1 ? 's' : ''}` : 'no gap ✓'}
        </span>
        {hedged && <span className="text-zinc-400">(hedged — coded at the underlying rung, per the codebook)</span>}
      </div>

      {gap > 0 && rewrites.length > 0 && (
        <div className="mt-3 rounded-lg border border-accent-200 dark:border-accent-900 bg-accent-50/60 dark:bg-accent-950/30 px-3 py-2 text-[13px]">
          <div className="font-semibold mb-1">rung-appropriate rewrites</div>
          {rewrites.map((r, i) => (
            <div key={i} className="mb-0.5">
              <span className="font-mono" style={{ color: RUNG_COLOR[3] }}>"{r.text}"</span>
              {' → '}
              <span style={{ color: RUNG_COLOR[1] }}>"{r.rewrite![0]}"</span>
              {methodRung >= 2 && <>{' or '}<span style={{ color: RUNG_COLOR[2] }}>"{r.rewrite![1]}"</span></>}
            </div>
          ))}
          <div className="text-[11px] text-zinc-400 mt-1">…or keep the sentence and strengthen the method to L{claimRung}.</div>
        </div>
      )}
      {gap === 0 && claimRung > 0 && (
        <div className="mt-3 text-[13px] text-zinc-500 dark:text-zinc-400">
          Language and evidence match. One thing left: state the scope.
        </div>
      )}

      {claimRung > 0 && (
        <div className="mt-3 rounded-lg border border-zinc-200 dark:border-zinc-700 px-3 py-2.5">
          <div className="text-[12px] font-semibold mb-1.5">Scope statement (checklist item 7) — fill in, copy, paste into your paper</div>
          <div className="flex flex-wrap gap-2 mb-2">
            <input value={scopeModel} onChange={e => setScopeModel(e.target.value)} placeholder="model, e.g. GPT-2 small"
              className="flex-1 min-w-[140px] rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 px-2.5 py-1.5 text-[12px] focus:outline-none focus:border-accent-500" />
            <input value={scopeData} onChange={e => setScopeData(e.target.value)} placeholder="data, e.g. English SVA prompts"
              className="flex-1 min-w-[140px] rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 px-2.5 py-1.5 text-[12px] focus:outline-none focus:border-accent-500" />
          </div>
          <div className="text-[12px] text-zinc-600 dark:text-zinc-300 italic leading-relaxed">"{scopeStatement}"</div>
          <button onClick={copyScope}
            className="mt-2 rounded-lg border border-accent-500 text-accent-700 dark:text-accent-300 px-3 py-1 text-[12px] font-medium hover:bg-accent-50 dark:hover:bg-accent-950/40 transition-colors">
            {copied ? 'copied ✓' : 'copy scope statement'}
          </button>
        </div>
      )}

      <p className="mt-3 text-[11px] text-zinc-400 leading-relaxed">
        The linter matches a fixed verb lexicon. A sentence like "this direction sits causally upstream of refusal"
        passes through unflagged, and hedges do not lower the assigned rung, following the codebook. Treat it as a
        spell-checker for causal language rather than a referee.
      </p>
    </div>
  );
}
