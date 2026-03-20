import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Toaster } from "@/components/ui/sonner";
import { Suspense } from "react";
import AuthModal from "@/components/auth-modal";

const interFont = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Prenota la tua Lezione Privata",
    template: "%s | PrenotaLezioni",
  },
  description:
    "Prenota una lezione privata online o in presenza in pochi click. Senza registrazione, senza stress.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="it">
      <body
        className={`${interFont.variable} font-sans antialiased`}
      >
        {children}
        <Toaster position="bottom-right" richColors closeButton />
        <Suspense fallback={null}>
          <AuthModal />
        </Suspense>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
