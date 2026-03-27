'use client'

import { useState } from 'react'
import { Users, GraduationCap, Shield, ArrowLeft } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import SuperadminDashboard from '@/components/superadmin-dashboard'
import { ProfessorsList, AdminsList, StudentsList } from '@/components/dashboard/superadmin-lists'

type Stats = {
  readonly admins: number
  readonly professors: number
  readonly students: number
}

type Profile = { id: string; first_name: string; last_name: string; email: string; phone?: string }

type View = 'overview' | 'admins' | 'professors' | 'students'

export default function SuperAdminDashboardView({
  user,
  stats,
  admins,
  professors,
  students,
  initialApplications,
  contactMessages
}: {
  readonly user: any
  readonly stats: Stats
  readonly admins: Profile[]
  readonly professors: Profile[]
  readonly students: Profile[]
  readonly initialApplications: any[]
  readonly contactMessages: any[]
}) {
  const [view, setView] = useState<View>('overview')

  // ── View headers ─────────────────────────────────────────────────────────────
  const viewMeta: Record<Exclude<View, 'overview'>, { title: string; description: string }> = {
    professors: {
      title: 'Gestione Professori',
      description: `${stats.professors} docenti verificati sulla piattaforma.`,
    },
    admins: {
      title: 'Gestione Amministratori',
      description: `${stats.admins} admin operativi. Puoi invitarne di nuovi.`,
    },
    students: {
      title: 'Gestione Studenti',
      description: `${stats.students} utenti registrati. Elimina su richiesta per conformità GDPR.`,
    },
  }

  return (
    <div className="space-y-8">

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-4">
        {view !== 'overview' && (
          <Button variant="ghost" size="icon" className="shrink-0" onClick={() => setView('overview')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
        )}
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            {view === 'overview' ? 'Panoramica Globale' : viewMeta[view].title}
          </h2>
          <p className="text-muted-foreground">
            {view === 'overview'
              ? 'Monitora lo stato della piattaforma e gestisci le nuove richieste.'
              : viewMeta[view].description}
          </p>
        </div>
      </div>

      {/* ── Stat Cards (always visible) ─────────────────────────────────────── */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Admins */}
        <Card
          className={`cursor-pointer border-2 transition-all hover:shadow-md ${view === 'admins' ? 'border-indigo-400 bg-indigo-50' : 'border-indigo-100 bg-indigo-50/50 hover:border-indigo-300'}`}
          onClick={() => setView('admins')}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-indigo-900">Totale Admin</CardTitle>
            <Shield className="h-4 w-4 text-indigo-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-indigo-900">{stats.admins}</div>
            <p className="text-xs text-indigo-600/70 mt-1">Gestori operativi · Clicca per gestire</p>
          </CardContent>
        </Card>

        {/* Professors */}
        <Card
          className={`cursor-pointer border-2 transition-all hover:shadow-md ${view === 'professors' ? 'border-emerald-400 bg-emerald-50' : 'border-emerald-100 bg-emerald-50/50 hover:border-emerald-300'}`}
          onClick={() => setView('professors')}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-emerald-900">Totale Professori</CardTitle>
            <GraduationCap className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-900">{stats.professors}</div>
            <p className="text-xs text-emerald-600/70 mt-1">Docenti verificati · Clicca per gestire</p>
          </CardContent>
        </Card>

        {/* Students */}
        <Card
          className={`cursor-pointer border-2 transition-all hover:shadow-md ${view === 'students' ? 'border-blue-400 bg-blue-50' : 'border-blue-100 bg-blue-50/50 hover:border-blue-300'}`}
          onClick={() => setView('students')}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-900">Totale Studenti</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900">{stats.students}</div>
            <p className="text-xs text-blue-600/70 mt-1">Utenti registrati · Clicca per gestire</p>
          </CardContent>
        </Card>
      </div>

      {/* ── Conditional Panels ──────────────────────────────────────────────── */}
      {view === 'overview' && (
        <div className="pt-4">
          <SuperadminDashboard
            initialApplications={initialApplications}
            contactMessages={contactMessages}
          />
        </div>
      )}

      {view === 'professors' && (
        <div className="bg-card border rounded-2xl p-6">
          <ProfessorsList professors={professors} />
        </div>
      )}

      {view === 'admins' && (
        <div className="bg-card border rounded-2xl p-6">
          <AdminsList admins={admins} />
        </div>
      )}

      {view === 'students' && (
        <div className="bg-card border rounded-2xl p-6">
          <StudentsList students={students} />
        </div>
      )}
    </div>
  )
}
