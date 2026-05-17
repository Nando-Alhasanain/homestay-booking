
# PRD: Homestay Booking Management Web App

## 1. Ringkasan Produk

Homestay Booking Management Web App adalah aplikasi web internal untuk membantu pengelola homestay mencatat, mengelola, dan memantau booking secara online.

Aplikasi ini dibuat sebagai responsive web app dengan pendekatan mobile-first, sehingga nyaman digunakan dari HP Android melalui browser. Aplikasi juga dapat dikembangkan sebagai PWA agar bisa dipasang ke homescreen seperti aplikasi Android.

Aplikasi ini digunakan oleh pengelola homestay, bukan oleh tamu umum.

Aplikasi ini tidak membutuhkan integrasi dengan:
- Airbnb
- Agoda
- Booking.com
- Traveloka
- Google Calendar
- OTA/channel manager lainnya

Booking dicatat manual oleh admin berdasarkan pesanan dari WhatsApp, telepon, media sosial, atau kanal lain.

---

## 2. Tujuan Produk

Tujuan utama aplikasi:

1. Membantu pengelola mencatat booking homestay secara rapi.
2. Menghindari double booking pada tanggal yang sama.
3. Memudahkan 2 pengelola mengakses data yang sama secara online.
4. Menampilkan ketersediaan homestay melalui kalender.
5. Menghasilkan invoice otomatis dalam bentuk PDF.
6. Memudahkan invoice dibagikan ke tamu melalui WhatsApp atau download PDF.
7. Memberikan dashboard sederhana untuk melihat aktivitas booking.

---

## 3. Target Pengguna

### Admin / Pengelola Homestay

Jumlah awal pengguna:

```text
2 orang pengelola
````

Kemampuan pengguna:

```text
- Login
- Logout
- Melihat dashboard
- Mengelola data homestay/property
- Membuat booking baru
- Mengubah booking
- Membatalkan booking
- Menghapus booking jika diperlukan
- Melihat kalender ketersediaan
- Melihat status pembayaran
- Generate invoice PDF
- Download invoice
- Membagikan invoice ke tamu
```

Untuk MVP, tidak perlu sistem role kompleks seperti owner, staff, super admin, dan sebagainya.

---

## 4. Platform

### Platform Utama

```text
Responsive Web App
```

### Target Device

```text
Android phone browser
Desktop browser
Tablet browser
```

### Optional

```text
PWA installable app
```

Dengan PWA, aplikasi bisa:

* dipasang ke homescreen Android
* memiliki icon aplikasi
* tampil lebih mirip aplikasi mobile
* berjalan fullscreen jika dikonfigurasi

---

## 5. Tech Stack Final

### Frontend

```text
Next.js App Router
TypeScript
Tailwind CSS
shadcn/ui
React Hook Form
Zod
Zustand
date-fns
lucide-react
```

### Backend

```text
Next.js Route Handler / Server Actions
TypeScript
Drizzle ORM
Zod Validation
JWT / Better Auth / Auth.js
bcrypt
```

### Database

```text
PostgreSQL
Hosted on Coolify
```

### ORM

```text
Drizzle ORM
```

### Calendar

Pilihan library:

```text
react-big-calendar
```

atau:

```text
FullCalendar
```

Untuk mobile-first, bisa juga membuat kalender custom sederhana berbasis grid bulanan agar lebih ringan.

### Invoice PDF

```text
@react-pdf/renderer
```

Alternatif:

```text
PDFKit
```

Rekomendasi MVP:

```text
@react-pdf/renderer
```

### Deployment

```text
Coolify
```

### Storage Invoice

```text
Coolify persistent volume
```

Future option:

```text
S3-compatible storage
```

---

## 6. Arsitektur Sistem

Aplikasi dibuat sebagai fullstack Next.js app.

```text
User Browser
   ↓
Next.js Web App
   ↓
Next.js API / Server Actions
   ↓
Drizzle ORM
   ↓
PostgreSQL on Coolify
```

Database PostgreSQL tidak boleh dibuka langsung ke publik.

Semua akses data dilakukan melalui backend Next.js.

---

## 7. Scope MVP

Fitur wajib MVP:

```text
- Login admin
- Logout admin
- Dashboard ringkas
- Manajemen data homestay/property
- Manajemen booking
- Kalender ketersediaan
- Pencegahan double booking
- Payment tracking
- Generate invoice PDF otomatis
- Download invoice PDF
- Share invoice melalui WhatsApp link
- Data online bisa diakses oleh 2 pengelola
- Responsive mobile-first UI
```

Fitur tidak masuk MVP:

```text
- Integrasi OTA
- Integrasi Google Calendar
- Payment gateway
- Push notification
- WhatsApp API otomatis
- Multi-role advanced permission
- Guest-facing booking page
- Laporan keuangan advanced
- Expense tracking
- Multi-property advanced management
```

---

## 8. Konsep Booking

Booking berdasarkan:

```text
Satu rumah penuh / satu property
```

Bukan berdasarkan kamar.

Artinya:

```text
- Tidak ada room booking.
- Tidak ada inventory per kamar.
- Satu booking berarti menyewa seluruh homestay.
- Kalender hanya menampilkan apakah homestay tersedia atau sudah terisi.
- Double booking dicegah berdasarkan overlap tanggal.
```

Walaupun saat ini hanya ada satu homestay, tetap gunakan tabel `properties` agar sistem mudah dikembangkan jika nanti ada lebih dari satu homestay.

---

## 9. Data Model

## 9.1 users

Menyimpan data admin.

```text
users
- id
- name
- email
- password_hash
- created_at
- updated_at
```

## 9.2 properties

Menyimpan data homestay.

```text
properties
- id
- name
- address
- description
- price_per_night
- max_guests
- status
- created_at
- updated_at
```

Status property:

```text
active
inactive
maintenance
```

## 9.3 bookings

Menyimpan data booking.

```text
bookings
- id
- property_id
- guest_name
- guest_phone
- guest_email
- check_in
- check_out
- guest_count
- price_per_night
- total_nights
- subtotal
- additional_fees
- discount
- total_price
- paid_amount
- remaining_amount
- payment_method
- booking_status
- payment_status
- notes
- created_by
- created_at
- updated_at
```

Booking status:

```text
pending
confirmed
checked_in
checked_out
cancelled
```

Payment status:

```text
unpaid
partial
paid
```

Payment method:

```text
cash
bank_transfer
qris
other
```

## 9.4 invoices

Menyimpan data invoice.

```text
invoices
- id
- booking_id
- invoice_number
- invoice_date
- pdf_url
- created_at
- updated_at
```

---

## 10. Business Rules

## 10.1 Perhitungan Jumlah Malam

Jumlah malam dihitung dari:

```text
check_out - check_in
```

Contoh:

```text
Check-in: 2026-05-14
Check-out: 2026-05-16
Total nights: 2
```

Tanggal check-out tidak dihitung sebagai malam menginap.

---

## 10.2 Perhitungan Harga

Formula:

```text
subtotal = price_per_night × total_nights
total_price = subtotal + additional_fees - discount
remaining_amount = total_price - paid_amount
```

---

## 10.3 Status Pembayaran

Jika:

```text
paid_amount = 0
```

maka:

```text
payment_status = unpaid
```

Jika:

```text
paid_amount > 0 dan paid_amount < total_price
```

maka:

```text
payment_status = partial
```

Jika:

```text
paid_amount >= total_price
```

maka:

```text
payment_status = paid
```

---

## 10.4 Pencegahan Double Booking

Sistem harus menolak booking baru jika ada booking lain yang overlap pada property yang sama.

Logic overlap:

```text
existing.check_in < new.check_out
AND
existing.check_out > new.check_in
AND
existing.booking_status != cancelled
AND
existing.property_id = new.property_id
```

Jika konflik ditemukan, backend harus mengembalikan error:

```text
Property is already booked for selected dates.
```

Validasi konflik wajib dilakukan di backend.

Frontend boleh melakukan pengecekan tambahan untuk UX, tetapi keputusan final tetap dari backend.

---

## 10.5 Booking Cancelled

Booking dengan status:

```text
cancelled
```

tidak dihitung sebagai tanggal terisi.

---

## 10.6 Invoice Generation

Invoice dibuat:

```text
- Otomatis setelah booking berhasil dibuat
- Bisa dibuat ulang secara manual dari detail booking
```

Invoice harus mengambil data terbaru dari booking.

---

## 11. Invoice

## 11.1 Format Nomor Invoice

Format:

```text
INV-YYYYMMDD-XXXX
```

Contoh:

```text
INV-20260514-0001
```

Keterangan:

```text
YYYYMMDD = tanggal invoice dibuat
XXXX = nomor urut
```

---

## 11.2 Isi Invoice

Invoice PDF harus memuat:

```text
- Nama homestay
- Alamat homestay
- Nomor invoice
- Tanggal invoice
- Nama tamu
- Nomor HP tamu
- Email tamu jika ada
- Tanggal check-in
- Tanggal check-out
- Total malam
- Jumlah tamu
- Harga per malam
- Subtotal
- Biaya tambahan
- Diskon
- Total tagihan
- Jumlah dibayar
- Sisa pembayaran
- Status pembayaran
- Metode pembayaran
- Catatan booking
```

---

## 11.3 File Invoice

Invoice disimpan sebagai PDF di persistent volume.

Contoh path:

```text
/storage/invoices/INV-20260514-0001.pdf
```

Database menyimpan:

```text
pdf_url
```

---

## 11.4 Download dan Share Invoice

Admin dapat:

```text
- Download invoice PDF
- Membuka invoice di browser
- Membagikan link invoice ke WhatsApp
```

Format link WhatsApp:

```text
https://wa.me/628xxxxxxxxxx?text=Halo%2C%20berikut%20invoice%20booking%20homestay%20Anda%3A%20{invoice_url}
```

---

## 12. API Routes

## 12.1 Auth

### POST /api/auth/login

Request:

```json
{
  "email": "admin@example.com",
  "password": "password"
}
```

Response:

```json
{
  "token": "jwt_token",
  "user": {
    "id": "user_id",
    "name": "Admin",
    "email": "admin@example.com"
  }
}
```

### GET /api/auth/me

Mengambil data user login.

### POST /api/auth/logout

Logout dari sisi client.

---

## 12.2 Properties

### GET /api/properties

Mengambil daftar property.

### GET /api/properties/:id

Mengambil detail property.

### POST /api/properties

Membuat property baru.

### PATCH /api/properties/:id

Mengubah data property.

### DELETE /api/properties/:id

Untuk MVP, lebih baik soft delete dengan mengubah status menjadi:

```text
inactive
```

---

## 12.3 Bookings

### GET /api/bookings

Query optional:

```text
start_date
end_date
status
payment_status
search
```

### GET /api/bookings/:id

Mengambil detail booking.

### POST /api/bookings

Membuat booking baru.

Backend harus:

```text
1. Validasi input
2. Cek konflik tanggal
3. Hitung total malam
4. Hitung subtotal
5. Hitung total harga
6. Hitung sisa pembayaran
7. Tentukan payment status
8. Simpan booking
9. Generate invoice otomatis
10. Return booking dan invoice
```

### PATCH /api/bookings/:id

Mengubah booking.

Jika field berikut berubah:

```text
property_id
check_in
check_out
```

backend harus cek ulang konflik booking.

### DELETE /api/bookings/:id

Untuk MVP, lebih baik mengubah status menjadi:

```text
cancelled
```

daripada hard delete.

---

## 12.4 Calendar

### GET /api/calendar

Query:

```text
property_id
month
year
```

Response:

```json
{
  "booked_dates": [
    {
      "date": "2026-05-14",
      "booking_id": "booking_id",
      "guest_name": "Guest Name",
      "status": "confirmed"
    }
  ]
}
```

---

## 12.5 Invoices

### POST /api/invoices/generate/:bookingId

Generate atau regenerate invoice PDF.

### GET /api/invoices/:id

Mengambil data invoice.

### GET /api/invoices/:id/download

Download invoice PDF.

---

## 12.6 Dashboard

### GET /api/dashboard/stats

Response:

```json
{
  "active_bookings": 10,
  "today_check_ins": 2,
  "today_check_outs": 1,
  "upcoming_bookings": 5,
  "unpaid_bookings": 3,
  "monthly_revenue": 5000000
}
```

---

## 13. Halaman Aplikasi

## 13.1 Login Page

Fungsi:

```text
- Input email
- Input password
- Button login
- Error message jika login gagal
```

---

## 13.2 Dashboard Page

Menampilkan:

```text
- Greeting admin
- Total booking aktif
- Check-in hari ini
- Check-out hari ini
- Booking belum lunas
- Revenue bulan ini
- Booking terdekat
- Quick action tambah booking
```

---

## 13.3 Booking List Page

Menampilkan daftar booking.

Fitur:

```text
- Search berdasarkan nama tamu
- Filter status booking
- Filter status pembayaran
- Filter tanggal
- Klik booking untuk detail
```

Card booking berisi:

```text
- Nama tamu
- Tanggal check-in dan check-out
- Total harga
- Status booking
- Status pembayaran
```

---

## 13.4 Booking Detail Page

Menampilkan:

```text
- Data tamu
- Tanggal booking
- Detail harga
- Data pembayaran
- Status booking
- Catatan
- Informasi invoice
```

Action:

```text
- Edit booking
- Cancel booking
- Generate ulang invoice
- Download invoice
- Share invoice via WhatsApp
- Delete booking jika diperlukan
```

---

## 13.5 Create Booking Page

Form input:

```text
- Nama tamu
- Nomor HP
- Email optional
- Property
- Check-in
- Check-out
- Jumlah tamu
- Harga per malam
- Biaya tambahan
- Diskon
- Jumlah dibayar
- Metode pembayaran
- Status booking
- Catatan
```

Sistem otomatis menghitung:

```text
- Total malam
- Subtotal
- Total tagihan
- Sisa pembayaran
- Status pembayaran
```

---

## 13.6 Edit Booking Page

Sama seperti Create Booking Page, tetapi data sudah terisi.

---

## 13.7 Calendar Page

Menampilkan kalender bulanan.

Fitur:

```text
- Tanggal terisi ditandai
- Tanggal kosong terlihat normal
- Klik tanggal untuk melihat detail booking
- Navigasi bulan sebelumnya dan berikutnya
```

---

## 13.8 Property Page

Menampilkan data homestay.

Fitur:

```text
- Lihat data property
- Edit nama homestay
- Edit alamat
- Edit deskripsi
- Edit harga per malam
- Edit kapasitas tamu
- Edit status
```

---

## 13.9 Invoice Page

Menampilkan:

```text
- Nomor invoice
- Tanggal invoice
- Status pembayaran
- Preview informasi invoice
- Button download
- Button share WhatsApp
```

---

## 13.10 Settings Page

Menampilkan:

```text
- Informasi akun
- Logout
- App version
```

---

## 14. UI/UX Direction

## 14.1 Gaya Visual

Aplikasi harus memiliki gaya:

```text
modern
minimalis
bersih
mobile-first
mudah digunakan
```

Referensi feel:

```text
Airbnb
Notion
Linear
Stripe Dashboard mobile
```

---

## 14.2 Warna

Gunakan warna netral dengan satu warna utama.

Contoh palette:

```text
Primary: #2563EB
Background: #F8FAFC
Card: #FFFFFF
Text: #0F172A
Subtext: #64748B
Success: #16A34A
Warning: #F59E0B
Danger: #DC2626
Border: #E2E8F0
```

---

## 14.3 Layout

Gunakan:

```text
- Mobile-first layout
- Max width untuk mobile experience
- Card-based layout
- Rounded corners
- Soft shadow
- Banyak whitespace
- Bottom navigation untuk mobile
- Sidebar/top navigation untuk desktop jika diperlukan
```

Contoh wrapper utama:

```text
max-width: 480px;
margin: 0 auto;
```

Untuk desktop, bisa tetap menampilkan layout centered agar app terasa seperti mobile admin app.

---

## 14.4 Navigation

Mobile navigation:

```text
Dashboard
Bookings
Calendar
Settings
```

Gunakan bottom navigation pada layar mobile.

Untuk desktop, boleh tetap gunakan top nav sederhana.

---

## 14.5 Komponen UI

Gunakan shadcn/ui untuk:

```text
- Button
- Card
- Dialog
- Dropdown
- Input
- Select
- Badge
- Calendar
- Sheet
- Tabs
- Toast
```

Gunakan lucide-react untuk icon.

---

## 15. Validasi Data

## 15.1 Booking Validation

Frontend dan backend wajib memvalidasi:

```text
guest_name wajib
guest_phone wajib
property_id wajib
check_in wajib
check_out wajib
check_out harus setelah check_in
guest_count minimal 1
price_per_night tidak boleh negatif
additional_fees tidak boleh negatif
discount tidak boleh negatif
paid_amount tidak boleh negatif
```

Optional rule:

```text
paid_amount tidak boleh lebih dari total_price
```

---

## 15.2 Auth Validation

```text
email wajib valid
password wajib
```

---

## 15.3 Property Validation

```text
name wajib
price_per_night wajib
max_guests minimal 1
status wajib
```

---

## 16. Security Requirements

## 16.1 Password

Password harus disimpan menggunakan bcrypt.

```text
password_hash
```

Jangan simpan password plain text.

---

## 16.2 Authentication

Gunakan salah satu:

```text
Better Auth
Auth.js
JWT custom
```

Rekomendasi untuk MVP:

```text
JWT custom + httpOnly cookie
```

Token sebaiknya disimpan di httpOnly cookie, bukan localStorage.

---

## 16.3 API Protection

Semua route selain login harus membutuhkan authentication.

---

## 16.4 Database

PostgreSQL tidak boleh diekspos langsung ke publik.

Akses database hanya melalui Next.js backend.

---

## 17. Error Handling

Backend harus mengembalikan error yang jelas.

Contoh:

```json
{
  "error": "BOOKING_CONFLICT",
  "message": "Property is already booked for selected dates."
}
```

Error code yang disarankan:

```text
VALIDATION_ERROR
AUTH_INVALID_CREDENTIALS
AUTH_UNAUTHORIZED
BOOKING_CONFLICT
BOOKING_NOT_FOUND
PROPERTY_NOT_FOUND
INVOICE_GENERATION_FAILED
INTERNAL_SERVER_ERROR
```

Frontend harus menampilkan error dengan bahasa yang mudah dipahami.

Contoh:

```text
Tanggal tersebut sudah terisi. Silakan pilih tanggal lain.
```

---

## 18. PWA Requirements

Aplikasi dapat dikembangkan sebagai PWA.

Fitur PWA:

```text
- Web app manifest
- App icon
- Theme color
- Installable on Android
- Mobile fullscreen display
```

Minimal manifest:

```json
{
  "name": "Homestay Booking",
  "short_name": "Homestay",
  "start_url": "/dashboard",
  "display": "standalone",
  "background_color": "#F8FAFC",
  "theme_color": "#2563EB",
  "icons": [
    {
      "src": "/icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

Offline mode tidak wajib untuk MVP.

---

## 19. Development Phases

## Phase 1: Project Setup

Tasks:

```text
- Setup Next.js App Router
- Setup TypeScript
- Setup Tailwind CSS
- Setup shadcn/ui
- Setup Drizzle ORM
- Setup PostgreSQL local/dev
- Setup environment variables
- Setup base layout
- Setup mobile-first UI shell
```

---

## Phase 2: Database & Auth

Tasks:

```text
- Create database schema
- Create migrations
- Seed initial admin user
- Implement login
- Implement logout
- Implement auth middleware
- Protect dashboard routes
```

---

## Phase 3: Property Management

Tasks:

```text
- Create property table
- Create property queries
- Create property page
- Create edit property form
```

---

## Phase 4: Booking Management

Tasks:

```text
- Create booking table
- Create booking list page
- Create booking detail page
- Create booking form
- Implement booking calculation
- Implement booking conflict prevention
- Implement edit booking
- Implement cancel booking
```

---

## Phase 5: Calendar

Tasks:

```text
- Create calendar query
- Show monthly calendar
- Mark booked dates
- Show booking detail when date clicked
```

---

## Phase 6: Invoice

Tasks:

```text
- Create invoice table
- Generate invoice number
- Generate PDF invoice
- Save PDF to persistent volume
- Create download invoice route
- Add WhatsApp share link
```

---

## Phase 7: UI Polish & Testing

Tasks:

```text
- Improve spacing
- Improve typography
- Improve card layout
- Add loading state
- Add empty state
- Add error state
- Test on Android browser
- Test PWA install
- Test with 2 admin accounts
- Test booking conflict
- Test invoice generation
```

---

## 20. Recommended Folder Structure

```text
src/
├── app/
│   ├── (auth)/
│   │   └── login/
│   ├── (dashboard)/
│   │   ├── dashboard/
│   │   ├── bookings/
│   │   ├── calendar/
│   │   ├── property/
│   │   ├── invoices/
│   │   └── settings/
│   └── api/
│       ├── auth/
│       ├── bookings/
│       ├── calendar/
│       ├── dashboard/
│       ├── invoices/
│       └── properties/
├── components/
│   ├── ui/
│   ├── layout/
│   ├── booking/
│   ├── calendar/
│   ├── property/
│   └── invoice/
├── db/
│   ├── schema.ts
│   ├── index.ts
│   └── migrations/
├── lib/
│   ├── auth.ts
│   ├── env.ts
│   ├── password.ts
│   ├── jwt.ts
│   ├── date.ts
│   ├── money.ts
│   └── invoice-number.ts
├── services/
│   ├── booking.service.ts
│   ├── property.service.ts
│   ├── invoice.service.ts
│   └── dashboard.service.ts
├── validators/
│   ├── auth.validator.ts
│   ├── booking.validator.ts
│   └── property.validator.ts
├── types/
└── styles/
```

---

## 21. Drizzle Schema Draft

```ts
import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  integer,
  numeric,
  date,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const properties = pgTable("properties", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 150 }).notNull(),
  address: text("address"),
  description: text("description"),
  pricePerNight: numeric("price_per_night", {
    precision: 12,
    scale: 2,
  }).notNull(),
  maxGuests: integer("max_guests").notNull(),
  status: varchar("status", { length: 30 }).notNull().default("active"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const bookings = pgTable("bookings", {
  id: uuid("id").defaultRandom().primaryKey(),

  propertyId: uuid("property_id")
    .notNull()
    .references(() => properties.id),

  guestName: varchar("guest_name", { length: 150 }).notNull(),
  guestPhone: varchar("guest_phone", { length: 50 }).notNull(),
  guestEmail: varchar("guest_email", { length: 255 }),

  checkIn: date("check_in").notNull(),
  checkOut: date("check_out").notNull(),
  guestCount: integer("guest_count").notNull(),

  pricePerNight: numeric("price_per_night", {
    precision: 12,
    scale: 2,
  }).notNull(),

  totalNights: integer("total_nights").notNull(),

  subtotal: numeric("subtotal", {
    precision: 12,
    scale: 2,
  }).notNull(),

  additionalFees: numeric("additional_fees", {
    precision: 12,
    scale: 2,
  }).notNull().default("0"),

  discount: numeric("discount", {
    precision: 12,
    scale: 2,
  }).notNull().default("0"),

  totalPrice: numeric("total_price", {
    precision: 12,
    scale: 2,
  }).notNull(),

  paidAmount: numeric("paid_amount", {
    precision: 12,
    scale: 2,
  }).notNull().default("0"),

  remainingAmount: numeric("remaining_amount", {
    precision: 12,
    scale: 2,
  }).notNull(),

  paymentMethod: varchar("payment_method", { length: 50 }),
  bookingStatus: varchar("booking_status", { length: 50 }).notNull().default("pending"),
  paymentStatus: varchar("payment_status", { length: 50 }).notNull().default("unpaid"),

  notes: text("notes"),

  createdBy: uuid("created_by").references(() => users.id),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const invoices = pgTable("invoices", {
  id: uuid("id").defaultRandom().primaryKey(),

  bookingId: uuid("booking_id")
    .notNull()
    .references(() => bookings.id),

  invoiceNumber: varchar("invoice_number", { length: 100 }).notNull().unique(),
  invoiceDate: date("invoice_date").notNull(),
  pdfUrl: text("pdf_url"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
```

---

## 22. Environment Variables

```env
DATABASE_URL=
JWT_SECRET=
JWT_EXPIRES_IN=
INVOICE_STORAGE_PATH=
NEXT_PUBLIC_APP_URL=
```

Contoh:

```env
DATABASE_URL=postgresql://user:password@host:5432/homestay_db
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d
INVOICE_STORAGE_PATH=/app/storage/invoices
NEXT_PUBLIC_APP_URL=https://homestay.yourdomain.com
```

---

## 23. AI Agent Instructions

Gunakan instruksi berikut untuk coding agent.

```text
Build a fullstack Next.js web application for internal homestay booking management.

Use Next.js App Router with TypeScript.

Use PostgreSQL as the database.

Use Drizzle ORM for database schema, migration, and queries.

Use Tailwind CSS and shadcn/ui for UI.

Use React Hook Form and Zod for form validation.

Use JWT authentication with httpOnly cookie.

Use bcrypt for password hashing.

The app must be mobile-first and responsive.

The app should feel like a modern minimal mobile admin app.

The booking model is property-based, not room-based.

One booking reserves the entire homestay/property.

Do not implement room-based booking.

Do not implement OTA integration.

Do not implement Google Calendar integration.

Do not implement payment gateway.

Create automatic invoice PDF generation after booking creation.

Use @react-pdf/renderer for invoice PDF generation.

Store generated invoices in persistent storage.

Add download invoice feature.

Add WhatsApp share link for invoice.

Prevent double booking on the backend.

Use clear error handling.

Keep the architecture simple, clean, and production-ready.
```

---

## 24. UI Agent Instructions

```text
Design the UI as mobile-first.

Use a max-width mobile container for the main app experience.

Use card-based layout.

Use rounded corners.

Use soft shadows.

Use neutral background.

Use one primary color.

Use clean typography.

Use bottom navigation on mobile.

Avoid dense desktop-style tables.

Avoid too many colors.

Avoid unnecessary gradients.

Prioritize fast data entry.

Prioritize readability on Android phone screens.

Use shadcn/ui components whenever possible.
```

---

## 25. Business Logic Agent Instructions

```text
Booking conflict logic:

existing.check_in < new.check_out
AND existing.check_out > new.check_in
AND existing.booking_status != cancelled
AND existing.property_id = new.property_id

If conflict exists, reject booking creation or update.

Calculate total_nights from check_in and check_out.

Calculate subtotal from price_per_night multiplied by total_nights.

Calculate total_price from subtotal plus additional_fees minus discount.

Calculate remaining_amount from total_price minus paid_amount.

Automatically determine payment_status based on paid_amount and total_price.

Generate invoice automatically after booking is created.
```

---

## 26. Acceptance Criteria

Aplikasi dianggap MVP selesai jika:

```text
- Admin bisa login.
- Admin bisa logout.
- Admin bisa melihat dashboard.
- Admin bisa melihat data homestay.
- Admin bisa mengedit data homestay.
- Admin bisa membuat booking.
- Admin bisa mengedit booking.
- Admin bisa membatalkan booking.
- Admin bisa melihat daftar booking.
- Admin bisa mencari booking berdasarkan nama tamu.
- Admin bisa memfilter booking berdasarkan status.
- Admin bisa melihat kalender booking.
- Sistem mencegah double booking.
- Sistem menghitung total malam otomatis.
- Sistem menghitung total harga otomatis.
- Sistem menghitung status pembayaran otomatis.
- Sistem generate invoice PDF otomatis.
- Admin bisa download invoice.
- Admin bisa share invoice via WhatsApp.
- Data yang dibuat admin 1 terlihat oleh admin 2.
- App nyaman digunakan di browser Android.
- App berhasil deploy di Coolify.
- PostgreSQL berjalan di Coolify.
```

---

## 27. Testing Checklist

## Auth

```text
- Login berhasil dengan akun benar.
- Login gagal dengan password salah.
- Route dashboard tidak bisa diakses tanpa login.
- Logout berhasil.
```

## Booking

```text
- Booking berhasil dibuat.
- Booking gagal jika tanggal overlap.
- Booking cancelled tidak memblokir tanggal.
- Total malam benar.
- Total harga benar.
- Payment status benar.
- Edit booking berhasil.
- Cancel booking berhasil.
```

## Calendar

```text
- Tanggal booking muncul di kalender.
- Tanggal kosong tidak ditandai.
- Klik tanggal menampilkan booking terkait.
```

## Invoice

```text
- Invoice dibuat otomatis setelah booking.
- Nomor invoice unik.
- PDF bisa dibuka.
- PDF bisa di-download.
- Link WhatsApp terbentuk dengan benar.
- Data invoice sesuai data booking.
```

## Multi Admin

```text
- Admin 1 membuat booking.
- Admin 2 bisa melihat booking tersebut.
- Admin 2 mengubah booking.
- Admin 1 melihat perubahan terbaru.
```

## Responsive

```text
- Tampilan nyaman di Android browser.
- Tampilan tetap rapi di desktop.
- Bottom navigation muncul di mobile.
- Form mudah digunakan di layar kecil.
```

---

## 28. Future Improvement

Fitur lanjutan setelah MVP:

```text
- Push notification
- WhatsApp API automation
- Upload bukti transfer
- Laporan pendapatan bulanan
- Expense tracking
- Multi-property management
- Role owner/staff
- Dark mode
- Backup database otomatis
- Guest database
- Export Excel
- Payment gateway
- Public booking page
- PWA offline mode
```

```
```
