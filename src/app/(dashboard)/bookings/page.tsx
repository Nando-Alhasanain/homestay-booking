import { Suspense } from "react";

import { BookingsView } from "@/components/booking/bookings-view";

export default function BookingsPage() {
  return (
    <Suspense fallback={<p className="text-sm text-muted-foreground">Memuat booking...</p>}>
      <BookingsView />
    </Suspense>
  );
}
