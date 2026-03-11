'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
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
import { loginWithMagicLink } from '@/app/actions/auth'

const formSchema = z.object({
  email: z.string().email("Inserisci un'email valida"),
})

type FormValues = z.infer<typeof formSchema>

export default function LoginPage() {
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
  })

  async function onSubmit(data: FormValues) {
    setIsPending(true)
    setError(null)

    try {
      const result = await loginWithMagicLink(data)

      if (result.error) {
        setError(result.error)
      } else if (result.success) {
        setSuccess(true)
      }
    } catch (err) {
      setError("Si è verificato un errore inaspettato.")
    } finally {
      setIsPending(false)
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
                <CardTitle className="text-2xl">Controlla la tua email</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground">
                    Ti abbiamo inviato un Magic Link per accedere alla dashboard. Clicca sul link nell'email per continuare.
                </p>
            </CardContent>
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
