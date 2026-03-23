import { createClient } from '@/utils/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { BookOpen, GraduationCap, Mail, CalendarCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import PublicNavbar from '@/components/public-navbar'
import { ReviewSection } from '@/components/review-section'
import { getProfessorReviewsAction } from '@/app/actions/reviews'
import { Star } from 'lucide-react'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> | { slug: string } }) {
  const resolvedParams = await Promise.resolve(params)
  const supabase = await createClient()
  const { data: prof } = await supabase
    .from('professors')
    .select('profiles!inner(first_name, last_name, bio)')
    .eq('slug', resolvedParams.slug)
    .single()
  
  const profile = (prof as any)?.profiles
  const name = profile ? `${profile.first_name} ${profile.last_name || ''}`.trim() : 'Docente'
  
  return {
    title: prof ? `${name} – Profilo Docente` : 'Docente non trovato',
    description: profile?.bio || 'Consulta il profilo del docente e prenota una lezione.',
  }
}

export default async function ProfessorProfilePage({ params }: { params: Promise<{ slug: string }> | { slug: string } }) {
  const resolvedParams = await Promise.resolve(params)
  const slug = resolvedParams.slug

  const supabase = await createClient()
  const { data: profRecord, error } = await supabase
    .from('professors')
    .select('*, profiles!inner(first_name, last_name, bio, avatar_url)')
    .eq('slug', slug)
    .single()

  if (!profRecord || error) {
    notFound()
  }

  const p = (profRecord as any).profiles
  const professor = {
    id: profRecord.id,
    slug: profRecord.slug,
    subjects: profRecord.teaching_subjects || (profRecord as any).subjects || [],
    name: p ? `${p.first_name || ''} ${p.last_name || ''}`.trim() : 'Docente',
    bio: p?.bio,
    avatar_url: p?.avatar_url
  }

  // Check if the currently logged-in user is the owner of this profile
  const { data: { user } } = await supabase.auth.getUser()
  const isOwner = !!user && user.id === professor.id

  // Fetch reviews and stats
  const { data: reviewsData } = await getProfessorReviewsAction(professor.id)
  const { data: statsData } = await supabase.rpc('get_professor_reviews_stats', { p_professor_id: professor.id }).maybeSingle()
  
  const avgRating = (statsData as any)?.avg_rating || 0
  const totalReviews = (statsData as any)?.total_reviews || 0

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <PublicNavbar />

      <main className="flex-1">
        {/* Hero del Profilo */}
        <section className="relative overflow-hidden border-b bg-gradient-to-br from-indigo-50/60 via-background to-purple-50/40 py-16 md:py-24">
          <div
            aria-hidden
            className="pointer-events-none absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full opacity-15"
            style={{ background: 'radial-gradient(circle, #6366f1 0%, transparent 70%)' }}
          />
          <div className="container mx-auto px-4 max-w-4xl relative z-10">
            <div className="flex flex-col md:flex-row items-start gap-8">
              {/* Avatar */}
              <div className="w-24 h-24 md:w-32 md:h-32 rounded-2xl bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-4xl md:text-5xl shadow-lg flex-shrink-0">
                {professor.name?.charAt(0).toUpperCase()}
              </div>

              <div className="flex-1">
                <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-2">
                  {professor.name}
                </h1>

                {/* Rating badge */}
                {totalReviews > 0 && (
                  <div className="flex items-center gap-1.5 mb-3 text-sm font-medium text-amber-600">
                    <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
                    <span className="text-lg font-bold text-slate-800">{avgRating}</span>
                    <span className="text-muted-foreground mr-1">/ 5</span>
                    <span className="text-muted-foreground">({totalReviews} recension{totalReviews === 1 ? 'e' : 'i'})</span>
                  </div>
                )}

                <div className="flex flex-wrap gap-2 mb-4">
                  {professor.subjects?.map((sub: string) => (
                    <Badge key={sub} variant="secondary" className="text-xs px-2.5 py-0.5">
                      <GraduationCap className="w-3 h-3 mr-1" />
                      {sub}
                    </Badge>
                  ))}
                </div>

                <p className="text-muted-foreground leading-relaxed max-w-2xl">
                  {professor.bio || 'Docente qualificato pronto ad aiutarti a raggiungere i tuoi obiettivi di apprendimento.'}
                </p>

                {/* CTA */}
                <div className="flex flex-wrap gap-3 mt-8">
                  <Link href={`/professori/${slug}/prenota`}>
                    <Button size="lg" className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-md gap-2">
                      <CalendarCheck className="w-5 h-5" />
                      Prenota una Lezione
                    </Button>
                  </Link>
                  <Link href={`/professori/${slug}/contatti`}>
                    <Button size="lg" variant="outline" className="gap-2 border-indigo-200 text-indigo-700 hover:bg-indigo-50">
                      <Mail className="w-5 h-5" />
                      Contatta
                    </Button>
                  </Link>
                  {isOwner && (
                    <Link href="/profile">
                      <Button size="lg" variant="secondary" className="gap-2 bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100">
                        <GraduationCap className="w-5 h-5" />
                        Modifica Profilo
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Sezione Recensioni */}
        <section className="container mx-auto px-4 max-w-4xl pb-16">
          <ReviewSection professorId={professor.id} reviews={(reviewsData as any[]) || []} user={user} />
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t py-8 bg-card">
        <div className="container mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2 font-medium text-foreground">
            <BookOpen className="w-4 h-4 text-indigo-600" />
            PrenotaLezioni
          </div>
          <p>© {new Date().getFullYear()} Tutti i diritti riservati</p>
        </div>
      </footer>
    </div>
  )
}
