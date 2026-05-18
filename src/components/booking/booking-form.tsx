"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { Card, ElevatedCard } from "@/components/ui/card";
import { Field, FieldError, Label } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  ClientApiError,
  fetchJson,
  normalizeBooking,
  normalizeProperty,
} from "@/lib/api-client";
import {
  calculateBooking,
  formatCurrency,
  paymentStatusLabel,
  paymentStatusTone,
} from "@/lib/utils";
import type { Booking, Property } from "@/types";

const bookingSchema = z
  .object({
    guestName: z.string().min(1, "Nama tamu wajib diisi"),
    guestPhone: z.string().min(1, "Nomor HP wajib diisi"),
    guestEmail: z.string().email("Email tidak valid").optional().or(z.literal("")),
    propertyId: z.string().min(1, "Property wajib dipilih"),
    checkIn: z.string().min(1, "Tanggal check-in wajib diisi"),
    checkOut: z.string().min(1, "Tanggal check-out wajib diisi"),
    guestCount: z.coerce.number().min(1, "Jumlah tamu minimal 1"),
    pricePerNight: z.coerce.number().min(0, "Harga tidak boleh negatif"),
    additionalFees: z.coerce.number().min(0, "Biaya tambahan tidak boleh negatif"),
    discount: z.coerce.number().min(0, "Diskon tidak boleh negatif"),
    paidAmount: z.coerce.number().min(0, "Jumlah dibayar tidak boleh negatif"),
    paymentMethod: z.enum(["bank_transfer", "cash", "qris", "other"]),
    bookingStatus: z.enum(["pending", "confirmed", "checked_in", "checked_out", "cancelled"]),
    notes: z.string().optional(),
  })
  .refine((data) => data.checkOut > data.checkIn, {
    message: "Check-out harus setelah check-in",
    path: ["checkOut"],
  });

type BookingFormValues = z.infer<typeof bookingSchema>;

type BookingFormProps = {
  mode?: "create" | "edit";
  bookingId?: string;
  initialBooking?: Booking;
};

const defaultValues: BookingFormValues = {
  guestName: "",
  guestPhone: "",
  guestEmail: "",
  propertyId: "",
  checkIn: "",
  checkOut: "",
  guestCount: 1,
  pricePerNight: 0,
  additionalFees: 0,
  discount: 0,
  paidAmount: 0,
  paymentMethod: "bank_transfer",
  bookingStatus: "confirmed",
  notes: "",
};

function getBookingFormValues(booking?: Booking): BookingFormValues {
  if (!booking) return defaultValues;

  return {
    guestName: booking.guestName,
    guestPhone: booking.guestPhone,
    guestEmail: booking.guestEmail ?? "",
    propertyId: booking.propertyId,
    checkIn: booking.checkIn,
    checkOut: booking.checkOut,
    guestCount: booking.guestCount,
    pricePerNight: booking.pricePerNight,
    additionalFees: booking.additionalFees,
    discount: booking.discount,
    paidAmount: booking.paidAmount,
    paymentMethod: booking.paymentMethod ?? "bank_transfer",
    bookingStatus: booking.bookingStatus,
    notes: booking.notes ?? "",
  };
}

export function BookingForm({ mode = "create", bookingId, initialBooking }: BookingFormProps) {
  const router = useRouter();
  const [toast, setToast] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [properties, setProperties] = useState<Property[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const form = useForm<BookingFormValues>({
    resolver: zodResolver(bookingSchema),
    defaultValues: getBookingFormValues(initialBooking),
    mode: "onBlur",
  });
  const watchedValues = useWatch({ control: form.control, defaultValue: defaultValues });
  const values = { ...defaultValues, ...watchedValues };

  useEffect(() => {
    if (initialBooking) {
      form.reset(getBookingFormValues(initialBooking));
    }
  }, [form, initialBooking]);

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      try {
        const [propertyResponse, bookingResponse] = await Promise.all([
          fetchJson<{ properties: Array<Record<string, unknown>> }>("/api/properties"),
          fetchJson<{ bookings: Array<Record<string, unknown>> }>("/api/bookings"),
        ]);
        if (cancelled) return;

        const normalizedProperties = propertyResponse.properties.map(normalizeProperty);
        setProperties(normalizedProperties);
        setBookings(bookingResponse.bookings.map(normalizeBooking));

        const firstProperty = normalizedProperties[0];
        if (mode === "create" && firstProperty && !form.getValues("propertyId")) {
          form.setValue("propertyId", firstProperty.id);
          form.setValue("pricePerNight", firstProperty.pricePerNight);
          form.setValue("guestCount", firstProperty.maxGuests);
        }
      } catch (error) {
        if (error instanceof ClientApiError && error.status === 401) {
          router.push("/login");
          return;
        }
        setError(error instanceof Error ? error.message : "Gagal memuat data form.");
      }
    }

    loadData();
    return () => {
      cancelled = true;
    };
  }, [form, mode, router]);

  const selectedProperty = properties.find((item) => item.id === values.propertyId);
  const calculation = calculateBooking({
    checkIn: values.checkIn,
    checkOut: values.checkOut,
    pricePerNight: Number(values.pricePerNight || 0),
    additionalFees: Number(values.additionalFees || 0),
    discount: Number(values.discount || 0),
    paidAmount: Number(values.paidAmount || 0),
  });
  const hasConflict = values.checkIn && values.checkOut
    ? bookings.some(
      (booking) =>
        booking.bookingStatus !== "cancelled" &&
        booking.id !== bookingId &&
        booking.propertyId === values.propertyId &&
        booking.checkIn < values.checkOut &&
        booking.checkOut > values.checkIn,
    )
    : false;

  async function onSubmit(input: BookingFormValues) {
    setIsSubmitting(true);
    setError("");

    try {
      const url = mode === "edit" && bookingId ? `/api/bookings/${bookingId}` : "/api/bookings";
      const response = await fetchJson<{ booking: Record<string, unknown> }>(url, {
        method: mode === "edit" ? "PATCH" : "POST",
        body: JSON.stringify(input),
      });
      const booking = normalizeBooking(response.booking);
      setToast(mode === "edit" ? "Booking berhasil diperbarui." : "Booking tersimpan. Invoice PDF otomatis dibuat.");
      window.setTimeout(() => router.push(`/bookings/${booking.id}`), 600);
    } catch (error) {
      if (error instanceof ClientApiError && error.status === 401) {
        router.push("/login");
        return;
      }
      setError(error instanceof Error ? error.message : "Booking gagal disimpan.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="relative">
      <form className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start" onSubmit={form.handleSubmit(onSubmit)}>
        <ElevatedCard className="grid gap-5">
          <FormSection title="Tanggal & properti" description="Pilih homestay, periode menginap, dan jumlah tamu.">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field className="sm:col-span-2">
                <Label htmlFor="propertyId">Properti</Label>
                <Select
                  id="propertyId"
                  {...form.register("propertyId", {
                    onChange: (event) => {
                    const property = properties.find((item) => item.id === event.target.value);
                      if (property) {
                        form.setValue("pricePerNight", property.pricePerNight);
                        form.setValue("guestCount", property.maxGuests);
                      }
                    },
                  })}
                >
                  <option value="">Pilih properti</option>
                  {properties.map((property) => (
                    <option key={property.id} value={property.id}>{property.name}</option>
                  ))}
                </Select>
                {selectedProperty ? <p className="text-xs text-muted-foreground">Kapasitas {selectedProperty.maxGuests} tamu</p> : null}
                {!properties.length ? <FieldError>Belum ada properti aktif. Tambahkan properti dulu.</FieldError> : null}
              </Field>
              <Field>
                <Label htmlFor="checkIn">Check-in</Label>
                <DatePicker
                  value={values.checkIn}
                  placeholder="Pilih tanggal check-in"
                  onChange={(value) => form.setValue("checkIn", value, { shouldDirty: true, shouldValidate: true })}
                />
                {form.formState.errors.checkIn ? <FieldError>{form.formState.errors.checkIn.message}</FieldError> : null}
              </Field>
              <Field>
                <Label htmlFor="checkOut">Check-out</Label>
                <DatePicker
                  value={values.checkOut}
                  placeholder="Pilih tanggal check-out"
                  onChange={(value) => form.setValue("checkOut", value, { shouldDirty: true, shouldValidate: true })}
                />
                {form.formState.errors.checkOut ? <FieldError>{form.formState.errors.checkOut.message}</FieldError> : null}
              </Field>
              <Field>
                <Label htmlFor="guestCount">Jumlah tamu</Label>
                <Input id="guestCount" type="number" min={1} {...form.register("guestCount", { valueAsNumber: true })} />
                {selectedProperty ? <p className="text-xs text-muted-foreground">Default mengikuti kapasitas {selectedProperty.maxGuests} tamu, masih bisa diedit.</p> : null}
              </Field>
            </div>
          </FormSection>

          <FormSection title="Data tamu" description="Informasi kontak untuk komunikasi booking.">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field>
                <Label htmlFor="guestName">Nama tamu</Label>
                <Input id="guestName" placeholder="Contoh: Sari Pratiwi" {...form.register("guestName")} />
                {form.formState.errors.guestName ? <FieldError>{form.formState.errors.guestName.message}</FieldError> : null}
              </Field>
              <Field>
                <Label htmlFor="guestPhone">Nomor HP</Label>
                <Input id="guestPhone" dir="ltr" placeholder="Contoh: 081234567890" {...form.register("guestPhone")} />
                {form.formState.errors.guestPhone ? <FieldError>{form.formState.errors.guestPhone.message}</FieldError> : null}
              </Field>
              <Field className="sm:col-span-2">
                <Label htmlFor="guestEmail">Email (opsional)</Label>
                <Input id="guestEmail" type="email" placeholder="Opsional" {...form.register("guestEmail")} />
                {form.formState.errors.guestEmail ? <FieldError>{form.formState.errors.guestEmail.message}</FieldError> : null}
              </Field>
            </div>
          </FormSection>

          <FormSection title="Harga & pembayaran" description="Atur tagihan, diskon, dan pembayaran awal.">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field>
                <Label htmlFor="pricePerNight">Harga per malam</Label>
                <Input id="pricePerNight" type="number" min={0} {...form.register("pricePerNight", { valueAsNumber: true })} />
              </Field>
              <Field>
                <Label htmlFor="additionalFees">Biaya tambahan</Label>
                <Input id="additionalFees" type="number" min={0} {...form.register("additionalFees", { valueAsNumber: true })} />
              </Field>
              <Field>
                <Label htmlFor="discount">Diskon</Label>
                <Input id="discount" type="number" min={0} {...form.register("discount", { valueAsNumber: true })} />
              </Field>
              <Field>
                <Label htmlFor="paidAmount">Jumlah dibayar</Label>
                <Input id="paidAmount" type="number" min={0} {...form.register("paidAmount", { valueAsNumber: true })} />
              </Field>
              <Field className="sm:col-span-2">
                <Label htmlFor="paymentMethod">Metode pembayaran</Label>
                <Select id="paymentMethod" {...form.register("paymentMethod")}>
                  <option value="bank_transfer">Transfer bank</option>
                  <option value="cash">Tunai</option>
                  <option value="qris">QRIS</option>
                  <option value="other">Lainnya</option>
                </Select>
              </Field>
            </div>
          </FormSection>

          <FormSection title={mode === "edit" ? "Status & catatan" : "Catatan"} description={mode === "edit" ? "Perbarui status booking jika diperlukan." : "Tambahkan informasi khusus untuk booking ini."}>
            <div className="grid gap-3 sm:grid-cols-2">
              {mode === "edit" ? (
                <Field>
                  <Label htmlFor="bookingStatus">Status booking</Label>
                  <Select id="bookingStatus" {...form.register("bookingStatus")}>
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="checked_in">Checked-in</option>
                    <option value="checked_out">Checked-out</option>
                    <option value="cancelled">Cancelled</option>
                  </Select>
                </Field>
              ) : null}
              <Field className={mode === "edit" ? "sm:col-span-2" : "sm:col-span-2"}>
                <Label htmlFor="notes">Catatan</Label>
                <Textarea id="notes" placeholder="Catatan tambahan" {...form.register("notes")} />
              </Field>
            </div>
          </FormSection>
        </ElevatedCard>

        <div className="grid gap-4 lg:sticky lg:top-24">
          <BookingSummary calculation={calculation} />

          {hasConflict ? (
            <p className="rounded-2xl border border-danger/20 bg-red-50 p-3 text-sm font-semibold text-danger">
              Tanggal tersebut sudah terisi. Silakan pilih tanggal lain.
            </p>
          ) : null}

          {error ? (
            <p className="rounded-2xl border border-danger/20 bg-red-50 p-3 text-sm font-semibold text-danger">
              {error}
            </p>
          ) : null}

          <Button type="submit" variant="primary" className="w-full" disabled={isSubmitting || !properties.length}>
            {isSubmitting ? "Menyimpan..." : mode === "edit" ? "Simpan Perubahan" : "Simpan Booking"}
          </Button>
        </div>
      </form>

      {toast ? (
        <div className="fixed bottom-24 right-4 z-50 rounded-[20px] bg-foreground px-4 py-3 text-sm font-bold text-white shadow-panel lg:bottom-6">
          {toast}
        </div>
      ) : null}
    </div>
  );
}

function FormSection({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="grid gap-3 border-b border-border pb-5 last:border-b-0 last:pb-0">
      <div>
        <h2 className="text-lg font-black tracking-[-0.03em]">{title}</h2>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">{description}</p>
      </div>
      {children}
    </section>
  );
}

function BookingSummary({ calculation }: { calculation: ReturnType<typeof calculateBooking> }) {
  return (
    <Card className="grid gap-4 bg-white shadow-panel">
      <div>
        <h2 className="text-[22px] font-black tracking-[-0.03em]">Ringkasan</h2>
        <p className="mt-1 text-sm text-muted-foreground">Total otomatis mengikuti tanggal dan pembayaran.</p>
      </div>
      <div className="grid gap-2 rounded-2xl bg-muted p-4 text-sm">
        <SummaryRow label="Total malam" value={`${calculation.totalNights} malam`} />
        <SummaryRow label="Subtotal" value={formatCurrency(calculation.subtotal)} />
        <SummaryRow label="Total tagihan" value={formatCurrency(calculation.totalPrice)} strong />
        <SummaryRow label="Sisa pembayaran" value={formatCurrency(calculation.remainingAmount)} strong />
        <div className="flex items-center justify-between gap-4 text-muted-foreground">
          <span>Status pembayaran</span>
          <Badge tone={paymentStatusTone(calculation.paymentStatus)}>{paymentStatusLabel(calculation.paymentStatus)}</Badge>
        </div>
      </div>
    </Card>
  );
}

function SummaryRow({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex justify-between gap-4 text-muted-foreground">
      <span>{label}</span>
      <strong className={strong ? "text-foreground" : "text-foreground/80"}>{value}</strong>
    </div>
  );
}
