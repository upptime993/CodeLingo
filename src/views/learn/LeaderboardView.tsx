import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Trophy, Zap } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { coursesApi } from '../../api/courses';
import type { LeaderboardEntry } from '../../types';

export default function LeaderboardView() {
  const { user } = useAuthStore();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    coursesApi.leaderboard()
      .then(setLeaderboard)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-dvh pb-28" style={{ background: 'var(--color-bg)' }}>
      {/* Header */}
      <header className="sticky top-0 z-40 flex items-center justify-between px-5 h-16 backdrop-blur-md border-b"
        style={{ background: 'rgba(14,19,24,0.92)', borderColor: 'var(--color-border)' }}>
        <div className="flex items-center gap-2">
          <Trophy size={20} style={{ color: 'var(--color-gold)' }} />
          <h1 className="font-display font-800 text-lg" style={{ fontFamily: 'var(--font-display)' }}>Peringkat</h1>
        </div>
      </header>

      <div className="max-w-md mx-auto px-4 pt-6">
        <div className="mb-6">
          <h2 className="font-display font-800 text-xl" style={{ fontFamily: 'var(--font-display)' }}>
            Leaderboard Top 100
          </h2>
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>
            Kumpulkan XP dengan menyelesaikan pelajaran untuk naik peringkat!
          </p>
        </div>

        <div className="flex flex-col gap-2">
          {loading ? (
            // Skeleton Loading
            [...Array(5)].map((_, i) => (
              <div key={i} className="animate-pulse flex items-center gap-3 px-4 py-3 rounded-xl"
                style={{ background: 'var(--color-surface-2)', border: '1.5px solid var(--color-border)' }}>
                <div className="w-7 h-6 rounded" style={{ background: 'var(--color-surface-3)' }} />
                <div className="w-10 h-10 rounded-full" style={{ background: 'var(--color-surface-3)' }} />
                <div className="flex-1 h-4 rounded" style={{ background: 'var(--color-surface-3)' }} />
                <div className="w-12 h-4 rounded" style={{ background: 'var(--color-surface-3)' }} />
              </div>
            ))
          ) : leaderboard.length === 0 ? (
            // Empty State
            <div className="text-center py-16" style={{ color: 'var(--color-text-muted)' }}>
              <p className="text-5xl mb-3">🏁</p>
              <p className="font-bold">Belum ada data peringkat</p>
              <p className="text-sm">Jadilah yang pertama menyelesaikan kelas!</p>
            </div>
          ) : (
            // Leaderboard List
            leaderboard.map((entry, i) => {
              const isMe = entry._id === user?._id;
              const medals: Record<number, string> = { 0: '🥇', 1: '🥈', 2: '🥉' };
              
              // Highlight styles for top 3
              let borderColor = isMe ? 'var(--color-primary)' : 'var(--color-border)';
              let bgColor = isMe ? 'rgba(195,243,119,0.06)' : 'var(--color-surface-2)';

              if (i === 0) {
                borderColor = 'var(--color-gold)';
                if (!isMe) bgColor = 'rgba(251,191,36,0.05)';
              } else if (i === 1) {
                borderColor = '#E2E8F0'; // Silver
                if (!isMe) bgColor = 'rgba(226,232,240,0.05)';
              } else if (i === 2) {
                borderColor = '#D97706'; // Bronze
                if (!isMe) bgColor = 'rgba(217,119,6,0.05)';
              }

              return (
                <motion.div key={entry._id}
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all"
                  style={{ background: bgColor, border: `2px solid ${borderColor}` }}>
                  
                  <span className="w-7 text-center font-900 text-lg" 
                    style={{ 
                      color: i === 0 ? 'var(--color-gold)' : i === 1 ? '#E2E8F0' : i === 2 ? '#D97706' : 'var(--color-text-dim)',
                      fontFamily: 'var(--font-display)' 
                    }}>
                    {medals[i] ?? `#${i + 1}`}
                  </span>
                  
                  <img src={entry.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${entry.username}`}
                    className="w-10 h-10 rounded-full" alt={entry.username}
                    style={{ border: `2px solid ${borderColor}` }} />
                  
                  <div className="flex-1 flex flex-col">
                    <span className="font-800 text-base" style={{ fontFamily: 'var(--font-display)', color: isMe ? 'var(--color-primary)' : 'var(--color-text)' }}>
                      {entry.username} {isMe && '(kamu)'}
                    </span>
                    {entry.streakDays > 0 && (
                      <span className="text-xs font-bold flex items-center gap-1" style={{ color: 'var(--color-gold)' }}>
                        🔥 {entry.streakDays}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg" style={{ background: 'rgba(94, 234, 212, 0.1)' }}>
                    <Zap size={14} style={{ color: 'var(--color-cyan)' }} />
                    <span className="font-900 text-sm" style={{ color: 'var(--color-cyan)' }}>{entry.totalXp.toLocaleString('id')}</span>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
