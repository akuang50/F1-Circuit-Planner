import type { Metadata } from "next";
import { IBM_Plex_Mono, Unbounded } from "next/font/google";
import { SiteNav } from "@/components/SiteNav";
import "./globals.css";

const display = Unbounded({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const mono = IBM_Plex_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "F1 Weather Resilience",
  description:
    "Historical NOAA ISD scenario analysis for Formula 1 race-weekend scheduling, with ERA5 climate and OpenF1 session weather. Not a weather forecast.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${mono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col grid-fade">
        <SiteNav />
        {children}
      </body>
    </html>
  );
}
