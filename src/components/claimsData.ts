/**
 * Shared loader for the pilot-study dataset (annotations.csv from the public
 * replication repo). Fetch is cached on window so multiple islands share one request.
 */

export const CSV_URL = 'https://raw.githubusercontent.com/rpatrik96/mech-interp-claim-calibration/main/annotations.csv';
export const REPO_URL = 'https://github.com/rpatrik96/mech-interp-claim-calibration';

export const RUNG_COLOR = { 1: '#4A6FA5', 2: '#C07A18', 3: '#B0356B' } as const;

export type Claim = {
  paper: string; text: string; location: string; method: string;
  methodRung: number; claimRung: number; gap: number; confidence: number;
  note: string; replication: string; replicationEvidence: string;
};

export function parseCsv(src: string): Claim[] {
  const rows: string[][] = [];
  let row: string[] = [], field = '', inQ = false;
  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (inQ) {
      if (ch === '"' && src[i + 1] === '"') { field += '"'; i++; }
      else if (ch === '"') inQ = false;
      else field += ch;
    } else if (ch === '"') inQ = true;
    else if (ch === ',') { row.push(field); field = ''; }
    else if (ch === '\n' || ch === '\r') {
      if (field !== '' || row.length) { row.push(field); rows.push(row); row = []; field = ''; }
      if (ch === '\r' && src[i + 1] === '\n') i++;
    } else field += ch;
  }
  if (field !== '' || row.length) { row.push(field); rows.push(row); }
  const head = rows[0];
  const col = (n: string) => head.indexOf(n);
  const [pi, ct, cl, mu, mr, cr, gs, cf, no, rs, re] =
    ['paper_id', 'claim_text', 'claim_location', 'method_used', 'method_rung', 'claim_rung', 'gap_score', 'confidence', 'notes', 'replication_status', 'replication_evidence'].map(col);
  return rows.slice(1).filter(r => r.length >= head.length - 1 && r[pi]).map(r => ({
    paper: r[pi], text: r[ct], location: r[cl], method: r[mu],
    methodRung: +r[mr] || 0, claimRung: +r[cr] || 0, gap: r[gs] === 'NA' ? -1 : +r[gs],
    confidence: +r[cf] || 0, note: r[no] ?? '', replication: r[rs] ?? '', replicationEvidence: r[re] ?? '',
  }));
}

declare global { interface Window { __claimsPromise?: Promise<Claim[]> } }

export function fetchClaims(): Promise<Claim[]> {
  if (typeof window === 'undefined') return Promise.resolve([]);
  if (!window.__claimsPromise) {
    window.__claimsPromise = fetch(CSV_URL)
      .then(r => { if (!r.ok) throw new Error('fetch failed'); return r.text(); })
      .then(parseCsv);
    window.__claimsPromise.catch(() => { delete window.__claimsPromise; });
  }
  return window.__claimsPromise;
}

export const REPLICATION_LABEL: Record<string, string> = {
  '0': 'independently replicated',
  '0.5': 'partially replicated',
  '1': 'failed to replicate',
};

// method-family filters for the browser
export const METHOD_FAMILIES: { id: string; label: string; test: (m: string) => boolean }[] = [
  { id: 'probing', label: 'probing', test: m => /prob|logit lens|attention vis/i.test(m) },
  { id: 'sae', label: 'SAE / dictionary', test: m => /sae|autoencoder|dictionary|sparse/i.test(m) },
  { id: 'patching', label: 'patching / tracing', test: m => /patch|tracing|ablat|mediation|interchange|causal/i.test(m) },
  { id: 'steering', label: 'steering', test: m => /steer/i.test(m) },
  { id: 'editing', label: 'editing', test: m => /edit|rome|memit|hyper-?network|weight/i.test(m) },
];
