'use client'

import { useState } from 'react'
import { Users, GraduationCap, Shield, Bell } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import SuperadminDashboard from '@/components/superadmin-dashboard'

type Stats = {
  admins: number
  professors: number
  students: number
}

export default function SuperAdminDashboardView({ 
  user, 
  stats,
  initialApplications 
}: { 
  user: any
  stats: Stats
  initialApplications: any[]
}) {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Panoramica Globale</h2>
        <p className="text-muted-foreground">Monitora lo stato della piattaforma e gestisci le nuove richieste.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-indigo-50/50 border-indigo-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-indigo-900">Totale Admin</CardTitle>
            <Shield className="h-4 h-4 text-indigo-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-indigo-900">{stats.admins}</div>
            <p className="text-xs text-indigo-600/70 mt-1">Gestori operativi</p>
          </CardContent>
        </Card>
        <Card className="bg-emerald-50/50 border-emerald-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-emerald-900">Totale Professori</CardTitle>
            <GraduationCap className="h-4 h-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-900">{stats.professors}</div>
            <p className="text-xs text-emerald-600/70 mt-1">Docenti verificati</p>
          </CardContent>
        </Card>
        <Card className="bg-blue-50/50 border-blue-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-900">Totale Studenti</CardTitle>
            <Users className="h-4 h-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900">{stats.students}</div>
            <p className="text-xs text-blue-600/70 mt-1">Utenti attivi</p>
          </CardContent>
        </Card>
      </div>

      <div className="pt-4">
        <SuperadminDashboard initialApplications={initialApplications} />
      </div>
    </div>
  )
}
