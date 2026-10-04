import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";
const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
  display: "swap",
});
const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: { default: "Forma · Give your idea a home", template: "%s · Forma" },
  description:
    "Turn your idea into a website with Forma. Start with AI, make it yours in the visual studio, and publish or export your work.",
  applicationName: "Forma",
  openGraph: {
    title: "Forma · Give your idea a home",
    description: "Start with AI. Make it yours. Put it out there.",
    type: "website",
    siteName: "Forma",
  },
  twitter: { card: "summary_large_image" },
  icons: { icon: "/icon.svg", apple: "/apple-icon" },
};
export const viewport: Viewport = {
  themeColor: "#0a0a0c",
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
      data-scroll-behavior="smooth"
      className={`dark ${geist.variable}`}
    >
      <body>
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        {children}
        <Toaster theme="dark" position="bottom-right" richColors closeButton />
      </body>
    </html>
  );
}
