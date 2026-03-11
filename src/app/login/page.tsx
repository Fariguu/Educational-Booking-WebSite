'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, MailCheck } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { loginWithMagicLink, verifyOtpAction } from '@/app/actions/auth'

const formSchema = z.object({
  email: z.string().email("Inserisci un'email valida"),
})

type FormValues = z.infer<typeof formSchema>

export default function LoginPage() {
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [typedEmail, setTypedEmail] = useState('')
  const [otpCode, setOtpCode] = useState('')
  const [isVerifying, setIsVerifying] = useState(false)

  const router = useRouter()

  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
  })

  useEffect(() => {
    // Client Supabase per ascoltare eventi Auth da browser
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' || session) {
        // Appena l'utente viene autenticato (es: cliccando il magic link dal cellulare)
        // la sessione diventa disponibile anche su questo client web (se stesso browser) 
        // o al ricaricamento. Ma ascoltiamo primariamente per scatti reattivi.
        router.push('/admin')
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [router])

  async function onSubmit(data: FormValues) {
    setIsPending(true)
    setError(null)

    try {
      const result = await loginWithMagicLink(data)

      if (result.error) {
        setError(result.error)
      } else if (result.success) {
        setTypedEmail(data.email)
        setSuccess(true)
      }
    } catch (err) {
      setError("Si è verificato un errore inaspettato.")
    } finally {
      setIsPending(false)
    }
  }

  async function onVerifyOtp() {
    if (otpCode.length < 6) return
    setIsVerifying(true)
    setError(null)
    try {
      const result = await verifyOtpAction(typedEmail, otpCode)
      if (result.error) {
        setError(result.error)
      } else {
        router.push('/admin')
      }
    } catch (err) {
      setError("Errore durante la verifica del codice.")
    } finally {
      setIsVerifying(false)
    }
  }

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4 bg-muted/30">
        <Card className="w-full max-w-md shadow-lg border-primary/20 bg-background text-center py-8">
            <CardHeader>
                <div className="flex justify-center mb-4">
                    <MailCheck className="h-12 w-12 text-green-500" />
                </div>
                <CardTitle className="text-2xl">Email inviata!</CardTitle>
                <CardDescription>
                  Abbiamo inviato un link di accesso a <strong>{typedEmail}</strong>.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                    Puoi cliccare sul link nell'email oppure inserire qui sotto il <strong>codice a 6 cifre</strong> presente nel testo del messaggio:
                </p>
                
                <div className="space-y-2">
                  <Input 
                    type="text" 
                    placeholder="Codice a 6 cifre" 
                    className="text-center text-2xl font-mono tracking-[0.5em]"
                    maxLength={6}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                  />
                  {error && (
                    <p className="text-xs text-destructive text-center">{error}</p>
                  )}
                </div>

                <Button 
                  onClick={onVerifyOtp} 
                  className="w-full" 
                  disabled={otpCode.length < 6 || isVerifying}
                >
                  {isVerifying ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Verifica in corso...
                    </>
                  ) : (
                    "Conferma Codice"
                  )}
                </Button>

                <div className="flex items-center justify-center text-xs text-muted-foreground pt-4 border-t">
                  <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                  In attesa di conferma dall'email...
                </div>
            </CardContent>
            <CardFooter className="justify-center">
              <Button variant="link" size="sm" onClick={() => setSuccess(false)}>
                Torna all'inserimento email
              </Button>
            </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-muted/30">
      <Card className="w-full max-w-md shadow-lg border-primary/20 bg-background">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold tracking-tight">Accesso Admin</CardTitle>
          <CardDescription>
            Inserisci la tua email per ricevere il link di accesso sicuro.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="professore@esempio.com"
                {...register("email")}
                disabled={isPending}
              />
              {errors.email && (
                <p className="text-sm font-medium text-destructive">{errors.email.message}</p>
              )}
            </div>
            
            {error && (
              <div className="p-3 bg-destructive/15 text-destructive text-sm rounded-md border border-destructive/20 font-medium whitespace-pre-wrap">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Invio in corso...
                </>
              ) : (
                "Invia Magic Link"
              )}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center border-t p-4 mt-4">
            <p className="text-xs text-muted-foreground">
                Modulo protetto e riservato esclusivamente all'amministrazione.
            </p>
        </CardFooter>
      </Card>
    </div>
  )
}
