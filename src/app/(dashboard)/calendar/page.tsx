import { AvailabilityCalendar } from "@/components/calendar/availability-calendar";
import { SectionHeader } from "@/components/ui/section-header";

export default function CalendarPage() {
  return (
    <>
      <SectionHeader
        title="Kalender"
        description="Lihat tanggal kosong dan terisi."
      />
      <AvailabilityCalendar />
    </>
  );
}
