"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SectionHeader } from "@/components/ui/section-header";
import { useTheme, type ThemePreference } from "@/components/theme-provider";
import { fetchJson } from "@/lib/api-client";

type User = {
  name: string;
  email: string;
};

export function SettingsView() {
  const router = useRouter();
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadUser() {
      try {
        const response = await fetchJson<{ user: User }>("/api/auth/me");
        if (!cancelled) setUser(response.user);
      } catch {
        router.push("/login");
      }
    }

    loadUser();
    return () => {
      cancelled = true;
    };
  }, [router]);

  async function logout() {
    await fetchJson("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <>
      <SectionHeader
        title="Pengaturan"
        description="Kelola akun dan aplikasi."
        action={
          <Button onClick={logout}>
            <LogOut className="h-4 w-4" /> Logout
          </Button>
        }
      />

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <h2 className="mb-4 text-[22px] font-black tracking-[-0.03em]">Tampilan</h2>
          <p className="mb-4 text-sm leading-6 text-muted-foreground">
            Pilih tema aplikasi. Mode system mengikuti pengaturan perangkat.
          </p>
          <div className="grid grid-cols-3 gap-2">
            {themeOptions.map((option) => (
              <Button
                key={option.value}
                type="button"
                variant={theme === option.value ? "primary" : "default"}
                size="sm"
                onClick={() => setTheme(option.value)}
              >
                {option.label}
              </Button>
            ))}
          </div>
          <p className="mt-3 text-xs font-semibold text-muted-foreground">
            Tema aktif: {resolvedTheme === "dark" ? "Dark" : "Light"}
          </p>
        </Card>
        <Card>
          <h2 className="mb-4 text-[22px] font-black tracking-[-0.03em]">Informasi akun</h2>
          <div className="divide-y divide-border border-y border-border">
            <Detail label="Nama" value={user?.name ?? "Memuat..."} />
            <Detail label="Email" value={user?.email ?? "Memuat..."} />
            <Detail label="Auth" value="JWT httpOnly cookie" />
          </div>
        </Card>
        <Card>
          <h2 className="mb-4 text-[22px] font-black tracking-[-0.03em]">Status aplikasi</h2>
          <div className="divide-y divide-border border-y border-border">
            <Detail label="Versi" value="Production" />
            <Detail label="PWA" value="Siap ditambahkan manifest" />
            <Detail label="Database" value="PostgreSQL via backend" />
          </div>
        </Card>
      </div>
    </>
  );
}

const themeOptions: Array<{ value: ThemePreference; label: string }> = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "system", label: "System" },
];

function Detail({ label, value }: { label: string; value: string }) {
  return <div className="grid gap-1 py-3 sm:grid-cols-[120px_1fr]"><span className="text-sm text-muted-foreground">{label}</span><strong>{value}</strong></div>;
}
