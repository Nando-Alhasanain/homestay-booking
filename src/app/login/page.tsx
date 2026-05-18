import Image from "next/image";
import { redirect } from "next/navigation";

import { LoginForm } from "@/components/auth/login-form";
import { Card } from "@/components/ui/card";
import { getCurrentUser } from "@/lib/auth";

export default async function LoginPage() {
  const user = await getCurrentUser();

  if (user) {
    redirect("/calendar");
  }

  return (
    <main className="grid min-h-screen place-items-center bg-background px-4 py-10">
      <div className="w-full max-w-[430px]">
        <div className="mb-6 flex items-center gap-3">
          <Image
            src="/logo.png"
            alt="Homestay Booking"
            width={64}
            height={64}
            className="h-16 w-16 rounded-full object-cover"
          />
          <div>
            <h1 className="text-2xl font-black tracking-[-0.04em]">Homestay Booking</h1>
            <p className="text-sm text-muted-foreground">Pengelolaan booking homestay</p>
          </div>
        </div>

        <Card className="shadow-panel">
          <div className="mb-5">
            <p className="mb-2 text-xs font-black uppercase tracking-[0.18em] text-primary">Login admin</p>
            <h2 className="text-[30px] font-black leading-tight tracking-[-0.04em]">Masuk untuk mengelola booking.</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">Gunakan akun admin yang sudah dibuat lewat seed database.</p>
          </div>
          <LoginForm />
        </Card>
      </div>
    </main>
  );
}
