'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { it } from 'date-fns/locale'
import { CheckCircle2, Clock, XCircle, Trash2, Loader2 } from 'lucide-react'

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from '@/components/ui/button'
import { removeAvailableSlot, confirmLesson, rejectLesson } from '@/app/actions/admin'

// Definiamo il tipo basandoci sullo schema
export type Lesson = {
  id: string
  start_time: string
  end_time: string
  is_available: boolean
  status: 'available' | 'pending' | 'confirmed'
  student_name: string | null
  student_contact: string | null
  notes: string | null
}

interface AdminTabsProps {
  initialLessons: Lesson[]
}

export function AdminTabs({ initialLessons }: AdminTabsProps) {
  const [lessons, setLessons] = useState<Lesson[]>(initialLessons)
  const [isRemoving, setIsRemoving] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState<string | null>(null)

  // Filtriamo le lezioni per le varie tab
  const pendingLessons = lessons.filter(l => l.status === 'pending')
  const confirmedLessons = lessons.filter(l => l.status === 'confirmed')
  const availableSlots = lessons.filter(l => l.status === 'available' && l.is_available)

  const formatDateTime = (dateString: string) => {
    return format(new Date(dateString), "dd MMMM yyyy, HH:mm", { locale: it })
  }

  async function handleRemove(id: string) {
    setIsRemoving(id)
    await removeAvailableSlot(id)
    setLessons(prev => prev.filter(l => l.id !== id))
    setIsRemoving(null)
  }

  async function handleConfirm(id: string) {
    setIsProcessing(id)
    const result = await confirmLesson(id)
    if (result?.gcalUrl) {
      window.open(result.gcalUrl, '_blank')
    }
    setLessons(prev => prev.map(l => l.id === id ? { ...l, status: 'confirmed' } : l))
    setIsProcessing(null)
  }

  async function handleReject(id: string) {
    setIsProcessing(id)
    await rejectLesson(id)
    setLessons(prev => prev.map(l => l.id === id ? { ...l, status: 'available', student_name: null, student_contact: null, notes: null, is_available: true } : l))
    setIsProcessing(null)
  }

  return (
    <Tabs defaultValue="pending" className="w-full">
      <TabsList className="grid w-full mb-8" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        <TabsTrigger value="pending">
          Da Confermare
          {pendingLessons.length > 0 && (
            <Badge variant="destructive" className="ml-2 rounded-full px-2 py-0.5 text-xs">
              {pendingLessons.length}
            </Badge>
          )}
        </TabsTrigger>
        <TabsTrigger value="confirmed">Confermate ({confirmedLessons.length})</TabsTrigger>
        <TabsTrigger value="available">Slot Liberi ({availableSlots.length})</TabsTrigger>
      </TabsList>

      <TabsContent value="pending">
        <Card>
          <CardHeader>
            <CardTitle>Richieste in attesa</CardTitle>
            <CardDescription>
              Queste lezioni sono state prenotate dagli studenti e necessitano di una tua conferma.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {pendingLessons.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">Nessuna richiesta in attesa.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data e Ora</TableHead>
                    <TableHead>Studente</TableHead>
                    <TableHead>Contatto</TableHead>
                    <TableHead>Note</TableHead>
                    <TableHead className="text-right">Azioni</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingLessons.map((lesson) => (
                    <TableRow key={lesson.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-orange-500" />
                          {formatDateTime(lesson.start_time)}
                        </div>
                      </TableCell>
                      <TableCell>{lesson.student_name}</TableCell>
                      <TableCell>
                        <a href={`mailto:${lesson.student_contact}`} className="text-primary hover:underline">
                          {lesson.student_contact}
                        </a>
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate" title={lesson.notes || ''}>
                        {lesson.notes || '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="text-green-600 hover:text-green-700 hover:bg-green-50"
                            onClick={() => handleConfirm(lesson.id)}
                            disabled={isProcessing === lesson.id}
                           >
                            {isProcessing === lesson.id ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-1" />}
                            Conferma
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => handleReject(lesson.id)}
                            disabled={isProcessing === lesson.id}
                           >
                            {isProcessing === lesson.id ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <XCircle className="w-4 h-4 mr-1" />}
                            Rifiuta
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="confirmed">
        <Card>
          <CardHeader>
            <CardTitle>Lezioni Confermate</CardTitle>
            <CardDescription>
              Lezioni passate o future che hai già confermato.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {confirmedLessons.length === 0 ? (
               <p className="text-center text-muted-foreground py-8">Nessuna lezione confermata.</p>
            ) : (
                <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data e Ora</TableHead>
                    <TableHead>Studente</TableHead>
                    <TableHead>Contatto</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {confirmedLessons.map((lesson) => (
                    <TableRow key={lesson.id}>
                      <TableCell className="font-medium text-green-600">
                        {formatDateTime(lesson.start_time)}
                      </TableCell>
                      <TableCell>{lesson.student_name}</TableCell>
                      <TableCell>{lesson.student_contact}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="available">
        <Card>
          <CardHeader>
            <CardTitle>I tuoi slot liberi</CardTitle>
            <CardDescription>
              Orari attualmente visibili al pubblico e prenotabili.
            </CardDescription>
          </CardHeader>
          <CardContent>
             {availableSlots.length === 0 ? (
               <p className="text-center text-muted-foreground py-8">Non hai nessuno slot libero futuro pubblicato.</p>
            ) : (
                <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data e Ora</TableHead>
                    <TableHead>Stato</TableHead>
                    <TableHead className="text-right">Azioni</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {availableSlots.map((lesson) => (
                    <TableRow key={lesson.id}>
                      <TableCell className="font-medium">
                        {formatDateTime(lesson.start_time)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">Pubblico</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                            size="sm" 
                            variant="ghost" 
                            className="text-destructive"
                            onClick={() => handleRemove(lesson.id)}
                            disabled={isRemoving === lesson.id}
                        >
                            {isRemoving === lesson.id ? (
                                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                            ) : (
                                <Trash2 className="w-4 h-4 mr-1" />
                            )}
                            Rimuovi
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )
}
