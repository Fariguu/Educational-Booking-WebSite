import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FileQuestion, ArrowLeft } from "lucide-react";

export default function NotFound() {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-background text-center p-4">
            <div className="w-32 h-32 rounded-full bg-indigo-50 flex items-center justify-center mb-8">
                <FileQuestion className="w-16 h-16 text-indigo-300" />
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight mb-4">404 — Pagina non trovata</h1>
            <p className="text-lg text-muted-foreground mb-8 max-w-md">
                Ops! Sembra che la pagina che stai cercando non esista o sia stata spostata.
            </p>
            <Link href="/">
                <Button size="lg" className="bg-indigo-600 hover:bg-indigo-700 text-white">
                    <ArrowLeft className="mr-2 w-4 h-4" />
                    Torna alla Home
                </Button>
            </Link>
        </div>
    );
}
