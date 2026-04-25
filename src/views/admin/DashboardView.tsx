import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Users, BookOpen, Layers, Zap } from 'lucide-react';
import client from '../../api/client';
import type { AdminStats } from '../../types';

export default function DashboardView() {
  const [stats, setStats] = useState<AdminStats | null>(null);

  useEffect(() => {
    client.get<AdminStats>('/admin/stats').then(r => setStats(r.data)).catch(() => {});
  }, []);

  const cards = [
    { label: 'Total Pengguna', value: stats?.totalUsers ?? '-', icon: <Users size={22} />, color: 'var(--color-cyan)', bg: 'rgba(94,234,212,0.1)' },
    { label: 'Total Kelas', value: stats?.totalCourses ?? '-', icon: <BookOpen size={22} />, color: 'var(--color-primary)', bg: 'rgba(195,243,119,0.1)' },
    { label: 'Total Level', value: stats?.totalLevels ?? '-', icon: <Layers size={22} />, color: 'var(--color-purple)', bg: 'rgba(168,85,247,0.1)' },
    { label: 'Selesai Hari Ini', value: stats?.completionsToday ?? '-', icon: <Zap size={22} />, color: 'var(--color-gold)', bg: 'rgba(251,191,36,0.1)' },
  ];

  return (
    <div className="p-6 max-w-5xl">
      <div className="mb-8">
        <h1 className="font-display font-800 text-2xl mb-1" style={{ fontFamily: 'var(--font-display)' }}>
          Dashboard Admin 👑
        </h1>
        <p style={{ color: 'var(--color-text-muted)' }}>Pantau dan kelola semua konten CodeLingo di sini.</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {cards.map((c, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
            className="rounded-2xl p-5 flex flex-col gap-3"
            style={{ background: 'var(--color-surface-2)', border: '1.5px solid var(--color-border)' }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: c.bg, color: c.color }}>
              {c.icon}
            </div>
            <div>
              <div className="font-display font-900 text-3xl" style={{ color: c.color, fontFamily: 'var(--font-display)' }}>
                {c.value}
              </div>
              <div className="text-sm" style={{ color: 'var(--color-text-muted)' }}>{c.label}</div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="rounded-2xl p-6" style={{ background: 'var(--color-surface-2)', border: '1.5px solid var(--color-border)' }}>
        <h2 className="font-display font-800 text-lg mb-4" style={{ fontFamily: 'var(--font-display)' }}>Aksi Cepat</h2>
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: '🌐 Tambah Kelas Baru', to: '/admin/kelas' },
            { label: '📖 Tambah Bab', to: '/admin/bab' },
            { label: '❓ Tambah Soal', to: '/admin/soal' },
            { label: '📥 Impor JSON', to: '/admin/impor' },
          ].map(a => (
            <a key={a.to} href={a.to}
              className="px-4 py-3 rounded-xl font-600 text-sm transition-all"
              style={{ background: 'var(--color-surface-3)', color: 'var(--color-text)', border: '1.5px solid var(--color-border)' }}
              onMouseOver={e => { (e.currentTarget as any).style.borderColor = 'var(--color-purple)'; (e.currentTarget as any).style.color = 'var(--color-purple)'; }}
              onMouseOut={e => { (e.currentTarget as any).style.borderColor = 'var(--color-border)'; (e.currentTarget as any).style.color = 'var(--color-text)'; }}
            >
              {a.label}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
