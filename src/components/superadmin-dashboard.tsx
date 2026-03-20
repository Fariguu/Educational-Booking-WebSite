'use client'

import { useEffect, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { Check, MailX, Loader2, X, Save } from 'lucide-react'
import { toast } from 'sonner'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { approveApplication, rejectApplication, updateApplicationNotes } from '@/app/actions/roles'

type Application = {
  id: string
  full_name: string
  bio: string
  subjects: string[]
  created_at: string
  admin_notes?: string
}

export default function SuperadminDashboard({ 
    initialApplications 
}: { 
    initialApplications: Application[] 
}) {
  const [applications, setApplications] = useState<Application[]>(initialApplications)
  const [localNotes, setLocalNotes] = useState<Record<string, string>>(() => {
    const notes: Record<string, string> = {}
    initialApplications.forEach(app => {
      notes[app.id] = app.admin_notes || ''
    })
    return notes
  })
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [rejectingId, setRejectingId] = useState<string | null>(null)
  const [confirmRejectId, setConfirmRejectId] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

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

  const handleSaveNotes = async (id: string) => {
    const notes = localNotes[id]
    setProcessingId(id)
    try {
      const res = await updateApplicationNotes(id, notes)
      if (res.error) {
        toast.error(res.error)
      } else {
        toast.success("Note aggiornate!")
      }
    } catch {
      toast.error("Errore di rete.")
    } finally {
      setProcessingId(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Candidature in attesa ({applications.length})</h2>
      </div>

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
                    <Label className="text-xs font-bold uppercase text-muted-foreground">Note Amministrative / Feedback</Label>
                    <Textarea 
                        value={localNotes[app.id]}
                        onChange={(e) => setLocalNotes(prev => ({ ...prev, [app.id]: e.target.value }))}
                        placeholder="Es: Mancano dettagli sulla laurea. Richiedere colloquio..."
                        className="text-xs min-h-[80px] bg-muted/30"
                    />
                    <Button 
                        size="sm" 
                        variant="ghost" 
                        className="w-full text-[10px] h-7 hover:bg-indigo-50 hover:text-indigo-600"
                        onClick={() => handleSaveNotes(app.id)}
                        disabled={processingId === app.id}
                    >
                        {processingId === app.id ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Save className="w-3 h-3 mr-1" />}
                        Salva Note
                    </Button>
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
    </div>
  )
}
