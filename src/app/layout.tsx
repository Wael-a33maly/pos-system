import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "next-themes";
import { ServiceWorkerRegistration } from "@/components/ServiceWorkerRegistration";
import { OfflineIndicator } from "@/components/OfflineIndicator";
import { Providers } from "@/components/Providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "نظام نقاط البيع - POS System",
  description: "نظام متكامل لإدارة نقاط البيع والمبيعات والمخزون",
  keywords: ["POS", "نقاط البيع", "مبيعات", "مخزون", "فواتير"],
  authors: [{ name: "POS System Team" }],
  icons: {
    icon: "/icons/icon-192x192.svg",
  },
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "white" },
    { media: "(prefers-color-scheme: dark)", color: "black" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link 
          href="https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;500;600;700;800&display=swap" 
          rel="stylesheet" 
        />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.svg" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} font-cairo antialiased bg-background text-foreground`}
      >
        <Providers>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <ServiceWorkerRegistration />
            {children}
            <Toaster position="top-center" richColors />
            <OfflineIndicator />
          </ThemeProvider>
        </Providers>
      </body>
    </html>
  );
}
