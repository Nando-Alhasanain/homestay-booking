import type { Metadata, Viewport } from "next";
import "./globals.css";
import { PWAProvider } from "@/components/pwa-provider";
import { ThemeProvider } from "@/components/theme-provider";

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
  const themeScript = `
    (() => {
      try {
        const theme = localStorage.getItem("homestay-theme") || "system";
        const isDark = theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
        document.documentElement.classList.toggle("dark", isDark);
        document.documentElement.dataset.theme = isDark ? "dark" : "light";
        document.documentElement.style.colorScheme = isDark ? "dark" : "light";
      } catch {}
    })();
  `;

  return (
    <html lang="id" data-scroll-behavior="smooth" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="3N Booking" />
      </head>
      <body>
        <ThemeProvider>
          {children}
          <PWAProvider />
        </ThemeProvider>
      </body>
    </html>
  );
}
