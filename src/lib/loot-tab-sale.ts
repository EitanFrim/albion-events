import { prisma } from '@/lib/prisma'
import { formatSilver, sendChannelMessage, editChannelMessage } from '@/lib/discord'

// ── Embed builder ────────────────────────────────────────────────────────

export function buildSaleEmbed(
  sale: {
    description?: string | null
    price: number
    expiresAt: Date
    createdAt: Date
    repairCost: number
    silverBags: number
  },
  bidCount: number,
  winner?: { discordName: string; inGameName?: string | null } | null
) {
  const expiryUnix = Math.floor(new Date(sale.expiresAt).getTime() / 1000)
  const isExpired = new Date(sale.expiresAt) <= new Date()

  const fields = [
    { name: 'Price', value: `${formatSilver(sale.price)} silver`, inline: true },
    {
      name: isExpired ? 'Ended' : 'Ends',
      value: isExpired ? `<t:${expiryUnix}:R>` : `<t:${expiryUnix}:R> (<t:${expiryUnix}:t>)`,
      inline: true,
    },
    { name: 'Signups', value: `${bidCount}`, inline: true },
  ]

  if (sale.repairCost > 0) {
    fields.push({ name: 'Repair Cost', value: `${formatSilver(sale.repairCost)} silver`, inline: true })
  }
  if (sale.silverBags > 0) {
    fields.push({ name: 'Silver Bags', value: `${formatSilver(sale.silverBags)} silver`, inline: true })
  }

  if (winner) {
    const winnerName = winner.inGameName || winner.discordName
    fields.push({ name: 'Winner', value: `**${winnerName}**`, inline: false })
  }

  return {
    title: sale.description || 'Loot Tab Sale',
    color: winner ? 0x22c55e : 0xf97316, // green if drawn, orange if open
    thumbnail: { url: 'https://render.albiononline.com/v1/item/T8_SILVERBAG_NONTRADABLE' },
    fields,
    footer: { text: winner ? 'Sale completed' : 'Click the button below to sign up!' },
    timestamp: new Date(sale.createdAt).toISOString(),
  }
}

// ── Button components builder ────────────────────────────────────────────

export function buildSaleComponents(saleId: string, isOpen: boolean) {
  return {
    type: 1, // ACTION_ROW
    components: [
      {
        type: 2, // BUTTON
        style: isOpen ? 3 : 2, // SUCCESS (green) when open, SECONDARY (grey) when closed
        label: isOpen ? 'Sign Up' : 'Closed',
        custom_id: `loot_tab_signup:${saleId}`,
        disabled: !isOpen,
      },
    ],
  }
}

// ── Draw winner ──────────────────────────────────────────────────────────

export type DrawResult =
  | { status: 'drawn'; winner: { id: string; discordUserId: string; discordName: string; inGameName: string | null } }
  | { status: 'no_bids' }
  | { status: 'not_found' }

export async function drawWinner(saleId: string): Promise<DrawResult> {
  return await prisma.$transaction(async (tx) => {
    // Lock on the sale row — only process if still OPEN
    const sale = await tx.lootTabSale.findFirst({
      where: { id: saleId, status: 'OPEN' },
      include: {
        createdBy: { select: { discordUserId: true, discordName: true } },
        bids: {
          include: {
            user: { select: { id: true, discordUserId: true, discordName: true, inGameName: true } },
          },
        },
      },
    })

    if (!sale) {
      return { status: 'not_found' as const }
    }

    // No bids → cancel
    if (sale.bids.length === 0) {
      await tx.lootTabSale.update({
        where: { id: saleId },
        data: { status: 'CANCELLED', drawnAt: new Date() },
      })

      // Update Discord embed if we have the message reference
      if (sale.channelId && sale.messageId) {
        const embed = buildSaleEmbed(sale, 0)
        embed.title = `${embed.title} — Cancelled`
        embed.color = 0xef4444 // red
        embed.footer = { text: 'No signups — sale cancelled' }
        await editChannelMessage(sale.channelId, sale.messageId, {
          embeds: [embed],
          components: [buildSaleComponents(saleId, false)],
        })
      }

      return { status: 'no_bids' as const }
    }

    // Pick a random winner
    const winningBid = sale.bids[Math.floor(Math.random() * sale.bids.length)]
    const winner = winningBid.user

    // Update sale
    await tx.lootTabSale.update({
      where: { id: saleId },
      data: {
        status: 'DRAWN',
        winnerId: winner.id,
        drawnAt: new Date(),
      },
    })

    // Update Discord embed
    if (sale.channelId && sale.messageId) {
      const embed = buildSaleEmbed(sale, sale.bids.length, winner)
      await editChannelMessage(sale.channelId, sale.messageId, {
        embeds: [embed],
        components: [buildSaleComponents(saleId, false)],
      })
    }

    // Send follow-up ping in channel
    if (sale.channelId) {
      const winnerName = winner.inGameName || winner.discordName
      await sendChannelMessage(sale.channelId, {
        content: `🎉 **Loot Tab Sale Winner!**\n\n<@${winner.discordUserId}> has won **${sale.description || 'the loot tab'}** for **${formatSilver(sale.price)}** silver!\n\n<@${sale.createdBy.discordUserId}> — please coordinate the trade with **${winnerName}**.`,
      })
    }

    return {
      status: 'drawn' as const,
      winner: {
        id: winner.id,
        discordUserId: winner.discordUserId,
        discordName: winner.discordName,
        inGameName: winner.inGameName,
      },
    }
  })
}

// ── Time formatting ──────────────────────────────────────────────────────

export function formatTimeRemaining(expiresAt: Date): string {
  const now = new Date()
  const diff = new Date(expiresAt).getTime() - now.getTime()

  if (diff <= 0) return 'Expired'

  const hours = Math.floor(diff / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

  if (hours > 0) return `${hours}h ${minutes}m remaining`
  return `${minutes}m remaining`
}
