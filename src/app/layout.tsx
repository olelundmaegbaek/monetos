import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { PinGate } from "@/components/auth/pin-gate";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
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
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <PinGate>
          <TooltipProvider>
            {children}
          </TooltipProvider>
        </PinGate>
      </body>
    </html>
  );
}
