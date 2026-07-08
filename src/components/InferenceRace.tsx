import { useEffect, useMemo, useRef, useState } from 'react';

/**
 * One forward pass versus an optimiser. Both use the SAME frozen
 * ground-truth dictionary (d_y = 8, d_h = 16, k = 2); only inference differs.
 * The amortised encoder (linear + ReLU, trained on in-distribution
 * compositions in your browser) answers instantly; ISTA iterates the lasso
 * objective per sample. On a composition the encoder never saw, only one
 * of them recovers the right atoms.
 */

const DY = 8, DH = 16, K = 2, LAM = 0.05;
const TRUE_C = '#71717A';
const ENC_C = '#C07A18';
const ISTA_C = '#4A6FA5';

function mulberry32(a: number) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function makeWorld() {
  const rnd = mulberry32(11);
  const g = () => { const u = Math.max(rnd(), 1e-9); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rnd()); };
  const A: number[][] = Array.from({ length: DH }, () => {
    const c = Array.from({ length: DY }, g);
    const n = Math.hypot(...c);
    return c.map(v => v / n);
  });
  return { A, rnd, g };
}

const mix = (A: number[][], z: number[]) => {
  const y = new Array(DY).fill(0);
  for (let j = 0; j < DH; j++) if (z[j]) for (let d = 0; d < DY; d++) y[d] += z[j] * A[j][d];
  return y;
};

const idPair = (rnd: () => number) => { const i = Math.floor(rnd() * 8); return [2 * i, 2 * i + 1]; };
const oodPair = (rnd: () => number) => { const i = Math.floor(rnd() * 8); return [2 * i, (2 * i + 5) % DH]; };
const mkz = (rnd: () => number, S: number[]) => { const z = new Array(DH).fill(0); for (const j of S) z[j] = 0.4 + 0.6 * rnd(); return z; };

function istaTrace(A: number[][], y: number[], iters = 120) {
  let h = new Array(DH).fill(0);
  const trace: number[][] = [h.slice()];
  const eta = 0.1;
  for (let t = 0; t < iters; t++) {
    const yh = new Array(DY).fill(0);
    for (let j = 0; j < DH; j++) if (h[j]) for (let d = 0; d < DY; d++) yh[d] += h[j] * A[j][d];
    const r = yh.map((v, d) => v - y[d]);
    for (let j = 0; j < DH; j++) {
      let gj = 0;
      for (let d = 0; d < DY; d++) gj += r[d] * A[j][d];
      const v = h[j] - eta * 2 * gj;
      h[j] = Math.max(0, v - eta * LAM);
    }
    if (t % 5 === 4) trace.push(h.slice());
  }
  trace.push(h.slice());
  return trace;
}

const support = (h: number[]) =>
  h.map((v, j) => [v, j] as [number, number]).sort((a, b) => b[0] - a[0]).slice(0, K).filter(x => x[0] > 0.05).map(x => x[1]);

const precision = (pred: number[], S: number[]) =>
  pred.length === 0 ? 0 : pred.filter(j => S.includes(j)).length / pred.length;

export default function InferenceRace() {
  const world = useMemo(makeWorld, []);
  const [trained, setTrained] = useState(0); // 0..1 progress
  const enc = useRef<{ B: number[][]; c: number[] } | null>(null);
  const [sample, setSample] = useState<{ z: number[]; S: number[]; ood: boolean } | null>(null);
  const [encH, setEncH] = useState<number[] | null>(null);
  const [istaH, setIstaH] = useState<number[] | null>(null);
  const [istaIter, setIstaIter] = useState(0);
  const traceRef = useRef<number[][]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // train the amortised encoder in-browser, chunked so the page stays live
  useEffect(() => {
    const { A, g } = world;
    const rnd = mulberry32(23);
    const train: number[][] = [];
    for (let i = 0; i < 600; i++) train.push(mkz(rnd, idPair(rnd)));
    const ys = train.map(z => mix(A, z));
    let B = Array.from({ length: DH }, () => Array.from({ length: DY }, () => g() * 0.1));
    let c = new Array(DH).fill(0);
    const lr = 0.05;
    let epoch = 0;
    const total = 400;
    const step = () => {
      for (let e = 0; e < 20 && epoch < total; e++, epoch++) {
        for (let i = 0; i < train.length; i++) {
          const z = train[i], y = ys[i];
          const pre = B.map((row, j) => row.reduce((s, w, d) => s + w * y[d], c[j]));
          const h = pre.map(v => Math.max(0, v));
          const yh = new Array(DY).fill(0);
          for (let j = 0; j < DH; j++) if (h[j]) for (let d = 0; d < DY; d++) yh[d] += h[j] * A[j][d];
          const r = yh.map((v, d) => v - y[d]);
          for (let j = 0; j < DH; j++) {
            if (pre[j] <= 0) continue;
            let gj = LAM;
            for (let d = 0; d < DY; d++) gj += 2 * r[d] * A[j][d];
            for (let d = 0; d < DY; d++) B[j][d] -= (lr * gj * y[d]) / 8;
            c[j] -= (lr * gj) / 8;
          }
        }
      }
      setTrained(epoch / total);
      if (epoch < total) setTimeout(step, 0);
      else enc.current = { B, c };
    };
    step();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [world]);

  const draw = (ood: boolean) => {
    if (!enc.current) return;
    const rnd = mulberry32(Math.floor(Math.random() * 1e9));
    const S = ood ? oodPair(rnd) : idPair(rnd);
    const z = mkz(rnd, S);
    const y = mix(world.A, z);
    const { B, c } = enc.current;
    const pre = B.map((row, j) => row.reduce((s, w, d) => s + w * y[d], c[j]));
    setSample({ z, S, ood });
    setEncH(pre.map(v => Math.max(0, v)));
    // animate ISTA
    traceRef.current = istaTrace(world.A, y);
    setIstaH(traceRef.current[0]); setIstaIter(0);
    if (timerRef.current) clearInterval(timerRef.current);
    let i = 0;
    timerRef.current = setInterval(() => {
      i++;
      if (i >= traceRef.current.length) { if (timerRef.current) clearInterval(timerRef.current); return; }
      setIstaH(traceRef.current[i]); setIstaIter(i * 5);
    }, 90);
  };

  const Bars = ({ h, color, label, S }: { h: number[]; color: string; label: string; S: number[] }) => {
    const mx = Math.max(...h, 1);
    return (
      <div className="flex items-center gap-2">
        <div className="w-40 shrink-0 text-right text-[11px] text-zinc-500 dark:text-zinc-400">{label}</div>
        <svg width="100%" height="34" viewBox={`0 0 ${DH * 16} 34`} preserveAspectRatio="none" className="flex-1">
          {h.map((v, j) => (
            <g key={j}>
              <rect x={j * 16 + 2} y={30 - (v / mx) * 26} width={12} height={(v / mx) * 26 + 0.5}
                fill={color} fillOpacity={S.includes(j) ? 0.95 : 0.4} />
              {S.includes(j) && <circle cx={j * 16 + 8} cy={33} r={1.6} fill="currentColor" fillOpacity="0.5" />}
            </g>
          ))}
        </svg>
      </div>
    );
  };

  const encP = sample && encH ? precision(support(encH), sample.S) : null;
  const istaP = sample && istaH ? precision(support(istaH), sample.S) : null;

  return (
    <div className="not-prose rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 my-6 text-zinc-800 dark:text-zinc-200">
      <div className="flex flex-wrap items-baseline justify-between gap-2 mb-2">
        <div className="text-sm font-semibold">One forward pass versus an optimiser</div>
        <div className="text-[11px] text-zinc-400">same frozen ground-truth dictionary · d_y = 8, d_h = 16, k = 2</div>
      </div>

      {trained < 1 ? (
        <div className="py-6 text-center text-[13px] text-zinc-500 dark:text-zinc-400">
          training the amortised encoder on in-distribution compositions ({Math.round(trained * 100)}%)…
          <div className="mt-2 h-1.5 w-56 mx-auto rounded bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
            <div className="h-full bg-accent-500 rounded transition-all" style={{ width: `${trained * 100}%` }} />
          </div>
        </div>
      ) : (
        <>
          <div className="flex flex-wrap gap-1.5 mb-3">
            <button onClick={() => draw(false)}
              className="rounded-lg border border-zinc-300 dark:border-zinc-700 px-3 py-1.5 text-[13px] font-medium hover:border-accent-400 transition-colors">
              draw an in-distribution composition
            </button>
            <button onClick={() => draw(true)}
              className="rounded-lg border border-accent-500 text-accent-700 dark:text-accent-300 px-3 py-1.5 text-[13px] font-medium hover:bg-accent-50 dark:hover:bg-accent-950/40 transition-colors">
              draw a composition the encoder never saw
            </button>
          </div>

          {sample && encH && istaH && (
            <div className="rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800 px-3 py-3 space-y-2">
              <Bars h={sample.z} color={TRUE_C} label="true code z (dots mark true atoms)" S={sample.S} />
              <Bars h={encH} color={ENC_C} label={`encoder — 1 pass · precision ${encP!.toFixed(2)}`} S={sample.S} />
              <Bars h={istaH} color={ISTA_C} label={`ISTA — iter ${istaIter} · precision ${istaP!.toFixed(2)}`} S={sample.S} />
            </div>
          )}

          {sample && istaH && istaIter >= 115 && (
            <div className="mt-3 rounded-lg px-3 py-2 text-[13px] leading-relaxed"
              style={{ background: sample.ood ? 'rgba(176,53,107,0.08)' : 'rgba(113,113,122,0.08)' }}>
              {sample.ood
                ? <>On the novel composition, the encoder places mass on atoms from the training co-occurrence pattern
                  (precision {encP!.toFixed(2)}), while ISTA solves the lasso from scratch on this input and recovers
                  the correct support (precision {istaP!.toFixed(2)}). The dictionary is identical. The difference is
                  the inference procedure, and this is the amortisation gap.</>
                : <>In distribution, the encoder is a serviceable approximation ({encP!.toFixed(2)} vs {istaP!.toFixed(2)}),
                  because it interpolates the compositions it was fit on. Now draw a novel one.</>}
            </div>
          )}

          <p className="mt-3 text-[11px] text-zinc-400 leading-relaxed">
            The encoder is linear + ReLU, trained on 600 in-distribution samples when the page loads. ISTA runs 120
            soft-thresholding iterations per draw. In the paper, the harder result is that with learned dictionaries,
            swapping the encoder for ISTA no longer helps (§4.4).
          </p>
        </>
      )}
    </div>
  );
}
