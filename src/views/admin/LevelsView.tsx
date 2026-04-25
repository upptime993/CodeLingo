import React, { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, ChevronDown, ChevronUp, X, Save } from 'lucide-react';
import client from '../../api/client';
import type { Course, Chapter, Question, QuestionType, MatchPair } from '../../types';
import toast from 'react-hot-toast';
import axios from 'axios';

// ─── Types ────────────────────────────────────────────────────────────────────
interface LevelFull {
  _id: string;
  chapterId: string;
  title: string;
  type: 'theory' | 'exercise';
  orderIndex: number;
  xpReward: number;
  theory?: { contentMarkdown: string; codeExample?: string };
  questions?: Question[];
}

const QUESTION_TYPES: { value: QuestionType; label: string; desc: string }[] = [
  { value: 'multiple_choice', label: '🔘 Pilihan Ganda', desc: '4 opsi, 1 jawaban benar' },
  { value: 'true_false', label: '✅ Benar / Salah', desc: 'Pernyataan benar atau salah' },
  { value: 'fill_blank', label: '✏️ Fill in the Blank', desc: 'Lengkapi kode dengan token' },
  { value: 'code_arrange', label: '🔀 Susun Kode', desc: 'Urutkan blok kode yang acak' },
  { value: 'match', label: '🔗 Pasangkan', desc: 'Pasangkan tag dengan fungsinya' },
];

// ─── Empty question templates ─────────────────────────────────────────────────
function emptyQuestion(type: QuestionType): Question {
  const base = { type, prompt: '', correctAnswer: '', explanation: '', xpReward: 15 } as Question;
  if (type === 'multiple_choice') return { ...base, options: ['', '', '', ''] };
  if (type === 'fill_blank') return { ...base, tokens: ['', ''] };
  if (type === 'code_arrange') return { ...base, codeBlocks: ['', ''] };
  if (type === 'match') return { ...base, matchPairs: [{ left: '', right: '' }, { left: '', right: '' }] };
  return base;
}

// ─── Question Editor ──────────────────────────────────────────────────────────
function QuestionEditor({ q, onChange, onDelete, index }: {
  q: Question; onChange: (q: Question) => void; onDelete: () => void; index: number;
}) {
  const [open, setOpen] = useState(true);

  const setField = <K extends keyof Question>(key: K, val: Question[K]) => onChange({ ...q, [key]: val });

  return (
    <div className="rounded-2xl overflow-hidden" style={{ border: '1.5px solid var(--color-border)', background: 'var(--color-surface)' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 cursor-pointer"
        style={{ background: 'var(--color-surface-2)', borderBottom: open ? '1px solid var(--color-border)' : 'none' }}
        onClick={() => setOpen(o => !o)}>
        <div className="flex items-center gap-2">
          <span className="text-xs font-800 px-2 py-0.5 rounded-lg" style={{ background: 'var(--color-surface-3)', color: 'var(--color-cyan)' }}>#{index + 1}</span>
          <span className="text-sm font-600">{QUESTION_TYPES.find(t => t.value === q.type)?.label || q.type}</span>
          {q.prompt && <span className="text-xs truncate max-w-[140px]" style={{ color: 'var(--color-text-dim)' }}>— {q.prompt}</span>}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ color: 'var(--color-coral)', background: 'rgba(255,107,107,0.1)' }}>
            <X size={13} />
          </button>
          {open ? <ChevronUp size={16} style={{ color: 'var(--color-text-dim)' }} /> : <ChevronDown size={16} style={{ color: 'var(--color-text-dim)' }} />}
        </div>
      </div>

      {open && (
        <div className="p-4 flex flex-col gap-3">
          {/* Type selector */}
          <div>
            <label className="block text-xs font-600 mb-1" style={{ color: 'var(--color-text-muted)' }}>Tipe Soal</label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {QUESTION_TYPES.map(t => (
                <button key={t.value} onClick={() => onChange(emptyQuestion(t.value))}
                  className="px-2 py-2 rounded-xl text-xs text-left transition-all"
                  style={{
                    background: q.type === t.value ? 'rgba(195,243,119,0.1)' : 'var(--color-surface-2)',
                    border: `1.5px solid ${q.type === t.value ? 'var(--color-primary)' : 'var(--color-border)'}`,
                    color: q.type === t.value ? 'var(--color-primary)' : 'var(--color-text-muted)',
                  }}>
                  <div className="font-600">{t.label}</div>
                  <div className="opacity-70 text-[10px] mt-0.5">{t.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Prompt */}
          <div>
            <label className="block text-xs font-600 mb-1" style={{ color: 'var(--color-text-muted)' }}>
              Pertanyaan {q.type === 'fill_blank' ? '(gunakan ___ untuk bagian kosong)' : ''}
            </label>
            <textarea className="input-field text-sm" rows={2}
              placeholder={q.type === 'fill_blank' ? 'cth: <___ href="...">Klik</a>' : 'Tulis pertanyaan...'}
              value={q.prompt} onChange={e => setField('prompt', e.target.value)} />
          </div>

          {/* Type-specific fields */}
          {q.type === 'multiple_choice' && (
            <div>
              <label className="block text-xs font-600 mb-1" style={{ color: 'var(--color-text-muted)' }}>Opsi Jawaban (klik ✓ untuk tandai jawaban benar)</label>
              <div className="flex flex-col gap-2">
                {(q.options || ['', '', '', '']).map((opt, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <button onClick={() => setField('correctAnswer', opt)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-all"
                      style={{
                        background: q.correctAnswer === opt && opt ? 'rgba(195,243,119,0.2)' : 'var(--color-surface-3)',
                        border: `1.5px solid ${q.correctAnswer === opt && opt ? 'var(--color-primary)' : 'var(--color-border)'}`,
                        color: q.correctAnswer === opt && opt ? 'var(--color-primary)' : 'var(--color-text-dim)',
                      }}>
                      ✓
                    </button>
                    <input className="input-field text-sm flex-1" placeholder={`Opsi ${i + 1}`}
                      value={opt}
                      onChange={e => {
                        const updated = [...(q.options || [])];
                        updated[i] = e.target.value;
                        const isCorrect = q.correctAnswer === opt;
                        setField('options', updated);
                        if (isCorrect) setField('correctAnswer', e.target.value);
                      }} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {q.type === 'true_false' && (
            <div>
              <label className="block text-xs font-600 mb-1" style={{ color: 'var(--color-text-muted)' }}>Jawaban yang benar</label>
              <div className="grid grid-cols-2 gap-2">
                {[{ v: 'true', l: '✅ BENAR' }, { v: 'false', l: '❌ SALAH' }].map(o => (
                  <button key={o.v} onClick={() => setField('correctAnswer', o.v)}
                    className="py-3 rounded-xl font-700 text-sm transition-all"
                    style={{
                      background: q.correctAnswer === o.v ? 'rgba(195,243,119,0.1)' : 'var(--color-surface-2)',
                      border: `2px solid ${q.correctAnswer === o.v ? 'var(--color-primary)' : 'var(--color-border)'}`,
                      color: q.correctAnswer === o.v ? 'var(--color-primary)' : 'var(--color-text-muted)',
                    }}>{o.l}</button>
                ))}
              </div>
            </div>
          )}

          {q.type === 'fill_blank' && (
            <div>
              <label className="block text-xs font-600 mb-1" style={{ color: 'var(--color-text-muted)' }}>Token (pilihan kata, 1 yang benar)</label>
              <div className="flex flex-col gap-2">
                {(q.tokens || []).map((tk, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <button onClick={() => setField('correctAnswer', tk)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                      style={{
                        background: q.correctAnswer === tk && tk ? 'rgba(195,243,119,0.2)' : 'var(--color-surface-3)',
                        border: `1.5px solid ${q.correctAnswer === tk && tk ? 'var(--color-primary)' : 'var(--color-border)'}`,
                        color: q.correctAnswer === tk && tk ? 'var(--color-primary)' : 'var(--color-text-dim)',
                      }}>✓</button>
                    <input className="input-field text-sm font-mono flex-1" placeholder={`Token ${i + 1}`}
                      value={tk}
                      onChange={e => {
                        const upd = [...(q.tokens || [])];
                        const wasCorrect = q.correctAnswer === tk;
                        upd[i] = e.target.value;
                        onChange({ ...q, tokens: upd, correctAnswer: wasCorrect ? e.target.value : q.correctAnswer });
                      }} />
                    <button onClick={() => {
                      const upd = [...(q.tokens || [])].filter((_, j) => j !== i);
                      setField('tokens', upd);
                    }} className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ color: 'var(--color-coral)', background: 'rgba(255,107,107,0.1)' }}>
                      <X size={13} />
                    </button>
                  </div>
                ))}
                <button onClick={() => setField('tokens', [...(q.tokens || []), ''])}
                  className="py-2 rounded-xl text-xs font-600" style={{ background: 'var(--color-surface-3)', color: 'var(--color-cyan)', border: '1px dashed var(--color-border)' }}>
                  + Tambah Token
                </button>
              </div>
            </div>
          )}

          {q.type === 'code_arrange' && (
            <div>
              <label className="block text-xs font-600 mb-1" style={{ color: 'var(--color-text-muted)' }}>
                Blok Kode (urutan yang benar dari atas ke bawah)
              </label>
              <div className="flex flex-col gap-2">
                {(q.codeBlocks || []).map((blk, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="text-xs font-800 shrink-0 w-6 text-center" style={{ color: 'var(--color-text-dim)' }}>{i + 1}</span>
                    <input className="input-field text-sm font-mono flex-1" placeholder={`Baris ${i + 1}`}
                      value={blk}
                      onChange={e => {
                        const upd = [...(q.codeBlocks || [])];
                        upd[i] = e.target.value;
                        const newBlocks = upd.filter(Boolean);
                        onChange({ ...q, codeBlocks: upd, correctAnswer: JSON.stringify(newBlocks) });
                      }} />
                    <button onClick={() => {
                      const upd = [...(q.codeBlocks || [])].filter((_, j) => j !== i);
                      onChange({ ...q, codeBlocks: upd, correctAnswer: JSON.stringify(upd.filter(Boolean)) });
                    }} className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ color: 'var(--color-coral)', background: 'rgba(255,107,107,0.1)' }}>
                      <X size={13} />
                    </button>
                  </div>
                ))}
                <button onClick={() => {
                  const upd = [...(q.codeBlocks || []), ''];
                  setField('codeBlocks', upd);
                }} className="py-2 rounded-xl text-xs font-600" style={{ background: 'var(--color-surface-3)', color: 'var(--color-cyan)', border: '1px dashed var(--color-border)' }}>
                  + Tambah Blok
                </button>
                <p className="text-xs" style={{ color: 'var(--color-text-dim)' }}>
                  ℹ️ Urutan di atas adalah urutan yang BENAR. Saat tampil ke user, blok akan diacak.
                </p>
              </div>
            </div>
          )}

          {q.type === 'match' && (
            <div>
              <label className="block text-xs font-600 mb-2" style={{ color: 'var(--color-text-muted)' }}>Pasangan (Kiri ↔ Kanan)</label>
              <div className="flex flex-col gap-2">
                {(q.matchPairs || []).map((pair, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input className="input-field text-sm font-mono flex-1" placeholder={`Kiri ${i + 1} (cth: <h1>)`}
                      value={pair.left}
                      onChange={e => {
                        const upd = [...(q.matchPairs || [])] as MatchPair[];
                        upd[i] = { ...upd[i], left: e.target.value };
                        const correctMap: Record<string, string> = {};
                        upd.forEach(p => { if (p.left && p.right) correctMap[p.left] = p.right; });
                        onChange({ ...q, matchPairs: upd, correctAnswer: JSON.stringify(correctMap) });
                      }} />
                    <span style={{ color: 'var(--color-text-dim)' }}>↔</span>
                    <input className="input-field text-sm flex-1" placeholder={`Kanan ${i + 1} (cth: Heading utama)`}
                      value={pair.right}
                      onChange={e => {
                        const upd = [...(q.matchPairs || [])] as MatchPair[];
                        upd[i] = { ...upd[i], right: e.target.value };
                        const correctMap: Record<string, string> = {};
                        upd.forEach(p => { if (p.left && p.right) correctMap[p.left] = p.right; });
                        onChange({ ...q, matchPairs: upd, correctAnswer: JSON.stringify(correctMap) });
                      }} />
                    <button onClick={() => {
                      const upd = [...(q.matchPairs || [])].filter((_, j) => j !== i) as MatchPair[];
                      const correctMap: Record<string, string> = {};
                      upd.forEach(p => { if (p.left && p.right) correctMap[p.left] = p.right; });
                      onChange({ ...q, matchPairs: upd, correctAnswer: JSON.stringify(correctMap) });
                    }} className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ color: 'var(--color-coral)', background: 'rgba(255,107,107,0.1)' }}>
                      <X size={13} />
                    </button>
                  </div>
                ))}
                <button onClick={() => setField('matchPairs', [...(q.matchPairs || []), { left: '', right: '' }])}
                  className="py-2 rounded-xl text-xs font-600" style={{ background: 'var(--color-surface-3)', color: 'var(--color-cyan)', border: '1px dashed var(--color-border)' }}>
                  + Tambah Pasangan
                </button>
              </div>
            </div>
          )}

          {/* Explanation + XP */}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-600 mb-1" style={{ color: 'var(--color-text-muted)' }}>Penjelasan (opsional)</label>
              <textarea className="input-field text-sm" rows={2} placeholder="Kenapa jawaban ini benar..."
                value={q.explanation || ''} onChange={e => setField('explanation', e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-600 mb-1" style={{ color: 'var(--color-text-muted)' }}>XP Reward</label>
              <input type="number" className="input-field text-sm" value={q.xpReward}
                onChange={e => setField('xpReward', Number(e.target.value))} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
const EMPTY_LEVEL = {
  title: '', type: 'theory' as const, orderIndex: 0, xpReward: 10,
  theory: { contentMarkdown: '', codeExample: '' },
  questions: [] as Question[],
};

export default function LevelsView() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [levels, setLevels] = useState<LevelFull[]>([]);
  const [selCourse, setSelCourse] = useState('');
  const [selChapter, setSelChapter] = useState('');
  const [modal, setModal] = useState<'add' | 'edit' | null>(null);
  const [form, setForm] = useState<any>({ ...EMPTY_LEVEL });
  const [editId, setEditId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [expandedLevel, setExpandedLevel] = useState<string | null>(null);

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setError(null);
    client.get<Course[]>('/admin/courses')
      .then(r => {
        setCourses(r.data);
        if (r.data[0] && !selCourse) setSelCourse(r.data[0]._id);
      })
      .catch(() => setError('Gagal memuat daftar kelas.'));
  }, []);

  useEffect(() => {
    if (!selCourse) { setChapters([]); setSelChapter(''); return; }
    setError(null);
    client.get<Chapter[]>(`/admin/chapters?courseId=${selCourse}`)
      .then(r => {
        setChapters(r.data);
        if (r.data[0]) setSelChapter(r.data[0]._id);
        else { setSelChapter(''); setLevels([]); }
      })
      .catch(() => setError('Gagal memuat daftar bab.'));
  }, [selCourse]);

  useEffect(() => {
    if (!selChapter) { setLevels([]); return; }
    setError(null);
    client.get<LevelFull[]>(`/admin/levels?chapterId=${selChapter}`)
      .then(r => setLevels(r.data))
      .catch(() => setError('Gagal memuat daftar level.'));
  }, [selChapter]);

  const loadLevels = () => {
    if (selChapter) {
      client.get<LevelFull[]>(`/admin/levels?chapterId=${selChapter}`)
        .then(r => setLevels(r.data))
        .catch(() => toast.error('Gagal memuat ulang daftar level.'));
    }
  };

  const openAdd = () => {
    setForm({ ...EMPTY_LEVEL, orderIndex: levels.length });
    setEditId(null);
    setModal('add');
  };

  const openEdit = (lv: LevelFull) => {
    setForm({
      title: lv.title,
      type: lv.type,
      orderIndex: lv.orderIndex,
      xpReward: lv.xpReward,
      theory: lv.theory || { contentMarkdown: '', codeExample: '' },
      questions: lv.questions || [],
    });
    setEditId(lv._id);
    setModal('edit');
  };

  const handleSave = async () => {
    if (!form.title) { toast.error('Judul level wajib!'); return; }
    setLoading(true);
    try {
      const payload = {
        ...form,
        chapterId: selChapter,
        questions: form.type === 'exercise' ? (form.questions || []) : [],
        theory: form.type === 'theory' ? form.theory : undefined,
      };
      if (modal === 'add') await client.post('/admin/levels', payload);
      else await client.put(`/admin/levels/${editId}`, payload);
      toast.success(modal === 'add' ? '✅ Level berhasil ditambahkan!' : '✅ Level berhasil diperbarui!');
      setModal(null);
      loadLevels();
    } catch (err: unknown) {
      const message = axios.isAxiosError(err) ? err.response?.data?.message : null;
      toast.error(message || 'Gagal menyimpan level.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Hapus level "${title}"?`)) return;
    try {
      await client.delete(`/admin/levels/${id}`);
      toast.success('Level dihapus!');
      loadLevels();
    } catch { toast.error('Gagal menghapus.'); }
  };

  const addQuestion = (type: QuestionType) => {
    setForm((f: any) => ({ ...f, questions: [...(f.questions || []), emptyQuestion(type)] }));
  };

  const updateQuestion = (index: number, q: Question) => {
    setForm((f: any) => {
      const qs = [...(f.questions || [])];
      qs[index] = q;
      return { ...f, questions: qs };
    });
  };

  const removeQuestion = (index: number) => {
    setForm((f: any) => ({ ...f, questions: (f.questions || []).filter((_: any, i: number) => i !== index) }));
  };

  return (
    <div className="p-6 max-w-5xl">
      {error && (
        <div className="p-4 bg-red-900/30 border border-red-500/50 rounded-xl mb-4">
          <p className="text-red-400 font-600 text-sm">{error}</p>
        </div>
      )}
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display font-800 text-2xl" style={{ fontFamily: 'var(--font-display)' }}>Level & Soal 🗂️</h1>
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>{levels.length} level</p>
        </div>
        <button className="btn-primary" style={{ padding: '10px 18px', fontSize: 14 }} onClick={openAdd}>
          <Plus size={16} /> Tambah Level
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-5 flex-wrap">
        <div className="relative">
          <label className="block text-xs font-600 mb-1" style={{ color: 'var(--color-text-muted)' }}>Kelas</label>
          <select className="input-field appearance-none pr-9 text-sm min-w-[160px]" value={selCourse}
            onChange={e => setSelCourse(e.target.value)}>
            {courses.map(c => <option key={c._id} value={c._id}>{c.icon} {c.title}</option>)}
          </select>
          <ChevronDown size={14} className="absolute right-3 bottom-3 pointer-events-none" style={{ color: 'var(--color-text-dim)' }} />
        </div>
        <div className="relative">
          <label className="block text-xs font-600 mb-1" style={{ color: 'var(--color-text-muted)' }}>Bab</label>
          <select className="input-field appearance-none pr-9 text-sm min-w-[200px]" value={selChapter}
            onChange={e => setSelChapter(e.target.value)}
            disabled={chapters.length === 0}>
            {chapters.length === 0 && <option>— Pilih kelas dulu —</option>}
            {chapters.map(c => <option key={c._id} value={c._id}>{c.title}</option>)}
          </select>
          <ChevronDown size={14} className="absolute right-3 bottom-3 pointer-events-none" style={{ color: 'var(--color-text-dim)' }} />
        </div>
      </div>

      {/* Levels list */}
      <div className="flex flex-col gap-3">
        {levels.map((lv) => (
          <div key={lv._id} className="rounded-2xl overflow-hidden"
            style={{ background: 'var(--color-surface-2)', border: '1.5px solid var(--color-border)' }}>
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-2xl shrink-0">{lv.type === 'theory' ? '📖' : '⚡'}</span>
                <div className="min-w-0">
                  <p className="font-600 truncate">{lv.title}</p>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className="badge" style={{ background: lv.type === 'theory' ? 'rgba(94,234,212,0.1)' : 'rgba(195,243,119,0.1)', color: lv.type === 'theory' ? 'var(--color-cyan)' : 'var(--color-primary)', fontSize: 11 }}>
                      {lv.type === 'theory' ? 'Materi' : 'Latihan'}
                    </span>
                    {lv.type === 'exercise' && (
                      <span className="badge" style={{ background: 'rgba(251,191,36,0.1)', color: 'var(--color-gold)', fontSize: 11 }}>
                        {lv.questions?.length || 0} soal
                      </span>
                    )}
                    <span className="badge" style={{ background: 'rgba(195,243,119,0.08)', color: 'var(--color-primary)', fontSize: 11 }}>
                      +{lv.xpReward} XP
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {lv.type === 'exercise' && (
                  <button onClick={() => setExpandedLevel(expandedLevel === lv._id ? null : lv._id)}
                    className="p-2 rounded-xl text-xs" style={{ color: 'var(--color-gold)', background: 'rgba(251,191,36,0.1)' }}>
                    {expandedLevel === lv._id ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                  </button>
                )}
                <button onClick={() => openEdit(lv)} className="p-2 rounded-xl" style={{ color: 'var(--color-cyan)', background: 'var(--color-surface-3)' }}>
                  <Edit2 size={15} />
                </button>
                <button onClick={() => handleDelete(lv._id, lv.title)} className="p-2 rounded-xl" style={{ color: 'var(--color-coral)', background: 'var(--color-surface-3)' }}>
                  <Trash2 size={15} />
                </button>
              </div>
            </div>

            {/* Expanded: quick view questions */}
            {expandedLevel === lv._id && lv.questions && lv.questions.length > 0 && (
              <div className="px-4 pb-4 flex flex-col gap-2" style={{ borderTop: '1px solid var(--color-border)' }}>
                <p className="text-xs font-700 pt-3" style={{ color: 'var(--color-text-dim)' }}>SOAL:</p>
                {lv.questions.map((q, i) => (
                  <div key={i} className="flex items-center gap-3 px-3 py-2 rounded-xl" style={{ background: 'var(--color-surface-3)' }}>
                    <span className="text-xs font-800 w-5 text-center" style={{ color: 'var(--color-text-dim)' }}>{i + 1}</span>
                    <span className="text-xs font-600" style={{ color: 'var(--color-cyan)' }}>
                      {QUESTION_TYPES.find(t => t.value === q.type)?.label || q.type}
                    </span>
                    <span className="text-xs truncate flex-1" style={{ color: 'var(--color-text-muted)' }}>{q.prompt}</span>
                    <span className="text-xs" style={{ color: 'var(--color-gold)' }}>+{q.xpReward}XP</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
        {levels.length === 0 && (
          <div className="text-center py-16" style={{ color: 'var(--color-text-muted)' }}>
            <p className="text-4xl mb-2">📭</p>
            <p className="font-600">Belum ada level di bab ini.</p>
            <p className="text-sm mt-1">Klik "Tambah Level" untuk mulai!</p>
          </div>
        )}
      </div>

      {/* ─── MODAL ─────────────────────────────────────────────────────────────── */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
          style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(6px)' }}>
          <div className="w-full max-w-2xl rounded-2xl my-4"
            style={{ background: 'var(--color-surface)', border: '1.5px solid var(--color-border)' }}>

            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4"
              style={{ borderBottom: '1px solid var(--color-border)', background: 'var(--color-surface-2)', borderRadius: '16px 16px 0 0' }}>
              <h2 className="font-display font-800 text-xl" style={{ fontFamily: 'var(--font-display)' }}>
                {modal === 'add' ? '➕ Tambah Level' : '✏️ Edit Level'}
              </h2>
              <button onClick={() => setModal(null)} className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ color: 'var(--color-text-muted)', background: 'var(--color-surface-3)' }}>
                <X size={18} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[75vh] flex flex-col gap-5">
              {/* Basic info */}
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-600 mb-1" style={{ color: 'var(--color-text-muted)' }}>Judul Level *</label>
                  <input className="input-field" placeholder="cth: Apa Itu HTML?" value={form.title}
                    onChange={e => setForm({ ...form, title: e.target.value })} />
                </div>
                <div>
                  <label className="block text-xs font-600 mb-1" style={{ color: 'var(--color-text-muted)' }}>Tipe Level</label>
                  <select className="input-field" value={form.type}
                    onChange={e => setForm({ ...form, type: e.target.value })}>
                    <option value="theory">📖 Materi (Theory)</option>
                    <option value="exercise">⚡ Latihan (Exercise)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-600 mb-1" style={{ color: 'var(--color-text-muted)' }}>XP Reward</label>
                  <input type="number" className="input-field" value={form.xpReward}
                    onChange={e => setForm({ ...form, xpReward: Number(e.target.value) })} />
                </div>
              </div>

              {/* Theory fields */}
              {form.type === 'theory' && (
                <div className="flex flex-col gap-3">
                  <div>
                    <label className="block text-xs font-600 mb-1" style={{ color: 'var(--color-text-muted)' }}>
                      Konten Materi (Markdown)
                    </label>
                    <textarea className="input-field font-mono text-xs" rows={8}
                      placeholder="## Judul Materi&#10;&#10;Isi materi di sini dengan **markdown**..."
                      value={form.theory?.contentMarkdown || ''}
                      onChange={e => setForm({ ...form, theory: { ...form.theory, contentMarkdown: e.target.value } })} />
                  </div>
                  <div>
                    <label className="block text-xs font-600 mb-1" style={{ color: 'var(--color-text-muted)' }}>Contoh Kode (opsional)</label>
                    <textarea className="input-field font-mono text-xs" rows={5}
                      placeholder="<!DOCTYPE html>&#10;..."
                      value={form.theory?.codeExample || ''}
                      onChange={e => setForm({ ...form, theory: { ...form.theory, codeExample: e.target.value } })} />
                  </div>
                </div>
              )}

              {/* Exercise: question list */}
              {form.type === 'exercise' && (
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-700" style={{ fontFamily: 'var(--font-display)' }}>
                      Soal ({(form.questions || []).length})
                    </h3>
                  </div>

                  {/* Question list */}
                  {(form.questions || []).map((q: Question, i: number) => (
                    <React.Fragment key={`q-${i}`}>
                      <QuestionEditor index={i} q={q}
                        onChange={(updated) => updateQuestion(i, updated)}
                        onDelete={() => removeQuestion(i)} />
                    </React.Fragment>
                  ))}

                  {/* Add question buttons */}
                  <div>
                    <p className="text-xs font-600 mb-2" style={{ color: 'var(--color-text-dim)' }}>+ Tambah soal baru:</p>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                      {QUESTION_TYPES.map(t => (
                        <button key={t.value} onClick={() => addQuestion(t.value)}
                          className="px-3 py-3 rounded-xl text-left text-xs transition-all"
                          style={{ background: 'var(--color-surface-2)', border: '1.5px dashed var(--color-border)', color: 'var(--color-text-muted)' }}
                          onMouseOver={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--color-cyan)'; (e.currentTarget as HTMLElement).style.color = 'var(--color-cyan)'; }}
                          onMouseOut={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--color-border)'; (e.currentTarget as HTMLElement).style.color = 'var(--color-text-muted)'; }}>
                          <div className="font-700 mb-0.5">{t.label}</div>
                          <div className="opacity-60">{t.desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex gap-3 px-6 py-4" style={{ borderTop: '1px solid var(--color-border)' }}>
              <button className="btn-ghost flex-1" onClick={() => setModal(null)}>Batal</button>
              <button className="btn-primary flex-1" onClick={handleSave} disabled={loading}>
                {loading ? '🔄 Menyimpan...' : <><Save size={15} /> Simpan Level</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
