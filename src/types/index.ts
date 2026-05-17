export type BookingStatus =
  | "pending"
  | "confirmed"
  | "checked_in"
  | "checked_out"
  | "cancelled";

export type PaymentStatus = "unpaid" | "partial" | "paid";

export type PaymentMethod = "cash" | "bank_transfer" | "qris" | "other";

export type PropertyStatus = "active" | "inactive" | "maintenance";

export type Property = {
  id: string;
  name: string;
  address: string | null;
  description: string | null;
  pricePerNight: number;
  maxGuests: number;
  status: PropertyStatus;
};

export type Booking = {
  id: string;
  propertyId: string;
  propertyName: string | null;
  guestName: string;
  guestPhone: string;
  guestEmail?: string | null;
  checkIn: string;
  checkOut: string;
  guestCount: number;
  pricePerNight: number;
  totalNights: number;
  subtotal: number;
  additionalFees: number;
  discount: number;
  totalPrice: number;
  paidAmount: number;
  remainingAmount: number;
  paymentMethod: PaymentMethod | null;
  bookingStatus: BookingStatus;
  paymentStatus: PaymentStatus;
  notes?: string | null;
  invoiceId: string | null;
  invoiceNumber: string | null;
};

export type Invoice = {
  id: string;
  bookingId: string;
  invoiceNumber: string;
  invoiceDate: string;
  pdfUrl: string | null;
};

export type DashboardStats = {
  activeBookings: number;
  todayCheckIns: number;
  todayCheckOuts: number;
  unpaidBookings: number;
  monthlyRevenue: number;
  upcomingBookings: number;
};
