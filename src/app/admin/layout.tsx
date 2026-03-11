import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-muted/10">
      <header className="bg-background border-b px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold">Area Admin</h1>
        <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">{user.email}</span>
            <form action="/auth/signout" method="POST">
                <button type="submit" className="text-sm text-destructive hover:underline">
                    Esci
                </button>
            </form>
        </div>
      </header>
      <main className="p-6">
        {children}
      </main>
    </div>
  )
}
