import { useEffect, useState } from 'react';
import { ShieldCheck, ShieldOff } from 'lucide-react';
import client from '../../api/client';
import type { User } from '../../types';
import toast from 'react-hot-toast';

export default function UsersView() {
  const [users, setUsers] = useState<User[]>([]);

  const load = () => client.get<User[]>('/admin/users').then(r => setUsers(r.data));
  useEffect(() => { load(); }, []);

  const toggleRole = async (u: User) => {
    const newRole = u.role === 'admin' ? 'student' : 'admin';
    if (!confirm(`Ubah role ${u.username} menjadi ${newRole}?`)) return;
    await client.put(`/admin/users/${u._id}`, { role: newRole });
    toast.success(`Role ${u.username} diubah menjadi ${newRole}`);
    load();
  };

  return (
    <div className="p-6 max-w-5xl">
      <div className="mb-6">
        <h1 className="font-display font-800 text-2xl" style={{ fontFamily: 'var(--font-display)' }}>Pengguna 👤</h1>
        <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>{users.length} pengguna terdaftar</p>
      </div>

      <div className="rounded-2xl overflow-hidden" style={{ border: '1.5px solid var(--color-border)' }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: 'var(--color-surface-2)', borderBottom: '1px solid var(--color-border)' }}>
              {['Pengguna', 'Email', 'XP', 'Streak', 'Role', 'Aksi'].map(h => (
                <th key={h} className="px-4 py-3 text-left font-600" style={{ color: 'var(--color-text-muted)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {users.map((u, i) => (
              <tr key={u._id} style={{ borderBottom: i < users.length - 1 ? '1px solid var(--color-border)' : 'none', background: 'var(--color-surface)' }}>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <img src={u.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.username}`}
                      className="w-8 h-8 rounded-full" alt={u.username}
                      style={{ border: '2px solid var(--color-border)' }} />
                    <span className="font-600">{u.username}</span>
                  </div>
                </td>
                <td className="px-4 py-3" style={{ color: 'var(--color-text-muted)' }}>{u.email}</td>
                <td className="px-4 py-3 font-600" style={{ color: 'var(--color-cyan)' }}>{u.totalXp.toLocaleString('id')}</td>
                <td className="px-4 py-3">
                  <span className="flex items-center gap-1" style={{ color: 'var(--color-gold)' }}>
                    🔥 {u.streakDays}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className="badge" style={{
                    background: u.role === 'admin' ? 'rgba(168,85,247,0.1)' : 'rgba(94,234,212,0.1)',
                    color: u.role === 'admin' ? 'var(--color-purple)' : 'var(--color-cyan)',
                  }}>
                    {u.role === 'admin' ? '👑 Admin' : '🎓 Pelajar'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <button onClick={() => toggleRole(u)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-600 transition-all"
                    style={{
                      background: 'var(--color-surface-2)',
                      color: u.role === 'admin' ? 'var(--color-coral)' : 'var(--color-purple)',
                      border: '1px solid var(--color-border)',
                    }}>
                    {u.role === 'admin' ? <><ShieldOff size={13} /> Cabut Admin</> : <><ShieldCheck size={13} /> Jadikan Admin</>}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {users.length === 0 && (
          <div className="text-center py-12" style={{ color: 'var(--color-text-muted)' }}>
            <p className="text-4xl mb-2">👥</p><p>Belum ada pengguna.</p>
          </div>
        )}
      </div>
    </div>
  );
}
