import { createClient } from '@/utils/supabase/server'
import { notFound } from 'next/navigation'
import RescheduleForm from '@/components/reschedule-form'
import { format } from 'date-fns'
import { it } from 'date-fns/locale'
import { Calendar, Clock, AlertCircle } from 'lucide-react'

// Forza rendering dinamico in app router per usare i param
export const dynamic = 'force-dynamic'

export default async function ManageLessonPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient()

  // Preleviamo i details e assicuriamoci che non sia un blocco libero
  const { data: lesson, error } = await supabase
    .from('lessons')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !lesson || !lesson.student_contact) {
    notFound() // Gestisce slot inesistenti o non associati ad uno studente
  }

  const start = new Date(lesson.start_time)
  const end = new Date(lesson.end_time)

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6">
      <div className="max-w-md mx-auto bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        
        {/* Header */}
        <div className="bg-purple-600 px-6 py-8 text-white text-center">
          <h1 className="text-2xl font-bold mb-2">Gestisci Prenotazione</h1>
          <p className="opacity-90 text-sm">Riepilogo e opzioni della tua lezione</p>
        </div>

        <div className="p-6">
          {/* Status Banner */}
          {lesson.reschedule_requested ? (
            <div className="mb-6 p-4 bg-amber-50 text-amber-800 rounded-xl border border-amber-200 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-sm">Richiesta di spostamento in attesa</p>
                <p className="text-xs mt-1 opacity-90">Hai già richiesto lo spostamento per questo orario. Il professore ti risponderà presto via email.</p>
              </div>
            </div>
          ) : (
            <div className="mb-6 p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-start gap-3">
               <div className="mt-0.5 flex-shrink-0 w-2 h-2 rounded-full mt-2 bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.8)] animate-pulse" />
               <div>
                  <p className="font-medium text-sm text-slate-800">
                    Stato: <span className="uppercase tracking-wider text-xs font-bold text-purple-600 ml-1">{lesson.status}</span>
                  </p>
               </div>
            </div>
          )}

          {/* Dettagli Lezione */}
          <div className="space-y-4 mb-8">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Dettagli Appuntamento</h3>
            
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-slate-500">Data</p>
                <p className="font-medium capitalize">{format(start, "EEEE d MMMM yyyy", { locale: it })}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-slate-500">Orario</p>
                <p className="font-medium">{format(start, "HH:mm")} - {format(end, "HH:mm")}</p>
              </div>
            </div>
          </div>

          <hr className="border-slate-100 mb-6" />

          {/* Form di Reschedule (Client Component) */}
          {!lesson.reschedule_requested && (
            <RescheduleForm slotId={lesson.id} />
          )}

        </div>
      </div>
    </div>
  )
}
