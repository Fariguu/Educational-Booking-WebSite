import { Metadata } from "next";
import { MessageSquare, Mail } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import ContactForm from "@/components/contact-form";
import PublicNavbar from "@/components/public-navbar";
import { createClient } from "@/utils/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Contatti",
  description: "Hai domande o vuoi maggiori informazioni? Scrivimi un messaggio.",
};

export default async function ContattiPage({ params }: { params: Promise<{ slug: string }> | { slug: string } }) {
  const resolvedParams = await Promise.resolve(params);
  const slug = resolvedParams.slug;

  // Risolvi slug → UUID
  const supabase = await createClient();
  const { data: professor } = await supabase
    .from('professors')
    .select('id, name, slug')
    .eq('slug', slug)
    .single();

  if (!professor) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-background">
      <PublicNavbar />

      <div className="container mx-auto px-4 py-12 max-w-2xl">
        <div className="text-center mb-10">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center mx-auto mb-4">
            <MessageSquare className="w-7 h-7 text-indigo-600" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight mb-2">Scrivi a {professor.name}</h1>
          <p className="text-muted-foreground">
            Hai domande, vuoi informazioni sulle lezioni o semplicemente vuoi
            salutare? Sono a tua disposizione.
          </p>
        </div>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Mail className="w-4 h-4 text-indigo-600" />
              Invia un messaggio
            </CardTitle>
            <CardDescription>
              Rispondo solitamente entro 24 ore. In alternativa puoi{" "}
              <Link href={`/professori/${professor.slug}/prenota`} className="text-indigo-600 hover:underline">
                prenotare direttamente uno slot
              </Link>.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ContactForm professorId={professor.id} />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
