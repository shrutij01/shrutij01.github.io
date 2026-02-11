import { useState, useRef, useEffect, useCallback } from 'react';

/**
 * Interactive 2D demo: shows how a linear encoder transforms
 * latent factors into representation space. Users can drag
 * the encoder matrix entries and see how axis-alignment,
 * rotation, and superposition affect a toy metric (correlation
 * between individual codes and individual factors).
 */

type Point = { z1: number; z2: number };

function generatePoints(n: number, corr: number): Point[] {
  const pts: Point[] = [];
  for (let i = 0; i < n; i++) {
    const u = gaussRandom();
    const v = gaussRandom();
    const z1 = u;
    const z2 = corr * u + Math.sqrt(1 - corr * corr) * v;
    pts.push({ z1, z2 });
  }
  return pts;
}

function gaussRandom(): number {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

function computeMCC(points: Point[], A: number[][]): number {
  // Simplified: mean absolute correlation between z_i and hat_z_j
  const n = points.length;
  const z1 = points.map(p => p.z1);
  const z2 = points.map(p => p.z2);
  const h1 = points.map(p => A[0][0] * p.z1 + A[0][1] * p.z2);
  const h2 = points.map(p => A[1][0] * p.z1 + A[1][1] * p.z2);

  const corr = (a: number[], b: number[]) => {
    const ma = a.reduce((s, x) => s + x, 0) / n;
    const mb = b.reduce((s, x) => s + x, 0) / n;
    let num = 0, da = 0, db = 0;
    for (let i = 0; i < n; i++) {
      const ai = a[i] - ma, bi = b[i] - mb;
      num += ai * bi; da += ai * ai; db += bi * bi;
    }
    return da > 0 && db > 0 ? Math.abs(num / Math.sqrt(da * db)) : 0;
  };

  // Hungarian-style: best 1-1 matching of |corr|
  const c11 = corr(z1, h1), c12 = corr(z1, h2);
  const c21 = corr(z2, h1), c22 = corr(z2, h2);
  const match1 = c11 + c22;
  const match2 = c12 + c21;
  return Math.max(match1, match2) / 2;
}

function ScatterCanvas({
  points,
  A,
  width,
  height,
}: {
  points: Point[];
  A: number[][];
  width: number;
  height: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const canvas = canvasRef.current!;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    const hw = width / 2, hh = height / 2;
    const scale = Math.min(hw, hh) * 0.25;

    ctx.clearRect(0, 0, width, height);

    // Grid
    ctx.strokeStyle = getComputedStyle(document.documentElement)
      .getPropertyValue('color-scheme') === 'dark' ? '#27272a' : '#f4f4f5';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(hw, 0); ctx.lineTo(hw, height);
    ctx.moveTo(0, hh); ctx.lineTo(width, hh);
    ctx.stroke();

    // Axes in representation space
    ctx.strokeStyle = '#a1a1aa';
    ctx.lineWidth = 0.5;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    const ax1 = { x: A[0][0], y: A[1][0] };
    const ax2 = { x: A[0][1], y: A[1][1] };
    ctx.moveTo(hw - ax1.x * scale * 4, hh + ax1.y * scale * 4);
    ctx.lineTo(hw + ax1.x * scale * 4, hh - ax1.y * scale * 4);
    ctx.moveTo(hw - ax2.x * scale * 4, hh + ax2.y * scale * 4);
    ctx.lineTo(hw + ax2.x * scale * 4, hh - ax2.y * scale * 4);
    ctx.stroke();
    ctx.setLineDash([]);

    // Points
    for (const p of points) {
      const hx = A[0][0] * p.z1 + A[0][1] * p.z2;
      const hy = A[1][0] * p.z1 + A[1][1] * p.z2;
      const sx = hw + hx * scale;
      const sy = hh - hy * scale;

      ctx.beginPath();
      ctx.arc(sx, sy, 2.5, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(51, 141, 255, 0.6)';
      ctx.fill();
    }

    // Labels
    ctx.font = '11px Inter, system-ui, sans-serif';
    ctx.fillStyle = '#a1a1aa';
    ctx.fillText('ẑ₁', width - 20, hh - 6);
    ctx.fillText('ẑ₂', hw + 6, 14);
  }, [points, A, width, height]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width, height }}
      className="rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900"
    />
  );
}

export default function RepresentationDemo() {
  const [corr, setCorr] = useState(0);
  const [angle, setAngle] = useState(0); // rotation in degrees
  const [scaleX, setScaleX] = useState(1);
  const [scaleY, setScaleY] = useState(1);

  const rad = (angle * Math.PI) / 180;
  const A = [
    [scaleX * Math.cos(rad), -scaleY * Math.sin(rad)],
    [scaleX * Math.sin(rad),  scaleY * Math.cos(rad)],
  ];

  const [points] = useState(() => generatePoints(200, 0));

  // Recompute with correlation
  const corrPoints = useCallback(() => generatePoints(200, corr), [corr]);
  const [pts, setPts] = useState(points);
  useEffect(() => { setPts(corrPoints()); }, [corr]);

  const mcc = computeMCC(pts, A);

  const det = A[0][0] * A[1][1] - A[0][1] * A[1][0];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-start">
        <ScatterCanvas points={pts} A={A} width={300} height={300} />

        <div className="space-y-5">
          {/* Metric readout */}
          <div className="p-4 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
            <div className="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-2">Metric readout</div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="text-xs text-zinc-500">MCC</div>
                <div className={`text-xl font-mono font-semibold ${mcc > 0.9 ? 'text-emerald-500' : mcc > 0.7 ? 'text-amber-500' : 'text-red-500'}`}>
                  {mcc.toFixed(3)}
                </div>
              </div>
              <div>
                <div className="text-xs text-zinc-500">det(A)</div>
                <div className="text-xl font-mono font-semibold text-zinc-600 dark:text-zinc-300">
                  {det.toFixed(2)}
                </div>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="space-y-3">
            <SliderControl label="Rotation" value={angle} min={0} max={90} step={1} unit="°"
              onChange={setAngle} />
            <SliderControl label="Scale ẑ₁" value={scaleX} min={0.1} max={3} step={0.1} unit="×"
              onChange={setScaleX} />
            <SliderControl label="Scale ẑ₂" value={scaleY} min={0.1} max={3} step={0.1} unit="×"
              onChange={setScaleY} />
            <SliderControl label="Latent correlation" value={corr} min={0} max={0.95} step={0.05} unit=""
              onChange={setCorr} />
          </div>
        </div>
      </div>

      <p className="text-xs text-zinc-400 dark:text-zinc-500 leading-relaxed">
        Drag the sliders to see how encoder geometry (rotation, scaling) and DGP
        properties (latent correlation) affect the MCC metric. At 0° rotation with
        unit scaling, MCC = 1. Rotating 45° makes the encoder linearly entangled
        (E3)—information is preserved (det ≠ 0) but MCC drops because axis-alignment
        is violated. Increasing correlation shows how MCC can remain high even when
        the encoder is misspecified.
      </p>
    </div>
  );
}

function SliderControl({
  label, value, min, max, step, unit, onChange,
}: {
  label: string; value: number; min: number; max: number;
  step: number; unit: string; onChange: (v: number) => void;
}) {
  return (
    <label className="block">
      <div className="flex justify-between text-xs mb-1">
        <span className="text-zinc-500">{label}</span>
        <span className="font-mono text-zinc-400">{value.toFixed(step < 1 ? 2 : 0)}{unit}</span>
      </div>
      <input
        type="range"
        min={min} max={max} step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-1.5 rounded-full appearance-none bg-zinc-200 dark:bg-zinc-700 accent-accent-500"
      />
    </label>
  );
}
