'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Loader2, Mail, Lock } from 'lucide-react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { loginWithPassword, registerWithPassword, resetPasswordAction } from '@/app/actions/auth'

const schema = z.object({
  email: z.string().email("Email non valida"),
  password: z.string().min(6, "Minimo 6 caratteri").optional().or(z.literal('')),
})

type AuthParams = z.infer<typeof schema>

export default function AuthModal() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const authMode = searchParams.get('auth') // 'login' | 'register' | 'forgot' | null

  const [isLogin, setIsLogin] = useState(true)
  const [isForgot, setIsForgot] = useState(false)
  const [isPending, setIsPending] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  useEffect(() => {
    setIsForgot(authMode === 'forgot')
    if (authMode === 'register') setIsLogin(false)
    if (authMode === 'login') setIsLogin(true)
  }, [authMode])

  const { register, handleSubmit, formState: { errors }, reset } = useForm<AuthParams>({
    resolver: zodResolver(schema)
  })

  // Evita scroll body se aperto
  useEffect(() => {
    if (authMode) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
  }, [authMode])

  if (!authMode) return null

  const closeMenu = () => {
    reset()
    setErrorMsg(null)
    const newParams = new URLSearchParams(searchParams.toString())
    newParams.delete('auth')
    const queryString = newParams.toString()
    router.push(queryString ? `${pathname}?${queryString}` : pathname)
  }

  const toggleMode = () => {
    setErrorMsg(null)
    reset()
    setIsLogin(!isLogin)
    if (isForgot) {
      const newParams = new URLSearchParams(searchParams.toString())
      newParams.set('auth', !isLogin ? 'login' : 'register')
      router.push(`${pathname}?${newParams.toString()}`)
    }
  }

  const goToForgot = () => {
    setErrorMsg(null)
    reset()
    const newParams = new URLSearchParams(searchParams.toString())
    newParams.set('auth', 'forgot')
    router.push(`${pathname}?${newParams.toString()}`)
  }

  const onSubmit = async (data: AuthParams) => {
    if (!isForgot && (!data.password || data.password.length < 6)) {
      setErrorMsg("La password è obbligatoria e deve contenere almeno 6 caratteri.")
      return
    }
    
    setIsPending(true)
    setErrorMsg(null)
    try {
      if (isForgot) {
         const res = await resetPasswordAction(data.email)
         if (res.error) {
           setErrorMsg(res.error)
         } else {
           toast.success("Ti abbiamo inviato un'email con il link per reimpostare la password.", { duration: 6000 })
           closeMenu()
         }
      } else if (isLogin) {
        const res = await loginWithPassword({ email: data.email, password: data.password! })
        if (res.error) {
          setErrorMsg(res.error)
        } else {
          toast.success("Accesso effettuato")
          closeMenu()
          router.refresh()
        }
      } else {
        const res = await registerWithPassword({ email: data.email, password: data.password! }) as any
        if (res.error) {
          setErrorMsg(res.error)
        } else {
          if (res.message) {
            toast.info(res.message, { duration: 6000 })
          } else {
            toast.success("Account creato con successo! Ora sei loggato.")
          }
          closeMenu()
          router.refresh()
        }
      }
    } catch {
      setErrorMsg("Errore di rete")
    } finally {
      setIsPending(false)
    }
  }

  return (
    <AnimatePresence>
      {authMode && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-0">
            {/* Backdrop */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={closeMenu}
                className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            />

            {/* Modal Container */}
            <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 20 }}
                transition={{ type: "spring", bounce: 0, duration: 0.4 }}
                className="relative w-full max-w-md bg-card border shadow-2xl rounded-3xl overflow-hidden"
            >
                {/* Header animato bg decorazione */}
                <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-br from-indigo-500 to-purple-600 opacity-10 pointer-events-none" />

                <button 
                  onClick={closeMenu}
                  className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-muted/50 hover:bg-muted text-muted-foreground transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>

                <div className="px-8 pt-10 pb-2 relative z-10">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={isLogin ? 'login-text' : 'register-text'}
                            initial={{ y: 10, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: -10, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="text-center"
                        >
                            <h2 className="text-2xl font-bold tracking-tight mb-2">
                                {isForgot ? "Recupera Password" : (isLogin ? "Bentornato" : "Crea un Account")}
                            </h2>
                            <p className="text-sm text-muted-foreground">
                                {isForgot ? "Inserisci la tua email per ricevere il link di ripristino." : (isLogin ? "Accedi per gestire le tue prenotazioni." : "Unisciti a noi gratuitamente in pochi secondi.")}
                            </p>
                        </motion.div>
                    </AnimatePresence>
                </div>

                <div className="px-8 pb-8 relative z-10">
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-6">
                        <div className="space-y-2">
                            <Label>Email</Label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input 
                                    type="email" 
                                    placeholder="nome@esempio.it" 
                                    className="pl-9 h-11 bg-muted/30 focus-visible:bg-transparent"
                                    {...register('email')}
                                    disabled={isPending}
                                />
                            </div>
                            {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
                        </div>

                        {!isForgot && (
                          <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <Label>Password</Label>
                                {isLogin && (
                                  <button type="button" onClick={goToForgot} className="text-xs font-medium text-indigo-600 hover:text-indigo-700">
                                    Password dimenticata?
                                  </button>
                                )}
                              </div>
                              <div className="relative">
                                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                  <Input 
                                      type="password" 
                                      placeholder="••••••••" 
                                      className="pl-9 h-11 bg-muted/30 focus-visible:bg-transparent"
                                      {...register('password')}
                                      disabled={isPending}
                                  />
                              </div>
                              {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
                          </div>
                        )}

                        {errorMsg && (
                            <motion.div 
                              initial={{ opacity: 0, height: 0 }} 
                              animate={{ opacity: 1, height: 'auto' }} 
                              className="text-sm text-destructive font-medium text-center bg-destructive/10 py-2 rounded-md"
                            >
                                {errorMsg}
                            </motion.div>
                        )}

                        <Button 
                            type="submit" 
                            className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-base mt-2 shadow-md shadow-indigo-200 transition-all"
                            disabled={isPending}
                        >
                            {isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : (isForgot ? "Invia Link di Ripristino" : (isLogin ? "Accedi" : "Registrati"))}
                        </Button>
                    </form>

                    <div className="mt-8 text-center text-sm">
                        <span className="text-muted-foreground">
                            {isForgot ? "Ti sei ricordato la password? " : (isLogin ? "Non hai un account? " : "Hai già un account? ")}
                        </span>
                        <button 
                            type="button" 
                            onClick={toggleMode}
                            className="font-semibold text-indigo-600 hover:text-indigo-700 hover:underline transition-all"
                        >
                            {isForgot ? "Torna al Login" : (isLogin ? "Registrati ora" : "Accedi")}
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
