"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Home } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Field, Label } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { fetchJson } from "@/lib/api-client";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      await fetchJson("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      router.push("/calendar");
      router.refresh();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Login gagal.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form className="grid gap-3" onSubmit={onSubmit}>
      <Field>
        <Label>Email</Label>
        <Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
      </Field>
      <Field>
        <Label>Password</Label>
        <Input type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
      </Field>
      {error ? (
        <p className="rounded-2xl border border-danger/20 bg-red-50 p-3 text-sm font-semibold text-danger">
          {error}
        </p>
      ) : null}
      <Button type="submit" variant="primary" className="mt-2 w-full" disabled={isLoading}>
        <Home className="h-4 w-4" />
        {isLoading ? "Masuk..." : "Login"}
      </Button>
    </form>
  );
}
