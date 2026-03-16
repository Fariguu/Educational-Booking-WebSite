'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Turnstile } from '@marsidev/react-turnstile'
import { Loader2, Send } from 'lucide-react'
import { requestReschedule } from '@/app/actions/booking'

import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'

const schema = z.object({
  notes: z.string().min(5, "Scrivi almeno 5 caratteri per spiegare la tua richiesta."),
})

type FormValues = z.infer<typeof schema>

export default function RescheduleForm({ slotId }: { slotId: string }) {
  const [turnstileToken, setTurnstileToken] = useState("")
  const [turnstileKey, setTurnstileKey] = useState(0)
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (values: FormValues) => {
    if (!turnstileToken) return
    setIsPending(true)
    setError(null)

    try {
      const res = await requestReschedule({
        slotId,
        notes: values.notes,
        turnstileToken
      })

      if (res?.error) {
        setError(res.error)
        setTurnstileToken("")
        setTurnstileKey(prev => prev + 1)
      } else {
        setSuccess(true)
      }
    } catch (err) {
      setError("Si è verificato un errore di rete.")
    } finally {
      setIsPending(false)
    }
  }

  if (success) {
    return (
      <div className="bg-emerald-50 text-emerald-800 p-6 rounded-2xl text-center border border-emerald-100">
        <h3 className="font-bold text-lg mb-2">Richiesta Inviata!</h3>
        <p className="text-sm">Il professore ha ricevuto la tua richiesta di spostamento e ti contatterà al più presto.</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="reschedule-notes" className="font-semibold text-slate-700">Richiedi Spostamento</Label>
        <p className="text-xs text-slate-500 mb-2">Descrivi il motivo e suggerisci eventuali orari e giorni alternativi.</p>
        <Textarea 
          id="reschedule-notes" 
          placeholder="Es: Ciao, purtroppo ho un imprevisto. Possiamo fare venerdì pomeriggio?"
          className="min-h-[100px] bg-white"
          {...register("notes")}
        />
        {errors.notes && <p className="text-xs text-destructive">{errors.notes.message}</p>}
      </div>

      {error && (
        <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-lg">
          {error}
        </div>
      )}

      <div className="flex justify-center py-2">
        <Turnstile
          key={turnstileKey}
          siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || ''}
          onSuccess={setTurnstileToken}
        />
      </div>

      <Button 
        type="submit" 
        className="w-full bg-slate-900 text-white hover:bg-slate-800" 
        disabled={isPending || !turnstileToken}
      >
        {isPending ? (
          <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Invio in corso...</>
        ) : (
          <><Send className="mr-2 h-4 w-4" /> Invia Richiesta</>
        )}
      </Button>
    </form>
  )
}
