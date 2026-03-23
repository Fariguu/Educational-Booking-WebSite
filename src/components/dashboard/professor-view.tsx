'use client'

import { useState } from 'react'
import { AdminTabs } from '@/components/admin/admin-tabs'
import { CreateSlotDialog } from '@/components/admin/create-slot-dialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, Mail, Clock, UserCircle, Edit3, Eye } from 'lucide-react'
import { Button, buttonVariants } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'

export default function ProfessorDashboardView({ 
  user, 
  lessons, 
  studentsHours,
  contactMessages = [],
  profData
}: { 
  user: any
  lessons: any[]
  studentsHours: any[]
  contactMessages?: any[]
  profData?: any
}) {
  const [activeTab, setActiveTab] = useState<'agenda' | 'messages' | 'students'>('agenda')

  return (
    <div className="space-y-8">
      {/* Intestazione e Profilo Pubblico */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2">
          <h2 className="text-3xl font-bold tracking-tight">La Tua Dashboard</h2>
          <p className="text-muted-foreground mt-1">Gestisci le tue disponibilità, messaggi e profilo pubblico.</p>
        </div>
        
        {/* Anteprima Profilo Pubblico */}
        <Card className="bg-gradient-to-br from-indigo-50 to-white border-indigo-100 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 p-3 flex gap-2">
            <Link 
              href={`/professori/${user.id}`} 
              target="_blank"
              rel="noopener noreferrer"
              className={buttonVariants({ variant: 'outline', size: 'sm' }) + " bg-white/50 backdrop-blur-sm border-indigo-200 text-indigo-700 hover:bg-indigo-100"}
              title="Visualizza Profilo Pubblico"
            >
              <Eye className="w-3.5 h-3.5 mr-1" />
              <span className="hidden sm:inline">Visualizza</span>
            </Link>
            <Link 
              href="/profile" 
              className={buttonVariants({ variant: 'outline', size: 'sm' }) + " bg-white/50 backdrop-blur-sm border-indigo-200 text-indigo-700 hover:bg-indigo-100 bg-indigo-50"}
            >
              <Edit3 className="w-3.5 h-3.5 mr-1" />
              <span className="hidden sm:inline">Modifica</span>
            </Link>
          </div>
          <CardContent className="p-5 pt-6 flex gap-4 items-center mt-4">
            <div className="w-14 h-14 bg-indigo-200 text-indigo-700 rounded-full flex items-center justify-center shrink-0">
              <UserCircle className="w-8 h-8" />
            </div>
            <div>
              <h3 className="font-bold text-lg leading-tight text-indigo-950">
                {profData?.name || user?.user_metadata?.first_name || 'Alunno Insegnante'}
              </h3>
              <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                {profData?.bio || 'Nessuna biografia inserita.'}
              </p>
              <div className="flex flex-wrap gap-1 mt-2">
                {profData?.subjects && profData.subjects.length > 0 ? (
                  profData.subjects.slice(0, 3).map((s: string) => (
                    <Badge key={s} variant="secondary" className="text-[10px] px-1.5 py-0 bg-indigo-100 text-indigo-700">{s}</Badge>
                  ))
                ) : (
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0">Nessuna materia</Badge>
                )}
                {profData?.subjects?.length > 3 && (
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-indigo-100 text-indigo-700">+{profData.subjects.length - 3}</Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs di navigazione */}
      <div className="flex items-center gap-4 border-b pb-1 overflow-x-auto scrollbar-none">
        <button 
          onClick={() => setActiveTab('agenda')}
          className={`pb-3 px-2 text-sm font-bold transition-all whitespace-nowrap relative ${activeTab === 'agenda' ? 'text-indigo-600' : 'text-muted-foreground hover:text-foreground'}`}
        >
          Agenda / Lezioni
          {activeTab === 'agenda' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600 rounded-full" />}
        </button>
        <button 
          onClick={() => setActiveTab('messages')}
          className={`pb-3 px-2 text-sm font-bold transition-all whitespace-nowrap relative ${activeTab === 'messages' ? 'text-indigo-600' : 'text-muted-foreground hover:text-foreground'}`}
        >
          Messaggi Feedback ({contactMessages.length})
          {activeTab === 'messages' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600 rounded-full" />}
        </button>
        <button 
          onClick={() => setActiveTab('students')}
          className={`pb-3 px-2 text-sm font-bold transition-all whitespace-nowrap relative ${activeTab === 'students' ? 'text-indigo-600' : 'text-muted-foreground hover:text-foreground'}`}
        >
          Dati Studenti
          {activeTab === 'students' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600 rounded-full" />}
        </button>
      </div>

      {/* Contenuto Tab */}
      <div className="mt-6">
        {activeTab === 'agenda' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="flex justify-between items-center bg-indigo-50/50 p-4 rounded-xl border border-indigo-100">
              <p className="text-sm font-medium text-indigo-900">Gestisci le tue disponibilità settimanali.</p>
              <CreateSlotDialog />
            </div>
            <AdminTabs initialLessons={lessons} />
          </div>
        )}

        {activeTab === 'messages' && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 max-w-4xl">
            <Card className="border-indigo-100 shadow-sm overflow-hidden">
              <CardHeader className="pb-3 border-b bg-indigo-50/30">
                <CardTitle className="text-sm font-bold flex items-center gap-2 text-indigo-900">
                  <Mail className="w-4 h-4" />
                  Messaggi Ricevuti
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {contactMessages.length === 0 ? (
                  <div className="p-12 text-center text-muted-foreground">
                    <Mail className="w-10 h-10 mx-auto mb-3 opacity-20" />
                    <p className="text-sm">Nessun messaggio ricevuto dai visitatori o studenti.</p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {contactMessages.map((msg) => (
                      <div key={msg.id} className="p-6 hover:bg-muted/30 transition-colors">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-indigo-950 uppercase tracking-tight">{msg.name}</span>
                            <span className="text-xs text-muted-foreground">{new Date(msg.created_at).toLocaleDateString('it-IT')}</span>
                          </div>
                          <a 
                            href={`https://mail.google.com/mail/?view=cm&fs=1&to=${msg.email}`} 
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Rispondi con Gmail"
                            className={buttonVariants({ variant: 'outline', size: 'sm' }) + " text-indigo-600 border-indigo-200 hover:bg-indigo-50"}
                          >
                            <Mail className="w-3.5 h-3.5 mr-2" />
                            Rispondi
                          </a>
                        </div>
                        <p className="text-sm text-slate-700 leading-relaxed bg-muted/20 p-4 rounded-lg italic border border-slate-100">
                          "{msg.message}"
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'students' && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 max-w-4xl">
            <Card>
              <CardHeader className="pb-3 border-b">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="w-5 h-5 text-indigo-600" />
                  Ore Studenti (Mese Corrente)
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                {studentsHours.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">Nessuna lezione completata o confermata per questo mese.</p>
                ) : (
                  <div className="space-y-4">
                    {studentsHours.map((student, idx) => (
                      <div key={idx} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                        <div className="flex flex-col gap-1">
                          <span className="font-semibold text-base text-gray-900">
                              {student.first_name || student.last_name 
                                ? `${student.first_name || ''} ${student.last_name || ''}`.trim()
                                : 'Studente Anonimo'
                              }
                          </span>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Mail className="w-3.5 h-3.5" />
                            <span>{student.email}</span>
                          </div>
                        </div>
                        <div className="flex flex-col items-end">
                          <div className="flex items-center gap-1.5 font-bold text-indigo-700 bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-100">
                            <Clock className="w-4 h-4" />
                            {student.total_hours} ore tot.
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
