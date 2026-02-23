/**
 * Albion Online gameinfo API — verify player names exist.
 */

export const ALBION_REGIONS: Record<string, string> = {
  americas: 'https://gameinfo.albiononline.com',
  europe: 'https://gameinfo-ams.albiononline.com',
  asia: 'https://gameinfo-sgp.albiononline.com',
}

export const REGION_LABELS: Record<string, string> = {
  americas: 'Americas',
  europe: 'Europe',
  asia: 'Asia',
}

interface AlbionPlayer {
  Id: string
  Name: string
  GuildName: string | null
  AllianceName: string | null
  KillFame: number
  DeathFame: number
}

interface SearchResponse {
  players: AlbionPlayer[]
  guilds: unknown[]
}

/**
 * Verify that a player name exists in Albion Online.
 * Returns the exact name (correct casing) from the API if found.
 */
export async function verifyAlbionName(
  name: string,
  region: string
): Promise<{ valid: boolean; exactName: string | null }> {
  const baseUrl = ALBION_REGIONS[region]
  if (!baseUrl) return { valid: false, exactName: null }

  try {
    const res = await fetch(
      `${baseUrl}/api/gameinfo/search?q=${encodeURIComponent(name)}`,
      { next: { revalidate: 0 } }
    )

    if (!res.ok) {
      console.error(`Albion API error: ${res.status}`)
      // On API error, allow the name through (don't block registration)
      return { valid: true, exactName: name }
    }

    const data: SearchResponse = await res.json()

    // Look for exact case-insensitive match
    const match = data.players?.find(
      (p) => p.Name.toLowerCase() === name.toLowerCase()
    )

    if (match) {
      return { valid: true, exactName: match.Name }
    }

    return { valid: false, exactName: null }
  } catch (err) {
    console.error('Albion API fetch error:', err)
    // On network error, allow the name through (don't block registration)
    return { valid: true, exactName: name }
  }
}
