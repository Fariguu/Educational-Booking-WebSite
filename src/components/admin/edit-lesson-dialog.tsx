'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { it } from 'date-fns/locale'
import { Loader2, Edit, AlertCircle, Trash } from 'lucide-react'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Lesson } from './admin-tabs'
import { updateLessonTime, cancelLessonWithChoice } from '@/app/actions/admin'
import { toast } from "sonner"

interface EditLessonDialogProps {
  lesson: Lesson
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function EditLessonDialog({ lesson, open, onOpenChange, onSuccess }: EditLessonDialogProps) {
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Conversione orari in formato YYYY-MM-DDTHH:mm per l'input datetime-local
  // Si rimuovono i secondi e i millisecondi (ISO standard locale approssimato per l'input)
  const formatForInput = (dateStr: string) => {
      const d = new Date(dateStr)
      // Ajust per il fuso orario locale
      d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
      return d.toISOString().slice(0, 16)
  }

  const [startTime, setStartTime] = useState(formatForInput(lesson.start_time))
  const [endTime, setEndTime] = useState(formatForInput(lesson.end_time))
  const [cancelMode, setCancelMode] = useState<'keep' | 'delete'>('keep')
  const [showCancelPrompt, setShowCancelPrompt] = useState(false)

  const handleUpdate = async () => {
    setIsPending(true)
    setError(null)

    // Aggiungo i secondi per il backend (datetime)
    const newStart = new Date(startTime + ':00Z')
    const newEnd = new Date(endTime + ':00Z')

    // Correggo l'offset
    newStart.setMinutes(newStart.getMinutes() + newStart.getTimezoneOffset())
    newEnd.setMinutes(newEnd.getMinutes() + newEnd.getTimezoneOffset())

    const res = await updateLessonTime(lesson.id, newStart.toISOString(), newEnd.toISOString())
    setIsPending(false)

    if (res?.error) {
      setError(res.error)
    } else {
      toast.success("Orario aggiornato e studente avvisato via mail.")
      onSuccess()
      onOpenChange(false)
    }
  }

  const handleCancelProcess = async () => {
    setIsPending(true)
    setError(null)

    // keep==true = torna disponibile, keep==false = cancella riga
    const keepAvailable = cancelMode === 'keep'
    const res = await cancelLessonWithChoice(lesson.id, keepAvailable)
    setIsPending(false)

    if (res?.error) {
      setError(res.error)
    } else {
      toast.success("Lezione annullata con successo.")
      onSuccess()
      onOpenChange(false)
      setShowCancelPrompt(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(val) => {
        if (!val) setShowCancelPrompt(false)
        onOpenChange(val)
    }}>
      <DialogContent className="sm:max-w-[425px]">
        {!showCancelPrompt ? (
            <>
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Edit className="w-5 h-5"/> Modifica Lezione
                    </DialogTitle>
                    <DialogDescription>
                        Gestisci l'orario o annulla la lezione per <strong>{lesson.student_name}</strong>.
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4 space-y-4">
                    {error && <p className="text-sm text-destructive">{error}</p>}

                    {lesson.reschedule_requested && (
                        <div className="bg-amber-50 border border-amber-200 text-amber-800 p-3 rounded-md text-sm">
                            <h4 className="font-semibold flex items-center gap-1.5"><AlertCircle className="w-4 h-4"/> Studente chiede spostamento</h4>
                            <p className="mt-1 italic">"{lesson.reschedule_notes}"</p>
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label>Nuovo Orario Inizio</Label>
                        <Input 
                            type="datetime-local" 
                            value={startTime} 
                            onChange={(e) => setStartTime(e.target.value)} 
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Nuovo Orario Fine</Label>
                        <Input 
                            type="datetime-local" 
                            value={endTime} 
                            onChange={(e) => setEndTime(e.target.value)} 
                        />
                    </div>
                </div>

                <DialogFooter className="flex-col sm:flex-row gap-2 justify-between items-center sm:items-center">
                    <Button variant="ghost" className="text-destructive hover:text-destructive hover:bg-destructive/10 w-full sm:w-auto" onClick={() => setShowCancelPrompt(true)}>
                        <Trash className="w-4 h-4 mr-2" /> Annulla Lezione
                    </Button>
                    <div className="flex gap-2 w-full sm:w-auto mt-2 sm:mt-0">
                        <Button variant="outline" className="w-full sm:w-auto" onClick={() => onOpenChange(false)} disabled={isPending}>Chiudi</Button>
                        <Button className="w-full sm:w-auto" onClick={handleUpdate} disabled={isPending}>
                            {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Salva Orario
                        </Button>
                    </div>
                </DialogFooter>
            </>
        ) : (
            /* Modalità Annulla Lezione */
            <>
                <DialogHeader>
                    <DialogTitle className="text-destructive flex items-center gap-2">
                        <AlertCircle className="w-5 h-5"/> Conferma Annullamento
                    </DialogTitle>
                    <DialogDescription>
                        Stai per annullare la lezione di <strong>{lesson.student_name}</strong>. Riceverà un'email di avviso.
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4 space-y-4">
                    {error && <p className="text-sm text-destructive">{error}</p>}
                    
                    <Label className="text-base">Cosa vuoi fare con questo blocco di tempo?</Label>
                    <RadioGroup value={cancelMode} onValueChange={(v: 'keep'|'delete') => setCancelMode(v)} className="space-y-2 mt-2">
                        <div className="flex items-center space-x-2 border p-3 rounded-md has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                            <RadioGroupItem value="keep" id="r1" />
                            <Label htmlFor="r1" className="cursor-pointer flex-1">
                                <span className="block font-semibold">Torna Disponibile al Pubblico</span>
                                <span className="block text-xs text-muted-foreground font-normal mt-0.5">La lezione si smonta ma l'orario torna verde sul calendario per altri.</span>
                            </Label>
                        </div>
                        <div className="flex items-center space-x-2 border p-3 rounded-md has-[:checked]:border-destructive has-[:checked]:bg-destructive/5">
                            <RadioGroupItem value="delete" id="r2" />
                            <Label htmlFor="r2" className="cursor-pointer flex-1">
                                <span className="block font-semibold text-destructive">Elimina Definitivamente</span>
                                <span className="block text-xs text-muted-foreground font-normal mt-0.5">L'orario svanisce nel nulla e non prenderai più impegni in quel frangente.</span>
                            </Label>
                        </div>
                    </RadioGroup>
                </div>

                <DialogFooter className="flex-col sm:flex-row gap-2">
                    <Button variant="outline" className="w-full sm:w-auto" onClick={() => setShowCancelPrompt(false)} disabled={isPending}>Indietro</Button>
                    <Button variant="destructive" className="w-full sm:w-auto" onClick={handleCancelProcess} disabled={isPending}>
                        {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        Conferma ed Elimina
                    </Button>
                </DialogFooter>
            </>
        )}
      </DialogContent>
    </Dialog>
  )
}
