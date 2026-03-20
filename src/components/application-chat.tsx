'use client'

import { useState, useEffect, useCallback } from 'react'
import { Send, Loader2, User, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { getApplicationMessages, sendApplicationMessage } from '@/app/actions/roles'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'
import { it } from 'date-fns/locale'

type Message = {
  id: string
  content: string
  created_at: string
  sender_id: string
  profiles: {
    role: string
    first_name: string | null
    last_name: string | null
  }
}

export function ApplicationChat({ 
    applicationId, 
    currentUserId,
    userRole 
}: { 
    applicationId: string, 
    currentUserId: string,
    userRole: string 
}) {
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [isPending, setIsPending] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const loadMessages = useCallback(async () => {
    const res = await getApplicationMessages(applicationId, 10)
    if (res.data) {
      // Cast o map se necessario per i tipi di Supabase
      const formatted = (res.data as any[]).map(msg => ({
        ...msg,
        profiles: Array.isArray(msg.profiles) ? msg.profiles[0] : msg.profiles
      }))
      setMessages(formatted)
    }
    setIsLoading(false)
  }, [applicationId])

  useEffect(() => {
    loadMessages()
    
    // Polling semplice ogni 10 secondi per questo MVP
    const interval = setInterval(loadMessages, 10000)
    return () => clearInterval(interval)
  }, [loadMessages])

  const handleSend = async () => {
    if (!newMessage.trim()) return
    setIsPending(true)
    const res = await sendApplicationMessage(applicationId, newMessage)
    if (res.error) {
      toast.error(res.error)
    } else {
      setNewMessage('')
      loadMessages()
    }
    setIsPending(false)
  }

  if (isLoading) return <div className="flex justify-center p-4"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>

  return (
    <div className="space-y-4">
      <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 scrollbar-thin">
        {messages.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-4 italic">Nessun messaggio ancora.</p>
        ) : (
          messages.map((msg) => {
            const isAdmin = msg.profiles.role === 'admin' || msg.profiles.role === 'superadmin'
            const isMe = msg.sender_id === currentUserId

            return (
              <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                <div className={`max-w-[85%] rounded-2xl px-3 py-2 text-xs shadow-sm ${
                  isMe 
                    ? 'bg-indigo-600 text-white rounded-tr-none' 
                    : 'bg-muted/50 text-foreground rounded-tl-none'
                }`}>
                  <div className="flex items-center gap-1.5 mb-1 opacity-70 font-bold text-[9px] uppercase tracking-wider">
                    {isAdmin ? <ShieldCheck className="w-2.5 h-2.5" /> : <User className="w-2.5 h-2.5" />}
                    {isAdmin ? 'Amministrazione' : 'Candidato'}
                  </div>
                  <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                </div>
                <span className="text-[9px] text-muted-foreground mt-1 px-1">
                  {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true, locale: it })}
                </span>
              </div>
            )
          })
        )}
      </div>

      <div className="flex gap-2 items-end pt-2 border-t">
        <Textarea 
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Scrivi un messaggio..."
          className="text-xs min-h-[60px] resize-none bg-muted/20"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              handleSend()
            }
          }}
        />
        <Button 
          size="icon" 
          className="h-9 w-9 shrink-0 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white"
          onClick={handleSend}
          disabled={isPending || !newMessage.trim()}
        >
          {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </Button>
      </div>
    </div>
  )
}
