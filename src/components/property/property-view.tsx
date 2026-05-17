"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, ElevatedCard } from "@/components/ui/card";
import { Field, Label } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { SectionHeader } from "@/components/ui/section-header";
import { ClientApiError, fetchJson, normalizeProperty } from "@/lib/api-client";
import { formatCurrency } from "@/lib/utils";
import type { Property } from "@/types";

export function PropertyView() {
  const router = useRouter();
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const property = properties.find((item) => item.id === selectedId) ?? properties[0];

  useEffect(() => {
    let cancelled = false;

    async function loadProperties() {
      try {
        const response = await fetchJson<{ properties: Array<Record<string, unknown>> }>("/api/properties");
        if (cancelled) return;
        const normalizedProperties = response.properties.map(normalizeProperty);
        setProperties(normalizedProperties);
        setSelectedId((current) => current || normalizedProperties[0]?.id || "");
      } catch (error) {
        if (error instanceof ClientApiError && error.status === 401) {
          router.push("/login");
          return;
        }
        setError(error instanceof Error ? error.message : "Gagal memuat property.");
      }
    }

    loadProperties();
    return () => {
      cancelled = true;
    };
  }, [router]);

  async function saveProperty(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!property) return;

    const formData = new FormData(event.currentTarget);
    setIsSaving(true);
    setError("");

    try {
      const response = await fetchJson<{ property: Record<string, unknown> }>(`/api/properties/${property.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          name: formData.get("name"),
          pricePerNight: Number(formData.get("pricePerNight")),
          maxGuests: Number(formData.get("maxGuests")),
          status: formData.get("status"),
          address: formData.get("address"),
          description: formData.get("description"),
        }),
      });
      const updated = normalizeProperty(response.property);
      setProperties((items) => items.map((item) => (item.id === updated.id ? updated : item)));
      setToast("Property berhasil disimpan.");
      window.setTimeout(() => setToast(""), 2200);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Gagal menyimpan property.");
    } finally {
      setIsSaving(false);
    }
  }

  if (!property) {
    return (
      <>
        <SectionHeader title="Belum Ada Properti" description="Tambahkan property lewat seed database atau API." />
        {error ? <p className="rounded-2xl border border-danger/20 bg-red-50 p-3 text-sm font-semibold text-danger">{error}</p> : null}
      </>
    );
  }

  return (
    <>
      <SectionHeader
        title="Properti"
        description="Kelola data homestay."
      />

      {error ? <p className="mb-4 rounded-2xl border border-danger/20 bg-red-50 p-3 text-sm font-semibold text-danger">{error}</p> : null}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(360px,0.9fr)]">
        <div className="relative flex min-h-[320px] items-end overflow-hidden rounded-[20px] border border-border p-5">
          <Image
            src="/homestay.png"
            alt={property.name}
            fill
            priority
            loading="eager"
            sizes="(min-width: 1024px) 720px, 100vw"
            className="object-cover"
          />
          <div className="relative z-10 max-w-sm rounded-[18px] border border-border bg-white/90 p-4 backdrop-blur">
            <h2 className="text-[22px] font-black tracking-[-0.03em]">{property.name}</h2>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">{property.address ?? "Alamat belum diisi"}</p>
          </div>
        </div>

        <ElevatedCard>
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-[22px] font-black tracking-[-0.03em]">Informasi utama</h2>
            <Badge tone={property.status === "active" ? "success" : property.status === "maintenance" ? "warning" : "neutral"}>{property.status}</Badge>
          </div>
          <div className="divide-y divide-border border-y border-border">
            <Detail label="Alamat" value={property.address ?? "-"} />
            <Detail label="Harga per malam" value={formatCurrency(property.pricePerNight)} />
            <Detail label="Kapasitas" value={`${property.maxGuests} tamu`} />
            <Detail label="Model booking" value="Satu rumah penuh, bukan per kamar" />
          </div>
        </ElevatedCard>
      </div>

      <Card className="mt-4">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-[22px] font-black tracking-[-0.03em]">Edit property</h2>
          {properties.length > 1 ? (
            <Select className="w-auto min-w-56" value={selectedId} onChange={(event) => setSelectedId(event.target.value)}>
              {properties.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </Select>
          ) : null}
        </div>
        <form className="grid gap-3 sm:grid-cols-2" onSubmit={saveProperty} key={property.id}>
          <Field><Label>Nama homestay</Label><Input name="name" defaultValue={property.name} /></Field>
          <Field><Label>Harga per malam</Label><Input name="pricePerNight" type="number" defaultValue={property.pricePerNight} /></Field>
          <Field><Label>Kapasitas tamu</Label><Input name="maxGuests" type="number" defaultValue={property.maxGuests} /></Field>
          <Field><Label>Status</Label><Select name="status" defaultValue={property.status}><option value="active">Aktif</option><option value="inactive">Inactive</option><option value="maintenance">Maintenance</option></Select></Field>
          <Field className="sm:col-span-2"><Label>Alamat</Label><Textarea name="address" defaultValue={property.address ?? ""} /></Field>
          <Field className="sm:col-span-2"><Label>Deskripsi</Label><Textarea name="description" defaultValue={property.description ?? ""} /></Field>
          <Button type="submit" variant="primary" disabled={isSaving} className="sm:col-span-2 sm:w-fit">
            {isSaving ? "Menyimpan..." : "Simpan Perubahan"}
          </Button>
        </form>
      </Card>

      {toast ? (
        <div className="fixed bottom-24 right-4 z-50 rounded-[20px] bg-foreground px-4 py-3 text-sm font-bold text-white shadow-panel lg:bottom-6">
          {toast}
        </div>
      ) : null}
    </>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return <div className="grid gap-1 py-3 sm:grid-cols-[160px_1fr]"><span className="text-sm text-muted-foreground">{label}</span><strong>{value}</strong></div>;
}
