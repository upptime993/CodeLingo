import 'dotenv/config';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import bcrypt from 'bcryptjs';
import { connectDB } from '../server/db.js';
import User from '../server/models/User.js';
import Course from '../server/models/Course.js';
import Chapter from '../server/models/Chapter.js';
import Level from '../server/models/Level.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Guard: hanya bisa diakses kalau ada secret key yang benar
  const secret = req.query.secret;
  if (!secret || secret !== process.env.SEED_SECRET) {
    return res.status(403).json({ message: '❌ Forbidden: secret salah atau tidak ada.' });
  }

  try {
    await connectDB();

    // Hapus semua data lama
    await Promise.all([
      User.deleteMany({}),
      Course.deleteMany({}),
      Chapter.deleteMany({}),
      Level.deleteMany({}),
    ]);

    // ── Admin user ──────────────────────────────────────────────────────────
    await User.create({
      username: 'admin',
      email: 'admin@codelingo.id',
      password: await bcrypt.hash('Admin123!', 10),
      role: 'admin',
      totalXp: 9999,
      streakDays: 99,
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin',
    });

    // ── Course: HTML Dasar ──────────────────────────────────────────────────
    const htmlCourse = await Course.create({
      title: 'HTML Dasar',
      slug: 'html',
      description: 'Pelajari dasar-dasar HTML dari nol! Bangun fondasi kuat untuk karir web developer kamu.',
      icon: '🌐',
      colorHex: '#C3F377',
      difficulty: 'Pemula',
      isPublished: true,
      order: 1,
    });

    // ── Chapter 1 ───────────────────────────────────────────────────────────
    const ch1 = await Chapter.create({
      courseId: htmlCourse._id,
      title: 'Bab 1: Pengenalan HTML',
      description: 'Kenalan sama HTML dan teman-temannya!',
      orderIndex: 0,
    });

    // Level 1 — Theory: Apa Itu HTML?
    await Level.create({
      chapterId: ch1._id,
      title: 'Apa Itu HTML?',
      type: 'theory',
      orderIndex: 0,
      xpReward: 10,
      theory: {
        contentMarkdown: `## Apa Itu HTML? 🤔

**HTML** (*HyperText Markup Language*) adalah bahasa markup standar untuk membuat halaman web.

Gampangnya, HTML adalah **kerangka** atau **tulang** dari sebuah website. Bayangin membangun rumah — HTML adalah fondasi dan temboknya.

### HTML bukan bahasa pemrograman!
HTML tidak bisa melakukan logika seperti *if-else* atau loop. HTML hanya mendeskripsikan **struktur konten** di halaman web.

### Cara HTML Bekerja
1. Kamu nulis kode HTML di file \`.html\`
2. Browser membaca file itu
3. Browser menampilkan hasilnya sebagai halaman web ✨`,
        codeExample: `<!DOCTYPE html>
<html lang="id">
  <head>
    <title>Halaman Pertamaku</title>
  </head>
  <body>
    <h1>Halo, Dunia! 👋</h1>
    <p>Ini halaman web pertamaku.</p>
  </body>
</html>`,
      },
    });

    // Level 2 — Exercise: Kuis Pengenalan HTML
    await Level.create({
      chapterId: ch1._id,
      title: 'Kuis: Pengenalan HTML (Semua Tipe Soal)',
      type: 'exercise',
      orderIndex: 1,
      xpReward: 100,
      questions: [
        {
          type: 'multiple_choice',
          prompt: 'HTML adalah singkatan dari...?',
          options: [
            'HyperText Markup Language',
            'Home Tool Markup Language',
            'Hyper Transfer Machine Logic',
            'High Text Module Language',
          ],
          correctAnswer: 'HyperText Markup Language',
          explanation: 'HTML = HyperText Markup Language. "Hyper" artinya tautan, "Markup" artinya penanda, "Language" artinya bahasa.',
          xpReward: 15,
        },
        {
          type: 'true_false',
          prompt: 'HTML adalah bahasa pemrograman seperti Python atau JavaScript.',
          correctAnswer: 'false',
          explanation: 'Salah! HTML adalah bahasa MARKUP, bukan bahasa pemrograman. HTML tidak bisa melakukan logika if-else atau loop.',
          xpReward: 10,
        },
        {
          type: 'fill_blank',
          prompt: 'Tag HTML untuk membuat heading terbesar adalah <___>.',
          tokens: ['h1', 'h6', 'header', 'title', 'head'],
          correctAnswer: 'h1',
          explanation: '<h1> adalah tag heading terbesar. Ada h1 sampai h6, semakin besar angkanya semakin kecil ukurannya.',
          xpReward: 15,
        },
        {
          type: 'code_arrange',
          prompt: 'Susun struktur HTML yang benar dari atas ke bawah!',
          codeBlocks: [
            '<!DOCTYPE html>',
            '<html lang="id">',
            '  <head>',
            '    <title>Halaman Web</title>',
            '  </head>',
            '  <body>',
            '    <h1>Halo!</h1>',
            '  </body>',
            '</html>',
          ],
          correctAnswer: JSON.stringify([
            '<!DOCTYPE html>',
            '<html lang="id">',
            '  <head>',
            '    <title>Halaman Web</title>',
            '  </head>',
            '  <body>',
            '    <h1>Halo!</h1>',
            '  </body>',
            '</html>',
          ]),
          explanation: 'Struktur HTML selalu dimulai dengan <!DOCTYPE html>, lalu <html>, di dalamnya ada <head> dan <body>.',
          xpReward: 25,
        },
        {
          type: 'match',
          prompt: 'Pasangkan tag HTML dengan fungsinya!',
          matchPairs: [
            { left: '<h1>', right: 'Heading terbesar' },
            { left: '<p>', right: 'Paragraf teks' },
            { left: '<img>', right: 'Gambar' },
            { left: '<a>', right: 'Tautan / link' },
          ],
          correctAnswer: JSON.stringify({
            '<h1>': 'Heading terbesar',
            '<p>': 'Paragraf teks',
            '<img>': 'Gambar',
            '<a>': 'Tautan / link',
          }),
          explanation: 'Setiap tag HTML punya fungsi khusus. Memahami fungsi tag dasar sangat penting untuk mulai coding HTML!',
          xpReward: 30,
        },
      ],
    });

    // Level 3 — Theory: HTML vs CSS vs JS
    await Level.create({
      chapterId: ch1._id,
      title: 'HTML vs CSS vs JavaScript',
      type: 'theory',
      orderIndex: 2,
      xpReward: 10,
      theory: {
        contentMarkdown: `## Perbedaan HTML, CSS, dan JavaScript 🎯

Dalam membuat website, ada 3 teknologi utama yang bekerja bareng:

### 🏗️ HTML — Struktur
HTML adalah **kerangka** website. Dia menentukan konten: judul, paragraf, gambar, tombol.

> *"Apa yang ada di halaman ini?"*

### 🎨 CSS — Tampilan
CSS (*Cascading Style Sheets*) mengatur **tampilan visual**: warna, font, ukuran, tata letak.

> *"Tampilan halaman ini seperti apa?"*

### ⚡ JavaScript — Interaksi
JavaScript membuat website **interaktif**: klik tombol, animasi, validasi form.

> *"Apa yang terjadi saat user berinteraksi?"*

---

### Analogi 🏠
- **HTML** = Dinding & atap (struktur)
- **CSS** = Cat & dekorasi (tampilan)
- **JavaScript** = Listrik & sistem pintar (fungsi)`,
        codeExample: `<!-- HTML: Struktur -->
<button id="tombol">Klik Aku!</button>

<!-- CSS: Tampilan -->
<style>
  #tombol {
    background: #C3F377;
    padding: 10px 24px;
    border-radius: 8px;
    font-weight: bold;
    cursor: pointer;
  }
</style>

<!-- JavaScript: Interaksi -->
<script>
  document.getElementById('tombol')
    .addEventListener('click', () => {
      alert('Halo! Tombolnya diklik! 🎉');
    });
</script>`,
      },
    });

    // Level 4 — Exercise: HTML vs CSS vs JS
    await Level.create({
      chapterId: ch1._id,
      title: 'Kuis: HTML, CSS, atau JavaScript?',
      type: 'exercise',
      orderIndex: 3,
      xpReward: 75,
      questions: [
        {
          type: 'multiple_choice',
          prompt: 'Untuk mengubah warna teks di halaman web, teknologi apa yang digunakan?',
          options: ['HTML', 'CSS', 'JavaScript', 'PHP'],
          correctAnswer: 'CSS',
          explanation: 'CSS digunakan untuk mengatur tampilan visual seperti warna, font, dan ukuran.',
          xpReward: 15,
        },
        {
          type: 'true_false',
          prompt: 'JavaScript dapat digunakan untuk menampilkan pesan alert saat tombol diklik.',
          correctAnswer: 'true',
          explanation: 'Benar! JavaScript menangani interaksi seperti klik tombol menggunakan event listener.',
          xpReward: 10,
        },
        {
          type: 'fill_blank',
          prompt: 'Untuk membuat paragraf di HTML, gunakan tag <___>.',
          tokens: ['p', 'div', 'span', 'text', 'para'],
          correctAnswer: 'p',
          explanation: 'Tag <p> digunakan untuk membuat paragraf teks di HTML.',
          xpReward: 15,
        },
        {
          type: 'match',
          prompt: 'Pasangkan teknologi web dengan fungsinya!',
          matchPairs: [
            { left: 'HTML', right: 'Struktur halaman' },
            { left: 'CSS', right: 'Tampilan visual' },
            { left: 'JavaScript', right: 'Interaktivitas' },
          ],
          correctAnswer: JSON.stringify({
            'HTML': 'Struktur halaman',
            'CSS': 'Tampilan visual',
            'JavaScript': 'Interaktivitas',
          }),
          explanation: 'HTML, CSS, dan JavaScript masing-masing punya peran berbeda namun saling melengkapi!',
          xpReward: 20,
        },
      ],
    });

    return res.status(200).json({
      message: '✅ Seed berhasil!',
      data: {
        admin: 'admin@codelingo.id / Admin123!',
        course: 'HTML Dasar',
        chapters: 1,
        levels: 4,
      },
    });

  } catch (err: any) {
    console.error('Seed error:', err);
    return res.status(500).json({ message: '❌ Seed gagal', error: err.message });
  }
}
