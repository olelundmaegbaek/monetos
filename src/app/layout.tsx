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

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://monetos.dk";

const seoTitle = "Monetos — Gratis Spiir-alternativ til danske husstande";
const seoDescription =
  "Spiir lukker — skift til Monetos. Gratis, open source privatøkonomi-app til danske husstande: CSV-import fra Nordea, Danske Bank, Jyske Bank og Lunar, AI-kategorisering, budget, prognose og dansk skatteberegning. Alt data krypteret og gemt lokalt i din browser.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: seoTitle,
    template: "%s · Monetos",
  },
  description: seoDescription,
  applicationName: "Monetos",
  keywords: [
    "Spiir alternativ",
    "Spiir erstatning",
    "Spiir lukker",
    "erstatning for Spiir",
    "gratis Spiir alternativ",
    "privatøkonomi app",
    "budget app Danmark",
    "gratis økonomi app",
    "open source privatøkonomi",
    "CSV import bank",
    "dansk skatteberegning 2026",
    "husstandsbudget",
    "AI kategorisering transaktioner",
    "Nordea CSV import",
    "Danske Bank CSV",
    "Jyske Bank CSV",
    "Lunar CSV",
    "økonomistyring dansk",
  ],
  authors: [{ name: "Ole Lund Mægbæk" }],
  creator: "Ole Lund Mægbæk",
  publisher: "Monetos",
  category: "finance",
  alternates: {
    canonical: "/",
    languages: {
      "da-DK": "/",
      "x-default": "/",
    },
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "da_DK",
    url: siteUrl,
    siteName: "Monetos",
    title: seoTitle,
    description:
      "Spiir lukker — skift til Monetos. Gratis, open source privatøkonomi-app til danske husstande med CSV-import, AI-kategorisering, budget og skatteberegning. Alt data krypteret og gemt lokalt.",
    images: [
      {
        url: "/icon.svg",
        width: 512,
        height: 512,
        alt: "Monetos — privatøkonomi til danske husstande",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: seoTitle,
    description:
      "Spiir lukker — skift til Monetos. Gratis, open source privatøkonomi-app til danske husstande.",
    images: ["/icon.svg"],
  },
  formatDetection: {
    telephone: false,
    email: false,
    address: false,
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "SoftwareApplication",
      name: "Monetos",
      alternateName: "Monetos — Spiir-alternativ",
      description:
        "Gratis, open source privatøkonomi-app til danske husstande. Et alternativ til Spiir (spiir.dk), som lukker. CSV-import fra danske banker, AI-kategorisering, budget, prognose og dansk skatteberegning. Alt data krypteret og gemt lokalt i browseren.",
      applicationCategory: "FinanceApplication",
      applicationSubCategory: "Personal Finance",
      operatingSystem: "Web",
      url: siteUrl,
      inLanguage: "da-DK",
      isAccessibleForFree: true,
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "DKK",
      },
      author: {
        "@type": "Person",
        name: "Ole Lund Mægbæk",
      },
      license: "https://opensource.org/licenses/MIT",
      featureList: [
        "CSV-import fra Nordea, Danske Bank, Jyske Bank og Lunar",
        "AI-kategorisering af transaktioner",
        "Budgettering og prognose",
        "Dansk skatteberegning 2026",
        "Lokal AES-256 kryptering",
      ],
    },
    {
      "@type": "WebSite",
      name: "Monetos",
      url: siteUrl,
      inLanguage: "da-DK",
      publisher: {
        "@type": "Person",
        name: "Ole Lund Mægbæk",
      },
    },
    {
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name: "Er Monetos et alternativ til Spiir?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Ja. Spiir (spiir.dk) lukker, og Monetos er et gratis, open source alternativ til danske husstande. Du importerer transaktioner fra din bank via CSV, kategoriserer dem automatisk med AI og får overblik over budget, prognose og dansk skat.",
          },
        },
        {
          "@type": "Question",
          name: "Er Monetos gratis?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Ja, Monetos er 100% gratis og open source under MIT-licensen. Der er ingen abonnement eller skjulte gebyrer.",
          },
        },
        {
          "@type": "Question",
          name: "Hvor gemmes mine data?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Al data gemmes lokalt i din browser og krypteres med AES-256-GCM med en PIN-kode. Ingen data sendes til en server.",
          },
        },
        {
          "@type": "Question",
          name: "Hvilke banker understøtter Monetos?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Monetos understøtter CSV-eksport fra Nordea, Danske Bank, Jyske Bank, Lunar samt en generisk dansk CSV-parser.",
          },
        },
      ],
    },
  ],
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <AppProvider>
          <TooltipProvider>
            {children}
          </TooltipProvider>
        </AppProvider>
      </body>
    </html>
  );
}
