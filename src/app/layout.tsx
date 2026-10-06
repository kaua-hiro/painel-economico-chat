import type { Metadata } from "next";
import { Archivo, Instrument_Sans, DM_Mono } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";
import { Ticker } from "@/components/layout/Ticker";
import { Footer } from "@/components/layout/Footer";

/** Display e números: largo, institucional, com algarismos tabulares. */
const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

/** Corpo. */
const instrument = Instrument_Sans({
  variable: "--font-instrument",
  subsets: ["latin"],
});

/** Rótulos de instrumento, códigos de série e horários. */
const dmMono = DM_Mono({
  variable: "--font-dm-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "Kauã Hiro Mizumoto — Painel econômico & chat em tempo real",
  description:
    "Projeto de portfólio: painel de indicadores do Banco Central do Brasil e chat em tempo real com Socket.IO, com um assistente que responde pelos mesmos números do painel.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      className={`${archivo.variable} ${instrument.variable} ${dmMono.variable} h-full`}
    >
      <body className="flex min-h-full flex-col bg-paper text-ink">
        <Navbar />
        <Ticker />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
