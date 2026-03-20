'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Loader2, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { applyForProfessor } from '@/app/actions/roles'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

const ApplicationSchema = z.object({
  fullName: z.string().min(2, "Il nome deve avere almeno 2 caratteri"),
  bio: z.string().min(20, "Scrivi una breve bio di almeno 20 caratteri"),
  subjects: z.array(z.object({ value: z.string().min(1, "Inserisci una materia") })).min(1, "Inserisci almeno una materia"),
})

type FormValues = z.infer<typeof ApplicationSchema>

export default function ProfessorApplicationForm() {
  const [isPending, setIsPending] = useState(false)
  const router = useRouter()

  const { register, control, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(ApplicationSchema),
    defaultValues: {
      fullName: '',
      bio: '',
      subjects: [{ value: '' }],
    }
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: "subjects",
  })

  const onSubmit = async (data: FormValues) => {
    setIsPending(true)
    try {
      // Map back to string array
      const mappedData = {
        fullName: data.fullName,
        bio: data.bio,
        subjects: data.subjects.map(s => s.value),
      }
      const res = await applyForProfessor(mappedData)
      
      if (res.error) {
        toast.error(res.error)
      } else {
        toast.success("Richiesta inviata con successo! Verrai contattato a breve.")
        router.push('/')
      }
    } catch {
      toast.error("Errore imprevisto di rete.")
    } finally {
      setIsPending(false)
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-md border-primary/10">
      <CardHeader>
        <CardTitle className="text-2xl">Richiesta Profilo Docente</CardTitle>
        <CardDescription>
          Compila i campi sottostanti per proporti come insegnante sulla nostra piattaforma.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <Label>Nome Completo (come apparirà pubblico)</Label>
            <Input 
              placeholder="Es: Prof. Mario Rossi"
              {...register('fullName')}
            />
            {errors.fullName && <p className="text-xs text-destructive">{errors.fullName.message}</p>}
          </div>

          <div className="space-y-2">
            <Label>Biografia o Presentazione</Label>
            <Textarea 
              placeholder="Racconta la tua esperienza e il tuo metodo di studio..."
              className="min-h-32"
              {...register('bio')}
            />
            {errors.bio && <p className="text-xs text-destructive">{errors.bio.message}</p>}
          </div>

          <div className="space-y-3">
            <Label>Materie Insegnate</Label>
            {fields.map((field, index) => (
              <div key={field.id} className="flex gap-2">
                <Input
                  {...register(`subjects.${index}.value` as const)}
                  placeholder="Es: Fisica"
                />
                <Button 
                    type="button" 
                    variant="outline" 
                    size="icon" 
                    onClick={() => remove(index)}
                    disabled={fields.length === 1}
                >
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>
            ))}
            {errors.subjects?.message && <p className="text-xs text-destructive">{errors.subjects.message}</p>}
            
            <Button 
                type="button" 
                variant="secondary" 
                size="sm" 
                onClick={() => append({ value: '' })}
                className="mt-2"
            >
              <Plus className="w-4 h-4 mr-2" /> Aggiungi Materia
            </Button>
          </div>

          <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700" disabled={isPending}>
            {isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : "Invia Richiesta"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
