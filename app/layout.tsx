import type { Metadata } from "next";
import { Poppins, Lora } from "next/font/google";
import { Agentation } from "agentation";
import "./globals.css";

const poppins = Poppins({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const lora = Lora({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "Straude",
  description:
    "Strava for Claude Code. Track your AI coding sessions, share progress with friends, and compete on leaderboards.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${poppins.variable} ${lora.variable} antialiased`}>
        {children}
        {process.env.NODE_ENV === "development" && <Agentation />}
      </body>
    </html>
  );
}
