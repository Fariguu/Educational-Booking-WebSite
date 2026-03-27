import { NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  // Protect cron endpoint
  const authHeader = request.headers.get('authorization')
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  try {
    const supabase = await createAdminClient()

    // Calcola la data limite: 365 giorni fa
    const cutoff = new Date()
    cutoff.setFullYear(cutoff.getFullYear() - 1)

    const { error, count } = await supabase
      .from('lessons')
      .delete({ count: 'exact' })
      .lt('end_time', cutoff.toISOString())

    if (error) {
      console.error('Errore pulizia lezioni vecchie:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log(`Cleanup: ${count} lezioni eliminate (più vecchie di ${cutoff.toISOString()})`)
    return NextResponse.json({ success: true, deleted: count })
  } catch (err: any) {
    console.error('Errore globale cleanup:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
