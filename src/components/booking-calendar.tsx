"use client";

import { useState, useEffect } from "react";
import { format, isSameDay, startOfDay, isBefore } from "date-fns";
import { it } from "date-fns/locale";
import {
  CalendarIcon,
  Clock,
  AlertCircle,
  Loader2,
  CalendarDays,
} from "lucide-react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Turnstile } from "@marsidev/react-turnstile";

import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/utils/supabase/client";
import { bookLesson } from "@/app/actions/booking";
import { Checkbox } from "@/components/ui/checkbox";
import Link from "next/link";

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
  status: "available" | "pending" | "confirmed";
}

const formSchema = z.object({
  studentName: z.string().min(2, "Il nome deve avere almeno 2 caratteri"),
  studentContact: z.string().email("Inserisci un indirizzo email valido"),
  notes: z.string().optional(),
  privacy: z.boolean().refine((v) => v === true, {
    message: "Devi accettare la privacy policy per procedere",
  }),
});
type FormValues = z.infer<typeof formSchema>;

export default function BookingCalendar() {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState("");
  const [turnstileKey, setTurnstileKey] = useState(0);
  const [selectedTimeRange, setSelectedTimeRange] = useState<{start: Date, end: Date} | null>(null);

  const availableTimeRanges = selectedSlot ? generateTimeSlots(new Date(selectedSlot.start_time), new Date(selectedSlot.end_time)) : [];

  useEffect(() => {
      if (availableTimeRanges.length === 1) {
          setSelectedTimeRange(availableTimeRanges[0]);
      } else {
          setSelectedTimeRange(null);
      }
  }, [selectedSlot]);

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { privacy: false },
  });

  const privacyChecked = watch('privacy');

  const fetchSlots = async () => {
    try {
      setLoading(true);
      const supabase = createClient();
      const { data, error: fetchError } = await supabase
        .from("lessons")
        .select("id, start_time, end_time, is_available, status")
        .gte("start_time", new Date().toISOString())
        .order("start_time", { ascending: true });
      if (fetchError) throw fetchError;
      setSlots((data as Slot[]) || []);
    } catch {
      setError("Impossibile caricare le disponibilità. Riprova più tardi.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSlots(); }, []);

  // Solo i giorni che hanno almeno uno slot realmente "available" (prenotabile)
  const availableDays = slots
    .filter((s) => s.status === "available")
    .map((s) => startOfDay(new Date(s.start_time)));

  // Slot del giorno selezionato
  const slotsForDay = selectedDate
    ? slots.filter((s) => isSameDay(new Date(s.start_time), selectedDate))
    : [];

  const isDateWithAvailableSlots = (date: Date) =>
    availableDays.some((d) => isSameDay(d, date));

  const onSubmit = async (values: FormValues) => {
    if (!selectedSlot || !turnstileToken || !selectedTimeRange) return;
    setIsPending(true);
    const result = await bookLesson({
       ...values,
       slotId: selectedSlot.id,
       turnstileToken,
       requestedStartTime: selectedTimeRange.start.toISOString(),
       requestedEndTime: selectedTimeRange.end.toISOString()
    });
    if (result.error) {
      setError(result.error);
      setTurnstileToken("");
      setTurnstileKey((k) => k + 1);
    } else {
      toast.success("Prenotazione inviata!", {
        description: "Riceverai una conferma via email non appena il professore approva.",
        duration: 6000,
      });
      setSelectedSlot(null);
      reset();
      await fetchSlots();
      // Resetta la selezione se non ci sono più slot prenotabili in quel giorno
      if (slotsForDay.every(s => s.status !== "available")) {
        setSelectedDate(undefined);
      }
    }
    setIsPending(false);
  };

  if (loading && slots.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-16 text-center">
        <Loader2 className="w-10 h-10 text-purple-400 animate-spin mb-4" />
        <p className="text-muted-foreground">Caricamento disponibilità...</p>
      </div>
    );
  }

  const getStatusConfig = (status: Slot["status"]) => {
    switch (status) {
      case "available":
        return {
          label: "Prenotabile",
          colorClass: "text-emerald-600 border-emerald-200 bg-emerald-50",
          iconColor: "text-emerald-600",
          bgColor: "bg-emerald-50",
          hoverBorder: "hover:border-emerald-400"
        };
      case "pending":
        return {
          label: "In attesa",
          colorClass: "text-amber-600 border-amber-200 bg-amber-50",
          iconColor: "text-amber-600",
          bgColor: "bg-amber-50",
          hoverBorder: "hover:border-amber-400"
        };
      case "confirmed":
        return {
          label: "Prenotata",
          colorClass: "text-slate-500 border-slate-200 bg-slate-50",
          iconColor: "text-slate-400",
          bgColor: "bg-slate-50",
          hoverBorder: "hover:border-slate-300"
        };
      default:
        return {
          label: "Non disponibile",
          colorClass: "text-slate-500 border-slate-200 bg-slate-50",
          iconColor: "text-slate-400",
          bgColor: "bg-slate-50",
          hoverBorder: "hover:border-slate-300"
        };
    }
  };

  return (
    <div className="space-y-6">
      {/* Errore globale */}
      {error && (
        <div className="flex items-center gap-3 p-4 border border-destructive/20 rounded-xl bg-destructive/5 text-destructive">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm font-medium flex-1">{error}</p>
          <Button variant="ghost" size="sm" onClick={() => setError(null)}>Chiudi</Button>
        </div>
      )}

      {slots.length === 0 && !loading ? (
        /* Stato vuoto */
        <div className="flex flex-col items-center justify-center p-14 text-center border rounded-2xl bg-card">
          <div className="w-20 h-20 rounded-full bg-purple-50 flex items-center justify-center mb-6">
            <CalendarDays className="w-10 h-10 text-purple-300" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Nessun orario disponibile</h3>
          <p className="text-muted-foreground max-w-sm">
            Al momento non ci sono slot liberi. Riprova nei prossimi giorni o{" "}
            <a href="/contatti" className="text-purple-600 hover:underline">contattami</a>.
          </p>
        </div>
      ) : (
        <div className="grid lg:grid-cols-[auto_1fr] gap-8 items-start">
          {/* ── CALENDARIO ── */}
          <div className="flex flex-col items-center lg:items-start">
            <div className="rounded-2xl border bg-card shadow-sm p-4">
              <p className="text-xs text-muted-foreground mb-3 text-center font-medium uppercase tracking-wide">
                Seleziona un giorno
              </p>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                locale={it}
                disabled={(date) =>
                  isBefore(date, startOfDay(new Date()))
                }
                modifiers={{ available: availableDays }}
                modifiersClassNames={{
                  available: "!bg-sky-100 !text-sky-700 !font-semibold hover:!bg-sky-200 rounded-lg border border-sky-300",
                }}
                classNames={{
                  selected: "aria-selected:!bg-purple-600 aria-selected:!text-white !bg-purple-600 !text-white rounded-lg shadow-sm border border-purple-600",
                  today: "!bg-muted rounded-lg border border-transparent",
                  day: "rounded-lg border border-transparent h-9 w-9 p-0 font-normal aria-selected:opacity-100",
                  button_next: "hover:!bg-purple-50",
                  button_previous: "hover:!bg-purple-50",
                }}
              />
            </div>
            {/* Legenda */}
            <div className="flex flex-col gap-2 mt-4 ml-1">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Legenda Calendario</p>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded-md bg-sky-100 border border-sky-300" />
                  Con lezioni libere
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded-md bg-purple-600" />
                  Selezionato
                </span>
              </div>
            </div>
          </div>

          {/* ── SLOT DEL GIORNO ── */}
          <div className="min-h-[300px]">
            {!selectedDate ? (
              <div className="flex flex-col items-center justify-center h-full p-10 text-center border-2 border-dashed rounded-2xl text-muted-foreground">
                <CalendarIcon className="w-10 h-10 mb-3 opacity-30" />
                <p className="font-medium">Seleziona un giorno</p>
                <p className="text-sm mt-1">Gli orari e la loro disponibilità appariranno qui</p>
              </div>
            ) : slotsForDay.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full p-10 text-center border-2 border-dashed rounded-2xl text-muted-foreground">
                <p className="font-medium">Nessuno slot inserito per questo giorno</p>
                <p className="text-sm mt-1">Prova a selezionare un altro giorno</p>
              </div>
            ) : (
              <div>
                <p className="text-sm font-semibold text-muted-foreground mb-4 capitalize flex items-center gap-2">
                  <CalendarIcon className="w-4 h-4" />
                  {format(selectedDate, "EEEE d MMMM yyyy", { locale: it })}
                </p>
                <div className="grid sm:grid-cols-2 gap-3">
                  {slotsForDay.map((slot) => {
                    const start = new Date(slot.start_time);
                    const end = new Date(slot.end_time);
                    const isAvailable = slot.status === "available";
                    const config = getStatusConfig(slot.status);

                    return (
                      <button
                        key={slot.id}
                        disabled={!isAvailable}
                        onClick={() => setSelectedSlot(slot)}
                        className={`group flex items-center justify-between rounded-xl border bg-card p-4 text-left shadow-sm transition-all ${
                          isAvailable 
                            ? `hover:border-purple-400 hover:shadow-md cursor-pointer` 
                            : `opacity-75 cursor-not-allowed`
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${config.bgColor}`}>
                            <Clock className={`w-5 h-5 ${config.iconColor}`} />
                          </div>
                          <div>
                            <p className="font-semibold text-sm leading-tight">
                              {format(start, "HH:mm")} – {format(end, "HH:mm")}
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {Math.round((end.getTime() - start.getTime()) / 60000)} min
                            </p>
                          </div>
                        </div>
                        <Badge
                          variant="outline"
                          className={config.colorClass}
                        >
                          {config.label}
                        </Badge>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── DIALOG DI PRENOTAZIONE ── */}
      <Dialog open={!!selectedSlot} onOpenChange={(open) => !open && setSelectedSlot(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Prenota Lezione</DialogTitle>
            <DialogDescription>Inserisci i tuoi dati per richiedere la prenotazione.</DialogDescription>
          </DialogHeader>

          {selectedSlot && (
            <div className="py-3 space-y-4">
              {/* Riepilogo slot */}
              <div className="bg-purple-50 border border-purple-100 p-3 rounded-xl space-y-1">
                <div className="flex items-center gap-2 text-sm font-medium text-purple-800">
                  <CalendarIcon className="w-4 h-4" />
                  <span className="capitalize">
                    {format(new Date(selectedSlot.start_time), "EEEE d MMMM", { locale: it })}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-purple-600">
                  <Clock className="w-4 h-4" />
                  <span>
                    {format(new Date(selectedSlot.start_time), "HH:mm")} –{" "}
                    {format(new Date(selectedSlot.end_time), "HH:mm")}
                  </span>
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
                                    className={`w-full text-xs font-medium ${isSelected ? 'bg-purple-600 text-white hover:bg-purple-700' : ''}`}
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
                  <Input id="studentName" {...register("studentName")} placeholder="Mario Rossi" />
                  {errors.studentName && <p className="text-xs text-destructive">{errors.studentName.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="studentContact">Email</Label>
                  <Input id="studentContact" type="email" {...register("studentContact")} placeholder="mario@esempio.it" />
                  {errors.studentContact && <p className="text-xs text-destructive">{errors.studentContact.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Note (facoltativo)</Label>
                  <Textarea id="notes" {...register("notes")} placeholder="Argomenti, dubbi specifici..." />
                </div>
                {/* Privacy checkbox */}
                <div className="space-y-1">
                  <div className="flex items-start gap-3">
                    <Checkbox
                      id="booking-privacy"
                      checked={privacyChecked}
                      onCheckedChange={(checked) => setValue('privacy', checked === true, { shouldValidate: true })}
                      className="mt-0.5 border-purple-200 text-purple-600 focus-visible:ring-purple-600"
                    />
                    <Label htmlFor="booking-privacy" className="text-sm font-normal leading-relaxed cursor-pointer">
                      Ho letto e accetto la{' '}
                      <Link href="/privacy" target="_blank" className="text-purple-600 hover:underline font-medium">
                        Privacy Policy
                      </Link>
                    </Label>
                  </div>
                  {errors.privacy && <p className="text-xs text-destructive pl-7">{errors.privacy.message}</p>}
                </div>
                <div className="flex justify-center py-1">
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
              disabled={isPending || !turnstileToken || !privacyChecked || !selectedTimeRange}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              {isPending ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Invio in corso...</>
              ) : "Conferma Prenotazione"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
