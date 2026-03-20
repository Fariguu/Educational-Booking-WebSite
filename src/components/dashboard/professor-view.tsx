'use client'

import { AdminTabs } from '@/components/admin/admin-tabs'
import { CreateSlotDialog } from '@/components/admin/create-slot-dialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, Mail, Clock } from 'lucide-react'

export default function ProfessorDashboardView({ 
  user, 
  lessons, 
  studentsHours
}: { 
  user: any
  lessons: any[]
  studentsHours: any[]
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
