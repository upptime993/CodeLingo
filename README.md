# 💻 CodeLingo

Platform pembelajaran pemrograman interaktif berbasis gamifikasi — belajar HTML, CSS, dan JavaScript dengan cara yang menyenangkan, seperti main game!

## ✨ Fitur

- 🗺️ **Peta Belajar** — Level tersusun seperti peta dengan sistem lock/unlock
- ❤️ **Hearts System** — Nyawa terbatas saat kuis, pulih otomatis tiap 8 jam
- 🔥 **Daily Streak** — Streak harian untuk memotivasi belajar konsisten
- ⚡ **XP & Leaderboard** — Kumpulkan XP dan bersaing di papan peringkat
- 5 tipe soal: Pilihan Ganda, Benar/Salah, Isi Bagian Kosong, Susun Kode, Pasangkan
- 👑 **Admin Panel** — CRUD course/bab/level + import masal via JSON

## 🛠️ Tech Stack

| Layer | Teknologi |
|-------|-----------|
| Frontend | React 19 + Vite + TypeScript |
| Styling | Tailwind CSS v4 + CSS Variables |
| Routing | React Router DOM v7 |
| State | Zustand (+ persist) |
| Animasi | Motion (Framer Motion) |
| Backend | Express.js + TypeScript |
| Database | MongoDB + Mongoose |
| Auth | JWT + bcryptjs |
| Deploy | Vercel (Serverless Functions) |

## 🚀 Setup Lokal

### 1. Clone & Install

```bash
git clone https://github.com/your-repo/CodeLingo.git
cd CodeLingo
npm install
```

### 2. Environment Variables

Buat file `.env` di root (lihat `.env.example`):

```env
MONGODB_URI=mongodb+srv://...
JWT_SECRET=random-secret-panjang-dan-aman
FRONTEND_URL=http://localhost:5173
PORT=3001
```

> ⚠️ **Penting**: Pastikan `JWT_SECRET` selalu diset. Server tidak akan start tanpa env var ini.

### 3. Jalankan Development

```bash
# Frontend + Backend sekaligus
npm run dev

# Atau terpisah:
npm run dev:client   # React (Vite) di port 5173
npm run dev:server   # Express di port 3001
```

### 4. Seed Data (Opsional)

```bash
npm run seed
```

## 📁 Struktur Folder

```
CodeLingo/
├── api/                    # Vercel serverless entry point
├── server/
│   ├── middleware/         # auth.ts (JWT guard)
│   ├── models/             # Mongoose schemas
│   ├── routes/             # Express API routes
│   └── utils/              # Helper functions
├── src/
│   ├── api/                # Axios API client & endpoints
│   ├── components/         # Shared UI components
│   ├── store/              # Zustand stores (auth, game)
│   ├── types/              # TypeScript types
│   └── views/
│       ├── admin/          # Admin panel views
│       ├── auth/           # Login & Register
│       └── learn/          # MapView, LessonView, ResultView
└── public/
```

## 🌐 Deploy ke Vercel

1. Push ke GitHub
2. Import repo di [vercel.com](https://vercel.com)
3. Set environment variables di Vercel dashboard
4. Deploy otomatis via `vercel.json`

## 📝 Format Import JSON

Admin dapat mengimpor materi secara massal melalui `/admin/impor`. Format file JSON:

```json
{
  "course": {
    "title": "Belajar HTML",
    "slug": "belajar-html",
    "description": "...",
    "icon": "🌐",
    "isPublished": true
  },
  "chapters": [
    {
      "title": "Bab 1: Pengenalan",
      "levels": [
        {
          "title": "Apa Itu HTML?",
          "type": "theory",
          "xpReward": 10,
          "theory": {
            "contentMarkdown": "## Apa Itu HTML?\n\nHTML adalah...",
            "codeExample": "<!DOCTYPE html>\n<html>...</html>"
          }
        }
      ]
    }
  ]
}
```
