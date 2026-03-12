import { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Mail, MessageSquare } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import ContactForm from "@/components/contact-form";

export const metadata: Metadata = {
  title: "Contatti",
  description: "Hai domande o vuoi maggiori informazioni? Scrivimi un messaggio.",
};

export default function ContattiPage() {
  return (
    <main className="min-h-screen bg-background">
      <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Torna alla home
          </Link>
          <h1 className="text-base font-semibold tracking-tight">Contatti</h1>
        </div>
      </header>

      <div className="container mx-auto px-4 py-12 max-w-2xl">
        <div className="text-center mb-10">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center mx-auto mb-4">
            <MessageSquare className="w-7 h-7 text-indigo-600" />
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight mb-2">Scrivimi</h2>
          <p className="text-muted-foreground">
            Hai domande, vuoi informazioni sulle lezioni o semplicemente vuoi salutare? Sono a tua disposizione.
          </p>
        </div>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Mail className="w-4 h-4 text-indigo-600" />
              Invia un messaggio
            </CardTitle>
            <CardDescription>
              Rispondo solitamente entro 24 ore. In alternativa puoi prenotare direttamente uno slot disponibile.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ContactForm />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
