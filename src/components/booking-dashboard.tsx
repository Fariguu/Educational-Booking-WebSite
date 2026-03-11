"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { Calendar as CalendarIcon, Clock, AlertCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// Mock data per M1 (in M2 verranno fetched da Supabase)
const mockSlots = [
    { id: "1", start_time: "2026-03-12T10:00:00Z", end_time: "2026-03-12T11:00:00Z", is_available: true },
    { id: "2", start_time: "2026-03-12T15:00:00Z", end_time: "2026-03-12T16:00:00Z", is_available: true },
    { id: "3", start_time: "2026-03-13T09:00:00Z", end_time: "2026-03-13T10:00:00Z", is_available: true },
];

export default function BookingDashboard() {
    const [mounted, setMounted] = useState(false);

    // Evita hydration mismatch (le date locali cambiano da server a client)
    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return <div className="animate-pulse space-y-4">Caricamento disponibilità...</div>;
    }

    if (mockSlots.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-center border rounded-xl bg-card">
                {/* Usando undraw a scopo puramente visivo come da richiesta */}
                <img src="https://undraw.co/api/illustrations/random?color=primary" alt="Nessuna lezione" className="h-48 mb-6 opacity-80" />
                <h3 className="text-xl font-semibold mb-2">Nessun orario disponibile</h3>
                <p className="text-muted-foreground max-w-md">
                    Al momento non ci sono slot liberi per le lezioni. Riprova nei prossimi giorni.
                </p>
            </div>
        );
    }

    return (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {mockSlots.map((slot) => {
                const start = new Date(slot.start_time);
                const end = new Date(slot.end_time);

                return (
                    <Card key={slot.id} className="group hover:border-primary/50 transition-colors">
                        <CardHeader className="pb-4">
                            <div className="flex justify-between items-start mb-2">
                                <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
                                    Libero
                                </Badge>
                            </div>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <CalendarIcon className="w-5 h-5 text-primary" />
                                <span className="capitalize">{format(start, "EEEE d MMMM", { locale: it })}</span>
                            </CardTitle>
                            <CardDescription className="flex items-center gap-2 mt-1">
                                <Clock className="w-4 h-4" />
                                <span>
                                    {format(start, "HH:mm")} - {format(end, "HH:mm")}
                                </span>
                            </CardDescription>
                        </CardHeader>
                        <CardFooter>
                            <Button className="w-full group-hover:bg-primary/90">
                                Prenota Ora
                            </Button>
                        </CardFooter>
                    </Card>
                );
            })}
        </div>
    );
}
