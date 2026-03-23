'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { User, Mail, Phone, BookOpen, Loader2, Save } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { updateProfile } from '@/app/actions/profile'

const ProfileSchema = z.object({
  firstName: z.string().min(2, "Il nome deve avere almeno 2 caratteri"),
  lastName: z.string().min(2, "Il cognome deve avere almeno 2 caratteri"),
  bio: z.string().optional(),
  phone: z.string().optional(),
  publicEmail: z.string().email("Inserisci un indirizzo email valido").optional().or(z.literal('')),
  subjects: z.string().optional(), // Gestito come stringa separata da virgola per semplicità in input
})

type ProfileFormValues = z.infer<typeof ProfileSchema>

export default function ProfileForm({ 
  profile, 
  roleData,
  userEmail 
}: { 
  profile: any
  roleData: any
  userEmail: string
}) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<ProfileFormValues>({
    resolver: zodResolver(ProfileSchema),
    defaultValues: {
      firstName: profile.first_name || '',
      lastName: profile.last_name || '',
      bio: profile.bio || roleData.bio || '',
      phone: profile.phone || roleData.phone || '',
      publicEmail: roleData.email || '',
      subjects: roleData.teaching_subjects?.join(', ') || ''
    }
  })

  const onSubmit = async (data: ProfileFormValues) => {
    setIsSubmitting(true)
    try {
      const subjectsArray = data.subjects 
        ? data.subjects.split(',').map(s => s.trim()).filter(s => s !== '')
        : []
      
      const res = await updateProfile({
        ...data,
        subjects: subjectsArray
      })

      if (res.error) {
        toast.error(res.error)
      } else {
        toast.success("Profilo aggiornato con successo!")
      }
    } catch (err) {
      toast.error("Errore imprevisto durante il salvataggio.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {/* 1. Personal Data Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5 text-indigo-600" />
            Dati Personali
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">Nome</Label>
              <Input 
                id="firstName" 
                placeholder="Es: Mario"
                {...register('firstName')} 
              />
              {errors.firstName && <p className="text-xs text-destructive">{errors.firstName.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Cognome</Label>
              <Input 
                id="lastName" 
                placeholder="Es: Rossi"
                {...register('lastName')} 
              />
              {errors.lastName && <p className="text-xs text-destructive">{errors.lastName.message}</p>}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="bio">Bio / Presentazione</Label>
            <Textarea 
              id="bio" 
              placeholder="Scrivi qualcosa su di te..."
              rows={4}
              {...register('bio')} 
            />
            <p className="text-xs text-muted-foreground italic">Questa bio è utile per far conoscere meglio la tua esperienza.</p>
          </div>
        </CardContent>
      </Card>

      {/* 2. Public / Teaching Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-emerald-600" />
            Informazioni Pubbliche
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="publicEmail">Email di Contatto</Label>
              <Input 
                id="publicEmail" 
                type="email"
                placeholder={userEmail}
                {...register('publicEmail')} 
              />
              <p className="text-[10px] text-muted-foreground">Verrà mostrata agli utenti per essere ricontattato. Lascia vuoto per usare quella di login.</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Numero di Telefono</Label>
              <Input 
                id="phone" 
                placeholder="Es: +39 333 1234567"
                {...register('phone')} 
              />
            </div>
          </div>

          {(profile.role === 'professor' || profile.role === 'superadmin') && (
             <div className="space-y-2">
                <Label htmlFor="subjects">Materie di Insegnamento</Label>
                <Input 
                    id="subjects" 
                    placeholder="Materia 1, Materia 2, Materia 3..."
                    {...register('subjects')} 
                />
                <p className="text-xs text-muted-foreground italic">Separa le materie con una virgola (es: Matematica, Fisica, Informatica).</p>
             </div>
          )}
        </CardContent>
        <CardFooter className="bg-muted/30 border-t pt-6 flex justify-between items-center">
            <div className="text-sm text-muted-foreground">
                Ruolo Attuale: <Badge variant="secondary" className="ml-1 uppercase">{profile.role}</Badge>
            </div>
            <Button 
                type="submit" 
                disabled={isSubmitting}
                className="bg-indigo-600 hover:bg-indigo-700 text-white min-w-[150px]"
            >
                {isSubmitting ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                    <Save className="w-4 h-4 mr-2" />
                )}
                Salva Modifiche
            </Button>
        </CardFooter>
      </Card>
    </form>
  )
}
