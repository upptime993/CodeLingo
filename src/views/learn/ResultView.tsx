import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { useAuthStore } from '../../store/authStore';

interface ResultState {
  xpGained: number;
  score: number;
  correctCount: number;
  totalQuestions: number;
  isTheory?: boolean;
}

export default function ResultView() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const { user } = useAuthStore();
  const { xpGained, score, correctCount, totalQuestions, isTheory } = (state as ResultState) ?? {};

  const isGood = !isTheory && score >= 66;
  const isPerfect = !isTheory && score === 100;

  const emoji = isPerfect ? '🏆' : isGood ? '🎉' : isTheory ? '📖' : '😅';
  const title = isPerfect
    ? 'Sempurna!'
    : isGood
    ? 'Keren banget!'
    : isTheory
    ? 'Materi selesai!'
    : 'Terus semangat!';
  const subtitle = isPerfect
    ? 'Kamu jawab semua dengan benar!'
    : isGood
    ? `${correctCount} dari ${totalQuestions} jawaban benar.`
    : isTheory
    ? 'Kamu sudah baca materinya. Lanjut ke kuis!'
    : `${correctCount} dari ${totalQuestions} jawaban benar. Jangan menyerah!`;

  return (
    <div className="min-h-dvh flex flex-col items-center justify-between px-5 py-10"
      style={{ background: 'linear-gradient(160deg, #0E1318 0%, #161D28 100%)' }}>

      {/* Ambient glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-80 h-80 rounded-full opacity-10"
          style={{ background: `radial-gradient(circle, ${isPerfect ? '#FBBF24' : isGood ? '#C3F377' : '#FF6B6B'}, transparent 70%)` }} />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center gap-8 max-w-sm w-full relative z-10">
        {/* Main content */}
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', damping: 12 }}
          className="text-center"
        >
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ repeat: Infinity, duration: 2.5 }}
            className="text-8xl mb-6"
          >
            {emoji}
          </motion.div>

          <h1 className="font-display font-900 text-4xl mb-3" style={{ fontFamily: 'var(--font-display)' }}>
            {title}
          </h1>
          <p className="text-lg" style={{ color: 'var(--color-text-muted)' }}>{subtitle}</p>
        </motion.div>

        {/* Stats */}
        <div className="flex gap-4 w-full">
          {/* XP */}
          <motion.div
            initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }}
            className="flex-1 flex flex-col items-center gap-1 py-5 rounded-2xl"
            style={{ background: 'var(--color-surface-2)', border: '1.5px solid var(--color-border)' }}
          >
            <span className="text-2xl">⚡</span>
            <motion.div
              initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.5, type: 'spring' }}
              className="font-display font-900 text-3xl" style={{ color: 'var(--color-cyan)', fontFamily: 'var(--font-display)' }}
            >
              +{xpGained}
            </motion.div>
            <span className="text-xs font-600" style={{ color: 'var(--color-text-muted)' }}>XP didapat</span>
          </motion.div>

          {/* Akurasi */}
          {!isTheory && (
            <motion.div
              initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4 }}
              className="flex-1 flex flex-col items-center gap-1 py-5 rounded-2xl"
              style={{ background: 'var(--color-surface-2)', border: '1.5px solid var(--color-border)' }}
            >
              <span className="text-2xl">{score >= 66 ? '🎯' : '📊'}</span>
              <motion.div
                initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.6, type: 'spring' }}
                className="font-display font-900 text-3xl"
                style={{ color: score >= 66 ? 'var(--color-primary)' : 'var(--color-coral)', fontFamily: 'var(--font-display)' }}
              >
                {score}%
              </motion.div>
              <span className="text-xs font-600" style={{ color: 'var(--color-text-muted)' }}>Akurasi</span>
            </motion.div>
          )}

          {/* Streak */}
          <motion.div
            initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.5 }}
            className="flex-1 flex flex-col items-center gap-1 py-5 rounded-2xl"
            style={{ background: 'var(--color-surface-2)', border: '1.5px solid var(--color-border)' }}
          >
            <span className="text-2xl">🔥</span>
            <motion.div
              initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.7, type: 'spring' }}
              className="font-display font-900 text-3xl" style={{ color: 'var(--color-gold)', fontFamily: 'var(--font-display)' }}
            >
              {user?.streakDays ?? 0}
            </motion.div>
            <span className="text-xs font-600" style={{ color: 'var(--color-text-muted)' }}>Streak</span>
          </motion.div>
        </div>
      </div>

      {/* CTA */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="w-full max-w-sm relative z-10"
      >
        <button
          id="btn-lanjut-hasil"
          className="btn-primary w-full"
          style={{ fontSize: 16, padding: '16px 24px' }}
          onClick={() => navigate('/belajar')}
        >
          Lanjut Belajar 🚀
        </button>
      </motion.div>
    </div>
  );
}
