'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Loader2, Mail, Lock, Phone, User, CheckCircle2 } from 'lucide-react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { loginWithPassword, registerWithPassword, resetPasswordAction } from '@/app/actions/auth'

const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[\d\W]).{8,}$/

const schema = z.object({
  email: z.email({ message: "Inserisci un indirizzo email valido" }),
  password: z.string().min(8, "Minimo 8 caratteri").regex(passwordRegex, "Almeno 1 maiuscola, 1 minuscola e 1 numero o carattere speciale").optional().or(z.literal('')),
  firstName: z.string().min(2, "Inserisci il tuo nome").optional().or(z.literal('')),
  phone: z.string().regex(/^[+]?[0-9\s\-()]{7,}$/, "Numero di telefono non valido").optional().or(z.literal('')),
})

type AuthParams = z.infer<typeof schema>

export default function AuthModal() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const authMode = searchParams.get('auth') // 'login' | 'register' | 'forgot' | null

  // Local state to close the modal immediately without waiting for URL change
  const [isClosed, setIsClosed] = useState(false)

  const [isLogin, setIsLogin] = useState(true)
  const [isForgot, setIsForgot] = useState(false)
  const [isPending, setIsPending] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [awaitingVerification, setAwaitingVerification] = useState(false)
  const [verifiedEmail, setVerifiedEmail] = useState('')

  // When authMode changes (e.g., a new ?auth=login link is clicked), re-open
  useEffect(() => {
    if (authMode) setIsClosed(false)
    setIsForgot(authMode === 'forgot')
    if (authMode === 'register') setIsLogin(false)
    if (authMode === 'login') setIsLogin(true)
  }, [authMode])

  const { register, handleSubmit, formState: { errors }, reset } = useForm<AuthParams>({
    resolver: zodResolver(schema)
  })

  const isOpen = !!authMode && !isClosed

  // Evita scroll body se aperto
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  const closeMenu = () => {
    reset()
    setErrorMsg(null)
    setAwaitingVerification(false)
    // Immediately hide via local state
    setIsClosed(true)
    const newParams = new URLSearchParams(searchParams.toString())
    newParams.delete('auth')
    const queryString = newParams.toString()
    router.replace(queryString ? `${pathname}?${queryString}` : pathname, { scroll: false })
  }

  const toggleMode = () => {
    setErrorMsg(null)
    reset()
    setIsLogin(!isLogin)
    if (isForgot) {
      const newParams = new URLSearchParams(searchParams.toString())
      newParams.set('auth', isLogin ? 'register' : 'login')
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

  const handleResetPassword = async (email: string) => {
    const res = await resetPasswordAction(email)
    if (res.error) {
      setErrorMsg(res.error)
    } else {
      toast.success("Ti abbiamo inviato un'email con il link per reimpostare la password.", { duration: 6000 })
      closeMenu()
    }
  }

  const handleLogin = async (data: AuthParams) => {
    const res = await loginWithPassword({ email: data.email, password: data.password! })
    if (res.error) {
      setErrorMsg("Email o password errata.")
    } else {
      toast.success("Accesso effettuato")
      closeMenu()
      router.refresh()
    }
  }

  const handleRegister = async (data: AuthParams) => {
    const res = await registerWithPassword({ email: data.email, password: data.password! }) as any
    if (res.error) {
      setErrorMsg(res.error)
    } else if (res.message) {
      // OTP / email confirmation required
      setVerifiedEmail(data.email)
      setAwaitingVerification(true)
    } else {
      toast.success("Account creato con successo! Ora sei loggato.")
      closeMenu()
      router.refresh()
    }
  }

  const onSubmit = async (data: AuthParams) => {
    if (!isForgot && (!data.password || data.password.length < 8)) {
      setErrorMsg("La password è obbligatoria e deve contenere almeno 8 caratteri.")
      return
    }
    
    setIsPending(true)
    setErrorMsg(null)
    try {
      if (isForgot) {
        await handleResetPassword(data.email)
      } else if (isLogin) {
        await handleLogin(data)
      } else {
        await handleRegister(data)
      }
    } catch {
      setErrorMsg("Errore di rete")
    } finally {
      setIsPending(false)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
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
                  type="button"
                  onClick={closeMenu}
                  aria-label="Chiudi"
                  className="absolute top-5 right-5 z-[50] w-9 h-9 flex items-center justify-center rounded-full bg-background/80 hover:bg-muted text-muted-foreground transition-all shadow-sm border border-border/50 backdrop-blur-md"
                >
                    <X className="w-5 h-5" />
                </button>

                {awaitingVerification ? (
                  // ── Schermata di verifica OTP ──
                  <div className="px-8 pb-10 pt-6 text-center space-y-4 relative z-10">
                    <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center mx-auto mb-2">
                      <CheckCircle2 className="w-9 h-9 text-indigo-600" />
                    </div>
                    <h2 className="text-xl font-bold text-indigo-900">Controlla la tua email</h2>
                    <p className="text-sm text-muted-foreground">
                      Abbiamo inviato un link di conferma a <strong>{verifiedEmail}</strong>.<br/>
                      Clicca il link nell'email per attivare il tuo account.
                    </p>
                    <p className="text-xs text-muted-foreground/70 italic">Non lo vedi? Controlla la cartella spam.</p>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full mt-4"
                      onClick={closeMenu}
                    >
                      Chiudi
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="px-8 pt-10 pb-2 relative z-10">
                        <AnimatePresence mode="wait">
                            {(() => {
                                let title = "Crea un Account"
                                let description = "Unisciti a noi gratuitamente in pochi secondi."
                                if (isForgot) {
                                    title = "Recupera Password"
                                    description = "Inserisci la tua email per ricevere il link di ripristino."
                                } else if (isLogin) {
                                    title = "Bentornato"
                                    description = "Accedi per gestire le tue prenotazioni."
                                }

                                return (
                                    <motion.div
                                        key={isLogin ? 'login-text' : 'register-text'}
                                        initial={{ y: 10, opacity: 0 }}
                                        animate={{ y: 0, opacity: 1 }}
                                        exit={{ y: -10, opacity: 0 }}
                                        transition={{ duration: 0.2 }}
                                        className="text-center"
                                    >
                                        <h2 className="text-2xl font-bold tracking-tight mb-2">
                                            {title}
                                        </h2>
                                        <p className="text-sm text-muted-foreground">
                                            {description}
                                        </p>
                                    </motion.div>
                                )
                            })()}
                        </AnimatePresence>
                    </div>

                    <div className="px-8 pb-8 relative z-10">
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-6">

                            {/* Field: Nome (solo signup) */}
                            {!isLogin && !isForgot && (
                              <div className="space-y-2">
                                  <Label>Nome</Label>
                                  <div className="relative">
                                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                      <Input
                                          type="text"
                                          placeholder="Mario"
                                          className="pl-9 h-11 bg-muted/30 focus-visible:bg-transparent"
                                          {...register('firstName')}
                                          disabled={isPending}
                                      />
                                  </div>
                              </div>
                            )}

                            {/* Field: Email */}
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

                            {/* Field: Password */}
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
                                  {!isLogin && (
                                    <p className="text-[10px] text-muted-foreground italic leading-tight mt-1">
                                      Min 8 caratteri (1 maiuscola, 1 minuscola, 1 numero o spec.).<br/>
                                      <strong className="text-amber-600 font-medium">Avviso:</strong> Ricordati di non inserire una password che hai già utilizzato su altri siti.
                                    </p>
                                  )}
                              </div>
                            )}

                            {/* Field: Telefono (solo signup) */}
                            {!isLogin && !isForgot && (
                              <div className="space-y-2">
                                  <Label>Telefono <span className="text-muted-foreground text-xs">(opzionale)</span></Label>
                                  <div className="relative">
                                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                      <Input
                                          type="tel"
                                          placeholder="+39 333 000 0000"
                                          className="pl-9 h-11 bg-muted/30 focus-visible:bg-transparent"
                                          {...register('phone')}
                                          disabled={isPending}
                                      />
                                  </div>
                                  {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
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
                                {(() => {
                                    if (isPending) return <Loader2 className="w-5 h-5 animate-spin" />
                                    if (isForgot) return "Invia Link di Ripristino"
                                    return isLogin ? "Accedi" : "Crea Account"
                                })()}
                            </Button>
                        </form>

                        <div className="mt-8 text-center text-sm">
                            <span className="text-muted-foreground">
                                {(() => {
                                    if (isForgot) return "Ti sei ricordato la password? "
                                    return isLogin ? "Non hai un account? " : "Hai già un account? "
                                })()}
                            </span>
                            <button 
                                type="button" 
                                onClick={toggleMode}
                                className="font-semibold text-indigo-600 hover:text-indigo-700 hover:underline transition-all"
                            >
                                {(() => {
                                    if (isForgot) return "Torna al Login"
                                    return isLogin ? "Registrati ora" : "Accedi"
                                })()}
                            </button>
                        </div>
                    </div>
                  </>
                )}
            </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
