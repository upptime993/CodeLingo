import { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, Eye, EyeOff } from 'lucide-react';
import client from '../../api/client';
import type { Course } from '../../types';
import toast from 'react-hot-toast';

const EMPTY: Omit<Course, '_id' | 'chaptersCount' | 'levelsCount'> = {
  title: '', slug: '', description: '', icon: '📚', colorHex: '#C3F377',
  difficulty: 'Pemula', isPublished: false, order: 0,
};

export default function CoursesView() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [modal, setModal] = useState<'add' | 'edit' | null>(null);
  const [form, setForm] = useState({ ...EMPTY });
  const [editId, setEditId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const load = () => client.get<Course[]>('/admin/courses').then(r => setCourses(r.data));
  useEffect(() => { load(); }, []);

  const openAdd = () => { setForm({ ...EMPTY }); setEditId(null); setModal('add'); };
  const openEdit = (c: Course) => { setForm({ ...c }); setEditId(c._id); setModal('edit'); };
  const closeModal = () => setModal(null);

  const slugify = (s: string) => s.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

  const handleSave = async () => {
    if (!form.title || !form.slug) { toast.error('Judul dan slug wajib diisi!'); return; }
    setLoading(true);
    try {
      if (modal === 'add') await client.post('/admin/courses', form);
      else await client.put(`/admin/courses/${editId}`, form);
      toast.success(modal === 'add' ? 'Kelas berhasil ditambahkan!' : 'Kelas berhasil diperbarui!');
      closeModal(); load();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal menyimpan.');
    } finally { setLoading(false); }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Hapus kelas "${title}"? Semua bab dan level di dalamnya juga akan terhapus!`)) return;
    try {
      await client.delete(`/admin/courses/${id}`);
      toast.success('Kelas dihapus!');
      load();
    } catch { toast.error('Gagal hapus.'); }
  };

  const togglePublish = async (c: Course) => {
    await client.put(`/admin/courses/${c._id}`, { isPublished: !c.isPublished });
    toast.success(!c.isPublished ? 'Kelas dipublikasikan!' : 'Kelas disembunyikan.');
    load();
  };

  return (
    <div className="p-6 max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display font-800 text-2xl" style={{ fontFamily: 'var(--font-display)' }}>Kelola Kelas 📚</h1>
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>{courses.length} kelas tersedia</p>
        </div>
        <button id="btn-tambah-kelas" className="btn-primary" style={{ padding: '10px 18px', fontSize: 14 }} onClick={openAdd}>
          <Plus size={16} /> Tambah Kelas
        </button>
      </div>

      {/* Table */}
      <div className="rounded-2xl overflow-hidden" style={{ border: '1.5px solid var(--color-border)' }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: 'var(--color-surface-2)', borderBottom: '1px solid var(--color-border)' }}>
              {['Kelas', 'Slug', 'Level', 'Status', 'Aksi'].map(h => (
                <th key={h} className="px-4 py-3 text-left font-600" style={{ color: 'var(--color-text-muted)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {courses.map((c, i) => (
              <tr key={c._id} style={{ borderBottom: i < courses.length - 1 ? '1px solid var(--color-border)' : 'none', background: 'var(--color-surface)' }}>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{c.icon}</span>
                    <div>
                      <p className="font-600">{c.title}</p>
                      <span className="badge" style={{ background: 'rgba(94,234,212,0.1)', color: 'var(--color-cyan)', fontSize: 10 }}>{c.difficulty}</span>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 font-mono text-xs" style={{ color: 'var(--color-text-dim)' }}>{c.slug}</td>
                <td className="px-4 py-3" style={{ color: 'var(--color-text-muted)' }}>{c.levelsCount ?? 0} level</td>
                <td className="px-4 py-3">
                  <span className="badge" style={{
                    background: c.isPublished ? 'rgba(195,243,119,0.1)' : 'rgba(123,139,164,0.1)',
                    color: c.isPublished ? 'var(--color-primary)' : 'var(--color-text-muted)',
                  }}>
                    {c.isPublished ? '✅ Publik' : '🔒 Draft'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => togglePublish(c)} className="p-1.5 rounded-lg transition-colors"
                      style={{ color: c.isPublished ? 'var(--color-text-muted)' : 'var(--color-primary)', background: 'var(--color-surface-2)' }}
                      title={c.isPublished ? 'Sembunyikan' : 'Publikasikan'}>
                      {c.isPublished ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                    <button onClick={() => openEdit(c)} className="p-1.5 rounded-lg" style={{ color: 'var(--color-cyan)', background: 'var(--color-surface-2)' }}>
                      <Edit2 size={15} />
                    </button>
                    <button onClick={() => handleDelete(c._id, c.title)} className="p-1.5 rounded-lg" style={{ color: 'var(--color-coral)', background: 'var(--color-surface-2)' }}>
                      <Trash2 size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {courses.length === 0 && (
          <div className="text-center py-12" style={{ color: 'var(--color-text-muted)' }}>
            <p className="text-4xl mb-2">📭</p>
            <p>Belum ada kelas. Tambah dulu yuk!</p>
          </div>
        )}
      </div>

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}>
          <div className="w-full max-w-md rounded-2xl p-6" style={{ background: 'var(--color-surface-2)', border: '1.5px solid var(--color-border)' }}>
            <h2 className="font-display font-800 text-xl mb-5" style={{ fontFamily: 'var(--font-display)' }}>
              {modal === 'add' ? '➕ Tambah Kelas' : '✏️ Edit Kelas'}
            </h2>
            <div className="flex flex-col gap-3">
              <div>
                <label className="block text-xs font-600 mb-1" style={{ color: 'var(--color-text-muted)' }}>Judul Kelas *</label>
                <input className="input-field" placeholder="cth: HTML Dasar" value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value, slug: slugify(e.target.value) })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-600 mb-1" style={{ color: 'var(--color-text-muted)' }}>Slug *</label>
                  <input className="input-field font-mono text-sm" placeholder="html-dasar" value={form.slug}
                    onChange={e => setForm({ ...form, slug: slugify(e.target.value) })} />
                </div>
                <div>
                  <label className="block text-xs font-600 mb-1" style={{ color: 'var(--color-text-muted)' }}>Icon (emoji)</label>
                  <input className="input-field" placeholder="📚" value={form.icon}
                    onChange={e => setForm({ ...form, icon: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-600 mb-1" style={{ color: 'var(--color-text-muted)' }}>Deskripsi</label>
                <textarea className="input-field" rows={2} placeholder="Deskripsi singkat kelas..." value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })} />
              </div>
              <div>
                <label className="block text-xs font-600 mb-1" style={{ color: 'var(--color-text-muted)' }}>Level Kesulitan</label>
                <select className="input-field" value={form.difficulty}
                  onChange={e => setForm({ ...form, difficulty: e.target.value as any })}>
                  {['Pemula', 'Menengah', 'Mahir'].map(d => <option key={d}>{d}</option>)}
                </select>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.isPublished}
                  onChange={e => setForm({ ...form, isPublished: e.target.checked })} className="w-4 h-4" />
                <span className="text-sm font-600">Langsung publikasikan</span>
              </label>
            </div>
            <div className="flex gap-3 mt-6">
              <button className="btn-ghost flex-1" onClick={closeModal}>Batal</button>
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
