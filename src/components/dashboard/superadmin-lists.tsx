'use client'

import { useState, useTransition } from 'react'
import { GraduationCap, Shield, Users, Trash2, Mail, UserMinus, UserPlus, X, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { toast } from 'sonner'
import { demoteProfessor, inviteAdmin, deleteStudentAccount, sendEmailToUser } from '@/app/actions/superadmin'

// ─── Types ─────────────────────────────────────────────────────────────────── 

type Professor = { id: string; first_name: string; last_name: string; email: string }
type Admin = { id: string; first_name: string; last_name: string; email: string; phone?: string }
type Student = { id: string; first_name: string; last_name: string; email: string }

// ─── Send-Email Modal ─────────────────────────────────────────────────────────

function EmailModal({ target, onClose }: Readonly<{ target: { name: string; email: string }; onClose: () => void }>) {
  const [pending, startTransition] = useTransition()
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')

  const handleSend = () => {
    if (!subject.trim() || !body.trim()) { toast.error('Compila tutti i campi.'); return }
    startTransition(async () => {
      const res = await sendEmailToUser({ to: target.email, subject, body })
      if (res.error) { toast.error(res.error) } else { toast.success('Email inviata!'); onClose() }
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-background rounded-2xl shadow-xl border w-full max-w-lg p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-lg">Scrivi a {target.name}</h3>
          <Button variant="ghost" size="icon" onClick={onClose}><X className="w-4 h-4" /></Button>
        </div>
        <p className="text-sm text-muted-foreground">A: <span className="font-medium text-foreground">{target.email}</span></p>
        <div className="space-y-2">
          <Label htmlFor="email-subject">Oggetto</Label>
          <Input id="email-subject" placeholder="Oggetto dell'email" value={subject} onChange={e => setSubject(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email-body">Messaggio</Label>
          <Textarea id="email-body" placeholder="Scrivi il messaggio..." rows={5} value={body} onChange={e => setBody(e.target.value)} />
        </div>
        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={onClose}>Annulla</Button>
          <Button onClick={handleSend} disabled={pending}>
            {pending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Mail className="w-4 h-4 mr-2" />}
            Invia
          </Button>
        </div>
      </div>
    </div>
  )
}

// ─── Invite Admin Modal ────────────────────────────────────────────────────────

function InviteAdminModal({ onClose }: Readonly<{ onClose: () => void }>) {
  const [pending, startTransition] = useTransition()
  const [form, setForm] = useState({ first_name: '', last_name: '', email: '', phone: '' })

  const handleInvite = () => {
    if (!form.first_name || !form.last_name || !form.email) { toast.error('Nome, Cognome ed Email sono obbligatori.'); return }
    startTransition(async () => {
      const res = await inviteAdmin({ ...form })
      if (res.error) { toast.error(res.error) }
      else { toast.success("Invito inviato! Il nuovo admin riceverà l'email di accesso."); onClose() }
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-background rounded-2xl shadow-xl border w-full max-w-lg p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-lg">Invita un nuovo Admin</h3>
          <Button variant="ghost" size="icon" onClick={onClose}><X className="w-4 h-4" /></Button>
        </div>
        <p className="text-sm text-muted-foreground">Il nuovo admin riceverà un&apos;email per impostare la propria password.</p>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="inv-fname">Nome *</Label>
            <Input id="inv-fname" value={form.first_name} onChange={e => setForm(f => ({ ...f, first_name: e.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="inv-lname">Cognome *</Label>
            <Input id="inv-lname" value={form.last_name} onChange={e => setForm(f => ({ ...f, last_name: e.target.value }))} />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="inv-email">Email *</Label>
          <Input id="inv-email" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="inv-phone">Telefono</Label>
          <Input id="inv-phone" type="tel" placeholder="+39..." value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
        </div>
        <div className="flex gap-2 justify-end pt-2">
          <Button variant="outline" onClick={onClose}>Annulla</Button>
          <Button className="bg-indigo-600 hover:bg-indigo-700 text-white" onClick={handleInvite} disabled={pending}>
            {pending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <UserPlus className="w-4 h-4 mr-2" />}
            Invia Invito
          </Button>
        </div>
      </div>
    </div>
  )
}

// ─── Professors List ──────────────────────────────────────────────────────────

export function ProfessorsList({ professors }: Readonly<{ professors: Professor[] }>) {
  const [pending, startTransition] = useTransition()
  const [confirmDemote, setConfirmDemote] = useState<Professor | null>(null)
  const [emailTarget, setEmailTarget] = useState<{ name: string; email: string } | null>(null)

  const handleDemote = (prof: Professor) => {
    startTransition(async () => {
      const res = await demoteProfessor(prof.id)
      if (res.error) { toast.error(res.error) } else { toast.success(`${prof.first_name} ${prof.last_name} è stato retrocesso.`) }
      setConfirmDemote(null)
    })
  }

  if (professors.length === 0) {
    return <EmptyState icon={<GraduationCap className="w-10 h-10 text-emerald-300" />} label="Nessun professore registrato." />
  }

  return (
    <div className="space-y-3">
      {emailTarget && <EmailModal target={emailTarget} onClose={() => setEmailTarget(null)} />}
      <AlertDialog open={!!confirmDemote} onOpenChange={(open: boolean) => { if (!open) setConfirmDemote(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Retrocedere {confirmDemote?.first_name}?</AlertDialogTitle>
            <AlertDialogDescription>
              Il profilo pubblico del professore verrà rimosso e il suo account retrocederà a semplice utente. L&apos;azione non è reversibile automaticamente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={() => confirmDemote && handleDemote(confirmDemote)}
              disabled={pending}
            >
              {pending ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
              Retrocedi
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {professors.map(prof => (
        <div key={prof.id} className="flex items-center justify-between p-4 rounded-xl border bg-card hover:bg-muted/30 transition-colors">
          <div>
            <p className="font-semibold">{prof.first_name} {prof.last_name}</p>
            <p className="text-sm text-muted-foreground">{prof.email}</p>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => setEmailTarget({ name: `${prof.first_name} ${prof.last_name}`, email: prof.email })}>
              <Mail className="w-3.5 h-3.5 mr-1" /> Contatta
            </Button>
            <Button size="sm" variant="destructive" onClick={() => setConfirmDemote(prof)}>
              <UserMinus className="w-3.5 h-3.5 mr-1" /> Retrocedi
            </Button>
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Admins List ─────────────────────────────────────────────────────────────

export function AdminsList({ admins }: Readonly<{ admins: Admin[] }>) {
  const [showInvite, setShowInvite] = useState(false)
  const [emailTarget, setEmailTarget] = useState<{ name: string; email: string } | null>(null)

  return (
    <div className="space-y-4">
      {showInvite && <InviteAdminModal onClose={() => setShowInvite(false)} />}
      {emailTarget && <EmailModal target={emailTarget} onClose={() => setEmailTarget(null)} />}

      <div className="flex justify-end">
        <Button className="bg-indigo-600 hover:bg-indigo-700 text-white" onClick={() => setShowInvite(true)}>
          <UserPlus className="w-4 h-4 mr-2" /> Invita Admin
        </Button>
      </div>

      {admins.length === 0 ? (
        <EmptyState icon={<Shield className="w-10 h-10 text-indigo-300" />} label="Nessun admin presente." />
      ) : (
        admins.map(admin => (
          <div key={admin.id} className="flex items-center justify-between p-4 rounded-xl border bg-card hover:bg-muted/30 transition-colors">
            <div>
              <p className="font-semibold">{admin.first_name} {admin.last_name}</p>
              <p className="text-sm text-muted-foreground">{admin.email}</p>
              {admin.phone && <p className="text-xs text-muted-foreground">{admin.phone}</p>}
            </div>
            <div className="flex gap-2">
              <Badge variant="outline" className="text-indigo-600 border-indigo-200 bg-indigo-50">Admin</Badge>
              <Button size="sm" variant="outline" onClick={() => setEmailTarget({ name: `${admin.first_name} ${admin.last_name}`, email: admin.email })}>
                <Mail className="w-3.5 h-3.5 mr-1" /> Contatta
              </Button>
            </div>
          </div>
        ))
      )}
    </div>
  )
}

// ─── Students List ────────────────────────────────────────────────────────────

export function StudentsList({ students }: Readonly<{ students: Student[] }>) {
  const [pending, startTransition] = useTransition()
  const [confirmDelete, setConfirmDelete] = useState<Student | null>(null)

  const handleDelete = (student: Student) => {
    startTransition(async () => {
      const res = await deleteStudentAccount(student.id)
      if (res.error) { toast.error(res.error) }
      else { toast.success(`Account di ${student.first_name} ${student.last_name} eliminato definitivamente.`) }
      setConfirmDelete(null)
    })
  }

  if (students.length === 0) {
    return <EmptyState icon={<Users className="w-10 h-10 text-blue-300" />} label="Nessuno studente registrato." />
  }

  return (
    <div className="space-y-3">
      <AlertDialog open={!!confirmDelete} onOpenChange={(open: boolean) => { if (!open) setConfirmDelete(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminare l&apos;account di {confirmDelete?.first_name}?</AlertDialogTitle>
            <AlertDialogDescription>
              Questa azione è <strong>irreversibile</strong>. Tutti i dati personali di {confirmDelete?.first_name} {confirmDelete?.last_name} (comprese prenotazioni e sessioni) verranno eliminati definitivamente in conformità con il GDPR.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={() => confirmDelete && handleDelete(confirmDelete)}
              disabled={pending}
            >
              {pending ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
              Elimina definitivamente
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {students.map(student => (
        <div key={student.id} className="flex items-center justify-between p-4 rounded-xl border bg-card hover:bg-muted/30 transition-colors">
          <div>
            <p className="font-semibold">{student.first_name} {student.last_name}</p>
            <p className="text-sm text-muted-foreground">{student.email}</p>
          </div>
          <Button size="sm" variant="destructive" onClick={() => setConfirmDelete(student)}>
            <Trash2 className="w-3.5 h-3.5 mr-1" /> Elimina Account
          </Button>
        </div>
      ))}
    </div>
  )
}

// ─── Shared Empty State ────────────────────────────────────────────────────────

function EmptyState({ icon, label }: Readonly<{ icon: React.ReactNode; label: string }>) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center gap-4">
      {icon}
      <p className="text-muted-foreground text-sm">{label}</p>
    </div>
  )
}
