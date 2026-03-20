'use client'

import { AdminTabs } from '@/components/admin/admin-tabs'
import { CreateSlotDialog } from '@/components/admin/create-slot-dialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, Mail, Clock, Send } from 'lucide-react'
import { Button, buttonVariants } from '@/components/ui/button'

export default function ProfessorDashboardView({ 
  user, 
  lessons, 
  studentsHours,
  contactMessages = []
}: { 
  user: any
  lessons: any[]
  studentsHours: any[]
  contactMessages?: any[]
}) {
  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">La Tua Agenda</h2>
          <p className="text-muted-foreground">Gestisci le tue disponibilità e monitora le ore dei tuoi studenti.</p>
        </div>
        <div className="flex items-center gap-3">
          <CreateSlotDialog />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3 space-y-6">
          <AdminTabs initialLessons={lessons} />
        </div>

        <div className="space-y-6">
          <Card className="border-indigo-100 shadow-sm overflow-hidden">
            <CardHeader className="pb-3 border-b bg-indigo-50/30">
              <CardTitle className="text-sm font-bold flex items-center gap-2 text-indigo-900">
                <Mail className="w-4 h-4" />
                Messaggi Ricevuti ({contactMessages.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {contactMessages.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  <Mail className="w-8 h-8 mx-auto mb-2 opacity-20" />
                  <p className="text-xs">Nessun messaggio ricevuto dai visitatori.</p>
                </div>
              ) : (
                <div className="divide-y max-h-[400px] overflow-y-auto scrollbar-thin">
                  {contactMessages.map((msg) => (
                    <div key={msg.id} className="p-4 hover:bg-muted/30 transition-colors">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-indigo-950 uppercase tracking-tight">{msg.name}</span>
                          <span className="text-[10px] text-muted-foreground">{new Date(msg.created_at).toLocaleDateString()}</span>
                        </div>
                        <a 
                          href={`mailto:${msg.email}`} 
                          title="Rispondi via email"
                          className={buttonVariants({ variant: 'ghost', size: 'icon' }) + " h-6 w-6 text-indigo-600"}
                        >
                          <Mail className="w-3.5 h-3.5" />
                        </a>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed bg-muted/20 p-2 rounded italic">
                        "{msg.message}"
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3 border-b mb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-600" />
                Ore Studenti (Mese Corrente)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {studentsHours.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">Nessuna lezione confermata o completata per questo mese.</p>
              ) : (
                <div className="space-y-4">
                  {studentsHours.map((student, idx) => (
                    <div key={idx} className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0">
                      <div className="flex flex-col gap-1">
                        <span className="font-semibold text-sm">
                            {student.first_name || student.last_name 
                              ? `${student.first_name || ''} ${student.last_name || ''}`.trim()
                              : 'Studente Anonimo'
                            }
                        </span>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Mail className="w-3 h-3" />
                          <span className="truncate max-w-[120px]">{student.email}</span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end">
                        <div className="flex items-center gap-1 font-bold text-indigo-700 bg-indigo-50 px-2 py-1 rounded">
                          <Clock className="w-3.5 h-3.5" />
                          {student.total_hours}h
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
