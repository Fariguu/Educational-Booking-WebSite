'use client'

import { LogOut } from 'lucide-react'
import { logoutAction } from '@/app/actions/auth'
import { Button } from './ui/button'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

export default function LogoutButton() {
  const router = useRouter()

  const handleLogout = async () => {
    await logoutAction()
    toast.success("Logout effettuato")
    router.refresh()
    router.push('/')
  }

  return (
    <Button 
      variant="ghost" 
      size="sm" 
      onClick={handleLogout}
      className="text-muted-foreground hover:text-destructive transition-colors px-2"
    >
      <LogOut className="w-4 h-4 mr-2" />
      Esci
    </Button>
  )
}
