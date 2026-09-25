import type { Metadata } from "next";
import "./globals.css";
import { LanguageProvider } from "@/lib/i18n/LanguageContext";
import Header from "@/components/common/Header";

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
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-surface font-sans text-on-surface antialiased selection:bg-primary-light selection:text-primary min-h-screen flex flex-col">
        <LanguageProvider>
          <Header />
          <main className="w-full pt-28 flex-grow">{children}</main>
        </LanguageProvider>
      </body>
    </html>
  );
}
