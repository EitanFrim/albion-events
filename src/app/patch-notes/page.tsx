import Link from 'next/link'
import { patchNotes } from '@/lib/patch-notes'

const typeBadge = {
  added: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
  fixed: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
  improved: 'bg-sky-500/15 text-sky-400 border-sky-500/20',
} as const

const typeLabel = {
  added: 'Added',
  fixed: 'Fixed',
  improved: 'Improved',
} as const

export const metadata = {
  title: 'Patch Notes — AlbionHQ',
  description: 'See what\'s new in AlbionHQ. Latest updates, fixes, and improvements.',
}

export default function PatchNotesPage() {
  return (
    <div className="min-h-screen bg-bg-base">
      <div className="max-w-3xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-10">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text-secondary transition-colors mb-6"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Back to Home
          </Link>
          <h1 className="font-display text-3xl font-800 text-text-primary tracking-tight mb-2">
            Patch Notes
          </h1>
          <p className="text-text-secondary text-sm">
            Latest updates, new features, and bug fixes for AlbionHQ.
          </p>
        </div>

        {/* Timeline */}
        <div className="space-y-6">
          {patchNotes.map((note, i) => (
            <article
              key={note.version}
              className="rounded-xl border border-border bg-bg-surface p-6 shadow-card"
            >
              {/* Version header */}
              <div className="flex items-center gap-3 mb-4">
                <span className="font-mono text-sm font-semibold text-accent bg-accent/10 border border-accent/20 px-2.5 py-1 rounded-lg">
                  v{note.version}
                </span>
                <span className="text-xs text-text-muted font-mono">
                  {new Date(note.date + 'T00:00:00').toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </span>
                {i === 0 && (
                  <span className="text-xs font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                    Latest
                  </span>
                )}
              </div>

              <h2 className="font-display text-lg font-700 text-text-primary mb-4">
                {note.title}
              </h2>

              {/* Changes list */}
              <ul className="space-y-2.5">
                {note.changes.map((change, j) => (
                  <li key={j} className="flex items-start gap-2.5">
                    <span
                      className={`inline-flex items-center text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded border flex-shrink-0 mt-0.5 ${typeBadge[change.type]}`}
                    >
                      {typeLabel[change.type]}
                    </span>
                    <span className="text-sm text-text-secondary leading-relaxed">
                      {change.text}
                    </span>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </div>
    </div>
  )
}
