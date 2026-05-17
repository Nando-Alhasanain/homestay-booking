import { Suspense } from "react";

import { InvoicesView } from "@/components/invoice/invoices-view";

export default function InvoicesPage() {
  return (
    <Suspense fallback={<p className="text-sm text-muted-foreground">Memuat invoice...</p>}>
      <InvoicesView />
    </Suspense>
  );
}
