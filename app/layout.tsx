import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { LanguageProvider } from "@/lib/i18n/LanguageContext";
import Header from "@/components/common/Header";

/**
 * Self-hosted font via next/font/google — prevents IP leakage
 * to third-party Google Fonts CDN servers on a privacy-first sanctuary.
 */
const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
  variable: "--font-plus-jakarta-sans",
});

export const metadata: Metadata = {
  title: "Project SAHARA — Dynamic Mental Health Monitoring & Distress Prediction",
  description:
    "Confidential, explainable distress monitoring and crisis triage sanctuary for victims of atrocities.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={plusJakartaSans.variable}>
      <body className="bg-surface font-sans text-on-surface antialiased selection:bg-primary-light selection:text-primary min-h-screen flex flex-col">
        <LanguageProvider>
          <Header />
          <main className="w-full pt-28 flex-grow">{children}</main>
        </LanguageProvider>
      </body>
    </html>
  );
}
