import { useEffect, useMemo, useState } from 'react';
import { fetchClaims, RUNG_COLOR, REPO_URL, REPLICATION_LABEL, METHOD_FAMILIES, type Claim } from './claimsData';

/**
 * The 186-claims pilot study (§G, arXiv:2602.16698).
 * Aggregate tabs use the numbers reported in the paper; the "browse" tab
 * fetches annotations.csv live from the public replication repo.
 */

const GAPS = [
  { label: 'gap 0 — claim matches method', n: 86, pct: 46.5, color: '#10B981' },
  { label: 'gap +1 — e.g. patching narrated as "THE circuit"', n: 76, pct: 41.1, color: '#C07A18' },
  { label: 'gap +2 — e.g. probing narrated as "encodes"', n: 23, pct: 12.4, color: '#B0356B' },
];

const TYPES = [
  { label: 'circuit discovery', rate: 0.64, papers: 16 },
  { label: 'knowledge localisation', rate: 0.5, papers: 3 },
  { label: 'other', rate: 0.47, papers: 19 },
  { label: 'evaluation / benchmark', rate: 0.45, papers: 5 },
  { label: 'applied / production', rate: 0.35, papers: 7 },
];

const PATTERNS: { method: string; mr: 1 | 2; claim: string; cr: 3; gap: number }[] = [
  { method: 'linear probing', mr: 1, claim: '"model encodes X"', cr: 3, gap: 2 },
  { method: 'SAE attribution', mr: 1, claim: '"model represents X"', cr: 3, gap: 2 },
  { method: 'attention visualisation', mr: 1, claim: '"head performs X"', cr: 3, gap: 2 },
  { method: 'activation patching', mr: 2, claim: '"this is THE circuit"', cr: 3, gap: 1 },
  { method: 'steering vectors', mr: 2, claim: '"controls concept X"', cr: 3, gap: 1 },
  { method: 'ablation', mr: 2, claim: '"necessary for behaviour"', cr: 3, gap: 1 },
];

function RungChip({ r }: { r: number }) {
  if (!r) return <span className="text-[10px] text-zinc-400">n/a</span>;
  const c = RUNG_COLOR[r as 1 | 2 | 3];
  return <span className="rounded-full px-1.5 py-0.5 text-[10px] font-bold" style={{ background: `${c}18`, color: c }}>L{r}</span>;
}

export default function ClaimsStudyChart() {
  const [tab, setTab] = useState<'gaps' | 'types' | 'patterns' | 'browse'>('gaps');
  const [claims, setClaims] = useState<Claim[] | null>(null);
  const [err, setErr] = useState(false);
  const [gapFilter, setGapFilter] = useState<-1 | 0 | 1 | 2>(-1); // -1 = all
  const [family, setFamily] = useState<string>('all');
  const [query, setQuery] = useState('');
  const [shown, setShown] = useState(12);

  useEffect(() => {
    if (tab !== 'browse' || claims || err) return;
    fetchClaims().then(setClaims).catch(() => setErr(true));
  }, [tab, claims, err]);

  const famTest = METHOD_FAMILIES.find(f => f.id === family)?.test;
  const filtered = useMemo(() => {
    if (!claims) return [];
    const q = query.toLowerCase();
    return claims.filter(c =>
      (gapFilter === -1 || c.gap === gapFilter) &&
      (!famTest || famTest(c.method)) &&
      (!q || c.text.toLowerCase().includes(q) || c.method.toLowerCase().includes(q) || c.note.toLowerCase().includes(q)));
  }, [claims, gapFilter, famTest, query]);

  return (
    <div className="not-prose rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 my-6 text-zinc-800 dark:text-zinc-200">
      <div className="flex flex-wrap items-baseline justify-between gap-2 mb-3">
        <div className="text-sm font-semibold">50 papers · 186 claims, annotated on the ladder</div>
        <div className="flex gap-1 flex-wrap">
          {(['gaps', 'types', 'patterns', 'browse'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors ${
                tab === t ? 'bg-accent-100 dark:bg-accent-950/60 text-accent-700 dark:text-accent-300'
                          : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300'}`}>
              {t === 'gaps' ? 'gap scores' : t === 'types' ? 'by paper type' : t === 'patterns' ? 'the six patterns' : 'browse all 186 ↗'}
            </button>
          ))}
        </div>
      </div>

      {tab === 'gaps' && (
        <div>
          {GAPS.map((g, i) => (
            <div key={i} className="mb-2.5">
              <div className="flex justify-between text-[12px] mb-0.5">
                <span>{g.label}</span>
                <span className="font-mono text-zinc-500">{g.n} claims · {g.pct}%</span>
              </div>
              <div className="h-5 rounded bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                <div className="h-full rounded" style={{ width: `${g.pct}%`, background: g.color, opacity: 0.85 }} />
              </div>
            </div>
          ))}
          <p className="text-[12px] text-zinc-500 dark:text-zinc-400 mt-3 leading-relaxed">
            53.5% of claims carry rung-elevated language (paper-level cluster-bootstrap 95% CI [44%, 63%]);
            a conservative re-coding that treats definite-article conventions as gap-free still leaves 47%.
            The robust statement: <strong>47–54%, depending on how you code linguistic convention.</strong>
          </p>
        </div>
      )}

      {tab === 'types' && (
        <div>
          {TYPES.map((t, i) => (
            <div key={i} className="flex items-center gap-2 mb-1.5 text-[12px]">
              <span className="w-44 shrink-0 text-right text-zinc-500">{t.label}</span>
              <div className="flex-1 h-4 rounded bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                <div className="h-full rounded bg-accent-500/80" style={{ width: `${t.rate * 100}%` }} />
              </div>
              <span className="font-mono w-20 shrink-0 text-zinc-500">{(t.rate * 100).toFixed(0)}% · n={t.papers}</span>
            </div>
          ))}
          <p className="text-[12px] text-zinc-500 dark:text-zinc-400 mt-3 leading-relaxed">
            Mean gap rate by paper type. Circuit-discovery papers elevate most, and engineering-framed applied
            papers least. Gap rates are similar in abstracts (53.3%) and body text (52.9%), which suggests a
            field-wide convention rather than pressure on abstract space.
          </p>
        </div>
      )}

      {tab === 'patterns' && (
        <div>
          {PATTERNS.map((p, i) => (
            <div key={i} className="flex items-center gap-2 mb-1.5 text-[12px] flex-wrap">
              <span className="rounded-full px-2 py-0.5 font-medium" style={{ background: `${RUNG_COLOR[p.mr]}18`, color: RUNG_COLOR[p.mr] }}>
                L{p.mr} · {p.method}
              </span>
              <span className="text-zinc-400">→ narrated as →</span>
              <span className="rounded-full px-2 py-0.5 font-medium" style={{ background: `${RUNG_COLOR[p.cr]}18`, color: RUNG_COLOR[p.cr] }}>
                L{p.cr} · {p.claim}
              </span>
              <span className="font-mono text-zinc-400 ml-auto">+{p.gap}</span>
            </div>
          ))}
          <p className="text-[12px] text-zinc-500 dark:text-zinc-400 mt-3 leading-relaxed">
            The six recurring elevation patterns from the codebook. +1 gaps (41%) are mostly patching → mechanistic
            narration; +2 gaps (12%) are mostly probing/SAE findings written with counterfactual verbs.
          </p>
        </div>
      )}

      {tab === 'browse' && (
        <div>
          {!claims && !err && <div className="text-[13px] text-zinc-400 py-6 text-center">loading annotations.csv from the replication repo…</div>}
          {err && (
            <div className="text-[13px] text-zinc-500 py-4 text-center">
              Couldn't reach the dataset. It lives at{' '}
              <a href={REPO_URL} className="underline decoration-accent-300 text-accent-600 dark:text-accent-400">{REPO_URL.replace('https://', '')}</a>.
            </div>
          )}
          {claims && (
            <div>
              <div className="flex flex-wrap gap-2 mb-2 items-center">
                <input value={query} onChange={e => { setQuery(e.target.value); setShown(12); }} placeholder="search claim text, method, notes…"
                  className="flex-1 min-w-[180px] rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 px-3 py-1.5 text-[12px] focus:outline-none focus:border-accent-500" />
                {([-1, 0, 1, 2] as const).map(g => (
                  <button key={g} onClick={() => { setGapFilter(g); setShown(12); }}
                    className={`rounded-full px-2.5 py-1 text-[11px] font-medium border transition-colors ${
                      gapFilter === g ? 'border-accent-500 text-accent-700 dark:text-accent-300 bg-accent-50 dark:bg-accent-950/40'
                                      : 'border-zinc-200 dark:border-zinc-700 text-zinc-400 hover:border-accent-300'}`}>
                    {g === -1 ? `all (${claims.length})` : `gap ${g === 0 ? '0' : `+${g}`} (${claims.filter(c => c.gap === g).length})`}
                  </button>
                ))}
              </div>
              <div className="flex flex-wrap gap-1.5 mb-3 items-center text-[11px]">
                <span className="text-zinc-400">your method:</span>
                <button onClick={() => { setFamily('all'); setShown(12); }}
                  className={`rounded-full px-2 py-0.5 font-medium border transition-colors ${family === 'all' ? 'border-accent-500 text-accent-700 dark:text-accent-300' : 'border-zinc-200 dark:border-zinc-700 text-zinc-400 hover:border-accent-300'}`}>
                  all
                </button>
                {METHOD_FAMILIES.map(f => (
                  <button key={f.id} onClick={() => { setFamily(f.id); setShown(12); }}
                    className={`rounded-full px-2 py-0.5 font-medium border transition-colors ${family === f.id ? 'border-accent-500 text-accent-700 dark:text-accent-300' : 'border-zinc-200 dark:border-zinc-700 text-zinc-400 hover:border-accent-300'}`}>
                    {f.label} ({claims.filter(c => f.test(c.method)).length})
                  </button>
                ))}
              </div>

              <div className="flex flex-col gap-1.5 max-h-[420px] overflow-y-auto pr-1">
                {filtered.slice(0, shown).map((c, i) => (
                  <details key={i} className="rounded-lg border border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 px-3 py-2">
                    <summary className="cursor-pointer text-[12px] leading-snug list-none">
                      <span className="flex items-start gap-2">
                        <span className="mt-0.5 shrink-0 flex items-center gap-1">
                          <RungChip r={c.methodRung} /><span className="text-zinc-300 dark:text-zinc-600">→</span><RungChip r={c.claimRung} />
                        </span>
                        <span className="text-zinc-700 dark:text-zinc-300">“{c.text}”</span>
                        {c.gap > 0 && <span className="ml-auto shrink-0 font-mono text-[10px] text-red-500/80">+{c.gap}</span>}
                      </span>
                    </summary>
                    <div className="mt-1.5 text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
                      <span className="font-medium">{c.method}</span> · found in {c.location}
                      {REPLICATION_LABEL[c.replication] && (
                        <span> · <span className={c.replication === '1' ? 'text-red-500/80' : c.replication === '0' ? 'text-emerald-600/90 dark:text-emerald-400/90' : 'text-amber-600/90 dark:text-amber-400/90'}>
                          {REPLICATION_LABEL[c.replication]}</span>{c.replicationEvidence ? ` (${c.replicationEvidence})` : ''}</span>
                      )}
                      {c.note && <div className="mt-1 italic">annotator: {c.note}</div>}
                    </div>
                  </details>
                ))}
                {filtered.length === 0 && <div className="text-[12px] text-zinc-400 py-4 text-center">no claims match</div>}
              </div>
              {shown < filtered.length && (
                <button onClick={() => setShown(s => s + 24)}
                  className="mt-2 w-full rounded-lg border border-zinc-200 dark:border-zinc-700 py-1.5 text-[12px] text-zinc-500 hover:border-accent-400 transition-colors">
                  show more ({filtered.length - shown} remaining)
                </button>
              )}
              <p className="text-[11px] text-zinc-400 mt-2 leading-relaxed">
                Drawn from the public dataset. Paper identifiers are deliberately withheld. The coding measures
                surface-level language rather than author intent or result validity, and many flagged phrases
                are ordinary disciplinary convention. That is the finding.
              </p>
            </div>
          )}
        </div>
      )}

      <details className="mt-3 text-[12px] text-zinc-500 dark:text-zinc-400">
        <summary className="cursor-pointer font-medium text-zinc-600 dark:text-zinc-300">How this was measured (and what it does not claim)</summary>
        <p className="mt-1.5 leading-relaxed">
          Claims were annotated by an LLM (Claude Opus 4.5) with human oversight — 12 of 50 papers (43 claims)
          fact-checked against sources, 84% needing no correction — and independently replicated by seven LLMs across
          four model families (Krippendorff's α: method rung 0.66, claim rung 0.56). The study measures
          <em> surface-level interpretive risk</em>: whether claim language, read at face value, admits a stronger causal
          reading than the method licenses. It does <strong>not</strong> claim the findings are wrong or the authors
          intended stronger readings — "THE circuit" often functions as a naming convention. That's precisely the point:
          the field lacks shared terminology that tracks evidential strength. Data, codebook, and pipeline:{' '}
          <a href={REPO_URL} className="underline decoration-accent-300 text-accent-600 dark:text-accent-400">
            github.com/rpatrik96/mech-interp-claim-calibration
          </a>.
        </p>
      </details>
    </div>
  );
}
