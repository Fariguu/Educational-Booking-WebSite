import { createClient } from '@/utils/supabase/server'
import { AdminTabs, type Lesson } from '@/components/admin/admin-tabs'
import { CreateSlotDialog } from '@/components/admin/create-slot-dialog'

export default async function AdminDashboardPage() {
    const supabase = await createClient()

    // L'utente autenticato (admin) vedrà tutte le righe grazie alla RLS Policy 'Admin Policy'
    const { data: lessons, error } = await supabase
        .from('lessons')
        .select('*')
        .order('start_time', { ascending: true })

    if (error) {
        return (
            <div className="p-4 bg-destructive/15 text-destructive rounded-md">
                Errore nel caricamento delle lezioni: {error.message}
            </div>
        )
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Dashboard Prenotazioni</h2>
                <CreateSlotDialog />
            </div>
            
            <p className="text-muted-foreground mb-6">
                Gestisci le richieste degli studenti, visualizza le prenotazioni confermate e i tuoi slot liberi.
            </p>

            <AdminTabs initialLessons={(lessons as Lesson[]) || []} />
        </div>
    )
}
