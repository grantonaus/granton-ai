// app/layout.tsx
import type { Metadata, Viewport } from "next";
import "./globals.css";
import { auth } from "../../auth";
import { SessionProvider } from "next-auth/react";
import { Toaster } from "sonner";


export const metadata: Metadata = {
  title: {
    default: "Granton AI",
    template: "%s | Granton AI",
  },
  description: "Granton AI – The AI-powered platform to optimize your grant applications.",
  keywords: [
    "Granton AI",
    "grant application",
    "AI grants",
    "funding",
    "grant management",
    "AI-powered",
    "nonprofit funding",
  ],
  openGraph: {
    title: "Granton AI",
    description: "Granton AI – The AI-powered platform to optimize your grant applications.",
    url: "https://www.granton.ai",
    siteName: "Granton AI",
    images: [
      {
        url: "/opengraph-image.png",
        width: 1200,
        height: 630,
        alt: "Granton AI – Streamline Grant Applications",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/android-chrome-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/android-chrome-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
    other: [
      { rel: "icon", url: "/favicon.ico", type: "image/x-icon" },
      { rel: "mask-icon", url: "/safari-pinned-tab.svg", color: "#5bbad5" },
    ],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();

  return (
    <SessionProvider session={session}>
      <html lang="en" className="h-full" suppressHydrationWarning>
        <head>
          <meta charSet="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <meta name="author" content="Artyom Antonenko" />
          <meta name="robots" content="index, follow" />
          <meta property="og:title" content="GStudy - Smarter Learning Platform" />
          <meta property="og:description" content="Boost your productivity with AI-generated notes, flashcards, and summaries tailored for effective studying." />
          <meta property="og:image" content="/og-image.png" />
          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:title" content="GStudy - Smarter Learning Platform" />
          <meta name="twitter:description" content="Boost your productivity with AI-generated notes, flashcards, and summaries tailored for effective studying." />
          <meta name="twitter:image" content="/og-image.png" />
          <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
          <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
          <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
          <link rel="manifest" href="/site.webmanifest" />
          <meta name="msapplication-TileColor" content="#da532c" />
          <meta name="theme-color" content="#ffffff" />
        </head>
        <body className="h-full antialiased" suppressHydrationWarning>
          <Toaster position="bottom-center" richColors />
          {children}
        </body>
      </html>
    </SessionProvider>
  );
}
