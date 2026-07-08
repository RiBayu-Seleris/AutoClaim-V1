# AutoClaim Webapp v2

Web app AutoClaim hasil migrasi dari **Flutter** (`autoclaim-flutter`) kembali ke **ReactJS**, dengan acuan desain layar scanning & hasil kerusakan dari webapp Vue lama (`autoclaim-webapp`).

Aplikasi ini ditujukan untuk **dua peran**:

- **User** — semua fitur (cek kondisi/scan, hasil kerusakan, klaim, pembayaran, bengkel, asuransi, towing, profil, kendaraan).
- **Driver towing** — portal terpisah untuk menerima & memperbarui status tugas derek.

> Dashboard mitra (bengkel/asuransi/towing/sparepart) **tidak** ada di sini — itu ditangani backoffice. Webapp ini hanya menyediakan **halaman pendaftaran** mitra.

## Stack

| Area            | Teknologi                                       |
| --------------- | ----------------------------------------------- |
| Build           | Vite 6 + TypeScript (strict)                    |
| UI              | React 18 + Tailwind CSS v4 (CSS-first `@theme`) |
| Routing         | React Router v6 (`createBrowserRouter`)         |
| Server state    | TanStack Query v5                               |
| Client state    | Zustand                                         |
| Form & validasi | React Hook Form + Zod                           |
| HTTP            | Axios (interceptor + auto-refresh token)        |
| Ikon            | lucide-react                                    |

## Menjalankan

```bash
npm install
cp .env.example .env     # sesuaikan base URL gateway bila perlu
npm run dev              # http://localhost:5173
```

Script lain: `npm run build`, `npm run preview`, `npm run lint`, `npm run typecheck`, `npm run format`.

### Environment

| Variabel                        | Keterangan                                                                        |
| ------------------------------- | --------------------------------------------------------------------------------- |
| `VITE_API_AUTOCLAIM_BASE_URL`   | Base URL gateway AutoClaim (tanpa trailing slash).                                |
| `VITE_API_CHANNEL`              | Nilai header `X-Channel` (default `cust_mobile_app`).                             |
| `VITE_USE_MOCK_SERVICES`        | Toggle mock global untuk fitur yang belum disetel spesifik.                       |
| `VITE_USE_MOCK_SCAN_SERVICES`   | `true` → OCR/upload scan memakai mock; `false` → backend asli.                    |
| `VITE_USE_MOCK_DAMAGE_ANALYSIS` | `true` → hasil damage mock; `false` → gateway `/v1/inference/damage/rest/create`. |
| `VITE_USE_MOCK_INSURANCE_CHECK` | `true` → status asuransi plat dummy; `false` → backend asli.                      |

Env divalidasi saat startup dengan Zod (`src/config/env.ts`) — salah konfigurasi = gagal cepat dengan pesan jelas.

## Struktur Folder

```
src/
  app/            # router, guards, store level-app, entry App
  components/     # UI kit (ui/), layout/, feedback/, brand/
  config/         # env tervalidasi + konstanta
  lib/            # api client + interceptors, storage, util
  features/       # modul per-domain (lihat di bawah)
  styles/         # design token Tailwind v4 + Poppins
```

Setiap `features/<domain>/` berisi `api`/`pages`/`store`/`types` sesuai kebutuhan, sehingga mudah dirawat & dipindahkan.

## Dua Fitur Baru

1. **Foto plat sebagai input (OCR) dengan fallback manual.**
   Foto plat dijalankan melalui `PlateRecognitionService`. Jika **3× gagal** terbaca jelas, form input plat manual otomatis muncul. Logika di `features/vehicle-scan/hooks/usePlateScan.ts`.

2. **Auto-cek asuransi dari plat.**
   Begitu plat didapat (OCR/manual), sistem otomatis memanggil `InsuranceCheckService`. Bila plat **sudah ditanggung**, status "Asuransi Terdeteksi" ditampilkan; saat hendak klaim, user diarahkan untuk **masuk/daftar** lalu melihat hasil kerusakan yang masih terkunci.

Kedua fitur memakai **service interface yang bisa dicampur** lewat env: OCR/upload, damage analysis, dan cek asuransi dapat dibuat mock atau backend asli secara terpisah.

> Mock cek asuransi bersifat deterministik untuk demo: plat `B 1234 CDE` dan `B 3456 FGH` dianggap sudah berasuransi.

## Modul Scanning yang Reusable

`src/features/vehicle-scan/` dibuat **portable** agar bisa dipakai project lain:

- Service (OCR plat, cek asuransi, upload) disuntikkan via `ScanServicesProvider` — host app bisa memberi implementasi sendiri.
- Komponen kamera (`CameraCapture`), store sesi scan, hook, dan util plat semuanya self-contained.
- API publik diekspor dari satu titik: `features/vehicle-scan/index.ts`.

```tsx
import { ScanServicesProvider, CameraCapture, usePlateScan } from '@/features/vehicle-scan';

<ScanServicesProvider services={{ plateRecognition: myOcrService }}>
  {/* ...alur scanning... */}
</ScanServicesProvider>;
```

## Akses Guest & Kunci Hasil

Sesuai webapp lama: **beranda + seluruh alur scanning bisa diakses tanpa login**. Halaman hasil kerusakan memiliki dua lapis kunci:

1. **Guest** → seluruh detail di-blur + prompt "Login Sekarang".
2. **Sudah login, belum bayar** → bagian estimasi di-blur + "Buka Detail Analisis Rp 20.000".

## Catatan

- Endpoint OCR plat & cek asuransi (`/v1/inference/plate/ocr`, `/v1/insurance/coverage`) masih **placeholder** — sesuaikan saat backend siap.
- Optimisasi lanjutan: code-splitting rute via `React.lazy` untuk memperkecil bundle awal.
