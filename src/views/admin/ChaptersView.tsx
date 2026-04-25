import { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, ChevronDown } from 'lucide-react';
import client from '../../api/client';
import type { Course, Chapter } from '../../types';
import toast from 'react-hot-toast';

export default function ChaptersView() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [modal, setModal] = useState<'add' | 'edit' | null>(null);
  const [form, setForm] = useState({ title: '', description: '', orderIndex: 0, courseId: '' });
  const [editId, setEditId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    client.get<Course[]>('/admin/courses').then(r => {
      setCourses(r.data);
      if (r.data.length > 0) setSelectedCourse(r.data[0]._id);
    });
  }, []);

  useEffect(() => {
    if (selectedCourse) {
      client.get<Chapter[]>(`/admin/chapters?courseId=${selectedCourse}`).then(r => setChapters(r.data));
    }
  }, [selectedCourse]);

  const loadChapters = () => {
    if (selectedCourse) client.get<Chapter[]>(`/admin/chapters?courseId=${selectedCourse}`).then(r => setChapters(r.data));
  };

  const openAdd = () => {
    setForm({ title: '', description: '', orderIndex: chapters.length, courseId: selectedCourse });
    setEditId(null);
    setModal('add');
  };

  const openEdit = (c: Chapter) => {
    setForm({ title: c.title, description: c.description, orderIndex: c.orderIndex, courseId: c.courseId });
    setEditId(c._id);
    setModal('edit');
  };

  const handleSave = async () => {
    if (!form.title) { toast.error('Judul bab wajib diisi!'); return; }
    setLoading(true);
    try {
      if (modal === 'add') await client.post('/admin/chapters', form);
      else await client.put(`/admin/chapters/${editId}`, form);
      toast.success(modal === 'add' ? 'Bab ditambahkan!' : 'Bab diperbarui!');
      setModal(null);
      loadChapters();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal menyimpan.');
    } finally { setLoading(false); }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Hapus bab "${title}"? Semua level di dalamnya juga terhapus!`)) return;
    try {
      await client.delete(`/admin/chapters/${id}`);
      toast.success('Bab dihapus!');
      loadChapters();
    } catch { toast.error('Gagal hapus.'); }
  };

  return (
    <div className="p-6 max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display font-800 text-2xl" style={{ fontFamily: 'var(--font-display)' }}>Bab & Level 📖</h1>
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>{chapters.length} bab</p>
        </div>
        <button className="btn-primary" style={{ padding: '10px 18px', fontSize: 14 }} onClick={openAdd}>
          <Plus size={16} /> Tambah Bab
        </button>
      </div>

      {/* Course filter */}
      <div className="relative mb-5 max-w-xs">
        <select className="input-field appearance-none pr-9" value={selectedCourse}
          onChange={e => setSelectedCourse(e.target.value)}>
          {courses.map(c => <option key={c._id} value={c._id}>{c.icon} {c.title}</option>)}
        </select>
        <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--color-text-dim)' }} />
      </div>

      {/* Chapters list */}
      <div className="flex flex-col gap-3">
        {chapters.map((ch, i) => (
          <div key={ch._id} className="rounded-2xl p-4 flex items-center justify-between"
            style={{ background: 'var(--color-surface-2)', border: '1.5px solid var(--color-border)' }}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center font-display font-800 text-sm"
                style={{ background: 'var(--color-surface-3)', color: 'var(--color-purple)', fontFamily: 'var(--font-display)' }}>
                {i + 1}
              </div>
              <div>
                <p className="font-600">{ch.title}</p>
                <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{ch.description || 'Tidak ada deskripsi'}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => openEdit(ch)} className="p-2 rounded-xl" style={{ color: 'var(--color-cyan)', background: 'var(--color-surface-3)' }}>
                <Edit2 size={15} />
              </button>
              <button onClick={() => handleDelete(ch._id, ch.title)} className="p-2 rounded-xl" style={{ color: 'var(--color-coral)', background: 'var(--color-surface-3)' }}>
                <Trash2 size={15} />
              </button>
            </div>
          </div>
        ))}
        {chapters.length === 0 && (
          <div className="text-center py-12" style={{ color: 'var(--color-text-muted)' }}>
            <p className="text-4xl mb-2">📂</p>
            <p>Belum ada bab. Tambah dulu!</p>
          </div>
        )}
      </div>

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}>
          <div className="w-full max-w-md rounded-2xl p-6" style={{ background: 'var(--color-surface-2)', border: '1.5px solid var(--color-border)' }}>
            <h2 className="font-display font-800 text-xl mb-5" style={{ fontFamily: 'var(--font-display)' }}>
              {modal === 'add' ? '➕ Tambah Bab' : '✏️ Edit Bab'}
            </h2>
            <div className="flex flex-col gap-3">
              <div>
                <label className="block text-xs font-600 mb-1" style={{ color: 'var(--color-text-muted)' }}>Judul Bab *</label>
                <input className="input-field" placeholder="cth: Bab 1: Pengenalan HTML" value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })} />
              </div>
              <div>
                <label className="block text-xs font-600 mb-1" style={{ color: 'var(--color-text-muted)' }}>Deskripsi</label>
                <textarea className="input-field" rows={2} placeholder="Deskripsi singkat..." value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })} />
              </div>
              <div>
                <label className="block text-xs font-600 mb-1" style={{ color: 'var(--color-text-muted)' }}>Urutan</label>
                <input type="number" className="input-field" value={form.orderIndex}
                  onChange={e => setForm({ ...form, orderIndex: Number(e.target.value) })} />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button className="btn-ghost flex-1" onClick={() => setModal(null)}>Batal</button>
              <button className="btn-primary flex-1" onClick={handleSave} disabled={loading}>
                {loading ? 'Menyimpan...' : 'Simpan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
