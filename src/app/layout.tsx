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
  title: "Caldera CFO",
  description:
    "Financial command center for rollup teams and token treasuries — settling every chain onto one ledger.",
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
