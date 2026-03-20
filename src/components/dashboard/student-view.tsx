'use client'

import { GraduationCap, Clock, Calendar, ArrowRight } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function StudentDashboardView({ 
  user, 
  professors, 
  monthlyHours 
}: { 
  user: any
  professors: any[]
  monthlyHours: number
}) {
  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Le Tue Lezioni</h2>
          <p className="text-muted-foreground">Tieni traccia dei tuoi progressi e prenota nuove lezioni.</p>
        </div>
        <Card className="bg-indigo-600 text-white border-none shadow-indigo-200">
          <CardContent className="px-5 py-3 flex items-center gap-4">
            <Clock className="w-6 h-6 opacity-80" />
            <div>
              <div className="text-[10px] uppercase font-bold opacity-70 leading-none">Ore questo mese</div>
              <div className="text-2xl font-black">{monthlyHours}h</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <h3 className="text-xl font-bold flex items-center gap-2">
          <GraduationCap className="w-6 h-6 text-indigo-600" />
          I Tuoi Professori
        </h3>
        
        {professors.length === 0 ? (
          <Card className="bg-muted/30 border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
              <Calendar className="w-12 h-12 mb-4 text-muted" />
              <p>Non hai ancora effettuato nessuna lezione confermata.</p>
              <Link href="/" className="mt-4">
                <Button variant="outline">Cerca un Professore</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {professors.map((p) => (
              <Card key={p.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3 px-6 pt-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-lg">
                      {p.name?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <CardTitle className="text-lg leading-tight">{p.name}</CardTitle>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {p.subjects?.slice(0, 2).map((s: string) => (
                          <Badge key={s} variant="secondary" className="text-[9px] px-1.5 py-0">{s}</Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="px-6 pb-6 pt-2">
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-6">
                    {p.bio}
                  </p>
                  <Link href={`/${p.id}/prenota`}>
                    <Button variant="outline" className="w-full gap-2 text-indigo-600 border-indigo-200 hover:bg-indigo-50">
                      Prenota di nuovo
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
