'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Turnstile } from '@marsidev/react-turnstile'
import { Loader2, AlertCircle, Send } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { sendContactMessage } from '@/app/actions/contact'

const formSchema = z.object({
  name: z.string().min(2, 'Il nome deve avere almeno 2 caratteri'),
  email: z.string().email('Inserisci un indirizzo email valido'),
  message: z.string().min(10, 'Il messaggio deve avere almeno 10 caratteri'),
  privacy: z.boolean().refine((v) => v === true, {
    message: 'Devi accettare la privacy policy per procedere',
  }),
})
type FormValues = z.infer<typeof formSchema>

export default function ContactForm({ professorId }: { professorId: string }) {
  const [turnstileToken, setTurnstileToken] = useState('')
  const [turnstileKey, setTurnstileKey] = useState(0)
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { privacy: false },
  })

  const privacyChecked = watch('privacy')

  const onSubmit = async (values: FormValues) => {
    if (!turnstileToken) return
    setIsPending(true)
    setError(null)

    const result = await sendContactMessage({ ...values, turnstileToken, professorId })

    if (result.error) {
      setError(result.error)
      setTurnstileToken('')
      setTurnstileKey(k => k + 1)
    } else {
      toast.success('Messaggio inviato!', {
        description: 'Ti risponderò il prima possibile all\'indirizzo email indicato.',
        duration: 6000,
      })
      reset()
      setTurnstileToken('')
      setTurnstileKey(k => k + 1)
    }
    setIsPending(false)
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

      {/* Privacy checkbox */}
      <div className="space-y-1">
        <div className="flex items-start gap-3">
          <Checkbox
            id="privacy"
            checked={privacyChecked}
            onCheckedChange={(checked) => setValue('privacy', checked === true, { shouldValidate: true })}
            disabled={isPending}
            className="mt-0.5"
          />
          <Label htmlFor="privacy" className="text-sm font-normal leading-relaxed cursor-pointer">
            Ho letto e accetto la{' '}
            <Link href="/privacy" target="_blank" className="text-indigo-600 hover:underline font-medium">
              Privacy Policy
            </Link>
            {' '}e acconsento al trattamento dei miei dati personali.
          </Label>
        </div>
        {errors.privacy && <p className="text-xs text-destructive pl-7">{errors.privacy.message}</p>}
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
        disabled={isPending || !turnstileToken || !privacyChecked}
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
