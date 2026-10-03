import "./globals.css";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { GoogleAnalytics } from "@next/third-parties/google";

const sans = Geist({ subsets: ["latin"], variable: "--font-sans" });
const mono = Geist_Mono({ subsets: ["latin"], variable: "--font-mono" });

export const metadata: Metadata = {
  title: "Resorte - Create phone / book stands to 3D print in vase mode",
  description: "Vase mode STL maker",
  openGraph: {
    title: "Resorte - Create phone / book stands to 3D print in vase mode",
    description: "Vase mode STL maker",
    images: "https://javier.xyz/resorte/og.jpg",
  },
  alternates: {
    canonical: "https://javier.xyz/resorte",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${sans.variable} ${mono.variable}`}>
      <body>{children}</body>
      <GoogleAnalytics gaId="G-M2FT27FXS2" />
    </html>
  );
}
