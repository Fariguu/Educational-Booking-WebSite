'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Turnstile } from '@marsidev/react-turnstile'
import { Loader2, CheckCircle2, AlertCircle, Send } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { sendContactMessage } from '@/app/actions/contact'

const formSchema = z.object({
  name: z.string().min(2, 'Il nome deve avere almeno 2 caratteri'),
  email: z.string().email('Inserisci un indirizzo email valido'),
  message: z.string().min(10, 'Il messaggio deve avere almeno 10 caratteri'),
})
type FormValues = z.infer<typeof formSchema>

export default function ContactForm() {
  const [turnstileToken, setTurnstileToken] = useState('')
  const [turnstileKey, setTurnstileKey] = useState(0)
  const [isPending, setIsPending] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
  })

  const onSubmit = async (values: FormValues) => {
    if (!turnstileToken) return
    setIsPending(true)
    setError(null)

    const result = await sendContactMessage({ ...values, turnstileToken })

    if (result.error) {
      setError(result.error)
      setTurnstileToken('')
      setTurnstileKey(k => k + 1)
    } else {
      setSuccess(true)
      reset()
    }
    setIsPending(false)
  }

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center gap-4">
        <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center">
          <CheckCircle2 className="w-8 h-8 text-green-500" />
        </div>
        <h3 className="text-xl font-bold">Messaggio inviato!</h3>
        <p className="text-muted-foreground max-w-sm">
          Grazie per avermi scritto. Ti risponderò il prima possibile all&apos;indirizzo email indicato.
        </p>
        <Button variant="outline" onClick={() => setSuccess(false)}>
          Invia un altro messaggio
        </Button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {error && (
        <div className="flex items-center gap-3 p-3 rounded-lg bg-destructive/5 border border-destructive/20 text-destructive text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Nome Completo</Label>
          <Input id="name" {...register('name')} placeholder="Mario Rossi" disabled={isPending} />
          {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" {...register('email')} placeholder="mario@esempio.it" disabled={isPending} />
          {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="message">Messaggio</Label>
        <Textarea
          id="message"
          {...register('message')}
          placeholder="Scrivi qui il tuo messaggio, una domanda o una richiesta di informazioni..."
          rows={5}
          disabled={isPending}
        />
        {errors.message && <p className="text-xs text-destructive">{errors.message.message}</p>}
      </div>

      <div className="flex justify-center">
        <Turnstile
          key={turnstileKey}
          siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!}
          onSuccess={(token) => setTurnstileToken(token)}
        />
      </div>

      <Button
        type="submit"
        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
        disabled={isPending || !turnstileToken}
      >
        {isPending ? (
          <>
            <Loader2 className="mr-2 w-4 h-4 animate-spin" />
            Invio in corso...
          </>
        ) : (
          <>
            <Send className="mr-2 w-4 h-4" />
            Invia Messaggio
          </>
        )}
      </Button>
    </form>
  )
}
