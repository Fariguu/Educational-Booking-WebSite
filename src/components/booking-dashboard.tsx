"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { Calendar as CalendarIcon, Clock, AlertCircle, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/utils/supabase/client";

interface Slot {
    id: string;
    start_time: string;
    end_time: string;
    is_available: boolean;
}

export default function BookingDashboard() {
    const [slots, setSlots] = useState<Slot[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchSlots() {
            try {
                setLoading(true);
                const supabase = createClient();
                
                const { data, error: fetchError } = await supabase
                    .from("lessons")
                    .select("*")
                    .eq("is_available", true)
                    .order("start_time", { ascending: true });

                if (fetchError) throw fetchError;
                
                setSlots(data || []);
            } catch (err) {
                console.error("Errore nel recupero delle lezioni:", err);
                setError("Impossibile caricare le disponibilità. Riprova più tardi.");
            } finally {
                setLoading(false);
            }
        }

        fetchSlots();
    }, []);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-center">
                <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
                <p className="text-muted-foreground">Caricamento disponibilità...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-center border border-destructive/20 rounded-xl bg-destructive/5">
                <AlertCircle className="w-10 h-10 text-destructive mb-4" />
                <h3 className="text-xl font-semibold mb-2 text-destructive">Errore</h3>
                <p className="text-muted-foreground">{error}</p>
            </div>
        );
    }

    if (slots.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-center border rounded-xl bg-card">
                <img src="https://illustrations.popsy.co/gray/calendar.svg" alt="Nessuna lezione" className="h-48 mb-6 opacity-80" />
                <h3 className="text-xl font-semibold mb-2">Nessun orario disponibile</h3>
                <p className="text-muted-foreground max-w-md">
                    Al momento non ci sono slot liberi per le lezioni. Riprova nei prossimi giorni.
                </p>
            </div>
        );
    }

    return (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {slots.map((slot) => {
                const start = new Date(slot.start_time);
                const end = new Date(slot.end_time);

                return (
                    <Card key={slot.id} className="group hover:border-primary/50 transition-colors">
                        <CardHeader className="pb-4">
                            <div className="flex justify-between items-start mb-2">
                                <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
                                    Disponibile
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
