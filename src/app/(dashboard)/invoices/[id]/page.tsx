import { InvoiceView } from "@/components/invoice/invoice-view";

export default async function InvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <InvoiceView invoiceId={id} />;
}
