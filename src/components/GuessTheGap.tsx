import { useEffect, useMemo, useState } from 'react';
import { fetchClaims, RUNG_COLOR, REPO_URL, type Claim } from './claimsData';
import { emitArc } from './arc';

/**
 * Guess the gap — calibration training on the real 186 annotated claims.
 * Shown a verbatim claim and its method, you predict the gap score the
 * annotator assigned. Five rounds; agreement caveats included, because
 * even the annotators only reach α = 0.56 on claim rung.
 */

const ROUNDS = 5;

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const GAP_DESC: Record<number, string> = {
  0: 'language matches the method',
  1: 'one rung above the evidence',
  2: 'two rungs above the evidence',
};

export default function GuessTheGap() {
  const [pool, setPool] = useState<Claim[] | null>(null);
  const [err, setErr] = useState(false);
  const [order, setOrder] = useState<Claim[]>([]);
  const [round, setRound] = useState(0);
  const [guess, setGuess] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    fetchClaims()
      .then(cs => setPool(cs.filter(c => c.gap >= 0 && c.methodRung > 0 && c.text.length > 25)))
      .catch(() => setErr(true));
  }, []);

  useEffect(() => { if (pool && order.length === 0) setOrder(shuffle(pool).slice(0, ROUNDS)); }, [pool, order]);

  const claim = order[round];
  const correct = guess !== null && claim && guess === claim.gap;

  const answer = (g: number) => { if (guess === null) { setGuess(g); if (claim && g === claim.gap) setScore(s => s + 1); } };
  const next = () => {
    if (round + 1 >= ROUNDS) { setFinished(true); emitArc('gap'); }
    else { setRound(r => r + 1); setGuess(null); }
  };
  const replay = () => { setOrder(shuffle(pool!).slice(0, ROUNDS)); setRound(0); setGuess(null); setScore(0); setFinished(false); };

  const chip = (r: number) => (
    <span className="rounded-full px-1.5 py-0.5 text-[10px] font-bold"
      style={{ background: `${RUNG_COLOR[r as 1 | 2 | 3]}18`, color: RUNG_COLOR[r as 1 | 2 | 3] }}>L{r}</span>
  );

  return (
    <div className="not-prose rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 my-6 text-zinc-800 dark:text-zinc-200">
      <div className="flex flex-wrap items-baseline justify-between gap-2 mb-3">
        <div className="text-sm font-semibold">Guess the gap</div>
        <div className="text-[11px] text-zinc-400">
          claims from the annotation dataset · round {Math.min(round + 1, ROUNDS)}/{ROUNDS} · score <span className="font-mono">{score}</span>
        </div>
      </div>

      {err && (
        <div className="text-[13px] text-zinc-500 py-4 text-center">
          Couldn't reach the dataset (<a href={REPO_URL} className="underline decoration-accent-300 text-accent-600 dark:text-accent-400">repo</a>).
        </div>
      )}
      {!pool && !err && <div className="text-[13px] text-zinc-400 py-6 text-center">loading the annotated claims…</div>}

      {claim && !finished && (
        <div>
          <div className="rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800 px-3 py-3 text-[14px] leading-relaxed">
            “{claim.text}”
          </div>
          <div className="flex flex-wrap items-center gap-2 mt-2 text-[12px] text-zinc-500 dark:text-zinc-400">
            <span>method: <span className="font-medium text-zinc-700 dark:text-zinc-300">{claim.method}</span> {chip(claim.methodRung)}</span>
            <span>· found in the {claim.location}</span>
          </div>

          <div className="text-[12px] text-zinc-500 dark:text-zinc-400 mt-3 mb-1.5">
            How far does the claim's language reach above the method's rung?
          </div>
          <div className="flex flex-wrap gap-1.5">
            {[0, 1, 2].map(g => (
              <button key={g} onClick={() => answer(g)} disabled={guess !== null}
                className={`rounded-lg border px-3 py-1.5 text-[13px] font-medium transition-colors disabled:cursor-default ${
                  guess !== null && claim.gap === g ? 'border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                  : guess === g ? 'border-red-400 bg-red-500/10 text-red-600 dark:text-red-400'
                  : guess !== null ? 'border-zinc-200 dark:border-zinc-800 text-zinc-400'
                  : 'border-zinc-300 dark:border-zinc-700 hover:border-accent-400'}`}>
                gap {g === 0 ? '0' : `+${g}`}
                <span className="block text-[10px] font-normal text-zinc-400">{GAP_DESC[g]}</span>
              </button>
            ))}
          </div>

          {guess !== null && (
            <div className="mt-3 rounded-lg px-3 py-2 text-[13px] leading-relaxed"
              style={{ background: correct ? 'rgba(16,185,129,0.08)' : 'rgba(176,53,107,0.08)' }}>
              <span className="font-semibold">{correct ? 'Agreed with the annotator.' : `Annotator coded gap ${claim.gap === 0 ? '0' : `+${claim.gap}`}`}</span>
              {' '}claim rung {chip(claim.claimRung)} vs method rung {chip(claim.methodRung)}.
              {claim.note && <span className="block mt-1 italic text-zinc-500 dark:text-zinc-400">annotator: {claim.note}</span>}
              <button onClick={next} className="mt-2 block rounded-lg border border-accent-500 text-accent-700 dark:text-accent-300 px-3 py-1 text-[12px] font-medium hover:bg-accent-50 dark:hover:bg-accent-950/40 transition-colors">
                {round + 1 >= ROUNDS ? 'finish' : 'next claim →'}
              </button>
            </div>
          )}
        </div>
      )}

      {finished && (
        <div className="text-center py-4">
          <div className="text-2xl font-bold text-accent-600 dark:text-accent-400">{score}/{ROUNDS}</div>
          <div className="text-[13px] text-zinc-500 dark:text-zinc-400 mt-1 max-w-md mx-auto leading-relaxed">
            {score >= 4 ? 'Well calibrated. You read language the way the codebook does.' :
             score >= 2 ? 'About where the field is. Distinguishing convention from commitment is hard.' :
             'Rung-elevated language reads as normal, which is the problem the paper names.'}
            {' '}For context, seven LLM annotators reach only α = 0.56 on claim rung themselves. Near-misses are the norm in this data.
          </div>
          <button onClick={replay} className="mt-3 rounded-lg border border-zinc-300 dark:border-zinc-700 px-3 py-1.5 text-[12px] hover:border-accent-400 transition-colors">
            play five more
          </button>
        </div>
      )}
    </div>
  );
}
