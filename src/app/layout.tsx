import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { AppProviders } from "@/lib/providers/app-providers";


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
      <body>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
