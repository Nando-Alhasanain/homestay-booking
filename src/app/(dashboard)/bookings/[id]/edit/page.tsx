import { BookingEditView } from "@/components/booking/booking-edit-view";

export default async function EditBookingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <BookingEditView bookingId={id} />;
}
