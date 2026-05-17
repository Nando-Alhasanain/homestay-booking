"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Download, ExternalLink, MessageCircle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SectionHeader } from "@/components/ui/section-header";
import { ClientApiError, fetchJson } from "@/lib/api-client";
import {
  formatCurrency,
  formatDate,
  formatDateRange,
  paymentStatusLabel,
  paymentStatusTone,
} from "@/lib/utils";

type InvoiceListItem = {
  id: string;
  invoiceNumber: string;
  invoiceDate: string;
  pdfUrl: string | null;
  guestName: string;
  guestPhone: string;
  checkIn: string;
  checkOut: string;
  totalPrice: string;
  paymentStatus: string;
  propertyName: string;
};

export function InvoicesView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [invoices, setInvoices] = useState<InvoiceListItem[]>([]);
  const [search, setSearch] = useState(() => searchParams.get("search") ?? "");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadInvoices() {
      setIsLoading(true);
      setError("");

      try {
        const params = new URLSearchParams();
        if (search) params.set("search", search);

        router.replace(`/invoices?${params.toString()}`, { scroll: false });

        const response = await fetchJson<{ invoices: InvoiceListItem[] }>(
          `/api/invoices?${params.toString()}`,
        );
        if (!cancelled) setInvoices(response.invoices);
      } catch (error) {
        if (error instanceof ClientApiError && error.status === 401) {
          router.push("/login");
          return;
        }
        if (!cancelled) setError(error instanceof Error ? error.message : "Gagal memuat invoice.");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    const timeout = window.setTimeout(loadInvoices, 250);
    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
    };
  }, [router, search]);

  const content = useMemo(() => {
    if (isLoading) return <p className="text-sm text-muted-foreground">Memuat invoice...</p>;
    if (error)
      return (
        <p className="rounded-2xl border border-danger/20 bg-red-50 p-3 text-sm font-semibold text-danger">
          {error}
        </p>
      );
    if (!invoices.length) return <p className="text-sm text-muted-foreground">Belum ada invoice.</p>;

    return invoices.map((invoice) => (
      <InvoiceCard key={invoice.id} invoice={invoice} />
    ));
  }, [invoices, error, isLoading]);

  return (
    <>
      <SectionHeader title="Invoice" description="Kelola invoice booking." />

      <Card>
        <div className="mb-4">
          <Input
            placeholder="Cari nomor invoice atau nama tamu"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
        <div className="grid gap-3">{content}</div>
      </Card>
    </>
  );
}

function InvoiceCard({ invoice }: { invoice: InvoiceListItem }) {
  return (
    <div className="grid gap-3 rounded-[18px] border border-border bg-white p-4 sm:grid-cols-[minmax(0,1fr)_auto]">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <strong className="truncate">{invoice.invoiceNumber}</strong>
          <Badge tone={paymentStatusTone(invoice.paymentStatus as "unpaid" | "partial" | "paid")}>
            {paymentStatusLabel(invoice.paymentStatus as "unpaid" | "partial" | "paid")}
          </Badge>
        </div>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">
          {invoice.guestName} · {formatDateRange(invoice.checkIn, invoice.checkOut)} · {invoice.propertyName}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">{formatDate(invoice.invoiceDate)}</p>
      </div>
      <div className="flex flex-wrap items-start gap-2 sm:flex-col sm:items-end">
        <span className="font-black tabular-nums">{formatCurrency(Number(invoice.totalPrice))}</span>
        <div className="flex gap-1">
          <Button asChild size="sm" variant="default">
            <Link href={`/invoices/${invoice.id}`}>
              <ExternalLink className="h-3.5 w-3.5" />
              Lihat
            </Link>
          </Button>
          <Button asChild size="sm" variant="default">
            <a href={`/api/invoices/${invoice.id}/download`}>
              <Download className="h-3.5 w-3.5" />
            </a>
          </Button>
          <Button
            size="sm"
            variant="default"
            onClick={() => {
              void navigator.clipboard?.writeText(`${window.location.origin}/invoices/${invoice.id}`);
            }}
          >
            <MessageCircle className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
