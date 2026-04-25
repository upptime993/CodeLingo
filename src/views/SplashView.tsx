import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';

export default function SplashView() {
  const navigate = useNavigate();

  return (
    <div className="min-h-dvh flex flex-col items-center justify-between px-6 py-10 relative overflow-hidden"
      style={{ background: 'linear-gradient(160deg, #0E1318 0%, #161D28 100%)' }}>

      {/* Background ambient glows */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #C3F377, transparent 70%)' }} />
        <div className="absolute bottom-1/4 right-0 w-64 h-64 rounded-full opacity-8"
          style={{ background: 'radial-gradient(circle, #5EEAD4, transparent 70%)' }} />
      </div>

      {/* Top — Brand */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="relative z-10 flex items-center gap-2 mt-4"
      >
        <span className="text-2xl">💻</span>
        <span className="font-display font-900 text-2xl" style={{ color: 'var(--color-primary)' }}>
          CodeLingo
        </span>
      </motion.div>

      {/* Center — Mascot + copy */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="relative z-10 flex flex-col items-center text-center gap-6 max-w-sm"
      >
        {/* Mascot */}
        <motion.div
          animate={{ y: [0, -12, 0] }}
          transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
          className="w-44 h-44 rounded-full flex items-center justify-center text-8xl"
          style={{
            background: 'var(--color-surface-2)',
            border: '3px solid var(--color-border)',
            boxShadow: '0 0 40px var(--color-primary-glow)',
          }}
        >
          🤖
        </motion.div>

        <div>
          <h1 className="font-display font-900 text-4xl leading-tight mb-3"
            style={{ fontFamily: 'var(--font-display)' }}>
            Belajar coding<br />
            <span style={{ color: 'var(--color-primary)' }}>jadi seru! 🚀</span>
          </h1>
          <p className="text-lg" style={{ color: 'var(--color-text-muted)' }}>
            Kuasai HTML, CSS, dan JavaScript dengan cara yang menyenangkan — kayak main game!
          </p>
        </div>

        {/* Badges features */}
        <div className="flex flex-wrap gap-2 justify-center">
          {['⭐ Level up', '🔥 Daily streak', '🏆 Achievement', '❤️ Gamifikasi'].map(f => (
            <span key={f} className="badge"
              style={{ background: 'var(--color-surface-2)', color: 'var(--color-text-muted)', border: '1px solid var(--color-border)' }}>
              {f}
            </span>
          ))}
        </div>
      </motion.div>

      {/* Bottom — CTA */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="relative z-10 w-full max-w-sm flex flex-col gap-3"
      >
        <button
          id="btn-mulai"
          className="btn-primary w-full text-base"
          style={{ fontSize: 16, padding: '16px 24px' }}
          onClick={() => navigate('/daftar')}
        >
          Mulai Belajar Gratis! 🎉
        </button>
        <button
          id="btn-masuk"
          className="btn-ghost w-full"
          onClick={() => navigate('/masuk')}
        >
          Sudah punya akun? Masuk
        </button>
      </motion.div>
    </div>
  );
}
