import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Instrument_Serif, Geist_Mono } from "next/font/google";
import { AppProvider } from "@/components/providers/app-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  display: "swap",
});

const serif = Instrument_Serif({
  variable: "--font-instrument-serif",
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

const mono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Monetos - Privatøkonomi",
  description: "Privatøkonomisk overblik med dansk skatteoptimering",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="da">
      <body
        className={`${jakarta.variable} ${serif.variable} ${mono.variable} antialiased`}
      >
        <AppProvider>
          <TooltipProvider>
            {children}
          </TooltipProvider>
        </AppProvider>
      </body>
    </html>
  );
}
