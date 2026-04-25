import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Upload, CheckCircle2, XCircle, Download, Copy } from 'lucide-react';
import client from '../../api/client';
import toast from 'react-hot-toast';
import type { ImportPayload } from '../../types';

// ─── Sample JSON dengan semua 5 tipe soal ─────────────────────────────────────
const SAMPLE: ImportPayload = {
  course: {
    title: "CSS Dasar",
    slug: "css-dasar",
    description: "Pelajari cara mempercantik website dengan CSS!",
    icon: "🎨",
    colorHex: "#5EEAD4",
    difficulty: "Pemula",
  },
  chapters: [
    {
      title: "Bab 1: Pengenalan CSS",
      description: "Kenalan sama CSS dan cara kerjanya!",
      levels: [
        {
          title: "Apa Itu CSS?",
          type: "theory",
          xpReward: 10,
          theory: {
            contentMarkdown: "## Apa Itu CSS?\n\nCSS (*Cascading Style Sheets*) adalah bahasa untuk **mengatur tampilan** halaman web.\n\n### Analogi Rumah\n- **HTML** = Kerangka / struktur rumah\n- **CSS** = Cat, furnitur, dan dekorasi\n- **JavaScript** = Listrik dan sistem otomatis",
            codeExample: "/* Selector { property: value; } */\nbody {\n  background: #0E1318;\n  color: white;\n  font-family: 'Inter', sans-serif;\n}\n\nh1 {\n  color: #C3F377;\n  font-size: 2rem;\n}"
          }
        },
        {
          title: "Kuis: Semua Tipe Soal",
          type: "exercise",
          xpReward: 100,
          questions: [
            {
              type: "multiple_choice",
              prompt: "CSS adalah singkatan dari...?",
              options: [
                "Cascading Style Sheets",
                "Colorful Style System",
                "Computer Stylesheet Script",
                "Creative Style Syntax"
              ],
              correctAnswer: "Cascading Style Sheets",
              explanation: "CSS = Cascading Style Sheets. Dipakai untuk mengatur tampilan visual halaman web.",
              xpReward: 15
            },
            {
              type: "true_false",
              prompt: "CSS digunakan untuk mengatur warna dan ukuran font pada halaman web.",
              correctAnswer: "true",
              explanation: "Benar! color dan font-size adalah dua properti CSS yang sering dipakai.",
              xpReward: 10
            },
            {
              type: "fill_blank",
              prompt: "Untuk mengubah warna teks di CSS: ___ : red;",
              tokens: ["color", "font", "background", "border"],
              correctAnswer: "color",
              explanation: "Properti 'color' mengatur warna teks. Contoh: color: red;",
              xpReward: 15
            },
            {
              type: "code_arrange",
              prompt: "Susun kode CSS yang benar untuk mengatur tampilan heading!",
              codeBlocks: [
                "h1 {",
                "  color: #C3F377;",
                "  font-size: 2rem;",
                "}"
              ],
              correctAnswer: "[\"h1 {\",\"  color: #C3F377;\",\"  font-size: 2rem;\",\"}\"]",
              explanation: "Struktur CSS: selector { property: value; } — selector dulu, lalu kurung kurawal buka, isi properti, lalu kurung kurawal tutup.",
              xpReward: 20
            },
            {
              type: "match",
              prompt: "Pasangkan properti CSS dengan fungsinya!",
              matchPairs: [
                { "left": "color", "right": "Warna teks" },
                { "left": "background", "right": "Warna latar" },
                { "left": "font-size", "right": "Ukuran huruf" },
                { "left": "border", "right": "Garis tepi elemen" }
              ],
              correctAnswer: "{\"color\":\"Warna teks\",\"background\":\"Warna latar\",\"font-size\":\"Ukuran huruf\",\"border\":\"Garis tepi elemen\"}",
              explanation: "Setiap properti CSS punya fungsi spesifik. Memahami pasangannya penting untuk nulis CSS yang benar!",
              xpReward: 25
            }
          ]
        }
      ]
    }
  ]
};

export default function ImportView() {
  const [rawJson, setRawJson] = useState('');
  const [parsed, setParsed] = useState<ImportPayload | null>(null);
  const [parseError, setParseError] = useState('');
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const totalQuestions = (p: ImportPayload) =>
    p.chapters.reduce((a, c) => a + c.levels.reduce((b, l) => b + (l.questions?.length || 0), 0), 0);

  const totalLevels = (p: ImportPayload) =>
    p.chapters.reduce((a, c) => a + c.levels.length, 0);

  const handleParse = () => {
    try {
      const data = JSON.parse(rawJson);
      if (!data.course || !data.chapters) throw new Error('JSON harus memiliki field "course" dan "chapters".');
      if (!data.course.slug) throw new Error('course.slug wajib diisi!');
      setParsed(data);
      setParseError('');
      toast.success('JSON valid! 🎉');
    } catch (e: any) {
      setParseError(e.message);
      setParsed(null);
    }
  };

  const handleImport = async () => {
    if (!parsed) return;
    setImporting(true);
    try {
      const { data } = await client.post('/admin/import', parsed);
      setResult(data.message);
      setRawJson('');
      setParsed(null);
      toast.success('Impor berhasil! 🎉');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Impor gagal! Cek format JSON kamu.');
    } finally {
      setImporting(false);
    }
  };

  const downloadSample = () => {
    const blob = new Blob([JSON.stringify(SAMPLE, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'codelingo-import-sample.json'; a.click();
    URL.revokeObjectURL(url);
  };

  const copySample = () => {
    navigator.clipboard.writeText(JSON.stringify(SAMPLE, null, 2));
    toast.success('Contoh JSON disalin ke clipboard!');
  };

  const TYPE_EMOJI: Record<string, string> = {
    multiple_choice: '🔘',
    true_false: '✅',
    fill_blank: '✏️',
    code_arrange: '🔀',
    match: '🔗',
  };

  return (
    <div className="p-6 max-w-5xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="font-display font-800 text-2xl" style={{ fontFamily: 'var(--font-display)' }}>
          Impor Konten via JSON 📥
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>
          Tambah banyak materi & soal (semua 5 tipe) sekaligus dengan paste JSON. Cocok buat output AI generator!
        </p>
      </div>

      {/* Tipe soal yang didukung */}
      <div className="flex flex-wrap gap-2 mb-6">
        {Object.entries(TYPE_EMOJI).map(([type, emoji]) => (
          <div key={type} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-600"
            style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', color: 'var(--color-text-muted)' }}>
            <span>{emoji}</span>
            <span>{type.replace('_', ' ')}</span>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* ── Left: Input ── */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-700 text-base" style={{ fontFamily: 'var(--font-display)' }}>📋 Paste JSON di sini</h2>
            <div className="flex gap-2">
              <button onClick={copySample}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-600"
                style={{ background: 'var(--color-surface-2)', color: 'var(--color-cyan)', border: '1px solid var(--color-border)' }}>
                <Copy size={12} /> Salin Contoh
              </button>
              <button onClick={downloadSample}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-600"
                style={{ background: 'var(--color-surface-2)', color: 'var(--color-primary)', border: '1px solid var(--color-border)' }}>
                <Download size={12} /> Unduh
              </button>
            </div>
          </div>

          <textarea
            className="input-field font-mono text-xs"
            rows={20}
            placeholder={`Paste JSON di sini...\n\nStruktur dasar:\n{\n  "course": { "title": "...", "slug": "...", ... },\n  "chapters": [\n    {\n      "title": "Bab 1",\n      "levels": [\n        { "title": "...", "type": "theory", "theory": {...} },\n        { "title": "...", "type": "exercise", "questions": [...] }\n      ]\n    }\n  ]\n}`}
            value={rawJson}
            onChange={e => { setRawJson(e.target.value); setParsed(null); setParseError(''); setResult(null); }}
            style={{ fontFamily: 'var(--font-mono)' }}
          />

          {parseError && (
            <div className="mt-3 px-4 py-3 rounded-xl flex items-start gap-2"
              style={{ background: 'rgba(255,107,107,0.08)', border: '1px solid var(--color-coral)' }}>
              <XCircle size={16} style={{ color: 'var(--color-coral)', marginTop: 2 }} />
              <p className="text-sm" style={{ color: 'var(--color-coral)' }}>{parseError}</p>
            </div>
          )}

          <div className="flex gap-3 mt-3">
            <button id="btn-validate" className="btn-ghost flex-1" onClick={handleParse} disabled={!rawJson.trim()}>
              🔍 Validasi JSON
            </button>
            <button id="btn-import" className="btn-primary flex-1" onClick={handleImport} disabled={!parsed || importing}>
              {importing ? '🔄 Mengimpor...' : <><Upload size={15} /> Impor Sekarang</>}
            </button>
          </div>
        </div>

        {/* ── Right: Preview ── */}
        <div>
          <h2 className="font-700 text-base mb-3" style={{ fontFamily: 'var(--font-display)' }}>
            👀 Preview / Skema JSON
          </h2>

          <AnimatePresence mode="wait">
            {/* Sukses */}
            {result && (
              <motion.div key="result" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                className="rounded-2xl p-8 flex flex-col items-center text-center gap-4"
                style={{ background: 'rgba(195,243,119,0.06)', border: '2px solid var(--color-primary)' }}>
                <span className="text-6xl">🎉</span>
                <h3 className="font-800 text-xl" style={{ color: 'var(--color-primary)', fontFamily: 'var(--font-display)' }}>
                  Impor Berhasil!
                </h3>
                <p style={{ color: 'var(--color-text-muted)' }}>{result}</p>
                <button className="btn-ghost mt-2" onClick={() => setResult(null)}>Impor Lagi</button>
              </motion.div>
            )}

            {/* Preview */}
            {parsed && !result && (
              <motion.div key="preview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-3">
                <div className="flex items-center gap-2 px-4 py-3 rounded-xl"
                  style={{ background: 'rgba(195,243,119,0.06)', border: '1px solid var(--color-primary)' }}>
                  <CheckCircle2 size={18} style={{ color: 'var(--color-primary)' }} />
                  <span className="font-700 text-sm" style={{ color: 'var(--color-primary)' }}>JSON valid! Siap diimpor.</span>
                </div>

                {/* Summary */}
                <div className="rounded-2xl p-4" style={{ background: 'var(--color-surface-2)', border: '1.5px solid var(--color-border)' }}>
                  <p className="font-700 mb-3">📊 Ringkasan Impor:</p>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {[
                      { label: 'Kelas', value: `${parsed.course.icon || '📚'} ${parsed.course.title}` },
                      { label: 'Slug', value: parsed.course.slug },
                      { label: 'Bab', value: `${parsed.chapters.length} bab` },
                      { label: 'Level', value: `${totalLevels(parsed)} level` },
                      { label: 'Total Soal', value: `${totalQuestions(parsed)} soal` },
                      { label: 'Kesulitan', value: parsed.course.difficulty || 'Pemula' },
                    ].map(item => (
                      <div key={item.label} className="flex flex-col">
                        <span className="text-xs" style={{ color: 'var(--color-text-dim)' }}>{item.label}</span>
                        <span className="font-600">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Chapter breakdown */}
                {parsed.chapters.map((ch, i) => (
                  <div key={i} className="rounded-xl p-3" style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)' }}>
                    <p className="font-700 text-sm mb-2">📂 {ch.title}</p>
                    {ch.levels.map((lv, j) => (
                      <div key={j} className="flex items-center gap-2 py-1 text-xs" style={{ color: 'var(--color-text-muted)' }}>
                        <span>{lv.type === 'theory' ? '📖' : '⚡'}</span>
                        <span className="flex-1 truncate">{lv.title}</span>
                        {lv.questions && lv.questions.length > 0 && (
                          <span className="flex items-center gap-1">
                            {[...new Set(lv.questions.map(q => q.type))].map((t) => (
                              <span key={t as string}>{TYPE_EMOJI[t as string] || '❓'}</span>
                            ))}
                            <span style={{ color: 'var(--color-gold)' }}>{lv.questions.length} soal</span>
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                ))}
              </motion.div>
            )}

            {/* Schema example */}
            {!parsed && !result && (
              <motion.div key="schema" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="rounded-2xl overflow-hidden" style={{ border: '1.5px solid var(--color-border)' }}>
                <div className="px-4 py-2 flex items-center gap-2"
                  style={{ background: 'var(--color-surface-3)', borderBottom: '1px solid var(--color-border)' }}>
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#FF5F56' }} />
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#FFBD2E' }} />
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#27C93F' }} />
                  <span className="text-xs ml-1" style={{ color: 'var(--color-text-dim)' }}>codelingo-import.json (semua 5 tipe soal)</span>
                </div>
                <pre className="p-4 text-xs overflow-auto max-h-[500px]" style={{
                  color: 'var(--color-primary)',
                  fontFamily: 'var(--font-mono)',
                  background: '#0A0E16',
                  lineHeight: 1.7,
                }}>
                  {JSON.stringify(SAMPLE, null, 2)}
                </pre>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
