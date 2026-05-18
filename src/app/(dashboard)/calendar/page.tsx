import Link from "next/link";
import { Plus } from "lucide-react";

import { AvailabilityCalendar } from "@/components/calendar/availability-calendar";
import { Button } from "@/components/ui/button";
import { SectionHeader } from "@/components/ui/section-header";

export default function CalendarPage() {
  return (
    <>
      <SectionHeader
        title="Kalender"
        description="Lihat tanggal kosong dan terisi."
      />
      <AvailabilityCalendar />
      <Button asChild variant="primary" className="fixed bottom-24 right-4 z-50 shadow-panel lg:hidden">
        <Link href="/bookings/new"><Plus className="h-4 w-4" /> Booking</Link>
      </Button>
    </>
  );
}
