import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import ViewportGuidance from "@/components/ViewportGuidance";
import InstallPrompt from "@/components/InstallPrompt";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "iASV Simulator — Hamilton Otis-Mead",
  description:
    "Interactieve simulator voor Intelligent Adaptive Support Ventilation op basis van de Otis- en Mead-formules.",
  applicationName: "iASV Simulator",
  appleWebApp: { capable: true, title: "iASV", statusBarStyle: "black" },
};

export const viewport: Viewport = {
  themeColor: "#030712",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="nl" className="dark">
      <body className={`${inter.className} bg-gray-950 text-gray-100 min-h-screen`}>
        <ViewportGuidance />
        <InstallPrompt />
        {children}
      </body>
    </html>
  );
}
