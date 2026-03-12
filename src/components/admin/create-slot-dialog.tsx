'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Calendar as CalendarIcon, Loader2, PlusCircle, Repeat } from 'lucide-react'
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
import { Checkbox } from "@/components/ui/checkbox"
import { createSlot } from '@/app/actions/admin'

export function CreateSlotDialog() {
  const [open, setOpen] = useState(false)
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  
  const [date, setDate] = useState<string>('')
  const [time, setTime] = useState<string>('15:00')
  const [duration, setDuration] = useState<number>(60)

  // Nuovi state per la ricorrenza
  const [isRecurring, setIsRecurring] = useState(false)
  const [endDate, setEndDate] = useState<string>('')

  async function handleCreateSlot() {
    if (!date || !time) {
      setError("Inserisci data e ora valide")
      return
    }

    if (isRecurring && !endDate) {
      setError("Inserisci una data di fine per la ricorrenza")
      return
    }

    if (isRecurring && new Date(endDate) < new Date(date)) {
      setError("La data di fine deve essere successiva a quella di inizio")
      return
    }

    setIsPending(true)
    setError(null)

    try {
      const localStartDate = new Date(`${date}T${time}:00`)
      const localEndDate = addMinutes(localStartDate, duration)
      
      // Prepariamo il payload che gestirà sia formati singoli che ricorrenti
      const payload = {
        start_time: localStartDate.toISOString(),
        end_time: localEndDate.toISOString(),
        is_recurring: isRecurring,
        recurrence_end_date: isRecurring ? new Date(`${endDate}T23:59:59`).toISOString() : undefined,
        duration_minutes: duration
      }

      // Utilizzeremo la stessa Action (che aggiorneremo), delegando al backend i cicli
      const result = await createSlot(payload)

      if (result?.error) {
        setError(result.error)
      } else {
        setOpen(false)
        router.refresh()
        setDate('')
        setTime('15:00')
        setDuration(60)
        setIsRecurring(false)
        setEndDate('')
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

          <div className="flex items-center space-x-2 pt-2 border-t">
            <Checkbox 
              id="recurring" 
              checked={isRecurring} 
              onCheckedChange={(checked) => setIsRecurring(checked as boolean)} 
            />
            <Label htmlFor="recurring" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center">
              <Repeat className="w-4 h-4 mr-1 text-muted-foreground"/>
              Ripeti ogni settimana
            </Label>
          </div>

          {isRecurring && (
            <div className="grid grid-cols-4 items-center gap-4 bg-muted/30 p-3 rounded-md border text-sm">
              <Label htmlFor="endDate" className="text-right">Fino al</Label>
              <Input
                id="endDate"
                type="date"
                className="col-span-3 h-8"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={date} // Non può finire prima di iniziare
                disabled={isPending}
              />
              <p className="col-span-4 text-xs text-muted-foreground mt-1 text-right">
                Verrà creato uno slot alla stessa ora per ogni settimana inclusa.
              </p>
            </div>
          )}

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
