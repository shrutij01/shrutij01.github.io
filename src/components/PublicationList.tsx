import { useState, useCallback } from 'react';
import type { Publication } from '../data/publications';

function BibTexModal({ bibtex, onClose }: { bibtex: string; onClose: () => void }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(bibtex);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [bibtex]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-lg bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-700 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-3 border-b border-zinc-100 dark:border-zinc-800">
          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">BibTeX</span>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <pre className="p-5 text-xs font-mono text-zinc-700 dark:text-zinc-300 overflow-x-auto whitespace-pre-wrap">
          {bibtex}
        </pre>
        <div className="px-5 py-3 border-t border-zinc-100 dark:border-zinc-800 flex justify-end">
          <button
            onClick={handleCopy}
            className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg bg-purple-600 text-white hover:bg-purple-700 dark:bg-purple-500 dark:hover:bg-purple-400 dark:text-zinc-950 transition-colors"
          >
            {copied ? (
              <>
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
                Copied
              </>
            ) : (
              <>
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9.75a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
                </svg>
                Copy
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function PublicationCard({ pub }: { pub: Publication }) {
  const [showBibtex, setShowBibtex] = useState(false);
  const [expanded, setExpanded] = useState(false);

  return (
    <>
      <div className={`group py-5 ${pub.highlight ? 'border-l-2 border-purple-400 dark:border-purple-500 pl-5 -ml-5' : ''}`}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-medium text-zinc-900 dark:text-zinc-100 leading-snug">
              {pub.title}
            </h3>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              {pub.authors}
            </p>
            <p className="mt-0.5 text-sm">
              <span className="text-zinc-600 dark:text-zinc-300 font-medium">{pub.venue}</span>
              <span className="text-zinc-400 dark:text-zinc-500"> · {pub.year}</span>
            </p>
          </div>
        </div>

        {/* Abstract toggle */}
        {pub.abstract && (
          <div className="mt-2">
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
            >
              {expanded ? '− Hide abstract' : '+ Abstract'}
            </button>
            {expanded && (
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                {pub.abstract}
              </p>
            )}
          </div>
        )}

        {/* Tags + links */}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {pub.tags.map((tag) => (
            <span key={tag} className="inline-block text-[11px] font-medium px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700">
              {tag}
            </span>
          ))}
          <span className="text-zinc-200 dark:text-zinc-700">|</span>
          {pub.links.map(({ label, href }) => (
            <a
              key={label}
              href={href}
              target="_blank"
              rel="noopener"
              className="text-xs font-medium text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300 transition-colors"
            >
              {label} ↗
            </a>
          ))}
          <button
            onClick={() => setShowBibtex(true)}
            className="text-xs font-medium text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
          >
            BibTeX
          </button>
        </div>
      </div>
      {showBibtex && <BibTexModal bibtex={pub.bibtex} onClose={() => setShowBibtex(false)} />}
    </>
  );
}

const PRIMARY_TAGS = ['method', 'evaluation', 'software-package'];

function TagButton({ tag, active, onClick }: { tag: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`text-xs font-medium px-3 py-1 rounded-full border transition-colors ${
        active
          ? 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800'
          : 'bg-zinc-50 text-zinc-500 border-zinc-200 dark:bg-zinc-900 dark:text-zinc-400 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600'
      }`}
    >
      {tag}
    </button>
  );
}

export default function PublicationList({
  publications,
  allTags,
}: {
  publications: Publication[];
  allTags: string[];
}) {
  const [activeTags, setActiveTags] = useState<Set<string>>(new Set());

  const toggleTag = (tag: string) => {
    setActiveTags((prev) => {
      const next = new Set(prev);
      next.has(tag) ? next.delete(tag) : next.add(tag);
      return next;
    });
  };

  const filtered = activeTags.size === 0
    ? publications
    : publications.filter((p) => p.tags.some((t) => activeTags.has(t)));

  const grouped = filtered.reduce<Record<number, Publication[]>>((acc, pub) => {
    (acc[pub.year] ??= []).push(pub);
    return acc;
  }, {});

  const years = Object.keys(grouped).map(Number).sort((a, b) => b - a);

  const primaryTags = PRIMARY_TAGS.filter((t) => allTags.includes(t));
  const secondaryTags = allTags.filter((t) => !PRIMARY_TAGS.includes(t));

  return (
    <div>
      {/* Tag filters — primary row then secondary */}
      <div className="mb-8 space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          {primaryTags.map((tag) => (
            <TagButton key={tag} tag={tag} active={activeTags.has(tag)} onClick={() => toggleTag(tag)} />
          ))}
          {activeTags.size > 0 && (
            <button
              onClick={() => setActiveTags(new Set())}
              className="text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 ml-1"
            >
              Clear
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {secondaryTags.map((tag) => (
            <TagButton key={tag} tag={tag} active={activeTags.has(tag)} onClick={() => toggleTag(tag)} />
          ))}
        </div>
      </div>

      {/* Grouped by year */}
      {years.map((year) => (
        <div key={year} className="mb-8">
          <h2 className="text-sm font-semibold text-zinc-400 dark:text-zinc-500 mb-2">{year}</h2>
          <div className="divide-y divide-zinc-100 dark:divide-zinc-800/50">
            {grouped[year].map((pub) => (
              <PublicationCard key={pub.id} pub={pub} />
            ))}
          </div>
        </div>
      ))}

      {filtered.length === 0 && (
        <p className="text-sm text-zinc-400 dark:text-zinc-500 py-8 text-center">
          No publications match the selected filters.
        </p>
      )}
    </div>
  );
}