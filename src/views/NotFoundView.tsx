import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';

export default function NotFoundView() {
  const navigate = useNavigate();
  return (
    <div className="min-h-dvh flex flex-col items-center justify-center gap-6 px-6"
      style={{ background: 'linear-gradient(160deg, #0E1318 0%, #161D28 100%)' }}>
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
          🤖
        </motion.div>
        <h1 className="font-display font-900 text-4xl mb-3" style={{ fontFamily: 'var(--font-display)' }}>
          404
        </h1>
        <p className="text-xl font-700 mb-2">Halaman Tidak Ada</p>
        <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
          Sepertinya kamu nyasar. Yuk balik ke tempat belajar!
        </p>
      </motion.div>
      <button className="btn-primary" style={{ fontSize: 16, padding: '14px 32px' }}
        onClick={() => navigate('/belajar')}>
        Kembali ke Belajar 🚀
      </button>
    </div>
  );
}
