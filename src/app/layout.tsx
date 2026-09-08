import "./globals.css";
import type { Metadata } from "next";
import { GoogleAnalytics } from "@next/third-parties/google";

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
    <html lang="en" className="dark">
      <body>{children}</body>
      <GoogleAnalytics gaId="G-M2FT27FXS2" />
    </html>
  );
}
