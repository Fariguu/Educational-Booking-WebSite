import Link from 'next/link'
import { BookOpen, Search, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import PublicNavbar from '@/components/public-navbar'
import { createClient } from '@/utils/supabase/server'
import SearchInput from '@/components/search-input'

export const metadata = {
  title: 'Risultati di Ricerca Docenti',
}

export default async function SearchResultsPage({ searchParams }: { searchParams: Promise<{ q?: string }> | { q?: string } }) {
  const resolvedParams = await Promise.resolve(searchParams)
  const q = resolvedParams.q || ""

  const supabase = await createClient()
  
  let professors = []
  
  if (q) {
    // Chiama la nuova funzione PostgreSQL per la ricerca fuzzy su array e testo
    const { data } = await supabase.rpc('search_professors', { search_query: q })
    professors = data || []
  } else {
    // Ritorna le occorrenze di default se la query è vuota
    const { data } = await supabase.from('professors').select('*').order('name', { ascending: true })
    professors = data || []
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <PublicNavbar />
      
      <main className="flex-1">
        <section className="bg-indigo-50/40 border-b py-10">
          <div className="container mx-auto px-4 max-w-3xl text-center">
            <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight mb-6">Cerca Docenti e Materie</h1>
            <SearchInput />
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
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-14 h-14 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xl flex-shrink-0">
                      {prof.name?.charAt(0).toUpperCase() || '?'}
                    </div>
                    <div>
                      <h3 className="font-semibold inset-0 text-lg">{prof.name}</h3>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {prof.subjects?.map((sub: string) => (
                           <Badge key={sub} variant="secondary" className="text-[10px] px-1.5 py-0">{sub}</Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  <p className="text-sm text-muted-foreground line-clamp-3 mb-6 flex-1">
                    {prof.bio || "Insegnante qualificato e pronto ad aiutarti a raggiungere i tuoi obiettivi."}
                  </p>

                  <div className="flex gap-2 mt-auto">
                      <Link href={`/${prof.id}/prenota`} className="flex-1">
                        <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm">
                           Prenota
                        </Button>
                      </Link>
                      <Link href={`/${prof.id}/contatti`} className="flex-1">
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
