import { NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase/server'
import { Resend } from 'resend'

const resend = process.env.RESEND_API_KEY && process.env.RESEND_API_KEY !== 're_...'
  ? new Resend(process.env.RESEND_API_KEY)
  : null

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  // Verifica l'autorizzazione (Se usi Vercel Cron)
  const authHeader = request.headers.get('authorization')
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  try {
    const supabase = await createAdminClient()

    // Calcola il range di tempo: lezioni terminate nelle ultime 24 ore
    const now = new Date()
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000)

    // Trova lezioni confermate che sono terminate ieri e non hanno la review richiesta
    const { data: recentLessons, error: fetchErr } = await supabase
      .from('lessons')
      .select(`
        id, 
        end_time,
        professors:professor_id(
          slug, 
          profiles(first_name, last_name)
        ),
        students:student_id(
          profiles(first_name, email)
        )
      `)
      .eq('status', 'confirmed')
      .eq('review_requested', false)
      .lt('end_time', now.toISOString())
      .gte('end_time', yesterday.toISOString())

    if (fetchErr) {
      console.error('Errore nel fetch delle lezioni:', fetchErr)
      return NextResponse.json({ error: 'Errore DB' }, { status: 500 })
    }

    if (!recentLessons || recentLessons.length === 0) {
      return NextResponse.json({ success: true, message: 'Nessuna nuova lezione completata da notificare.' })
    }

    let emailsSent = 0

    // Per ogni lezione, verifichiamo se lo studente ha già recensito il prof
    for (const lesson of recentLessons) {
      const studentProfile = (lesson.students as any)?.profiles;
      const studentEmail = studentProfile?.email;
      const studentName = studentProfile?.first_name || 'Studente';

      if (!studentEmail || !resend) continue;

      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
      const profProfile = (lesson.professors as any)?.profiles;
      const profName = profProfile ? `${profProfile.first_name} ${profProfile.last_name || ''}`.trim() : 'il tuo insegnante';
      const profSlug = (lesson.professors as any)?.slug || '';
      
      const reviewUrl = `${siteUrl}/professori/${profSlug}`

      try {
        await resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL || 'Prenotazioni <onboarding@resend.dev>',
          to: studentEmail,
          subject: `Come è andata la tua lezione con ${profName}?`,
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 32px; border: 1px solid #e2e8f0; border-radius: 16px;">
              <h1 style="color: #4f46e5; font-size: 24px;">Lascia una Recensione! ⭐</h1>
              <p style="color: #374151;">Ciao <strong>${studentName}</strong>,</p>
              <p style="color: #374151;">Speriamo che la tua recente lezione con <strong>${profName}</strong> sia andata benissimo!</p>
              <p style="color: #374151;">Il tuo feedback è fondamentale per noi e per aiutare altri studenti a trovare il docente perfetto.</p>
              
              <div style="text-align: center; margin: 32px 0;">
                <a href="${reviewUrl}" style="background-color: #f59e0b; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
                  Valuta l'Insegnante
                </a>
              </div>
              
              <p style="color: #6b7280; font-size: 14px;">Ci vorrà solo un minuto. Grazie mille per il tuo contributo!</p>
            </div>
          `,
        })
        
        // Contrassegna come inviata per evitare futuri doppioni
        await supabase.from('lessons').update({ review_requested: true }).eq('id', lesson.id)

        emailsSent++
      } catch (err) {
        console.error('Errore invio email per recensione:', err)
      }
    }

    return NextResponse.json({ success: true, emailsSent })

  } catch (globalErr: any) {
    console.error('Errore global resend review cron:', globalErr)
    return NextResponse.json({ error: globalErr.message }, { status: 500 })
  }
}
