import type { Metadata, Viewport } from "next";
import { Inter, Playfair_Display, Cormorant_Garamond } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
});

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  weight: ["400", "600"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MeditationGuru - Your AI Meditation & Yoga Guide",
  description: "The world's first AI-native meditation and yoga app. Experience real-time guidance from your personal AI guru powered by Gemini.",
  keywords: ["meditation", "yoga", "AI", "mindfulness", "wellness", "guided meditation", "yoga poses", "stress relief"],
  authors: [{ name: "MeditationGuru" }],
  openGraph: {
    title: "MeditationGuru - Your AI Meditation & Yoga Guide",
    description: "Experience real-time guidance from your personal AI guru",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#0a0a12",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${inter.variable} ${playfair.variable} ${cormorant.variable} antialiased bg-[#0a0a12] text-white min-h-screen`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
