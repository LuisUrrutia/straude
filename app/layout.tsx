import type { Metadata } from "next";
import { Archivo, Inter, JetBrains_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { Agentation } from "agentation";
import "./globals.css";

const archivo = Archivo({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const inter = Inter({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://straude.com"),
  title: "Straude",
  description:
    "Strava for Claude Code. Track your AI coding sessions, share progress with friends, and compete on leaderboards.",
  openGraph: {
    title: "Straude",
    description: "Strava for Claude Code. Track your AI coding sessions, share progress with friends, and compete on leaderboards.",
    url: "https://straude.com",
    siteName: "Straude",
    type: "website",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Straude - Strava for Claude Code",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Straude",
    description: "Strava for Claude Code. Track your AI coding sessions, share progress with friends, and compete on leaderboards.",
    images: ["/opengraph-image"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={`${archivo.variable} ${inter.variable} ${jetbrainsMono.variable} antialiased`}>
          {children}
          {process.env.NODE_ENV === "development" && <Agentation />}
        </body>
      </html>
    </ClerkProvider>
  );
}
