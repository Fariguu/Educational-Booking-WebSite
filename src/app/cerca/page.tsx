import Link from 'next/link'
import { Search, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import PublicNavbar from '@/components/public-navbar'
import { createClient } from '@/utils/supabase/server'
import SearchInput from '@/components/search-input'
import { Suspense } from 'react'

export const metadata = {
  title: 'Risultati di Ricerca Docenti',
}

export default async function SearchResultsPage({ searchParams }: { readonly searchParams: Promise<{ q?: string }> | { q?: string } }) {
  const resolvedParams = await Promise.resolve(searchParams)
  const q = resolvedParams.q || ""

  const supabase = await createClient()
  
  let professors = []
  
  // Sempre usa l'RPC per consistenza, garantendo che i nomi e le materie siano mappati correttamente.
  const { data } = await supabase.rpc('search_professors', { search_query: q || "" })
  professors = data || []


  // Recuperiamo le recensioni per calcolare il rating e ordinare i risultati
  const { data: allReviews } = await supabase.from('reviews').select('professor_id, rating')
  
  const profStats = allReviews?.reduce((acc: any, review: any) => {
    if (!acc[review.professor_id]) acc[review.professor_id] = { total: 0, sum: 0 }
    acc[review.professor_id].total += 1
    acc[review.professor_id].sum += review.rating
    return acc
  }, {}) || {}

  professors = professors.map((prof: any) => {
    const stats = profStats[prof.id]
    return {
      ...prof,
      avgRating: stats ? (stats.sum / stats.total).toFixed(1) : Number.parseFloat("0").toFixed(1),
      totalReviews: stats ? stats.total : 0
    }
  }).sort((a: any, b: any) => {
    if (Number(b.avgRating) !== Number(a.avgRating)) {
      return Number(b.avgRating) - Number(a.avgRating)
    }
    return b.totalReviews - a.totalReviews
  })

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <PublicNavbar />
      
      <main className="flex-1">
        <section className="bg-indigo-50/40 border-b py-10">
          <div className="container mx-auto px-4 max-w-3xl text-center">
            <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight mb-6">Cerca Docenti e Materie</h1>
            <Suspense fallback={<div className="h-12 w-full max-w-lg mx-auto bg-muted animate-pulse rounded-md" />}>
              <SearchInput />
            </Suspense>
          </div>
        </section>

        <section className="container mx-auto px-4 py-12 max-w-5xl">
          <div className="mb-8 flex items-center justify-between">
            <h2 className="text-xl font-bold">
              {q ? `Risultati per "${q}" (${professors.length})` : `Tutti i Docenti Disponibili (${professors.length})`}
            </h2>
          </div>

          {professors.length === 0 ? (
            <div className="text-center py-20 bg-muted/30 rounded-2xl border border-dashed">
                <Search className="w-12 h-12 md:w-16 md:h-16 text-muted-foreground/40 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground">Nessun docente trovato</h3>
                <p className="text-muted-foreground mt-2 max-w-md mx-auto">
                    Non siamo riusciti a trovare insegnanti che corrispondono a "{q}". Prova con un sinonimo o verifica l'ortografia.
                </p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {professors.map((prof: any) => (
                <div key={prof.id} className="bg-card rounded-2xl p-6 border shadow-sm hover:shadow-md transition-shadow flex flex-col">
                  <Link href={`/professori/${prof.slug}`} className="flex items-start gap-4 mb-4 group cursor-pointer">
                    <div className="w-14 h-14 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xl flex-shrink-0 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                      {prof.name?.charAt(0).toUpperCase() || '?'}
                    </div>
                    <div>
                      <h3 className="font-semibold inset-0 text-lg group-hover:text-indigo-600 transition-colors">{prof.name}</h3>
                      
                      {/* Stelle */}
                      {prof.totalReviews > 0 && (
                        <div className="flex items-center gap-1 mt-0.5 text-xs font-medium text-amber-600">
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                          <span>{prof.avgRating} ({prof.totalReviews})</span>
                        </div>
                      )}

                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {prof.subjects?.map((sub: string) => (
                           <Badge key={sub} variant="secondary" className="text-[10px] px-1.5 py-0">{sub}</Badge>
                        ))}
                      </div>
                    </div>
                  </Link>
                  
                  <p className="text-sm text-muted-foreground line-clamp-3 mb-6 flex-1">
                    {prof.bio || "Insegnante qualificato e pronto ad aiutarti a raggiungere i tuoi obiettivi."}
                  </p>

                  <div className="flex gap-2 mt-auto">
                      <Link href={`/professori/${prof.slug}/prenota`} className="flex-1">
                        <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm">
                           Prenota
                        </Button>
                      </Link>
                      <Link href={`/professori/${prof.slug}/contatti`} className="flex-1">
                        <Button variant="outline" className="w-full">
                           Contatta
                        </Button>
                      </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
