import type { Metadata } from "next";
import { Playfair_Display, Outfit } from "next/font/google";
import "./globals.css";

const ppMondwest = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-ppmondwest",
  weight: ["400", "500"],
  style: ["normal"],
});

const af = Outfit({
  subsets: ["latin"],
  variable: "--font-af",
  weight: ["400", "500", "600", "700"],
});

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: {
    default: "PitchReady — Investor-Ready Series A Pitch Decks",
    template: "%s | PitchReady",
  },
  description:
    "Get a CFO-reviewed, investor-ready Series A pitch deck and written report in 5–7 business days. Built from your intake, refined by a seasoned CFO.",
  keywords: [
    "Series A pitch deck",
    "investor pitch deck",
    "CFO pitch review",
    "startup fundraising",
    "Series A fundraising",
    "pitch deck service",
    "investor ready deck",
  ],
  authors: [{ name: "PitchReady" }],
  creator: "PitchReady",
  metadataBase: new URL("https://cfo-tool-five.vercel.app"),
  openGraph: {
    type: "website",
    siteName: "PitchReady",
    title: "PitchReady — Investor-Ready Series A Pitch Decks",
    description:
      "CFO-reviewed pitch deck and written report in 5–7 business days. No calls. No back-and-forth.",
    url: "https://cfo-tool-five.vercel.app",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "PitchReady — Investor-Ready Series A Pitch Decks",
    description:
      "CFO-reviewed pitch deck and written report in 5–7 business days. No calls. No back-and-forth.",
    creator: "@pitchready",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${ppMondwest.variable} ${af.variable}`}>
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
