import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Settings, Zap, Flame, Trophy, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { coursesApi } from '../api/courses';
import type { LeaderboardEntry } from '../types';

export default function ProfileView() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);

  useEffect(() => {
    coursesApi.leaderboard().then(setLeaderboard).catch(() => {});
  }, []);

  const userRank = leaderboard.findIndex(e => e._id === user?._id) + 1;

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (!user) return null;

  return (
    <div className="min-h-dvh pb-28">
      {/* Header */}
      <header className="sticky top-0 z-40 flex items-center justify-between px-5 h-16 backdrop-blur-md border-b"
        style={{ background: 'rgba(14,19,24,0.92)', borderColor: 'var(--color-border)' }}>
        <h1 className="font-display font-800 text-lg" style={{ fontFamily: 'var(--font-display)' }}>Profilku</h1>
        <div className="flex items-center gap-2">
          {user.role === 'admin' && (
            <button onClick={() => navigate('/admin')}
              className="px-3 py-1.5 rounded-xl text-xs font-700"
              style={{ background: 'var(--color-purple)', color: '#fff' }}>
              Admin Panel
            </button>
          )}
          <button onClick={handleLogout}
            className="w-9 h-9 rounded-xl flex items-center justify-center transition-colors"
            style={{ background: 'var(--color-surface-2)', color: 'var(--color-coral)', border: '1.5px solid var(--color-border)' }}>
            <LogOut size={18} />
          </button>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 pt-6 flex flex-col gap-6">
        {/* Profile card */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl p-6 flex items-center gap-4"
          style={{ background: 'var(--color-surface-2)', border: '1.5px solid var(--color-border)' }}>
          <img
            src={user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`}
            alt={user.username}
            className="w-20 h-20 rounded-full"
            style={{ border: '3px solid var(--color-primary)' }}
          />
          <div>
            <h2 className="font-display font-800 text-xl" style={{ fontFamily: 'var(--font-display)' }}>{user.username}</h2>
            <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>{user.email}</p>
            <div className="flex items-center gap-2 mt-2">
              <span className="badge" style={{ background: 'rgba(195,243,119,0.1)', color: 'var(--color-primary)' }}>
                {user.role === 'admin' ? '👑 Admin' : '🎓 Pelajar'}
              </span>
              {userRank > 0 && (
                <span className="badge" style={{ background: 'rgba(251,191,36,0.1)', color: 'var(--color-gold)' }}>
                  🏆 #{userRank} Leaderboard
                </span>
              )}
            </div>
          </div>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: <Zap size={20} fill="currentColor" />, value: user.totalXp.toLocaleString('id'), label: 'Total XP', color: 'var(--color-cyan)' },
            { icon: <Flame size={20} fill="currentColor" />, value: `${user.streakDays}`, label: 'Hari Streak', color: 'var(--color-gold)' },
            { icon: <span className="text-xl">❤️</span>, value: `${user.hearts}/5`, label: 'Nyawa', color: 'var(--color-coral)' },
          ].map((stat, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
              className="flex flex-col items-center gap-2 py-5 rounded-2xl"
              style={{ background: 'var(--color-surface-2)', border: '1.5px solid var(--color-border)' }}>
              <span style={{ color: stat.color }}>{stat.icon}</span>
              <span className="font-display font-900 text-2xl" style={{ color: stat.color, fontFamily: 'var(--font-display)' }}>{stat.value}</span>
              <span className="text-xs font-600" style={{ color: 'var(--color-text-muted)' }}>{stat.label}</span>
            </motion.div>
          ))}
        </div>

        {/* Leaderboard */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display font-800 text-lg flex items-center gap-2" style={{ fontFamily: 'var(--font-display)' }}>
              <Trophy size={20} style={{ color: 'var(--color-gold)' }} />
              Papan Peringkat
            </h2>
          </div>

          <div className="flex flex-col gap-2">
            {leaderboard.slice(0, 10).map((entry, i) => {
              const isMe = entry._id === user?._id;
              const medals: Record<number, string> = { 0: '🥇', 1: '🥈', 2: '🥉' };
              return (
                <motion.div key={entry._id}
                  initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl"
                  style={{
                    background: isMe ? 'rgba(195,243,119,0.06)' : 'var(--color-surface-2)',
                    border: `1.5px solid ${isMe ? 'var(--color-primary)' : 'var(--color-border)'}`,
                  }}>
                  <span className="w-7 text-center font-800 text-sm" style={{ color: i < 3 ? 'var(--color-gold)' : 'var(--color-text-dim)' }}>
                    {medals[i] ?? `#${i + 1}`}
                  </span>
                  <img src={entry.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${entry.username}`}
                    className="w-8 h-8 rounded-full" alt={entry.username}
                    style={{ border: '2px solid var(--color-border)' }} />
                  <span className="flex-1 font-600 text-sm">{entry.username}{isMe ? ' (kamu)' : ''}</span>
                  <div className="flex items-center gap-1">
                    <Zap size={13} style={{ color: 'var(--color-cyan)' }} />
                    <span className="font-800 text-sm" style={{ color: 'var(--color-cyan)' }}>{entry.totalXp.toLocaleString('id')}</span>
                  </div>
                </motion.div>
              );
            })}
            {leaderboard.length === 0 && (
              <div className="text-center py-10" style={{ color: 'var(--color-text-muted)' }}>
                <p className="text-4xl mb-2">🏁</p>
                <p>Belum ada data. Jadilah yang pertama di leaderboard!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
