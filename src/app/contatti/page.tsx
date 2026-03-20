import PublicNavbar from '@/components/public-navbar'
import ContactForm from '@/components/contact-form'
import { Mail, MessageCircle } from 'lucide-react'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Contattaci – PrenotaLezioni',
  description: 'Hai domande sulla piattaforma? Scrivici e ti risponderemo il prima possibile.',
}

export default function ContattiPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <PublicNavbar />

      <main className="flex-1">
        {/* Hero */}
        <section className="bg-indigo-50/40 border-b py-12">
          <div className="container mx-auto px-4 max-w-2xl text-center">
            <div className="w-14 h-14 rounded-2xl bg-indigo-100 flex items-center justify-center mx-auto mb-4">
              <MessageCircle className="w-7 h-7 text-indigo-600" />
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-3">
              Contattaci
            </h1>
            <p className="text-muted-foreground text-lg">
              Hai domande sulla piattaforma, problemi tecnici o vuoi saperne di più? Scrivici.
            </p>
          </div>
        </section>

        {/* Form */}
        <section className="container mx-auto px-4 py-14 max-w-xl">
          <div className="bg-card border rounded-2xl shadow-sm p-8">
            <div className="flex items-center gap-3 mb-6">
              <Mail className="w-5 h-5 text-indigo-600" />
              <h2 className="text-lg font-semibold">Invia un Messaggio</h2>
            </div>
            {/* professorId is undefined here: message goes to platform admin */}
            <ContactForm professorId={undefined as unknown as string} />
          </div>
        </section>
      </main>
    </div>
  )
}
