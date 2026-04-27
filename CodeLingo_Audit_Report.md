# 🔍 Laporan Audit Kode — CodeLingo
**Tanggal Audit**: 2026-04-27  
**Auditor**: Senior Code Auditor (AI)  
**Codebase**: `CodeLingo-main` — Platform belajar coding bergamifikasi (React + Express + MongoDB)  
**Total Temuan**: 28 item (2 CRITICAL · 6 HIGH · 17 MEDIUM · 6 LOW)

---

## 🚨 CRITICAL (2) — Harus diperbaiki sebelum production

---

### [BUG-01] `$inc` duplikat — XP tidak bertambah saat hati hilang
**File**: `server/routes/progress.ts:36–38`  
**Dampak**: Setiap kali user salah jawab (heartsUsed > 0), XP tidak pernah bertambah di database

**Kode Bermasalah:**
```typescript
await User.findByIdAndUpdate(
  req.user!._id,
  {
    $inc: { totalXp: xpGained },          // ← ditimpa oleh spread di bawah
    $set: { lastActiveDate: new Date() },
    ...(heartsUsed > 0 ? { $inc: { hearts: -heartsUsed } } : {}), // ← menimpa $inc atas
  },
  { new: true }
)
```

**Perbaikan:**
```typescript
await User.findByIdAndUpdate(
  req.user!._id,
  {
    $inc: {
      totalXp: xpGained,
      ...(heartsUsed > 0 ? { hearts: -heartsUsed } : {}),
    },
    $set: { lastActiveDate: new Date() },
  },
  { new: true }
)
```

---

### [SEC-01] JWT_SECRET fallback `'dev-secret'` — token bisa dipalsu
**File**: `server/middleware/auth.ts:21`, `server/routes/auth.ts:32, 80`  
**Dampak**: Jika `JWT_SECRET` tidak diset di production, siapapun bisa membuat token admin yang valid

**Kode Bermasalah:**
```typescript
const secret = process.env.JWT_SECRET || 'dev-secret';
```

**Perbaikan:**
```typescript
const secret = process.env.JWT_SECRET;
if (!secret) throw new Error('JWT_SECRET tidak diset di environment variables!');
```

> ⚠️ Pastikan `JWT_SECRET` sudah diset di Vercel environment variables sebelum deploy.

---

## 🔴 HIGH (6)

---

### [SEC-02] Import JSON tanpa sanitasi konten
**File**: `server/routes/admin.ts:163–172`  
**Dampak**: Admin bisa import `contentMarkdown` berisi script berbahaya yang dirender ke user

**Perbaikan**: Validasi tipe data setiap field sebelum upsert, atau gunakan library sanitasi HTML seperti `DOMPurify` di frontend sebelum render markdown.

---

### [SEC-03] Endpoint leaderboard publik — data user bocor
**File**: `server/routes/courses.ts:120`  
**Dampak**: Siapapun tanpa login bisa melihat daftar username + avatar semua student

**Kode Bermasalah:**
```typescript
router.get('/leaderboard/top', async (_req, res: Response) => {
  // tidak ada requireAuth
```

**Perbaikan:**
```typescript
router.get('/leaderboard/top', requireAuth, async (_req, res: Response) => {
```

---

### [BUG-02] Double-count `correctCount` — skor bisa >100%
**File**: `src/views/learn/LessonView.tsx:507–508`  
**Dampak**: Saat soal terakhir dijawab benar, `correctCount` sudah +1 dari re-render, lalu ditambah 1 lagi → skor bisa melebihi 100%

**Kode Bermasalah:**
```typescript
const corrTotal = correctCount + (isCorrect ? 1 : 0); // double-count!
const score = Math.round((corrTotal / totalQuestions) * 100);
```

**Perbaikan**: Hapus kompensasi `isCorrect` karena `correctCount` sudah ter-update saat `handleNext` dipanggil:
```typescript
const score = Math.round((correctCount / totalQuestions) * 100);
```

---

### [BUG-03] Tidak ada error handling di `progressApi.complete()`
**File**: `src/views/learn/LessonView.tsx:509–516, 526–533`  
**Dampak**: Jika API gagal saat selesai kuis, user stuck di layar tanpa pesan error dan tidak bisa lanjut

**Perbaikan**: Tambahkan `.catch()` pada kedua pemanggilan:
```typescript
progressApi.complete({ levelId: level._id, score, heartsUsed })
  .then(({ xpGained, user: updatedUser }) => {
    updateUser(updatedUser);
    navigate(`/hasil/${level._id}`, { state: {...}, replace: true });
  })
  .catch(() => {
    toast.error('Gagal menyimpan progress. Coba lagi!');
  });
```

---

### [GAP-01] Exit kuis tanpa konfirmasi
**File**: `src/views/learn/LessonView.tsx:537–540`  
**Dampak**: User bisa tidak sengaja keluar dari kuis yang sedang berjalan

**Kode Bermasalah:**
```typescript
const handleExit = () => {
  navigate('/belajar'); // langsung keluar tanpa tanya
};
```

**Perbaikan**: Tambahkan konfirmasi native atau modal:
```typescript
const handleExit = () => {
  if (window.confirm('Yakin mau keluar? Progress kamu di soal ini sudah tersimpan.')) {
    navigate('/belajar');
  }
};
```

---

### [UX-01] `ResultView` crash jika diakses langsung via URL
**File**: `src/views/learn/ResultView.tsx:17`  
**Dampak**: Jika user buka `/hasil/:levelId` langsung (bukan dari selesai kuis), semua nilai jadi `undefined`

**Perbaikan**: Tambahkan guard di awal komponen:
```typescript
if (!state) {
  return (
    <div className="min-h-dvh flex flex-col items-center justify-center">
      <p className="text-xl mb-4">😕 Tidak ada hasil untuk ditampilkan.</p>
      <button className="btn-primary" onClick={() => navigate('/belajar')}>
        Kembali ke Belajar
      </button>
    </div>
  );
}
```

---

## 🟡 MEDIUM (17)

---

### [KR-01] 3 route admin GET tanpa try-catch
**File**: `server/routes/admin.ts:34–37, 73–78, 146–148`  
**Dampak**: DB error menyebabkan unhandled promise rejection yang bisa crash server

**Contoh perbaikan** (terapkan ke 3 route):
```typescript
router.get('/courses', async (_req, res) => {
  try {
    const courses = await Course.find().sort({ order: 1 });
    res.json(courses);
  } catch {
    res.status(500).json({ message: 'Gagal mengambil data kelas.' });
  }
});
```

---

### [SEC-04] CORS wildcard saat `FRONTEND_URL` tidak diset
**File**: `server/app.ts:13`  

**Kode Bermasalah:**
```typescript
origin: process.env.FRONTEND_URL || '*',
```

**Perbaikan:**
```typescript
origin: process.env.FRONTEND_URL || 'http://localhost:3000',
```
Dan pastikan `FRONTEND_URL` diset di semua environment production.

---

### [SEC-05] Update role user tanpa validasi enum
**File**: `server/routes/admin.ts:152–154`

**Perbaikan:**
```typescript
const { role } = req.body;
if (!['student', 'admin'].includes(role)) {
  res.status(400).json({ message: 'Role tidak valid.' });
  return;
}
```

---

### [UX-02] LessonView loading selamanya jika API gagal
**File**: `src/views/learn/LessonView.tsx:440–458`

**Perbaikan**: Tambahkan state `error` dan `.catch()`:
```typescript
const [error, setError] = useState<string | null>(null);

coursesApi.level(levelId)
  .then(l => { setLevel(l); setPhase(l.type === 'theory' ? 'theory' : 'question'); })
  .catch(() => setError('Gagal memuat soal. Coba refresh halaman.'));
```
Lalu render error state jika `error !== null`.

---

### [UX-03] MapView tidak ada empty state saat tidak ada course
**File**: `src/views/learn/MapView.tsx:292–297`

**Perbaikan**: Tambahkan kondisi di bagian render:
```typescript
{!loading && chapters.length === 0 && (
  <div className="text-center py-16">
    <p className="text-4xl mb-2">🚧</p>
    <p className="font-600">Konten sedang disiapkan.</p>
    <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>
      Pantau terus ya!
    </p>
  </div>
)}
```

---

### [UX-04] DashboardView pakai `<a href>` bukan `<Link>`
**File**: `src/views/admin/DashboardView.tsx:59`  
**Dampak**: Setiap klik "Aksi Cepat" trigger full page reload, kehilangan state

**Perbaikan**: Ganti `<a href={a.to}>` dengan `<Link to={a.to}>` dari `react-router-dom`.

---

### [UX-05] Tab "Pengguna" hilang di mobile admin
**File**: `src/views/admin/AdminLayout.tsx:89`

**Kode Bermasalah:**
```typescript
{navItems.slice(0, 5).map(...)} // ← item ke-6 (Pengguna) hilang
```

**Perbaikan:**
```typescript
{navItems.map(...)} // tampilkan semua, atau ganti dengan hamburger menu
```

---

### [BUG-04] Auto-logout 401 tidak clear Zustand store
**File**: `src/api/client.ts:19–22`  
**Dampak**: Zustand persist masih menyimpan user data lama setelah force-logout dari interceptor

**Perbaikan**: Gunakan `useAuthStore.getState().logout()` daripada akses localStorage langsung:
```typescript
import { useAuthStore } from '../store/authStore';

if (err.response?.status === 401) {
  useAuthStore.getState().logout();
  window.location.href = '/masuk';
}
```

---

### [BUG-05] MapView tidak ada catch di `loadCourse`
**File**: `src/views/learn/MapView.tsx:299–309`  
**Dampak**: API error = silent fail, loading hilang, tampilan kosong tanpa keterangan

**Perbaikan**: Tambahkan catch di dalam try block yang sudah ada.

---

### [GAP-02] Streak hanya update saat login, bukan saat selesai level
**File**: `server/routes/auth.ts:63–78`  
**Dampak**: User yang tetap login multi-hari dan belajar tidak mendapat streak update

**Saran**: Tambahkan logika streak yang sama di `server/routes/progress.ts` saat `POST /complete`.

---

### [GAP-03] Hearts direset ke 5 jika user refresh browser di tengah kuis
**File**: `src/store/gameStore.ts`  
**Dampak**: User yang kehabisan hearts bisa reset tidak sengaja dengan refresh

**Perbaikan**: Tambahkan `persist` middleware ke `gameStore`:
```typescript
export const useGameStore = create<GameState>()(
  persist(
    (set) => ({ ... }),
    { name: 'cl-game', partialize: (s) => ({ hearts: s.hearts }) }
  )
);
```

---

### [KR-02] `existingCount` dihitung tapi tidak dipakai (DB query sia-sia)
**File**: `server/routes/admin.ts:188`

**Kode Bermasalah:**
```typescript
const existingCount = await Chapter.countDocuments({ courseId: course._id });
// variabel ini tidak pernah dipakai setelahnya
```

**Perbaikan**: Hapus baris tersebut.

---

### [KR-04] Token disimpan ganda di dua localStorage key
**File**: `src/store/authStore.ts:24`, `src/api/client.ts:10`  
**Dampak**: `cl_token` (untuk axios) dan `cl-auth` (Zustand persist) bisa desync

**Perbaikan Jangka Pendek**: Hapus `localStorage.setItem('cl_token', token)` di authStore. Update `client.ts` untuk baca token dari Zustand:
```typescript
import { useAuthStore } from '../store/authStore';
const token = useAuthStore.getState().token;
```

> ⚠️ Perubahan ini berpotensi breaking — test login flow secara menyeluruh.

---

### [PERF-01] N+1 DB query di GET /courses
**File**: `server/routes/courses.ts:16–23`  
**Dampak**: Untuk N course = N×2 DB round-trips. Untuk 5 course = 10 query per request

**Perbaikan**: Gunakan MongoDB aggregation pipeline:
```typescript
const courses = await Course.aggregate([
  { $match: { isPublished: true } },
  { $sort: { order: 1 } },
  { $lookup: { from: 'chapters', localField: '_id', foreignField: 'courseId', as: 'chapters' } },
  { $addFields: { chaptersCount: { $size: '$chapters' } } },
]);
```

---

### [PERF-02] Dynamic import User model dalam request handler
**File**: `server/routes/courses.ts:122`

**Kode Bermasalah:**
```typescript
const User = (await import('../models/User.js')).default;
```

**Perbaikan**: Pindahkan ke static import di baris atas file.

---

### [PERF-03] Tidak ada pagination di admin list endpoints
**File**: `server/routes/admin.ts:147, 113`  
**Saran**: Tambahkan `?page=1&limit=50` di backend dan komponen pagination sederhana di frontend.

---

## 🔵 LOW (6)

---

### [DC-01] `TopNav.tsx` tidak pernah dipakai
**File**: `src/components/TopNav.tsx`  
**Aksi**: Hapus file.

---

### [DC-02] `ShopView.tsx` kosong
**File**: `src/views/ShopView.tsx`  
**Aksi**: Hapus file (tidak ada route yang mengarah ke sana).

---

### [DC-03] Dependency `@google/genai` tidak dipakai
**File**: `package.json:17`  
**Aksi**: `npm uninstall @google/genai`

---

### [DC-04] `src/views/LessonView.tsx` (versi lama)
**File**: `src/views/LessonView.tsx` (bukan yang ada di `learn/`)  
**Aksi**: Hapus — versi aktif ada di `src/views/learn/LessonView.tsx`.

---

### [DC-05] `README.md` masih template AI Studio
**File**: `README.md`  
**Aksi**: Update README dengan dokumentasi proyek yang sesungguhnya.

---

### [KR-03] `useState<any>` di LevelsView
**File**: `src/views/admin/LevelsView.tsx:296`  
**Aksi**: Ganti dengan tipe yang proper sesuai `EMPTY_LEVEL`.

---

## 📊 Rekap Prioritas Perbaikan

| Prioritas | Item | Estimasi |
|-----------|------|----------|
| 🚨 Kerjakan Hari Ini | BUG-01, SEC-01, SEC-03, BUG-02, BUG-03, GAP-01, UX-01 | ~2 jam |
| 🔴 Minggu Ini | SEC-02, SEC-04, SEC-05, KR-01, UX-02, UX-04, BUG-04 | ~2 jam |
| 🟡 Sprint Berikutnya | UX-03, UX-05, BUG-05, GAP-02, GAP-03, KR-02, KR-04, PERF-01, PERF-02 | ~4 jam |
| 🔵 Kapan Sempat | PERF-03, DC-01~05, KR-03 | ~2 jam |
| **Total** | **28 fix** | **~10 jam** |

---

## 🗂️ Daftar File yang Perlu Dihapus

```
src/components/TopNav.tsx
src/views/ShopView.tsx
src/views/LessonView.tsx  (bukan yang di /learn/)
```

## 📦 Package yang Perlu Dihapus

```bash
npm uninstall @google/genai
```

---

## 💡 Rekomendasi Enhancement (Bukan Bug, Tapi Disarankan)

Bagian ini berisi saran peningkatan yang tidak bersifat darurat, namun akan meningkatkan kualitas produk secara signifikan.

---

### 🆕 Fitur Tambahan yang Disarankan

---

#### [F-01] Hearts Recovery Timer — **WAJIB** · Kompleksitas M
**Masalah**: Jika user kehabisan hearts (0/5), tidak ada cara memulihkan tanpa logout lalu login ulang. Pengalaman user sangat buruk.

**Saran Implementasi**: Di endpoint `GET /api/auth/me`, tambahkan logika:
```typescript
// server/routes/auth.ts — di handler /me
const now = new Date();
const lastActive = user.lastActiveDate ? new Date(user.lastActiveDate) : null;
const hoursSince = lastActive
  ? (now.getTime() - lastActive.getTime()) / 3_600_000
  : 999;

if (user.hearts < 5 && hoursSince >= 8) {
  const recovered = Math.min(5, user.hearts + Math.floor(hoursSince / 8));
  await User.findByIdAndUpdate(user._id, { hearts: recovered });
  user.hearts = recovered;
}
```
Tampilkan di ProfileView: *"Hati pulih setiap 8 jam"* agar user tahu kapan harus balik.

---

#### [F-02] Halaman 404 Kustom — **DISARANKAN** · Kompleksitas S
**Masalah**: `App.tsx:105` menggunakan `<Navigate to="/" replace />` untuk semua path tidak dikenal. User tidak tahu kenapa tiba-tiba diarahkan ke splash screen.

**Saran**: Buat komponen `NotFoundView.tsx` bertema CodeLingo:
```typescript
// src/views/NotFoundView.tsx
export default function NotFoundView() {
  const navigate = useNavigate();
  return (
    <div className="min-h-dvh flex flex-col items-center justify-center gap-6">
      <div className="text-8xl">🤖</div>
      <h1 className="font-display text-3xl font-900">404 — Halaman Tidak Ada</h1>
      <p style={{ color: 'var(--color-text-muted)' }}>
        Sepertinya kamu nyasar. Yuk balik ke tempat belajar!
      </p>
      <button className="btn-primary" onClick={() => navigate('/belajar')}>
        Kembali ke Belajar 🚀
      </button>
    </div>
  );
}
```
Ganti di `App.tsx`: `<Route path="*" element={<NotFoundView />} />`

---

#### [F-03] Streak Update Saat Selesai Level — **DISARANKAN** · Kompleksitas S
**Masalah**: Streak hanya update saat login (`auth.ts:63–78`). User yang tidak logout-login selama beberapa hari tidak mendapat streak meski aktif belajar.

**Saran**: Copy logika streak dari `auth.ts:63–78` ke `server/routes/progress.ts` saat `POST /complete`:
```typescript
// Tambahkan di progress.ts setelah upsert progress
const today = new Date(); today.setHours(0, 0, 0, 0);
const currentUser = await User.findById(req.user!._id);
if (currentUser) {
  const last = currentUser.lastActiveDate
    ? new Date(currentUser.lastActiveDate) : null;
  if (last) {
    last.setHours(0, 0, 0, 0);
    const diff = Math.floor((today.getTime() - last.getTime()) / 86400000);
    if (diff === 1) currentUser.streakDays += 1;
    else if (diff > 1) currentUser.streakDays = 1;
  } else {
    currentUser.streakDays = 1;
  }
  currentUser.lastActiveDate = new Date();
  await currentUser.save();
}
```

---

#### [F-04] Pagination Admin — **DISARANKAN** · Kompleksitas M
**Masalah**: Semua list admin (users, levels) tidak ada batasnya. Jika data ribuan, response bisa sangat besar dan lambat.

**Saran Backend**: Tambahkan query param `?page=1&limit=50`:
```typescript
router.get('/users', async (req, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const users = await User.find()
      .select('-password')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);
    const total = await User.countDocuments();
    res.json({ users, total, page, totalPages: Math.ceil(total / limit) });
  } catch { res.status(500).json({ message: 'Gagal.' }); }
});
```

---

### 🎨 Peningkatan UI/UX Lanjutan

---

#### [U-06] Loading Skeleton di MapView — **DISARANKAN** · Kompleksitas S
**Masalah**: Saat load course, MapView hanya menampilkan kotak abu-abu polos (`animate-pulse`). Lebih baik gunakan skeleton yang menyerupai bentuk aslinya.

**Saran**: Ganti placeholder di `MapView.tsx:380–384` dengan skeleton yang lebih informatif — tampilkan 3 card dengan shape header bab + progress circle.

---

#### [U-07] Toast Feedback Saat Streak Naik — **DISARANKAN** · Kompleksitas S
**Masalah**: User tidak mendapat notifikasi visual saat streak mereka naik setelah selesai level.

**Saran**: Di `ResultView.tsx`, bandingkan `user.streakDays` sebelum dan sesudah selesai level, lalu tampilkan toast:
```typescript
if (updatedUser.streakDays > prevStreakDays) {
  toast.success(`🔥 Streak ${updatedUser.streakDays} hari! Keren banget!`);
}
```

---

#### [U-08] Email Validation di Mongoose Schema — **DISARANKAN** · Kompleksitas S
**Masalah**: `server/models/User.ts` tidak memvalidasi format email, hanya `required: true`. Email asal-asalan bisa masuk ke database.

**Saran**:
```typescript
email: {
  type: String,
  required: true,
  unique: true,
  lowercase: true,
  trim: true,
  match: [/^\S+@\S+\.\S+$/, 'Format email tidak valid'],
},
```

---

### 🔧 Peningkatan Teknis & Arsitektur

---

#### [T-09] Optimasi GET /courses dengan MongoDB Aggregation — **DISARANKAN** · Kompleksitas M
*(Lihat juga PERF-01)* Ganti N+1 query dengan pipeline agregasi tunggal yang menghitung `chaptersCount` dan `levelsCount` sekaligus:
```typescript
const courses = await Course.aggregate([
  { $match: { isPublished: true } },
  { $sort: { order: 1 } },
  {
    $lookup: {
      from: 'chapters',
      localField: '_id',
      foreignField: 'courseId',
      as: 'chaptersArr',
    },
  },
  {
    $addFields: {
      chaptersCount: { $size: '$chaptersArr' },
    },
  },
  { $project: { chaptersArr: 0 } },
]);
```

---

#### [T-10] Gunakan `asyncHandler` Wrapper di Express Routes — **DISARANKAN** · Kompleksitas S
**Masalah**: Banyak route handler yang membutuhkan try-catch berulang (KR-01). Pola ini bisa disederhanakan dengan helper:

```typescript
// server/utils/asyncHandler.ts
import { Request, Response, NextFunction } from 'express';

export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
) => (req: Request, res: Response, next: NextFunction) => {
  fn(req, res, next).catch(next);
};
```

Penggunaan:
```typescript
router.get('/courses', asyncHandler(async (_req, res) => {
  const courses = await Course.find().sort({ order: 1 });
  res.json(courses);
}));
```

---

#### [T-11] Tambah Index pada Progress Model — **DISARANKAN** · Kompleksitas S
**Masalah**: Query `Progress.find({ userId, levelId: { $in: levelIds } })` di `courses.ts:51` bisa lambat tanpa compound index yang tepat.

Model `Progress.ts` sudah punya `userId` index dan compound `{ userId, levelId }` unique index — ini sudah baik. Tapi pastikan index benar-benar terbuat di MongoDB Atlas dengan verifikasi via `db.progresses.getIndexes()`.

---

## 📋 Ringkasan Lengkap Semua Temuan

| Kode | Tipe | Prioritas | File Utama | Status |
|------|------|-----------|------------|--------|
| BUG-01 | Bug | 🚨 CRITICAL | `progress.ts:36` | Harus fix |
| SEC-01 | Keamanan | 🚨 CRITICAL | `auth.ts:21` | Harus fix |
| SEC-02 | Keamanan | 🔴 HIGH | `admin.ts:163` | Harus fix |
| SEC-03 | Keamanan | 🔴 HIGH | `courses.ts:120` | Harus fix |
| BUG-02 | Bug | 🔴 HIGH | `LessonView.tsx:507` | Harus fix |
| BUG-03 | Bug | 🔴 HIGH | `LessonView.tsx:509` | Harus fix |
| GAP-01 | UX | 🔴 HIGH | `LessonView.tsx:537` | Harus fix |
| UX-01 | UI/UX | 🔴 HIGH | `ResultView.tsx:17` | Harus fix |
| KR-01 | Kode Rapuh | 🟡 MEDIUM | `admin.ts:34,73,146` | Disarankan |
| SEC-04 | Keamanan | 🟡 MEDIUM | `app.ts:13` | Disarankan |
| SEC-05 | Keamanan | 🟡 MEDIUM | `admin.ts:152` | Disarankan |
| UX-02 | UI/UX | 🟡 MEDIUM | `LessonView.tsx:440` | Disarankan |
| UX-03 | UI/UX | 🟡 MEDIUM | `MapView.tsx:292` | Disarankan |
| UX-04 | UI/UX | 🟡 MEDIUM | `DashboardView.tsx:59` | Disarankan |
| UX-05 | UI/UX | 🟡 MEDIUM | `AdminLayout.tsx:89` | Disarankan |
| BUG-04 | Bug | 🟡 MEDIUM | `client.ts:19` | Disarankan |
| BUG-05 | Bug | 🟡 MEDIUM | `MapView.tsx:299` | Disarankan |
| GAP-02 | Gap Fitur | 🟡 MEDIUM | `progress.ts` | Disarankan |
| GAP-03 | Gap Fitur | 🟡 MEDIUM | `gameStore.ts` | Disarankan |
| KR-02 | Kode Rapuh | 🟡 MEDIUM | `admin.ts:188` | Disarankan |
| KR-04 | Kode Rapuh | 🟡 MEDIUM | `authStore.ts:24` | Disarankan ⚠️ |
| PERF-01 | Performa | 🟡 MEDIUM | `courses.ts:16` | Disarankan |
| PERF-02 | Performa | 🟡 MEDIUM | `courses.ts:122` | Disarankan |
| PERF-03 | Performa | 🟡 MEDIUM | `admin.ts:147` | Disarankan |
| DC-01 | Dead Code | 🔵 LOW | `TopNav.tsx` | Hapus |
| DC-02 | Dead Code | 🔵 LOW | `ShopView.tsx` | Hapus |
| DC-03 | Dead Code | 🔵 LOW | `package.json` | Uninstall |
| DC-04 | Dead Code | 🔵 LOW | `views/LessonView.tsx` | Hapus |
| DC-05 | Dokumentasi | 🔵 LOW | `README.md` | Update |
| KR-03 | Kode Rapuh | 🔵 LOW | `LevelsView.tsx:296` | Disarankan |
| F-01 | Enhancement | 💡 | `auth.ts / /me` | Hearts recovery |
| F-02 | Enhancement | 💡 | `App.tsx` | Halaman 404 |
| F-03 | Enhancement | 💡 | `progress.ts` | Streak on complete |
| F-04 | Enhancement | 💡 | `admin.ts` | Pagination |
| U-06 | Enhancement | 💡 | `MapView.tsx` | Loading skeleton |
| U-07 | Enhancement | 💡 | `ResultView.tsx` | Toast streak naik |
| U-08 | Enhancement | 💡 | `User.ts` | Email validation |
| T-09 | Enhancement | 💡 | `courses.ts` | Aggregation |
| T-10 | Enhancement | 💡 | Semua routes | asyncHandler |
| T-11 | Enhancement | 💡 | `Progress.ts` | DB Index verif |
