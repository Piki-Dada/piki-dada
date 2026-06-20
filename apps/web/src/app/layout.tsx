import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { MapsProvider } from "@/components/maps/map-provider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Piki Dada",
  description: "Modern ride-hailing for Uganda",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-neutral-50">
        <MapsProvider>{children}</MapsProvider>
      </body>
    </html>
  );
}
