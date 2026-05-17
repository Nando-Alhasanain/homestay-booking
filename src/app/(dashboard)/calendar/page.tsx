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
        action={
          <Button asChild variant="primary">
            <Link href="/bookings/new"><Plus className="h-4 w-4" /> Tambah dari tanggal</Link>
          </Button>
        }
      />
      <AvailabilityCalendar />
    </>
  );
}
