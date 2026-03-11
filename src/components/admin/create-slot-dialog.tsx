'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Calendar as CalendarIcon, Loader2, PlusCircle } from 'lucide-react'
import { addMinutes, format } from 'date-fns'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createSlot } from '@/app/actions/admin'

export function CreateSlotDialog() {
  const [open, setOpen] = useState(false)
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [date, setDate] = useState<string>('')
  const [time, setTime] = useState<string>('15:00')
  const [duration, setDuration] = useState<number>(60)

  async function handleCreateSlot() {
    if (!date || !time) {
      setError("Inserisci data e ora valide")
      return
    }

    setIsPending(true)
    setError(null)

    try {
      // Costruiamo un oggetto Date locale partendo dagli input
      const localStartDate = new Date(`${date}T${time}:00`)
      const localEndDate = addMinutes(localStartDate, duration)
      
      const payload = {
        start_time: localStartDate.toISOString(),
        end_time: localEndDate.toISOString()
      }

      const result = await createSlot(payload)

      if (result?.error) {
        setError(result.error)
      } else {
        setOpen(false)
        // Reset state
        setDate('')
        setTime('15:00')
        setDuration(60)
      }
    } catch (err) {
      setError("Si è verificato un errore inaspettato.")
    } finally {
      setIsPending(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2">
        <PlusCircle className="mr-2 h-4 w-4" />
        Aggiungi Disponibilità
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Crea nuovo Slot orario</DialogTitle>
          <DialogDescription>
            Definisci la data, l'ora di inizio e la durata della lezione. Verrà reso visibile immediatamente agli studenti.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="date" className="text-right">Data</Label>
            <Input
              id="date"
              type="date"
              className="col-span-3"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              disabled={isPending}
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="time" className="text-right">Ora (Inizio)</Label>
            <Input
              id="time"
              type="time"
              className="col-span-3"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              disabled={isPending}
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="duration" className="text-right">Durata</Label>
            <div className="col-span-3 flex items-center gap-2">
                <Input
                    id="duration"
                    type="number"
                    min="15"
                    step="15"
                    value={duration}
                    onChange={(e) => setDuration(parseInt(e.target.value) || 60)}
                    disabled={isPending}
                />
                <span className="text-sm text-muted-foreground whitespace-nowrap">minuti</span>
            </div>
          </div>
        </div>

        {error && (
            <div className="p-3 bg-destructive/15 text-destructive text-sm rounded-md font-medium whitespace-pre-wrap">
              {error}
            </div>
        )}

        <div className="flex justify-end pt-4 border-t">
          <Button type="button" variant="outline" onClick={() => setOpen(false)} className="mr-2">
            Annulla
          </Button>
          <Button onClick={handleCreateSlot} disabled={isPending}>
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creazione...
              </>
            ) : "Crea Slot"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
