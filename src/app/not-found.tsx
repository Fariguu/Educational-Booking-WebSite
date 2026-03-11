import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-background text-center p-4">
            {/* Sostituire con l'SVG reale scaricato da unDraw */}
            <div className="w-64 h-64 bg-muted rounded-full flex items-center justify-center mb-8 relative overflow-hidden">
                <span className="text-muted-foreground font-medium z-10">unDraw Illustration 404</span>
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight mb-4">404 - Pagina non trovata</h1>
            <p className="text-lg text-muted-foreground mb-8 max-w-md">
                Ops! Sembra che la pagina che stai cercando non esista o sia stata spostata.
            </p>
            <Link href="/">
                <Button size="lg">Torna alla Home</Button>
            </Link>
        </div>
    );
}
