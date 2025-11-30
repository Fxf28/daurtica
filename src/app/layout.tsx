// src/app/layout.tsx
import type { Metadata, Viewport } from "next";
import { ClerkProvider } from '@clerk/nextjs'
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { QueryClientProvider } from "./query-client-provider";
import ProgressLoader from '@/components/progress-loader';

// 1. OPTIMASI FONT: Tambahkan display: 'swap'
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap", // Wajib untuk LCP
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap", // Wajib untuk LCP
});

// SEO Metadata
export const metadata: Metadata = {
  title: {
    default: "Daurtica - Platform AI untuk Klasifikasi dan Edukasi Pengelolaan Sampah",
    template: "%s | Daurtica"
  },
  description: "Daurtica menggunakan teknologi AI untuk membantu klasifikasi sampah otomatis, edukasi pengelolaan sampah, dan menemukan bank sampah terdekat. Wujudkan Indonesia bersih dan berkelanjutan.",
  keywords: [
    "sampah", "daur ulang", "klasifikasi sampah AI", "pengelolaan sampah",
    "bank sampah", "lingkungan hidup", "teknologi hijau", "Indonesia bersih",
    "edukasi sampah", "AI lingkungan"
  ],
  authors: [{ name: "Daurtica Team" }],
  creator: "Daurtica",
  publisher: "Daurtica",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://daurtica.vercel.app'),
  alternates: {
    canonical: '/',
    languages: {
      'id-ID': '/',
    },
  },
  openGraph: {
    type: 'website',
    locale: 'id_ID',
    url: 'https://daurtica.vercel.app',
    title: "Daurtica - Platform AI untuk Klasifikasi dan Edukasi Pengelolaan Sampah",
    description: "Klasifikasi sampah otomatis dengan AI, edukasi pengelolaan sampah, dan temukan bank sampah terdekat.",
    siteName: 'Daurtica',
    images: [
      {
        url: '/logo.png',
        width: 1024,
        height: 1024,
        alt: 'Daurtica - Platform Pengelolaan Sampah Berbasis AI',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: "Daurtica - Platform AI untuk Klasifikasi dan Edukasi Pengelolaan Sampah",
    description: "Klasifikasi sampah otomatis dengan AI, edukasi pengelolaan sampah, dan temukan bank sampah terdekat.",
    images: ['/logo.png'],
    creator: '@daurtica',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  // 3. OPTIMASI ICON: Pindahkan dari Head ke sini
  icons: {
    icon: [
      { url: '/my-favicon.ico', sizes: 'any' },
      { url: '/favicon-16x16.png', type: 'image/png', sizes: '16x16' },
      { url: '/favicon-32x32.png', type: 'image/png', sizes: '32x32' },
      { url: '/android-chrome-192x192.png', type: 'image/png', sizes: '192x192' },
      { url: '/android-chrome-512x512.png', type: 'image/png', sizes: '512x512' },
    ],
    apple: [
      { url: '/apple-touch-icon.png' }
    ]
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Daurtica",
  },
  verification: {
    // google: 'your-google-verification-code',
  },
  category: 'technology',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0a' }
  ],
  colorScheme: 'light dark',
  userScalable: false,
}

// JSON-LD Structured Data
const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Daurtica',
  url: 'https://daurtica.vercel.app',
  logo: 'https://daurtica.vercel.app/logo.png',
  description: 'Platform AI untuk klasifikasi dan edukasi pengelolaan sampah',
  address: {
    '@type': 'PostalAddress',
    addressLocality: 'Surakarta',
    addressRegion: 'Jawa Tengah',
    postalCode: '57100',
    addressCountry: 'ID'
  },
  contactPoint: {
    '@type': 'ContactPoint',
    telephone: '+62-21-1234-5678',
    contactType: 'customer service',
    email: 'hello@daurtica.id',
    areaServed: 'ID',
    availableLanguage: ['Indonesian']
  },
  sameAs: [
    'https://facebook.com/daurtica',
    'https://twitter.com/daurtica',
    'https://instagram.com/daurtica',
    'https://youtube.com/@daurtica'
  ]
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider afterSignOutUrl="/">
      <html lang="id" suppressHydrationWarning>
        <head>
          {/* 2. BERSIHKAN HEAD: Hapus manual link font dan favicon */}
          {/* next/font sudah otomatis handle font loading */}

          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
          />
        </head>
        <body className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col`}>
          <QueryClientProvider>
            <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
              <ProgressLoader />
              {children}
              <Toaster richColors position="top-right" />
            </ThemeProvider>
          </QueryClientProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}