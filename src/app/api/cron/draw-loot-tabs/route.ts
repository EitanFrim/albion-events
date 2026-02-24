export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { drawWinner } from '@/lib/loot-tab-sale'

export async function GET(req: NextRequest) {
  // Verify Vercel Cron secret
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Find all OPEN sales that have expired
  const expiredSales = await prisma.lootTabSale.findMany({
    where: {
      status: 'OPEN',
      expiresAt: { lte: new Date() },
    },
  })

  const results = []
  for (const sale of expiredSales) {
    try {
      const result = await drawWinner(sale.id)
      results.push({ saleId: sale.id, ...result })
    } catch (err) {
      console.error(`Failed to draw sale ${sale.id}:`, err)
      results.push({ saleId: sale.id, status: 'error', error: String(err) })
    }
  }

  return NextResponse.json({ processed: results.length, results })
}
