"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { InvoicePreview } from "@/components/invoice/invoice-preview";
import { SectionHeader } from "@/components/ui/section-header";
import {
  ClientApiError,
  fetchJson,
  normalizeBooking,
  normalizeInvoice,
  normalizeProperty,
} from "@/lib/api-client";
import type { Booking, Invoice, Property } from "@/types";

type InvoiceApiResponse = {
  invoice: Record<string, unknown>;
  booking: Record<string, unknown>;
  property: Record<string, unknown>;
  shareUrl: string;
};

export function InvoiceView({ invoiceId }: { invoiceId: string }) {
  const router = useRouter();
  const [data, setData] = useState<{
    invoice: Invoice;
    booking: Booking;
    property: Property;
    shareUrl: string;
  } | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadInvoice() {
      try {
        const response = await fetchJson<InvoiceApiResponse>(`/api/invoices/${invoiceId}`);
        if (cancelled) return;
        setData({
          invoice: normalizeInvoice(response.invoice),
          booking: normalizeBooking({
            ...response.booking,
            propertyName: response.property.name,
            invoiceId: response.invoice.id,
            invoiceNumber: response.invoice.invoiceNumber,
          }),
          property: normalizeProperty(response.property),
          shareUrl: response.shareUrl,
        });
      } catch (error) {
        if (error instanceof ClientApiError && error.status === 401) {
          router.push("/login");
          return;
        }
        if (!cancelled) setError(error instanceof Error ? error.message : "Gagal memuat invoice.");
      }
    }

    loadInvoice();
    return () => {
      cancelled = true;
    };
  }, [invoiceId, router]);

  return (
    <>
      <SectionHeader
        title="Invoice"
        description="Download atau bagikan invoice."
      />
      {error ? <p className="rounded-2xl border border-danger/20 bg-red-50 p-3 text-sm font-semibold text-danger">{error}</p> : null}
      {!data && !error ? <p className="text-sm text-muted-foreground">Memuat invoice...</p> : null}
      {data ? <InvoicePreview {...data} /> : null}
    </>
  );
}
