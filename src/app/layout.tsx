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
    default: "BuildFest 2026 — The next big idea could be yours.",
    template: "%s · BuildFest 2026",
  },
  description:
    "One Idea. Three Minds. Endless Possibilities. Build with AI, solve real problems, and pitch your innovation at GUtech’s BuildFest 2026. PKR 1,500 per team.",
  openGraph: {
    title: "BuildFest 2026 — Build what’s next.",
    description:
      "GUtech’s innovation challenge. 1–3 members. AI encouraged. One idea can change everything.",
    type: "website",
    locale: "en_PK",
    images: ["/opengraph-image"],
  },
  twitter: {
    card: "summary_large_image",
    title: "BuildFest 2026",
    description: "The next big idea could be yours.",
  },
  robots: { index: true, follow: true },
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
