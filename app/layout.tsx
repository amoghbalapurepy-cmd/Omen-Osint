import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "OMEN // OSINT & Security Console",
  description:
    "OMEN is a local-first OSINT, privacy-awareness and defensive-security console. See what's public. Understand the evidence.",
  applicationName: "OMEN",
  keywords: [
    "OSINT",
    "security console",
    "privacy",
    "defensive security",
    "public sources",
  ],
  authors: [{ name: "Amogh Balapure" }],
};

export const viewport: Viewport = {
  themeColor: "#02070d",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${jetbrainsMono.variable} bg-background`}
    >
      <body className="bg-background text-foreground antialiased">
        {children}
      </body>
    </html>
  );
}
