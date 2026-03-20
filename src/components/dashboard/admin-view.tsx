'use client'

import { GraduationCap, Users, Mail, Phone } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default function AdminDashboardView({ 
  user, 
  professors, 
  students 
}: { 
  user: any
  professors: any[]
  students: any[]
}) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Gestione Operativa</h2>
        <p className="text-muted-foreground">Visualizza e gestisci l'elenco dei docenti e dei nuovi iscritti.</p>
      </div>

      <Tabs defaultValue="professors" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2 mb-8 h-12">
          <TabsTrigger value="professors" className="gap-2">
            <GraduationCap className="w-4 h-4" />
            Professori ({professors.length})
          </TabsTrigger>
          <TabsTrigger value="students" className="gap-2">
            <Users className="w-4 h-4" />
            Studenti ({students.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="professors">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {professors.map((p) => (
              <Card key={p.id}>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">{p.name || `${p.first_name} ${p.last_name}`}</CardTitle>
                    <Badge variant="outline">Docente</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground line-clamp-2">{p.bio}</p>
                  <div className="flex flex-wrap gap-1">
                    {p.subjects?.map((s: string) => (
                      <Badge key={s} variant="secondary" className="text-[10px] px-1.5 py-0">{s}</Badge>
                    ))}
                  </div>
                  <div className="pt-2 flex flex-col gap-1.5 text-xs text-muted-foreground border-t">
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5" />
                      {p.email || 'Email non disponibile'}
                    </div>
                    {p.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5" />
                        {p.phone}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="students">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {students.map((s) => (
              <Card key={s.id}>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">
                      {s.first_name || s.last_name 
                        ? `${s.first_name || ''} ${s.last_name || ''}`.trim() 
                        : s.email?.split('@')[0]}
                    </CardTitle>
                    <Badge variant="secondary">Studente</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex flex-col gap-1.5 text-xs text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5" />
                      {s.email}
                    </div>
                    {s.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5" />
                        {s.phone}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
