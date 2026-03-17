'use client'

import { useState } from 'react'

interface ParsedEntry {
  playerName: string
  amount: number
}

interface Props {
  guildSlug: string
  onImportComplete?: () => void
}

export function BalanceImport({ guildSlug, onImportComplete }: Props) {
  const [raw, setRaw] = useState('')
  const [parsed, setParsed] = useState<ParsedEntry[]>([])
  const [parseError, setParseError] = useState('')
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<{ applied: number; pending: number; updated: number } | null>(null)

  function handleParse() {
    setParseError('')
    setResult(null)

    const lines = raw.trim().split('\n').filter(l => l.trim())
    const entries: ParsedEntry[] = []

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      // Split by tab
      const cols = line.split('\t').map(c => c.replace(/^"|"$/g, '').trim())

      if (cols.length < 2) {
        setParseError(`Line ${i + 1}: expected at least 2 columns (Player, Balance), got ${cols.length}`)
        return
      }

      const [playerName, amountStr] = cols
      // Parse amount: remove commas and whitespace
      const amount = parseInt(amountStr.replace(/,/g, '').trim(), 10)

      if (!playerName) {
        setParseError(`Line ${i + 1}: missing player name`)
        return
      }

      if (isNaN(amount)) {
        setParseError(`Line ${i + 1}: invalid amount "${amountStr}"`)
        return
      }

      entries.push({ playerName, amount })
    }

    if (entries.length === 0) {
      setParseError('No valid entries found. Paste a tab-separated list with columns: Player, Balance')
      return
    }

    setParsed(entries)
  }

  async function handleImport() {
    setImporting(true)
    setResult(null)
    try {
      const res = await fetch(`/api/guilds/${guildSlug}/balance-import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entries: parsed.filter(e => e.amount !== 0) }),
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

  const totalSilver = parsed.reduce((sum, e) => sum + e.amount, 0)
  const nonZero = parsed.filter(e => e.amount !== 0)

  return (
    <div className="card p-5 space-y-4">
      <div>
        <h3 className="font-display font-600 text-text-primary text-sm mb-1">Import Silver Balances</h3>
        <p className="text-xs text-text-muted">
          Paste a tab-separated list of players and their silver balances from your old system.
          Registered players will receive their balance immediately. Unregistered players will get theirs when they register.
        </p>
      </div>

      <div className="bg-bg-elevated/60 border border-border-subtle rounded-lg px-4 py-3 space-y-2">
        <p className="text-xs font-medium text-text-secondary">Expected format (tab-separated):</p>
        <pre className="text-xs text-text-muted font-mono bg-bg-overlay rounded px-3 py-2">
{`PlayerName1\t4,118,285
PlayerName2\t0
PlayerName3\t2,972,307`}
        </pre>
      </div>

      <textarea
        value={raw}
        onChange={e => { setRaw(e.target.value); setParsed([]); setResult(null); setParseError('') }}
        placeholder={`Alessio24\t4,118,285\nAm3li4\t0\nandrukas1\t2,972,307`}
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
            {importing ? 'Importing…' : `Import ${nonZero.length} balances`}
          </button>
        )}
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
            <span className="text-emerald-400 font-mono">{result.applied}</span> applied to registered players
            {result.pending > 0 && <> · <span className="text-amber-400 font-mono">{result.pending}</span> pending (will apply on registration)</>}
            {result.updated > 0 && <> · <span className="text-blue-400 font-mono">{result.updated}</span> updated (previously pending)</>}
          </p>
        </div>
      )}

      {/* Preview table */}
      {nonZero.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-text-muted">
            <span>{nonZero.length} players</span>
            <span className="font-mono text-text-secondary">{totalSilver.toLocaleString()} total silver</span>
          </div>
          <div className="border border-border rounded-lg overflow-hidden">
            <div className="max-h-60 overflow-y-auto">
              <table className="w-full text-xs">
                <thead className="bg-bg-elevated sticky top-0">
                  <tr>
                    <th className="text-left px-3 py-2 text-text-muted font-medium">Player</th>
                    <th className="text-right px-3 py-2 text-text-muted font-medium">Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {nonZero.map((e, i) => (
                    <tr key={i} className="border-t border-border-subtle">
                      <td className="px-3 py-1.5 text-text-primary">{e.playerName}</td>
                      <td className={`px-3 py-1.5 text-right font-mono font-medium ${e.amount > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {e.amount.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
