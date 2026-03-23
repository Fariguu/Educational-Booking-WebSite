'use client'

import { useState } from 'react'
import { Star, MessageCircle, Send, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { toast } from 'sonner'
import { submitReviewAction } from '@/app/actions/reviews'

type Review = {
  id: string
  rating: number
  comment: string | null
  created_at: string
  profiles: {
    first_name: string | null
    last_name: string | null
  } | null
}

export function ReviewSection({ 
  professorId, 
  reviews, 
  user 
}: { 
  professorId: string
  reviews: Review[]
  user: any
}) {
  const [rating, setRating] = useState<number>(0)
  const [hoverRating, setHoverRating] = useState<number>(0)
  const [comment, setComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Controlla se l'utente ha già recensito per mostrare/nascondere il form
  const hasReviewed = user ? reviews.some(r => r.profiles?.first_name === user.user_metadata?.first_name && r.profiles?.last_name === user.user_metadata?.last_name) : false

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (rating === 0) {
      toast.error('Seleziona un numero di stelle prima di inviare.')
      return
    }

    setIsSubmitting(true)
    try {
      const res = await submitReviewAction(professorId, rating, comment)
      if (res.error) {
        toast.error(res.error)
      } else {
        toast.success('Recensione inviata con successo!')
        setRating(0)
        setComment('')
      }
    } catch {
      toast.error('Errore di rete imprevisto.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-8 mt-12 bg-white p-6 md:p-8 rounded-3xl border border-indigo-50 shadow-sm relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-amber-50 rounded-full blur-3xl opacity-50 pointer-events-none" />
      
      <div className="flex items-center gap-3 border-b border-indigo-100 pb-4 relative z-10">
        <MessageCircle className="w-6 h-6 text-amber-500" />
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">Recensioni degli Studenti</h2>
      </div>

      {user && !hasReviewed && (
        <form onSubmit={handleSubmit} className="bg-slate-50 border border-slate-100 p-5 rounded-2xl relative z-10">
          <h3 className="font-semibold text-sm mb-3">Lascia una recensione</h3>
          
          <div className="flex gap-1 mb-4">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                className="focus:outline-none transition-transform hover:scale-110"
              >
                <Star 
                  className={`w-7 h-7 ${star <= (hoverRating || rating) ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`} 
                />
              </button>
            ))}
          </div>

          <Textarea 
            placeholder="Racconta la tua esperienza con questo insegnante (opzionale)..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="mb-3 bg-white border-slate-200 focus-visible:ring-amber-500"
            rows={3}
          />

          <Button 
            type="submit" 
            disabled={isSubmitting} 
            className="w-full sm:w-auto bg-amber-500 hover:bg-amber-600 text-white shadow-sm font-medium"
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
            Invia Recensione
          </Button>
        </form>
      )}

      {user && hasReviewed && (
        <div className="bg-emerald-50 text-emerald-800 text-sm p-4 rounded-xl border border-emerald-100 relative z-10">
          Hai già lasciato una recensione per questo insegnante. Grazie per il tuo feedback!
        </div>
      )}

      {/* Lista Recensioni */}
      <div className="space-y-4 relative z-10">
        {reviews.length === 0 ? (
          <p className="text-muted-foreground text-sm py-4 italic text-center text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200">
            Nessuna recensione presente al momento.
          </p>
        ) : (
          reviews.map((r) => (
            <Card key={r.id} className="border-slate-100 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-700 font-bold flex items-center justify-center text-xs">
                      {r.profiles?.first_name?.charAt(0) || 'U'}
                    </div>
                    <div>
                      <div className="font-semibold text-sm">
                        {r.profiles?.first_name ? `${r.profiles.first_name} ${r.profiles.last_name || ''}`.trim() : 'Studente Anonimo'}
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        {new Date(r.created_at).toLocaleDateString('it-IT')}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className={`w-3.5 h-3.5 ${i < r.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`} />
                    ))}
                  </div>
                </div>
                {r.comment && (
                  <p className="text-sm mt-3 text-slate-600 italic bg-slate-50 p-3 rounded-lg border border-slate-100">
                    "{r.comment}"
                  </p>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
