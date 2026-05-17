import { BookingForm } from "@/components/booking/booking-form";
import { SectionHeader } from "@/components/ui/section-header";

export default function NewBookingPage() {
  return (
    <>
      <SectionHeader
        title="Booking Baru"
        description="Isi data tamu dan tanggal menginap."
      />
      <BookingForm />
    </>
  );
}
