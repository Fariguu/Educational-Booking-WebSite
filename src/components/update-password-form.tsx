'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Lock, Loader2, KeyRound } from 'lucide-react'
import { toast } from 'sonner'
import { updatePasswordAction } from '@/app/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function UpdatePasswordForm() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isPending, setIsPending] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[\d\W]).{8,}$/

    if (!passwordRegex.test(password)) {
      setErrorMsg("Minimo 8 caratteri, almeno 1 maiuscola, 1 minuscola e 1 numero o carattere speciale.")
      return
    }

    if (password !== confirmPassword) {
      setErrorMsg("Le password non coincidono.")
      return
    }

    setIsPending(true)
    try {
      const res = await updatePasswordAction(password)
      if (res.error) {
        setErrorMsg(res.error)
      } else {
        toast.success("Password aggiornata con successo!")
        router.push('/?auth=login')
      }
    } catch {
      setErrorMsg("Errore di rete durante l'aggiornamento.")
    } finally {
      setIsPending(false)
    }
  }

  return (
    <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="relative w-full max-w-md bg-white border border-slate-200 shadow-xl rounded-3xl overflow-hidden"
    >
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-br from-indigo-500 to-purple-600 opacity-10 pointer-events-none" />

        <div className="px-8 pt-10 pb-6 relative z-10 text-center">
            <div className="mx-auto w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mb-4 text-indigo-600">
                <KeyRound className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight mb-2">Imposta Nuova Password</h2>
            <p className="text-sm text-slate-500">Scegli una nuova password sicura per il tuo account.</p>
        </div>

        <div className="px-8 pb-8 relative z-10">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                    <Label>Nuova Password</Label>
                    <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input 
                            type="password" 
                            placeholder="••••••••" 
                            className="pl-9 h-11 bg-slate-50 focus-visible:bg-transparent"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            disabled={isPending}
                            required
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <Label>Conferma Password</Label>
                    <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input 
                            type="password" 
                            placeholder="••••••••" 
                            className="pl-9 h-11 bg-slate-50 focus-visible:bg-transparent"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            disabled={isPending}
                            required
                        />
                    </div>
                </div>

                {errorMsg && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }} 
                      animate={{ opacity: 1, height: 'auto' }} 
                      className="text-sm text-red-600 font-medium text-center bg-red-50 py-2 rounded-md"
                    >
                        {errorMsg}
                    </motion.div>
                )}

                <Button 
                    type="submit" 
                    className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-base mt-4 shadow-md shadow-indigo-200 transition-all"
                    disabled={isPending}
                >
                    {isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : "Aggiorna Password"}
                </Button>
            </form>
        </div>
    </motion.div>
  )
}
