/* eslint-disable jsx-a11y/alt-text -- React PDF Image does not expose an alt prop. */
import { Document, Image, Page, StyleSheet, Text, View } from "@react-pdf/renderer";

import type { BookingRow, InvoiceRow, PropertyRow } from "@/db/schema";
import { formatCurrency, paymentStatusLabel } from "@/lib/utils";

const colors = {
  background: "#f7f7f7",
  foreground: "#212121",
  muted: "#f7f7f7",
  mutedForeground: "#6b6b6b",
  border: "#dedede",
  card: "#ffffff",
  primary: "#ff3860",
  primarySoft: "#fff0f3",
  success: "#146c2e",
  successSoft: "#effaf2",
  warning: "#b06b13",
  warningSoft: "#fff7e8",
  danger: "#c7351d",
  dangerSoft: "#fff1ee",
  borderAccent: "#c0c0c0",
};

const styles = StyleSheet.create({
  page: {
    padding: 26,
    fontSize: 9,
    color: colors.foreground,
    fontFamily: "Helvetica",
    backgroundColor: colors.background,
  },
  watermarkText: {
    position: "absolute",
    top: 398,
    left: 0,
    right: 0,
    textAlign: "center",
    fontSize: 42,
    fontWeight: 700,
    color: colors.primary,
    opacity: 0.045,
  },
  watermarkLogo: {
    position: "absolute",
    top: 246,
    left: 198,
    width: 200,
    height: 200,
    opacity: 0.035,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
    padding: 13,
    borderRadius: 8,
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    borderRightWidth: 1,
    borderRightColor: colors.border,
    borderBottomWidth: 2.5,
    borderBottomColor: colors.borderAccent,
    borderLeftWidth: 5,
    borderLeftColor: colors.primary,
  },
  brandRow: { flexDirection: "row", alignItems: "center" },
  logo: { width: 40, height: 40, marginRight: 10, borderRadius: 999 },
  brandName: { fontSize: 14, fontWeight: 700, marginBottom: 3, color: colors.foreground },
  brandMeta: { fontSize: 8, color: colors.mutedForeground, maxWidth: 230, lineHeight: 1.25 },
  titleBlock: { alignItems: "flex-end" },
  title: { fontSize: 24, fontWeight: 700, marginBottom: 4, color: colors.foreground },
  invoiceNumber: { fontSize: 10, color: colors.primary, fontWeight: 700, marginBottom: 3 },
  invoiceDate: { fontSize: 8, color: colors.mutedForeground },
  summaryCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
    padding: 12,
    borderRadius: 8,
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    borderRightWidth: 1,
    borderRightColor: colors.border,
    borderBottomWidth: 2.5,
    borderBottomColor: colors.borderAccent,
    borderLeftWidth: 1,
    borderLeftColor: colors.border,
  },
  summaryLabel: { color: colors.mutedForeground, marginBottom: 4, fontSize: 8 },
  summaryValue: { fontSize: 16, fontWeight: 700, color: colors.primary },
  statusPill: {
    alignSelf: "flex-start",
    paddingVertical: 4,
    paddingHorizontal: 9,
    borderRadius: 999,
    fontWeight: 700,
    fontSize: 8,
  },
  statusPaid: {
    backgroundColor: colors.successSoft,
    color: colors.success,
  },
  statusPartial: {
    backgroundColor: colors.warningSoft,
    color: colors.warning,
  },
  statusUnpaid: {
    backgroundColor: colors.dangerSoft,
    color: colors.danger,
  },
  columns: { flexDirection: "row", marginBottom: 10 },
  column: {
    flex: 1,
    padding: 11,
    borderRadius: 8,
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    borderRightWidth: 1,
    borderRightColor: colors.border,
    borderBottomWidth: 2.5,
    borderBottomColor: colors.borderAccent,
    borderLeftWidth: 1,
    borderLeftColor: colors.border,
  },
  columnSpacing: { marginRight: 10 },
  section: {
    marginBottom: 10,
    padding: 11,
    borderRadius: 8,
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    borderRightWidth: 1,
    borderRightColor: colors.border,
    borderBottomWidth: 2.5,
    borderBottomColor: colors.borderAccent,
    borderLeftWidth: 1,
    borderLeftColor: colors.border,
  },
  sectionTitle: { fontSize: 10, fontWeight: 700, color: colors.foreground, marginBottom: 5 },
  row: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 4.5, borderBottom: `1px solid ${colors.border}` },
  rowLast: { borderBottom: `0px solid ${colors.card}` },
  label: { color: colors.mutedForeground, maxWidth: 170 },
  value: { fontWeight: 700, textAlign: "right", maxWidth: 280 },
  totalRow: { marginTop: 5, padding: 8, borderRadius: 12, backgroundColor: colors.primarySoft, borderBottom: `0px solid ${colors.card}` },
  total: { fontSize: 12, fontWeight: 700, color: colors.primary },
  footer: { marginTop: 2, paddingTop: 8, borderTop: `1px solid ${colors.border}`, color: colors.mutedForeground, fontSize: 8, lineHeight: 1.35 },
});

type InvoiceDocumentProps = {
  booking: BookingRow;
  property: PropertyRow;
  invoice: InvoiceRow;
  logoSrc: string;
};

export function InvoiceDocument({ booking, property, invoice, logoSrc }: InvoiceDocumentProps) {
  const paymentStatus = booking.paymentStatus as "unpaid" | "partial" | "paid";
  const paymentLabel = paymentStatusLabel(paymentStatus);
  const statusStyle = getPaymentStatusStyle(paymentStatus);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Image src={logoSrc} style={styles.watermarkLogo} />
        <Text style={styles.watermarkText}>HOMESTAY BOOKING</Text>

        <View style={styles.header}>
          <View style={styles.brandRow}>
            <Image src={logoSrc} style={styles.logo} />
            <View>
              <Text style={styles.brandName}>Homestay Booking</Text>
              <Text style={styles.brandMeta}>{property.name}</Text>
              <Text style={styles.brandMeta}>{property.address ?? "-"}</Text>
            </View>
          </View>
          <View style={styles.titleBlock}>
            <Text style={styles.title}>Invoice</Text>
            <Text style={styles.invoiceNumber}>{invoice.invoiceNumber}</Text>
            <Text style={styles.invoiceDate}>Tanggal invoice: {invoice.invoiceDate}</Text>
          </View>
        </View>

        <View style={styles.summaryCard}>
          <View>
            <Text style={styles.summaryLabel}>Total tagihan</Text>
            <Text style={styles.summaryValue}>{formatCurrency(Number(booking.totalPrice))}</Text>
          </View>
          <View>
            <Text style={styles.summaryLabel}>Status pembayaran</Text>
            <Text style={statusStyle}>{paymentLabel}</Text>
          </View>
        </View>

        <View style={styles.columns}>
          <View style={[styles.column, styles.columnSpacing]}>
            <Text style={styles.sectionTitle}>Data Tamu</Text>
            <InvoiceRow label="Nama tamu" value={booking.guestName} />
            <InvoiceRow label="Nomor HP" value={booking.guestPhone} />
            <InvoiceRow label="Email" value={booking.guestEmail ?? "-"} last />
          </View>
          <View style={styles.column}>
            <Text style={styles.sectionTitle}>Detail Menginap</Text>
            <InvoiceRow label="Check-in" value={booking.checkIn} />
            <InvoiceRow label="Check-out" value={booking.checkOut} />
            <InvoiceRow label="Total malam" value={`${booking.totalNights} malam`} />
            <InvoiceRow label="Jumlah tamu" value={`${booking.guestCount} tamu`} last />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Rincian Pembayaran</Text>
          <InvoiceRow label="Harga per malam" value={formatCurrency(Number(booking.pricePerNight))} />
          <InvoiceRow label="Subtotal" value={formatCurrency(Number(booking.subtotal))} />
          <InvoiceRow label="Biaya tambahan" value={formatCurrency(Number(booking.additionalFees))} />
          <InvoiceRow label="Diskon" value={formatCurrency(Number(booking.discount))} />
          <InvoiceRow label="Total tagihan" value={formatCurrency(Number(booking.totalPrice))} strong />
          <InvoiceRow label="Jumlah dibayar" value={formatCurrency(Number(booking.paidAmount))} />
          <InvoiceRow label="Sisa pembayaran" value={formatCurrency(Number(booking.remainingAmount))} strong last />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informasi Tambahan</Text>
          <InvoiceRow label="Metode pembayaran" value={booking.paymentMethod ?? "-"} />
          <InvoiceRow label="Catatan" value={booking.notes ?? "-"} last />
        </View>

        <View style={styles.footer}>
          <Text>Terima kasih sudah melakukan pemesanan. Invoice ini dibuat otomatis oleh sistem Homestay Booking.</Text>
          <Text>Mohon simpan invoice ini sebagai bukti administrasi pemesanan.</Text>
        </View>
      </Page>
    </Document>
  );
}

function getPaymentStatusStyle(status: "unpaid" | "partial" | "paid") {
  if (status === "paid") return [styles.statusPill, styles.statusPaid];
  if (status === "partial") return [styles.statusPill, styles.statusPartial];
  return [styles.statusPill, styles.statusUnpaid];
}

function InvoiceRow({ label, value, strong = false, last = false }: { label: string; value: string; strong?: boolean; last?: boolean }) {
  const rowStyle = strong && last
    ? [styles.row, styles.totalRow, styles.rowLast]
    : strong
      ? [styles.row, styles.totalRow]
      : last
        ? [styles.row, styles.rowLast]
        : styles.row;

  return (
    <View style={rowStyle}>
      <Text style={styles.label}>{label}</Text>
      <Text style={strong ? [styles.value, styles.total] : styles.value}>{value}</Text>
    </View>
  );
}
