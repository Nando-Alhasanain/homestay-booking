"use client";

import { useCallback, useEffect, useState } from "react";
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

type DeletePropertyResponse =
  | { deleted: true; id: string }
  | { deleted: false; property: Record<string, unknown> };

type FormMode = "edit" | "create";

export function PropertyView() {
  const router = useRouter();
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [mode, setMode] = useState<FormMode>("edit");
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const property = properties.find((item) => item.id === selectedId) ?? properties[0];
  const isCreating = mode === "create" || !property;

  const handleAuthError = useCallback((error: unknown) => {
    if (error instanceof ClientApiError && error.status === 401) {
      router.push("/login");
    }
  }, [router]);

  useEffect(() => {
    let cancelled = false;

    async function loadProperties() {
      try {
        const response = await fetchJson<{ properties: Array<Record<string, unknown>> }>("/api/properties");
        if (cancelled) return;
        const normalizedProperties = response.properties.map(normalizeProperty);
        setProperties(normalizedProperties);
        setSelectedId((current) => current || normalizedProperties[0]?.id || "");
        if (normalizedProperties.length === 0) setMode("create");
      } catch (error) {
        handleAuthError(error);
        setError(error instanceof Error ? error.message : "Gagal memuat properti.");
      }
    }

    loadProperties();
    return () => {
      cancelled = true;
    };
  }, [handleAuthError]);

  function showToast(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(""), 2200);
  }

  function startCreateProperty() {
    setMode("create");
    setError("");
  }

  function cancelCreateProperty() {
    setMode("edit");
    setError("");
  }

  async function saveProperty(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isCreating && !property) return;

    const formData = new FormData(event.currentTarget);
    const payload = {
      name: formData.get("name"),
      pricePerNight: Number(formData.get("pricePerNight")),
      maxGuests: Number(formData.get("maxGuests")),
      status: formData.get("status"),
      address: formData.get("address"),
      description: formData.get("description"),
    };

    setIsSaving(true);
    setError("");

    try {
      const response = await fetchJson<{ property: Record<string, unknown> }>(
        isCreating ? "/api/properties" : `/api/properties/${property?.id}`,
        {
          method: isCreating ? "POST" : "PATCH",
          body: JSON.stringify(payload),
        },
      );
      const saved = normalizeProperty(response.property);

      if (isCreating) {
        setProperties((items) => [...items, saved]);
        setSelectedId(saved.id);
        setMode("edit");
        showToast("Properti berhasil ditambahkan.");
      } else {
        setProperties((items) => items.map((item) => (item.id === saved.id ? saved : item)));
        showToast("Properti berhasil disimpan.");
      }
    } catch (error) {
      handleAuthError(error);
      setError(error instanceof Error ? error.message : "Gagal menyimpan properti.");
    } finally {
      setIsSaving(false);
    }
  }

  async function deleteSelectedProperty() {
    if (!property || isCreating) return;
    const confirmed = window.confirm(
      `Hapus ${property.name}? Jika properti sudah memiliki booking, properti akan dinonaktifkan agar histori tetap aman.`,
    );

    if (!confirmed) return;

    setIsDeleting(true);
    setError("");

    try {
      const response = await fetchJson<DeletePropertyResponse>(`/api/properties/${property.id}`, {
        method: "DELETE",
      });

      if (response.deleted) {
        const remaining = properties.filter((item) => item.id !== response.id);
        setProperties(remaining);
        setSelectedId(remaining[0]?.id ?? "");
        if (remaining.length === 0) setMode("create");
        showToast("Properti berhasil dihapus.");
      } else {
        const updated = normalizeProperty(response.property);
        setProperties((items) => items.map((item) => (item.id === updated.id ? updated : item)));
        showToast("Properti memiliki booking, jadi dinonaktifkan.");
      }
    } catch (error) {
      handleAuthError(error);
      setError(error instanceof Error ? error.message : "Gagal menghapus properti.");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <>
      <SectionHeader
        title="Properti"
        description="Kelola beberapa homestay dalam satu dashboard."
        action={
          <Button type="button" variant="primary" onClick={startCreateProperty} disabled={isCreating}>
            Tambah Properti
          </Button>
        }
      />

      {error ? <p className="mb-4 rounded-2xl border border-danger/20 bg-red-50 p-3 text-sm font-semibold text-danger">{error}</p> : null}

      {!isCreating && property ? (
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
      ) : null}

      <Card className="mt-4">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-[22px] font-black tracking-[-0.03em]">{isCreating ? "Tambah properti" : "Edit properti"}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {isCreating ? "Masukkan data homestay baru." : "Perbarui data homestay yang dipilih."}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {!isCreating && properties.length > 1 ? (
              <Select className="w-auto min-w-56" value={selectedId} onChange={(event) => setSelectedId(event.target.value)}>
                {properties.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
              </Select>
            ) : null}
            {isCreating && properties.length > 0 ? (
              <Button type="button" onClick={cancelCreateProperty}>
                Batal
              </Button>
            ) : null}
            {!isCreating && property ? (
              <Button type="button" variant="danger" onClick={deleteSelectedProperty} disabled={isDeleting}>
                {isDeleting ? "Menghapus..." : "Hapus Properti"}
              </Button>
            ) : null}
          </div>
        </div>
        <form className="grid gap-3 sm:grid-cols-2" onSubmit={saveProperty} key={isCreating ? "create" : property?.id ?? "empty"}>
          <Field><Label>Nama homestay</Label><Input name="name" defaultValue={isCreating ? "" : property?.name ?? ""} /></Field>
          <Field><Label>Harga per malam</Label><Input name="pricePerNight" type="number" defaultValue={isCreating ? "" : property?.pricePerNight ?? ""} /></Field>
          <Field><Label>Kapasitas tamu</Label><Input name="maxGuests" type="number" defaultValue={isCreating ? "" : property?.maxGuests ?? ""} /></Field>
          <Field><Label>Status</Label><Select name="status" defaultValue={isCreating ? "active" : property?.status ?? "active"}><option value="active">Aktif</option><option value="inactive">Inactive</option><option value="maintenance">Maintenance</option></Select></Field>
          <Field className="sm:col-span-2"><Label>Alamat</Label><Textarea name="address" defaultValue={isCreating ? "" : property?.address ?? ""} /></Field>
          <Field className="sm:col-span-2"><Label>Deskripsi</Label><Textarea name="description" defaultValue={isCreating ? "" : property?.description ?? ""} /></Field>
          <Button type="submit" variant="primary" disabled={isSaving} className="sm:col-span-2 sm:w-fit">
            {isSaving ? "Menyimpan..." : isCreating ? "Tambah Properti" : "Simpan Perubahan"}
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
