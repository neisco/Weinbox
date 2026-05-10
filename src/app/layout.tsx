import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AppProviders } from "@/lib/providers/app-providers";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Weinbox – dein privater Weinkeller",
  description: "Moderne Web-App zur Verwaltung privater Weinkeller, Bewertungen und Trinkhistorie.",
  applicationName: "Weinbox",
  metadataBase: new URL("https://weinbox.vercel.app")
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#7f1734"
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="de">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
