'use client'

import { useState } from 'react'

interface ParsedEntry {
  date: string
  playerName: string
  reason: string
  amount: number
}

interface Props {
  guildSlug: string
  onImportComplete?: () => void
}

export function SiphonedEnergyImport({ guildSlug, onImportComplete }: Props) {
  const [raw, setRaw] = useState('')
  const [parsed, setParsed] = useState<ParsedEntry[]>([])
  const [parseError, setParseError] = useState('')
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<{ imported: number; skipped: number; orphaned: number } | null>(null)
  const [notifyOnImport, setNotifyOnImport] = useState(false)

  function handleParse() {
    setParseError('')
    setResult(null)

    const lines = raw.trim().split('\n').filter(l => l.trim())
    const entries: ParsedEntry[] = []

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      // Remove surrounding quotes and split by tab
      const cols = line.split('\t').map(c => c.replace(/^"|"$/g, '').trim())

      // Skip header row
      if (cols[0]?.toLowerCase() === 'date') continue

      if (cols.length < 4) {
        setParseError(`Line ${i + 1}: expected 4 columns (Date, Player, Reason, Amount), got ${cols.length}`)
        return
      }

      const [date, playerName, reason, amountStr] = cols
      const amount = parseInt(amountStr, 10)

      if (isNaN(amount)) {
        setParseError(`Line ${i + 1}: invalid amount "${amountStr}"`)
        return
      }

      if (!date || !playerName) {
        setParseError(`Line ${i + 1}: missing date or player name`)
        return
      }

      entries.push({ date, playerName, reason: reason || '', amount })
    }

    if (entries.length === 0) {
      setParseError('No valid entries found. Paste TSV data with columns: Date, Player, Reason, Amount')
      return
    }

    setParsed(entries)
  }

  async function handleImport() {
    setImporting(true)
    setResult(null)
    try {
      const res = await fetch(`/api/guilds/${guildSlug}/siphoned-energy/import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entries: parsed, notify: notifyOnImport }),
      })
      if (!res.ok) {
        const data = await res.json()
        setParseError(data.error || 'Import failed')
        return
      }
      const data = await res.json()
      setResult(data)
      setParsed([])
      setRaw('')
      onImportComplete?.()
    } catch {
      setParseError('Network error')
    } finally {
      setImporting(false)
    }
  }

  return (
    <div className="card p-5 space-y-4">
      <div>
        <h3 className="font-display font-600 text-text-primary text-sm mb-1">Import Siphoned Energy Logs</h3>
        <p className="text-xs text-text-muted">Paste TSV data with columns: Date, Player, Reason, Amount. Duplicates are automatically skipped.</p>
      </div>

      <textarea
        value={raw}
        onChange={e => { setRaw(e.target.value); setParsed([]); setResult(null); setParseError('') }}
        placeholder={`"Date"\t"Player"\t"Reason"\t"Amount"\n"2026-03-12 15:06:51"\t"PlayerName"\t"Deposit"\t"10"`}
        className="input w-full h-32 font-mono text-xs resize-y"
      />

      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={handleParse}
          disabled={!raw.trim()}
          className="btn-secondary text-xs px-4 py-2"
        >
          Parse
        </button>

        {parsed.length > 0 && (
          <button
            onClick={handleImport}
            disabled={importing}
            className="btn-primary text-xs px-4 py-2"
          >
            {importing ? 'Importing…' : `Import ${parsed.length} entries`}
          </button>
        )}

        <label className="flex items-center gap-2 cursor-pointer ml-auto">
          <input
            type="checkbox"
            checked={notifyOnImport}
            onChange={e => setNotifyOnImport(e.target.checked)}
            className="w-3.5 h-3.5 rounded border-border bg-bg-elevated accent-teal-400"
          />
          <span className="text-xs text-text-secondary">Notify players in debt via Discord DM</span>
        </label>
      </div>

      {parseError && (
        <div className="text-xs text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">
          {parseError}
        </div>
      )}

      {result && (
        <div className="text-xs bg-emerald-400/10 border border-emerald-400/20 rounded-lg px-3 py-2 space-y-1">
          <p className="text-emerald-400 font-medium">Import complete</p>
          <p className="text-text-secondary">
            <span className="text-emerald-400 font-mono">{result.imported}</span> imported
            {result.skipped > 0 && <> · <span className="text-amber-400 font-mono">{result.skipped}</span> skipped (duplicates)</>}
            {result.orphaned > 0 && <> · <span className="text-amber-400 font-mono">{result.orphaned}</span> unlinked (player not in guild)</>}
          </p>
        </div>
      )}

      {/* Preview table */}
      {parsed.length > 0 && (
        <div className="border border-border rounded-lg overflow-hidden">
          <div className="max-h-60 overflow-y-auto">
            <table className="w-full text-xs">
              <thead className="bg-bg-elevated sticky top-0">
                <tr>
                  <th className="text-left px-3 py-2 text-text-muted font-medium">Date</th>
                  <th className="text-left px-3 py-2 text-text-muted font-medium">Player</th>
                  <th className="text-left px-3 py-2 text-text-muted font-medium">Reason</th>
                  <th className="text-right px-3 py-2 text-text-muted font-medium">Amount</th>
                </tr>
              </thead>
              <tbody>
                {parsed.map((e, i) => (
                  <tr key={i} className="border-t border-border-subtle">
                    <td className="px-3 py-1.5 font-mono text-text-muted">{e.date}</td>
                    <td className="px-3 py-1.5 text-text-primary">{e.playerName}</td>
                    <td className="px-3 py-1.5 text-text-secondary">{e.reason}</td>
                    <td className={`px-3 py-1.5 text-right font-mono font-medium ${e.amount > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {e.amount > 0 ? '+' : ''}{e.amount}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
