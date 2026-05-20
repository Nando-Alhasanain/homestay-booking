"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { type ReactNode } from "react";
import {
  CalendarDays,
  FileText,
  Home,
  Hotel,
  Settings,
  UserCircle,
} from "lucide-react";

import { cn } from "@/lib/utils";
import type { SessionPayload } from "@/lib/jwt";

const navItems = [
  { label: "Dashboard", mobileLabel: "Beranda", href: "/dashboard", icon: Home },
  { label: "Booking", mobileLabel: "Booking", href: "/bookings", icon: Hotel },
  { label: "Kalender", mobileLabel: "Kalender", href: "/calendar", icon: CalendarDays },
  { label: "Properti", mobileLabel: "Properti", href: "/property", icon: UserCircle },
  { label: "Invoice", mobileLabel: "Invoice", href: "/invoices", icon: FileText },
  { label: "Pengaturan", mobileLabel: "Akun", href: "/settings", icon: Settings },
];

function isActive(pathname: string, href: string) {
  if (href.startsWith("/invoices")) return pathname.startsWith("/invoices");
  if (href === "/bookings") return pathname.startsWith("/bookings");
  return pathname === href;
}

function getInitials(user: SessionPayload) {
  const nameParts = user.name.trim().split(/\s+/).filter(Boolean);

  if (nameParts.length > 0) {
    return nameParts.slice(0, 2).map((part) => part[0]).join("").toUpperCase();
  }

  return user.email.slice(0, 2).toUpperCase();
}

function getMobilePageMeta(pathname: string) {
  if (pathname === "/" || pathname === "/dashboard") {
    return { title: "Dashboard", description: "Ringkasan booking hari ini." };
  }
  if (pathname === "/bookings/new") {
    return { title: "Booking Baru", description: "Isi data tamu dan tanggal menginap." };
  }
  if (/^\/bookings\/[^/]+\/edit$/.test(pathname)) {
    return { title: "Edit Booking", description: "Perbarui data booking tamu." };
  }
  if (/^\/bookings\/[^/]+$/.test(pathname)) {
    return { title: "Detail Booking", description: "Lihat rincian booking tamu." };
  }
  if (pathname === "/bookings") {
    return { title: "Booking", description: "Kelola daftar booking tamu." };
  }
  if (pathname === "/calendar") {
    return { title: "Kalender", description: "Lihat tanggal kosong dan terisi." };
  }
  if (pathname === "/property") {
    return { title: "Properti", description: "Kelola homestay." };
  }
  if (/^\/invoices\/[^/]+$/.test(pathname)) {
    return { title: "Detail Invoice", description: "Download atau bagikan invoice." };
  }
  if (pathname === "/invoices") {
    return { title: "Invoice", description: "Kelola invoice booking." };
  }
  if (pathname === "/settings") {
    return { title: "Pengaturan", description: "Kelola akun dan aplikasi." };
  }

  return { title: "Homestay", description: "Booking management." };
}

export function AppShell({ children, user }: { children: ReactNode; user: SessionPayload }) {
  const pathname = usePathname();
  const initials = getInitials(user);
  const mobilePageMeta = getMobilePageMeta(pathname);

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[280px_minmax(0,1fr)]">
      <aside className="sticky top-0 hidden h-screen flex-col gap-7 border-r border-border bg-card px-5 py-7 lg:flex">
        <Link href="/dashboard" className="flex items-center gap-3 font-black tracking-[-0.02em]">
          <Image
            src="/logo.png"
            alt="Homestay Booking"
            width={56}
            height={56}
            className="h-14 w-14 rounded-full object-cover"
          />
          <span className="text-xl leading-5">
            Homestay
            <br />
            Booking
          </span>
        </Link>

        <nav className="grid gap-2" aria-label="Navigasi desktop">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(pathname, item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex min-h-12 items-center gap-3 rounded-[20px] px-3.5 py-3 text-sm font-bold transition hover:bg-muted",
                  active && "bg-foreground text-background hover:bg-foreground",
                )}
              >
                <Icon className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      <main className="min-w-0 px-4 pb-24 pt-0 lg:px-7 lg:pb-10">
        <header className="sticky top-0 z-20 -mx-4 mb-5 flex items-center justify-between gap-3 border-b border-border/75 bg-background/90 px-4 py-3 backdrop-blur-xl lg:-mx-7 lg:mb-7 lg:justify-end lg:px-7 lg:py-4">
          <div className="min-w-0 lg:hidden">
            <h1 className="truncate text-lg font-black leading-tight tracking-[-0.03em]">
              {mobilePageMeta.title}
            </h1>
            <p className="mt-0.5 truncate text-xs font-semibold text-muted-foreground">
              {mobilePageMeta.description}
            </p>
          </div>

          <Link
            href="/settings"
            className="flex h-11 w-11 items-center justify-center rounded-full border border-border bg-card p-1 md:w-auto md:justify-start md:gap-2 md:pr-3"
          >
            <span className="grid h-8 w-8 place-items-center rounded-full bg-foreground text-xs font-black text-background">
              {initials}
            </span>
            <span className="hidden max-w-40 truncate text-sm font-bold md:block">{user.name}</span>
          </Link>
        </header>

        <div className="mx-auto max-w-[1180px]">{children}</div>
      </main>

      <nav
        className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-border bg-card px-2 py-1.5 pb-[calc(0.4rem+env(safe-area-inset-bottom))] lg:hidden"
        aria-label="Navigasi mobile"
      >
        {navItems
          .filter((item) => item.label !== "Pengaturan")
          .map((item) => {
            const Icon = item.icon;
            const active = isActive(pathname, item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex min-h-[54px] flex-col items-center justify-center gap-1 rounded-2xl px-1 text-[11px] font-bold text-muted-foreground",
                  active && "bg-primary/10 text-primary",
                )}
              >
                <Icon className="h-5 w-5" />
                <span>{item.mobileLabel}</span>
              </Link>
            );
          })}
      </nav>
    </div>
  );
}
