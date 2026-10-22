import type { Metadata } from "next";
import { Geist, Geist_Mono, Syne } from "next/font/google";
import "./globals.css";
import { ScrollReset } from "@/components/scroll-reset";
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});
const display = Syne({ variable: "--font-display", subsets: ["latin"] });
export const metadata: Metadata = {
  metadataBase: new URL(process.env.APP_URL || "http://localhost:3000"),
  title: {
    default: "LEAP 3 — Pitch Your Startup. Unlock Opportunities.",
    template: "%s · LEAP 3",
  },
  description:
    "GUtech University’s Official Startup Pitching Event, organized by the Entrepreneurship Society. Free applications for ideas, prototypes, MVPs, and growing businesses.",
  openGraph: {
    title: "LEAP 3 — Pitch Your Startup. Unlock Opportunities.",
    description:
      "Apply with your startup idea and PDF pitch deck. No working product required. Only shortlisted startups pitch at LEAP 3.",
    type: "website",
    locale: "en_PK",
    images: ["/opengraph-image"],
  },
  twitter: {
    card: "summary_large_image",
    title: "LEAP 3",
    description: "Pitch Your Startup. Unlock Opportunities.",
  },
  robots: { index: true, follow: true },
  verification: {
    google: "ksPme2yJzX9I1yhuyQYrwfQnBEAiKoCqh976CaL08WA",
  },
};
export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${display.variable}`}
    >
      <body>
        <ScrollReset />
        <a href="#main-content" className="skip-link">
          Skip to content
        </a>
        <div id="main-content">{children}</div>
      </body>
    </html>
  );
}
