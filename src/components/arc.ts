/**
 * Tiny progress thread connecting the post's demos into one arc.
 * Steps: ladder → dial → gap → language. Persisted in localStorage.
 */

export type ArcStep = 'ladder' | 'dial' | 'gap' | 'language';
export const ARC_STEPS: { id: ArcStep; label: string }[] = [
  { id: 'ladder', label: 'Place the evidence' },
  { id: 'dial', label: 'Feel the theorem' },
  { id: 'gap', label: 'Calibrate on the literature' },
  { id: 'language', label: 'Fix the language' },
];

const KEY = 'causality-arc-v1';

export function completedSteps(): ArcStep[] {
  if (typeof window === 'undefined') return [];
  try { return JSON.parse(window.localStorage.getItem(KEY) || '[]'); } catch { return []; }
}

export function emitArc(step: ArcStep) {
  if (typeof window === 'undefined') return;
  const done = completedSteps();
  if (!done.includes(step)) {
    done.push(step);
    try { window.localStorage.setItem(KEY, JSON.stringify(done)); } catch { /* private mode */ }
  }
  window.dispatchEvent(new CustomEvent('arc:step', { detail: step }));
}

export function resetArc() {
  if (typeof window === 'undefined') return;
  try { window.localStorage.removeItem(KEY); } catch { /* */ }
  window.dispatchEvent(new CustomEvent('arc:step', { detail: null }));
}
