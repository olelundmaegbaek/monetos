import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AppProvider } from "@/components/providers/app-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://monetos.vercel.app"),
  title: {
    default: "Monetos - Privatøkonomi",
    template: "%s | Monetos",
  },
  description: "Privatøkonomisk overblik med dansk skatteoptimering",
  applicationName: "Monetos",
  robots: { index: false, follow: false },
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
        <AppProvider>
          <TooltipProvider>
            {children}
          </TooltipProvider>
        </AppProvider>
      </body>
    </html>
  );
}
