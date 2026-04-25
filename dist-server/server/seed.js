/**
 * SEED DATA — Bab 1: Pengenalan HTML
 * Jalankan: npm run seed
 */
import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { connectDB } from './db.js';
import User from './models/User.js';
import Course from './models/Course.js';
import Chapter from './models/Chapter.js';
import Level from './models/Level.js';
async function seed() {
    await connectDB();
    console.log('🌱 Mulai seeding...');
    // Bersihkan data lama
    await Promise.all([
        User.deleteMany({}),
        Course.deleteMany({}),
        Chapter.deleteMany({}),
        Level.deleteMany({}),
    ]);
    console.log('🗑️  Data lama dihapus');
    // ── Admin user ───────────────────────────────────────────────────────────────
    await User.create({
        username: 'admin',
        email: 'admin@codelingo.id',
        password: await bcrypt.hash('Admin123!', 10),
        role: 'admin',
        totalXp: 9999,
        streakDays: 99,
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin',
    });
    console.log('👤 Admin dibuat: admin@codelingo.id / Admin123!');
    // ── Course: HTML Dasar ────────────────────────────────────────────────────────
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
    console.log('📚 Kelas HTML Dasar dibuat');
    // ── Chapter 1: Pengenalan HTML ────────────────────────────────────────────────
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

**HTML** (*HyperText Markup Language*) adalah bahasa markup standar yang digunakan untuk membuat halaman web.

Gampangnya, HTML adalah **kerangka** atau **tulang** dari sebuah website. Bayangin membangun rumah — HTML adalah fondasi dan temboknya.

### HTML bukan bahasa pemrograman!
HTML tidak bisa melakukan logika seperti *if-else* atau loop. HTML hanya mendeskripsikan **struktur konten** di halaman web.

### Sejarah singkat HTML
- **1991** — Tim Berners-Lee menciptakan HTML pertama kali
- **1995** — HTML 2.0 (versi pertama yang terstandar)
- **2014** — HTML5 dirilis, yang kita pakai sampai sekarang

### Gimana HTML bekerja?
1. Kamu nulis kode HTML di file \`.html\`
2. Browser (Chrome, Firefox, dll) membaca file itu
3. Browser menampilkan hasilnya sebagai halaman web yang indah ✨`,
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
    // Level 2 — Exercise: Quiz HTML Dasar
    await Level.create({
        chapterId: ch1._id,
        title: 'Kuis: Apa Itu HTML?',
        type: 'exercise',
        orderIndex: 1,
        xpReward: 50,
        questions: [
            {
                type: 'multiple_choice',
                prompt: 'HTML adalah singkatan dari...?',
                options: [
                    'HyperText Markup Language',
                    'Home Tool Markup Language',
                    'Hyper Transfer Markup Logic',
                    'High Text Machine Language',
                ],
                correctAnswer: 'HyperText Markup Language',
                explanation: 'HTML = HyperText Markup Language. "Hyper" artinya tautan antar halaman, "Markup" artinya penanda, "Language" artinya bahasa.',
                xpReward: 15,
            },
            {
                type: 'true_false',
                prompt: 'HTML adalah bahasa pemrograman seperti Python atau JavaScript.',
                correctAnswer: 'false',
                explanation: 'Salah! HTML adalah bahasa MARKUP, bukan bahasa pemrograman. HTML tidak bisa melakukan logika if-else atau loop.',
                xpReward: 15,
            },
            {
                type: 'multiple_choice',
                prompt: 'Ekstensi file HTML yang benar adalah...?',
                options: ['.html', '.hml', '.web', '.htm5'],
                correctAnswer: '.html',
                explanation: 'File HTML disimpan dengan ekstensi .html (atau .htm). Contoh: index.html, tentang.html',
                xpReward: 20,
            },
        ],
    });
    // Level 3 — Theory: Perbedaan HTML, CSS, dan JavaScript
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
HTML adalah **kerangka** website. Dia menentukan konten apa yang ada di halaman: judul, paragraf, gambar, tombol, dll.

> *"Apa yang ada di halaman ini?"*

### 🎨 CSS — Tampilan  
CSS (*Cascading Style Sheets*) mengatur **tampilan visual** website: warna, font, ukuran, tata letak, dan animasi.

> *"Tampilan halaman ini seperti apa?"*

### ⚡ JavaScript — Interaksi
JavaScript adalah bahasa pemrograman yang membuat website **interaktif**: klik tombol, animasi, validasi form, dan masih banyak lagi.

> *"Apa yang terjadi saat user berinteraksi?"*

---

### Analogi keren 🏠

Bayangin kamu lagi bangun rumah:
- **HTML** = Pondasi, dinding, atap (struktur)
- **CSS** = Cat, furnitur, dekorasi (tampilan)
- **JavaScript** = Listrik, AC, kunci otomatis (fungsionalitas)

Ketiganya saling melengkapi!`,
            codeExample: `<!-- HTML: Struktur -->
<button id="tombol">Klik Aku!</button>

<!-- CSS: Tampilan (di dalam <style>) -->
<style>
  #tombol {
    background: lime;
    padding: 10px 20px;
    border-radius: 8px;
    font-size: 18px;
  }
</style>

<!-- JavaScript: Interaksi (di dalam <script>) -->
<script>
  document.getElementById('tombol')
    .addEventListener('click', function() {
      alert('Halo! Tombolnya diklik! 🎉');
    });
</script>`,
        },
    });
    // Level 4 — Exercise: Quiz Perbedaan
    await Level.create({
        chapterId: ch1._id,
        title: 'Kuis: HTML, CSS, atau JavaScript?',
        type: 'exercise',
        orderIndex: 3,
        xpReward: 50,
        questions: [
            {
                type: 'multiple_choice',
                prompt: 'Untuk mengubah warna teks di halaman web, teknologi apa yang digunakan?',
                options: ['HTML', 'CSS', 'JavaScript', 'PHP'],
                correctAnswer: 'CSS',
                explanation: 'CSS (Cascading Style Sheets) digunakan untuk mengatur tampilan visual seperti warna, font, ukuran, dan tata letak.',
                xpReward: 15,
            },
            {
                type: 'multiple_choice',
                prompt: 'Kamu ingin membuat tombol yang saat diklik menampilkan pesan. Teknologi apa yang kamu butuhkan?',
                options: ['HTML saja', 'CSS saja', 'JavaScript', 'Ketiganya harus ada'],
                correctAnswer: 'JavaScript',
                explanation: 'JavaScript digunakan untuk menambahkan interaktivitas seperti menangani klik tombol dan menampilkan pesan.',
                xpReward: 15,
            },
            {
                type: 'true_false',
                prompt: 'HTML, CSS, dan JavaScript harus selalu digunakan bersamaan untuk membuat website.',
                correctAnswer: 'false',
                explanation: 'Tidak selalu! Kamu bisa membuat halaman web sederhana hanya dengan HTML. CSS dan JavaScript adalah tambahan untuk mempercantik dan memberi interaksi.',
                xpReward: 20,
            },
        ],
    });
    console.log('✅ Level Bab 1 berhasil dibuat (4 level, 6 soal)');
    console.log('\n🎉 Seeding selesai!');
    console.log('📧 Login admin: admin@codelingo.id');
    console.log('🔑 Password: Admin123!');
    await mongoose.disconnect();
    process.exit(0);
}
seed().catch((err) => {
    console.error('❌ Error seeding:', err);
    process.exit(1);
});
