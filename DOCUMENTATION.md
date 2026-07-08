# Dokumentasi AutoClaim Webapp v2

Dokumen teknis lengkap untuk `autoclaim-webapp-v2` — hasil migrasi **Flutter → ReactJS**.
Untuk ringkasan singkat & cara menjalankan, lihat [README.md](./README.md).

- **Sumber fitur**: `autoclaim-flutter` (versi paling lengkap).
- **Acuan desain layar scan & hasil kerusakan**: `autoclaim-webapp` (Vue 3).
- **Peran**: User (semua fitur) + Driver Towing (portal terpisah). Mitra hanya _pendaftaran_.

---

## 1. Stack & Keputusan Teknis

| Area         | Pilihan                                     | Alasan                             |
| ------------ | ------------------------------------------- | ---------------------------------- |
| Build        | Vite 6 + TypeScript **strict**              | cepat, type-safe ("Very Safety")   |
| UI           | React 18 + Tailwind v4 (CSS-first `@theme`) | token desain identik dgn Vue       |
| Routing      | React Router v6 (`createBrowserRouter`)     | guard berbasis komponen            |
| Server state | TanStack Query v5                           | caching, retry, refetch interval   |
| Client state | Zustand                                     | store ringan per-domain            |
| Form         | React Hook Form + Zod                       | validasi deklaratif                |
| HTTP         | Axios + interceptor                         | auto-refresh token, channel header |
| Ikon         | lucide-react                                | konsisten, tree-shakeable          |

`tsconfig` mengaktifkan `strict`, `noUncheckedIndexedAccess`, `noUnusedLocals/Parameters`, dll.

---

## 2. Struktur Folder

```
src/
├─ app/
│  ├─ App.tsx            # QueryClientProvider + RouterProvider + overlay global
│  ├─ router.tsx         # definisi semua rute + guard
│  ├─ routes.ts          # konstanta path + builder berparameter
│  ├─ guards.tsx         # RootGate (onboarding) + RequireAuth
│  └─ appStore.ts        # flag level-app (onboarding)
├─ components/
│  ├─ ui/                # Button, Input, TextArea, Card, Modal, Badge, Skeleton, Spinner
│  ├─ layout/            # PageContainer, AppHeader, BottomNav, AppShell, AuthLayout
│  ├─ feedback/          # toast, confirm, Toaster, ConfirmRoot, StateViews, ComingSoon
│  └─ brand/             # Logo (SVG)
├─ config/              # env (validasi Zod) + constants (storage keys, dll)
├─ lib/
│  ├─ api/               # client (axios+interceptor), queryClient, types
│  ├─ storage/           # wrapper localStorage aman
│  └─ utils/             # cn(), format (rupiah/tanggal/severity)
├─ features/<domain>/   # api / pages / store / types / components / hooks
└─ styles/index.css     # @theme token + Poppins + utilities
```

Setiap domain berdiri sendiri di `features/`, sehingga mudah dirawat & dipindah.

---

## 3. Sistem Desain

Token diambil 1:1 dari `autoclaim-webapp/src/assets/css/main.css` + `autoclaim-flutter` theme:

- **Primary**: `deep-blue-500 #4b61a1` (skala 50–900).
- **Brand**: `green-cust #37ab87`. Status: success/danger/orange/warning.
- **Severity** (% kerusakan): biru ≤25 `#3b82f6` / hijau ≤50 `#22c55e` / kuning ≤75 `#fbbf24` / merah >75 `#ef4444`.
- **Font**: Poppins. Ukuran token: `text-10/12/14/16/18/20`.
- Kanvas bergaya mobile: `max-w-[480px]` dipusatkan (`PageContainer`).

Aset gambar (frame kerusakan, ilustrasi checkup) disalin ke `public/assets/`.

---

## 4. Peta Rute & Level Akses

Pembagian akses (di `app/router.tsx`):

- **Publik (guest)**: onboarding, auth, beranda, dan **seluruh alur scanning**.
- **Terproteksi** (`RequireAuth` → redirect `/login?redirect=`): hasil ke atas (klaim, bayar, kendaraan, dll).
- **Portal sopir**: sesi sendiri, ditangani di dalam halaman (`DriverGate`).

| Path                                                                   | Halaman                             | Akses         |
| ---------------------------------------------------------------------- | ----------------------------------- | ------------- |
| `/get-started`                                                         | GetStarted (onboarding 1×)          | publik        |
| `/login`, `/register`                                                  | Login / Register user               | publik        |
| `/register/mitra`                                                      | Daftar mitra (chooser + form)       | publik        |
| `/`                                                                    | Home (tab)                          | publik        |
| `/profile`                                                             | Profil (tab)                        | **login**     |
| `/check-condition`                                                     | Cek kondisi (selamat?)              | publik        |
| `/check-condition/emergency`                                           | Bantuan darurat                     | publik        |
| `/check-condition/emergency/hospitals` · `/towing`                     | Layanan darurat                     | publik        |
| `/check-condition/license-plate`                                       | **Foto plat + OCR + cek asuransi**  | publik        |
| `/check-condition/vehicle-all-sides`                                   | Foto 4 sisi                         | publik        |
| `/check-condition/vehicle-all/preview`                                 | Pratinjau + submit analisis         | publik        |
| `/damage-analysis`                                                     | **Hasil kerusakan (2 lapis kunci)** | publik (blur) |
| `/detail-damage-analysis`                                              | Detail 1 kerusakan                  | login         |
| `/estimated-repair-costs`                                              | Estimasi biaya                      | login         |
| `/payment` · `-waiting` · `-success`                                   | Pembayaran (unlock laporan)         | login         |
| `/workshop-recommendations` · `/:id` · `/:id/route`                    | Bengkel                             | login         |
| `/insurance/search` · `/detail` · `/purchase`                          | Asuransi                            | login         |
| `/claims` · `/claim/select-policy` · `/form` · `/status` · `/approved` | Klaim                               | login         |
| `/towing/order` · `/towing/:code/status` · `/tracking`                 | Towing user                         | login         |
| `/recent-activity`                                                     | Aktivitas + riwayat bayar           | login         |
| `/vehicles` · `/vehicles/form` · `/check-condition/select-vehicle`     | Kendaraan                           | login         |
| `/rating`                                                              | Penilaian                           | login         |
| `/driver`                                                              | Portal sopir (login/tasks)          | sesi sopir    |

Builder path berparameter ada di `app/routes.ts` (`buildPath.*`).

---

## 5. Autentikasi & Sesi

- **Login terpadu** ([useLogin.ts](src/features/auth/hooks/useLogin.ts)): probe `/v1/admin/auth/login` dulu → `towing_driver` masuk portal sopir; mitra lain diarahkan ke backoffice; selain itu login user biasa `/v1/auth/login`.
- **Sesi terpisah** (token key beda): user (`auth_token` + refresh), driver (`driver_token`). Lihat `config/constants.ts`.
- **Auto-refresh**: interceptor menukar refresh-token saat 401 (single-flight); bila gagal → `logout()` + guard mengarahkan ke `/login`.
- Envelope gateway: payload di `data.data`, token di `data.data.token.access_token`, error di `stat_msg`.

---

## 6. Dua Fitur Baru (detail)

### 6.1 Foto plat → OCR, 3× gagal → input manual

File inti: [usePlateScan.ts](src/features/vehicle-scan/hooks/usePlateScan.ts), [LicensePlatePage.tsx](src/features/checkup/pages/LicensePlatePage.tsx).

```
Ambil foto plat
   └─> PlateRecognitionService.recognize(blob)
         ├─ terdeteksi (confidence ≥ 0.75) → simpan plat (source: ocr) → cek asuransi
         └─ gagal → attempts++  (MAX_PLATE_ATTEMPTS = 3)
                      └─ attempts ≥ 3 → tampilkan form INPUT MANUAL
Input manual → normalisasi & validasi (regex plat ID) → simpan (source: manual) → cek asuransi
```

### 6.2 Auto-cek asuransi dari plat

```
Plat didapat (ocr/manual)
   └─> InsuranceCheckService.checkByPlate(plat)
         ├─ insured  → kartu "Asuransi Terdeteksi" (+penanggung/produk)
         │              + arahan: untuk klaim → masuk/daftar dulu
         └─ not_insured → tetap bisa lanjut analisis
Status disimpan di scanStore (idle|checking|insured|not_insured|error)
```

Keduanya memakai **interface yang bisa di-swap**. Saat `VITE_USE_MOCK_SERVICES=true`, dipakai
mock; saat `false`, dipakai implementasi backend.

- Mock OCR sengaja _flaky_ (~50%) agar alur 3× bisa diuji — `setMockPlateSuccessRate(rate)` untuk demo.
- Mock asuransi **deterministik**: plat dgn jumlah digit **genap** = insured (mis. `B 1234 ABC`).

---

## 7. Hasil Kerusakan — 2 Lapis Kunci

File: [DamageAnalysisPage.tsx](src/features/damage/pages/DamageAnalysisPage.tsx) (port `DamageAnalysis.vue`).

1. **Guest belum login** → seluruh detail di-blur + kartu "Perhatian / Login Sekarang"
   (→ `/login?redirect=/damage-analysis`).
2. **Sudah login, belum bayar** → bagian frame + rincian di-blur + tombol
   **"Buka Detail Analisis — Rp 20.000"** → `/payment` (type `AI_REPORT`).
   Setelah bayar (`PaymentSuccess`) → `damageStore.unlockReport()` membuka detail.

Gauge donat `RadialProgress`, kartu severity per-sisi (scroll horizontal), frame per-sisi, daftar kerusakan → detail.

---

## 8. Modul Scanning Reusable

`features/vehicle-scan/` dirancang **portable** untuk dipakai project lain.

```
vehicle-scan/
├─ index.ts                       # API publik (satu pintu impor)
├─ components/CameraCapture.tsx    # kamera getUserMedia + frame + capture→blob/dataUrl
├─ hooks/usePlateScan.ts          # OCR 3×→manual + trigger cek asuransi
├─ store/scanStore.ts             # sesi scan (plat, asuransi, 4 sisi)
├─ utils/plate.ts                 # normalisasi + validasi plat ID
└─ services/
   ├─ types.ts                    # interface: PlateRecognition / InsuranceCheck / Upload
   ├─ mock.ts                     # implementasi mock
   ├─ backend.ts                  # implementasi backend (stub siap pakai)
   ├─ index.ts                    # factory pilih mock/backend via env (singleton)
   ├─ scanServicesContext.ts      # context + useScanServices()
   └─ ScanServicesProvider.tsx    # provider untuk inject service custom
```

Contoh penggunaan di host app lain:

```tsx
import {
  ScanServicesProvider,
  CameraCapture,
  usePlateScan,
  useScanStore,
  type PlateRecognitionService,
} from '@/features/vehicle-scan';

const myOcr: PlateRecognitionService = {
  async recognize(blob) {
    /* panggil OCR sendiri */ return { detected: true, plateNumber: 'B 1 A', confidence: 0.9 };
  },
};

<ScanServicesProvider services={{ plateRecognition: myOcr }}>
  {/* komponen yang memakai usePlateScan / CameraCapture */}
</ScanServicesProvider>;
```

Tanpa provider, `useScanServices()` otomatis memakai implementasi default (env).

---

## 9. State Management

| Store (Zustand)     | Isi                                                      |
| ------------------- | -------------------------------------------------------- |
| `authStore`         | token, user, login/register user, session-expired        |
| `driverStore`       | token + nama sopir, loginAsDriver                        |
| `appStore`          | flag onboarding                                          |
| `scanStore`         | foto plat, nomor plat, status asuransi, 4 sisi kendaraan |
| `damageStore`       | hasil analisis, `reportUnlocked`                         |
| `toast` / `confirm` | notifikasi & dialog imperatif (pengganti SweetAlert2)    |

Data server (kendaraan, klaim, bengkel, dll) memakai **TanStack Query** (bukan store).

---

## 10. Inventaris Endpoint Backend

| Fitur                           | Method & Path                                            | Status                 |
| ------------------------------- | -------------------------------------------------------- | ---------------------- | ------- |
| Login user                      | `POST /v1/auth/login`                                    | dipakai                |
| Register user/mitra             | `POST /v1/auth/register`                                 | dipakai                |
| Login admin/sopir               | `POST /v1/admin/auth/login`                              | dipakai                |
| Refresh token                   | `POST /v1/auth/refresh`                                  | dipakai (interceptor)  |
| Profil                          | `GET /v1/member/profile`                                 | tersedia               |
| **OCR plat**                    | `POST /v1/inference/plate/ocr`                           | **STUB** (placeholder) |
| **Cek asuransi plat**           | `GET /v1/insurance/coverage?plate=`                      | **STUB** (placeholder) |
| Upload gambar                   | `POST /v1/s3/image/upload`                               | dipakai (mode backend) |
| Analisis kerusakan              | `POST /v1/inference/damage/rest/create`                  | dipakai (mode backend) |
| Aktivitas                       | `GET /v1/inference/damages`                              | dipakai                |
| Riwayat bayar                   | `GET /v1/payment/history`                                | dipakai                |
| Kendaraan                       | `GET/POST/PUT/DELETE /v1/vehicle`                        | dipakai                |
| Rekomendasi (bengkel/RS/towing) | `POST /v1/recommender`                                   | dipakai                |
| Produk asuransi                 | `GET /v1/member/insurance/products`                      | dipakai                |
| Polis                           | `GET /v1/member/insurance/policies`                      | dipakai                |
| Beli polis                      | `POST /v1/member/insurance/purchase`                     | dipakai                |
| Klaim                           | `GET/POST /v1/member/claims`                             | dipakai                |
| Rating                          | `POST /v1/member/ratings`                                | dipakai                |
| Towing user                     | `…/v1/member/towing-orders[/:code]/tracking              | /cancel]`              | dipakai |
| Tugas sopir                     | `GET/POST /v1/admin/driver/towing-orders[/:code/status]` | dipakai                |

> Mock bisa dipisah lewat env: `VITE_USE_MOCK_SCAN_SERVICES`, `VITE_USE_MOCK_DAMAGE_ANALYSIS`, dan `VITE_USE_MOCK_INSURANCE_CHECK`. Untuk testing saat ini, damage analysis dibuat real ke gateway, sementara cek asuransi plat tetap dummy.

---

## 11. Menjalankan & Verifikasi

```bash
npm install
cp .env.example .env
npm run dev        # http://localhost:5173
npm run build      # tsc -b && vite build
npm run lint       # eslint .
npm run typecheck  # tsc -b --noEmit
```

Status terakhir: `build`, `tsc -b`, `eslint .` **0 error** (1803 modul, preview HTTP 200).

---

## 12. Yang Belum / TODO

- Endpoint **OCR plat** & **cek asuransi** masih placeholder — konfirmasi path & bentuk respons backend lalu sesuaikan `services/backend.ts`.
- **Peta nyata** belum diintegrasikan (towing-tracking & workshop-route memakai placeholder + tautan Google Maps).
- **Code-splitting** rute via `React.lazy` untuk memperkecil bundle awal (~556 KB).
- Pembayaran nyata (QRIS/GoPay) masih simulasi di mode mock — sambungkan ke gateway pembayaran.

```

```
