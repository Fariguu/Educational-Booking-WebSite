"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { Calendar as CalendarIcon, Clock, AlertCircle, Loader2, CheckCircle2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Turnstile } from "@marsidev/react-turnstile";

import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/utils/supabase/client";
import { bookLesson } from "@/app/actions/booking";

function generateTimeSlots(start: Date, end: Date) {
    const slots = [];
    let current = start.getTime();
    const duration = 60 * 60000; // 60 minuti
    const interval = 30 * 60000; // scatti da 30 minuti

    while (current + duration <= end.getTime()) {
        slots.push({
            start: new Date(current),
            end: new Date(current + duration)
        });
        current += interval;
    }
    
    // Se lo slot è troppo corto (< 60 min) ma esistente, permetti comunque la prenotazione dell'intero periodo
    if (slots.length === 0 && start.getTime() < end.getTime()) {
        slots.push({ start, end });
    }
    
    return slots;
}

interface Slot {
    id: string;
    start_time: string;
    end_time: string;
    is_available: boolean;
}

const formSchema = z.object({
    studentName: z.string().min(2, "Il nome deve avere almeno 2 caratteri"),
    studentContact: z.string().email("Inserisci un indirizzo email valido"),
    notes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function BookingDashboard() {
    const [slots, setSlots] = useState<Slot[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
    const [isPending, setIsPending] = useState(false);
    const [turnstileToken, setTurnstileToken] = useState<string>("");
    const [success, setSuccess] = useState(false);
    const [turnstileKey, setTurnstileKey] = useState(0);
    const [selectedTimeRange, setSelectedTimeRange] = useState<{start: Date, end: Date} | null>(null);

    const availableTimeRanges = selectedSlot ? generateTimeSlots(new Date(selectedSlot.start_time), new Date(selectedSlot.end_time)) : [];

    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => {
        if (availableTimeRanges.length === 1) {
            setSelectedTimeRange(availableTimeRanges[0]);
        } else {
            setSelectedTimeRange(null);
        }
    }, [selectedSlot]);

    const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
        resolver: zodResolver(formSchema),
    });

    const fetchSlots = async () => {
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
    };

    useEffect(() => {
        fetchSlots();
    }, []);

    const onSubmit = async (values: FormValues) => {
        if (!selectedSlot || !turnstileToken || !selectedTimeRange) return;

        try {
            setIsPending(true);
            const result = await bookLesson({
                ...values,
                slotId: selectedSlot.id,
                turnstileToken,
                requestedStartTime: selectedTimeRange.start.toISOString(),
                requestedEndTime: selectedTimeRange.end.toISOString(),
            });

            if (result.error) {
                setError(result.error);
                setIsPending(false);
                setTurnstileToken(""); // Reset token locale
                setTurnstileKey(prev => prev + 1); // Forza il remount di Turnstile
                return;
            }

            setSuccess(true);
            setSelectedSlot(null);
            reset();
            fetchSlots();
        } catch (_err) {
            setError("Si è verificato un errore imprevisto.");
        } finally {
            setIsPending(false);
        }
    };

    if (loading && slots.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-center">
                <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
                <p className="text-muted-foreground">Caricamento disponibilità...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {error && (
                <div className="flex items-center gap-3 p-4 border border-destructive/20 rounded-xl bg-destructive/5 text-destructive mb-6">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    <p className="text-sm font-medium">{error}</p>
                    <Button variant="ghost" size="sm" onClick={() => setError(null)} className="ml-auto">Chiudi</Button>
                </div>
            )}

            {success && (
                <div className="flex flex-col items-center justify-center p-8 text-center border border-green-200 rounded-xl bg-green-50 text-green-800 mb-6">
                    <CheckCircle2 className="w-12 h-12 text-green-600 mb-4" />
                    <h3 className="text-xl font-bold mb-2">Prenotazione Inviata!</h3>
                    <p className="mb-4">Riceverai un&apos;email di conferma non appena il professore avrà approvato la richiesta.</p>
                    <Button onClick={() => setSuccess(false)} variant="outline">Ok, grazie</Button>
                </div>
            )}

            {slots.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-12 text-center border rounded-xl bg-card">
                    <img src="https://illustrations.popsy.co/gray/calendar.svg" alt="Nessuna lezione" className="h-48 mb-6 opacity-80" />
                    <h3 className="text-xl font-semibold mb-2">Nessun orario disponibile</h3>
                    <p className="text-muted-foreground max-w-md">
                        Al momento non ci sono slot liberi per le lezioni. Riprova nei prossimi giorni.
                    </p>
                </div>
            ) : (
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
                                    <Button className="w-full group-hover:bg-primary/90" onClick={() => setSelectedSlot(slot)}>
                                        Prenota Ora
                                    </Button>
                                </CardFooter>
                            </Card>
                        );
                    })}
                </div>
            )}

            <Dialog open={!!selectedSlot} onOpenChange={(open) => !open && setSelectedSlot(null)}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Prenota Lezione</DialogTitle>
                        <DialogDescription>
                            Inserisci i tuoi dati per richiedere la prenotazione.
                        </DialogDescription>
                    </DialogHeader>

                    {selectedSlot && (
                        <div className="py-4 space-y-4">
                            <div className="bg-muted p-3 rounded-lg space-y-1">
                                <div className="flex items-center gap-2 text-sm font-medium">
                                    <CalendarIcon className="w-4 h-4" />
                                    <span className="capitalize">{format(new Date(selectedSlot.start_time), "EEEE d MMMM", { locale: it })}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Clock className="w-4 h-4" />
                                    <span>{format(new Date(selectedSlot.start_time), "HH:mm")} - {format(new Date(selectedSlot.end_time), "HH:mm")}</span>
                                </div>
                            </div>

                            <form id="booking-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Seleziona Orario</Label>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2 max-h-40 overflow-y-auto pr-1">
                                        {availableTimeRanges.map((range, idx) => {
                                            const isSelected = selectedTimeRange?.start.getTime() === range.start.getTime();
                                            return (
                                                <Button 
                                                    key={idx}
                                                    type="button"
                                                    variant={isSelected ? "default" : "outline"}
                                                    onClick={() => setSelectedTimeRange(range)}
                                                    className="w-full text-xs font-medium"
                                                >
                                                    {format(range.start, "HH:mm")} - {format(range.end, "HH:mm")}
                                                </Button>
                                            )
                                        })}
                                    </div>
                                    {!selectedTimeRange && (
                                        <p className="text-xs text-destructive">Scegli un orario per procedere con la prenotazione.</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="studentName">Nome Completo</Label>
                                    <Input id="studentName" {...register("studentName")} placeholder="Es. Mario Rossi" />
                                    {errors.studentName && <p className="text-xs text-destructive">{errors.studentName.message}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="studentContact">Email</Label>
                                    <Input id="studentContact" type="email" {...register("studentContact")} placeholder="mario.rossi@esempio.it" />
                                    {errors.studentContact && <p className="text-xs text-destructive">{errors.studentContact.message}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="notes">Note (facoltativo)</Label>
                                    <Textarea id="notes" {...register("notes")} placeholder="Argomenti della lezione, dubbi specifici..." />
                                </div>

                                <div className="flex justify-center py-2">
                                    <Turnstile
                                        key={turnstileKey}
                                        siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!}
                                        onSuccess={(token) => setTurnstileToken(token)}
                                    />
                                </div>
                            </form>
                        </div>
                    )}

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setSelectedSlot(null)}>Annulla</Button>
                        <Button
                            type="submit"
                            form="booking-form"
                            disabled={isPending || !turnstileToken || !selectedTimeRange}
                        >
                            {isPending ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Invio in corso...
                                </>
                            ) : (
                                "Conferma Prenotazione"
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
