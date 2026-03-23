'use client'

import { useEffect, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { Check, MailX, Loader2, X, Mail } from 'lucide-react'
import { toast } from 'sonner'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Button, buttonVariants } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { approveApplication, rejectApplication } from '@/app/actions/roles'

type Application = {
  id: string
  full_name: string
  bio: string
  subjects: string[]
  created_at: string
  admin_notes?: string
  email?: string // email del candidato (salvata in professor_applications)
}

type ContactMessage = {
  id: string
  name: string
  email: string
  message: string
  created_at: string
}

export default function SuperadminDashboard({ 
    initialApplications,
    contactMessages = [] 
}: { 
    initialApplications: Application[]
    contactMessages?: ContactMessage[] 
}) {
  const [activeTab, setActiveTab] = useState<'applications' | 'contacts'>('applications')
  const [applications, setApplications] = useState<Application[]>(initialApplications)
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [rejectingId, setRejectingId] = useState<string | null>(null)
  const [confirmRejectId, setConfirmRejectId] = useState<string | null>(null)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'professor_applications',
        },
        (payload) => {
          // Quando c'è un nuovo inserimento, lo aggiungiamo in cima alla lista
          const newApp = payload.new as Application
          setApplications((prev) => [newApp, ...prev])
          toast.success(`Nuova richiesta da ${newApp.full_name}`)
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'professor_applications',
        },
        (payload) => {
          // Quando viene eliminata (ad esempio, approvata), la rimuoviamo dalla lista
          setApplications((prev) => prev.filter((app) => app.id !== payload.old.id))
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const handleApprove = async (id: string, name: string) => {
    setProcessingId(id)
    try {
      const res = await approveApplication(id)
      if (res.error) {
         toast.error(res.error)
      } else {
         toast.success(`${name} è stato approvato come Professore!`)
         setApplications(prev => prev.filter(app => app.id !== id))
      }
    } catch {
       toast.error("Errore di rete imprevisto.")
    } finally {
       setProcessingId(null)
    }
  }

  const handleReject = async (id: string, name: string) => {
    if (confirmRejectId !== id) {
      setConfirmRejectId(id)
      return
    }
    setRejectingId(id)
    setConfirmRejectId(null)
    try {
      const res = await rejectApplication(id)
      if (res.error) {
        toast.error(res.error)
      } else {
        toast.info(`Candidatura di ${name} rifiutata.`)
        setApplications(prev => prev.filter(app => app.id !== id))
      }
    } catch {
      toast.error("Errore di rete imprevisto.")
    } finally {
      setRejectingId(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 border-b pb-1">
        <button 
          onClick={() => setActiveTab('applications')}
          className={`pb-3 px-2 text-sm font-bold transition-all relative ${activeTab === 'applications' ? 'text-indigo-600' : 'text-muted-foreground hover:text-foreground'}`}
        >
          Richieste Docenti ({applications.length})
          {activeTab === 'applications' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600 rounded-full" />}
        </button>
        <button 
          onClick={() => setActiveTab('contacts')}
          className={`pb-3 px-2 text-sm font-bold transition-all relative ${activeTab === 'contacts' ? 'text-indigo-600' : 'text-muted-foreground hover:text-foreground'}`}
        >
          Messaggi Piattaforma ({contactMessages.length})
          {activeTab === 'contacts' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600 rounded-full" />}
        </button>
      </div>

      {activeTab === 'applications' ? (
        <>
          {applications.length === 0 ? (
            <Card className="bg-muted/30 border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                    <MailX className="w-12 h-12 mb-4 text-muted" />
                    <p>Non ci sono nuove richieste per diventare docenti al momento.</p>
                </CardContent>
            </Card>
          ) : (
            <div className="grid lg:grid-cols-2 gap-4">
              {applications.map((app) => (
                <Card key={app.id} className="flex flex-col">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start gap-4">
                      <CardTitle className="text-lg leading-tight">{app.full_name}</CardTitle>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(app.created_at).toLocaleDateString('it-IT')}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-2">
                        {app.subjects.map(s => (
                            <Badge key={s} variant="secondary" className="text-[10px] px-1.5 py-0">{s}</Badge>
                        ))}
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1 space-y-4">
                    <p className="text-sm text-muted-foreground line-clamp-3">
                        {app.bio}
                    </p>
                    <div className="pt-4 border-t space-y-2">
                        <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest flex items-center gap-2">
                          <Mail className="w-3 h-3 text-indigo-500" />
                          Contatta il candidato
                        </Label>
                        {app.email ? (
                          <a
                            href={`https://mail.google.com/mail/?view=cm&fs=1&to=${app.email}&su=${encodeURIComponent("Riguardo la tua candidatura")}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={buttonVariants({ variant: 'outline', size: 'sm' }) + " w-full"}
                          >
                            <Mail className="w-3 h-3 mr-1.5" />
                            Rispondi via Email ({app.email})
                          </a>
                        ) : (
                          <p className="text-xs text-muted-foreground italic">Email non disponibile.</p>
                        )}
                    </div>
                  </CardContent>
                  <CardFooter className="pt-3 border-t bg-muted/20 flex gap-2">
                    <Button 
                        onClick={() => handleApprove(app.id, app.full_name)}
                        disabled={processingId === app.id || rejectingId === app.id}
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                        {processingId === app.id ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                            <Check className="w-4 h-4 mr-2" />
                        )}
                        Approva
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => handleReject(app.id, app.full_name)}
                        disabled={processingId === app.id || rejectingId === app.id}
                        className={`flex-1 border-red-200 hover:bg-red-50 ${
                          confirmRejectId === app.id 
                            ? 'text-white bg-red-600 hover:bg-red-700 border-red-600' 
                            : 'text-red-600'
                        }`}
                    >
                        {rejectingId === app.id ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                            <X className="w-4 h-4 mr-2" />
                        )}
                        {confirmRejectId === app.id ? 'Conferma Rifiuto' : 'Rifiuta'}
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </>
      ) : (
        <div className="space-y-4">
          {contactMessages.length === 0 ? (
            <Card className="bg-muted/30 border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                    <MailX className="w-12 h-12 mb-4 text-muted" />
                    <p>Nessun messaggio di contatto ricevuto.</p>
                </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {contactMessages.map((msg) => (
                <Card key={msg.id} className="overflow-hidden">
                  <CardHeader className="bg-muted/20 py-3">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs uppercase">
                          {msg.name?.charAt(0)}
                        </div>
                        <div>
                          <CardTitle className="text-sm">{msg.name}</CardTitle>
                          <div className="text-[10px] text-muted-foreground">{msg.email}</div>
                        </div>
                      </div>
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(msg.created_at).toLocaleString('it-IT')}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="py-4">
                    <p className="text-sm whitespace-pre-wrap leading-relaxed text-muted-foreground italic">
                      "{msg.message}"
                    </p>
                  </CardContent>
                  <CardFooter className="bg-muted/5 py-2 px-4 border-t flex justify-end">
                    <a 
                      href={`https://mail.google.com/mail/?view=cm&fs=1&to=${msg.email}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={buttonVariants({ variant: 'link', size: 'sm' }) + " text-indigo-600 p-0 h-auto"}
                    >
                      Rispondi via Email
                    </a>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
