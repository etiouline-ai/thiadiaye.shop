import type { Metadata, Viewport } from "next";
import { EB_Garamond } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { adsClientId } from "@/lib/ads";

const garamond = EB_Garamond({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-garamond",
});

export const metadata: Metadata = {
  title: {
    default: "THIADIAYE.SHOP — Annonces au Sénégal",
    template: "%s | THIADIAYE.SHOP",
  },
  description:
    "Le portail d'annonces locales de Thiadiaye et du Sénégal : véhicules, immobilier, agriculture, électronique, maison, emploi et services. Publiez gratuitement, achetez et vendez près de chez vous.",
  keywords: [
    "annonces",
    "Thiadiaye",
    "Sénégal",
    "petites annonces",
    "achat",
    "vente",
    "immobilier",
    "véhicules",
    "agriculture",
  ],
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  ),
  openGraph: {
    type: "website",
    locale: "fr_SN",
    siteName: "THIADIAYE.SHOP",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#15803d",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr" className={`${garamond.variable} h-full`}>
      <head>
        {adsClientId ? (
          <script
            async
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsClientId}`}
            crossOrigin="anonymous"
          />
        ) : null}
      </head>
      <body className="flex min-h-full flex-col bg-ink-50">
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
