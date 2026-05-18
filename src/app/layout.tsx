import type { Metadata, Viewport } from "next";
import "./globals.css";
import { PWAProvider } from "@/components/pwa-provider";

export const metadata: Metadata = {
  title: "3N Homestay Booking Management",
  description: "Pengelolaan booking homestay 3N.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    title: "3N Booking",
    statusBarStyle: "default",
  },
  icons: {
    icon: "/icon.png",
    apple: "/apple-icon.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#ff385c",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" data-scroll-behavior="smooth">
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="3N Booking" />
      </head>
      <body>
        {children}
        <PWAProvider />
      </body>
    </html>
  );
}
