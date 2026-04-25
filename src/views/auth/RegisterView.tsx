import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, User } from 'lucide-react';
import { authApi } from '../../api/auth';
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';

export default function RegisterView() {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const [form, setForm] = useState({ username: '', email: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password.length < 6) {
      toast.error('Password minimal 6 karakter ya!');
      return;
    }
    setLoading(true);
    try {
      const res = await authApi.register(form);
      login(res);
      toast.success(`Yeay! Akun berhasil dibuat. Selamat belajar, ${res.user.username}! 🎉`);
      navigate('/belajar');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Daftar gagal. Coba lagi!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-dvh flex items-center justify-center px-5 py-10"
      style={{ background: 'linear-gradient(160deg, #0E1318 0%, #161D28 100%)' }}>

      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-64 opacity-10 rounded-full"
          style={{ background: 'radial-gradient(circle, #C3F377, transparent 70%)' }} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm relative z-10"
      >
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 justify-center mb-6">
            <span className="text-3xl">💻</span>
            <span className="font-display font-900 text-2xl" style={{ color: 'var(--color-primary)', fontFamily: 'var(--font-display)' }}>
              CodeLingo
            </span>
          </Link>
          <h1 className="font-display text-2xl font-800 mb-1" style={{ fontFamily: 'var(--font-display)' }}>
            Buat Akun Gratis! 🎉
          </h1>
          <p style={{ color: 'var(--color-text-muted)' }}>Mulai perjalanan coding kamu sekarang</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Username */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-600" style={{ color: 'var(--color-text-muted)' }}>Username</label>
            <div className="relative">
              <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-text-dim)' }} />
              <input
                id="input-username"
                type="text"
                placeholder="username_keren"
                className="input-field"
                style={{ paddingLeft: '42px' }}
                value={form.username}
                onChange={e => setForm({ ...form, username: e.target.value })}
                minLength={3}
                maxLength={30}
                required
              />
            </div>
          </div>

          {/* Email */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-600" style={{ color: 'var(--color-text-muted)' }}>Email</label>
            <div className="relative">
              <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-text-dim)' }} />
              <input
                id="input-email"
                type="email"
                placeholder="kamu@email.com"
                className="input-field"
                style={{ paddingLeft: '42px' }}
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>
          </div>

          {/* Password */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-600" style={{ color: 'var(--color-text-muted)' }}>Password</label>
            <div className="relative">
              <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-text-dim)' }} />
              <input
                id="input-password"
                type={showPw ? 'text' : 'password'}
                placeholder="Min. 6 karakter"
                className="input-field"
                style={{ paddingLeft: '42px', paddingRight: '46px' }}
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                minLength={6}
                required
              />
              <button type="button" className="absolute right-4 top-1/2 -translate-y-1/2"
                style={{ color: 'var(--color-text-dim)' }}
                aria-label={showPw ? 'Sembunyikan password' : 'Tampilkan password'}
                title={showPw ? 'Sembunyikan password' : 'Tampilkan password'}
                onClick={() => setShowPw(!showPw)}>
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <p className="text-xs" style={{ color: 'var(--color-text-dim)' }}>Minimal 6 karakter</p>
          </div>

          <button
            id="btn-daftar"
            type="submit"
            disabled={loading}
            className="btn-primary w-full mt-2"
            style={{ opacity: loading ? 0.7 : 1 }}
          >
            {loading ? 'Membuat akun...' : 'Daftar Sekarang 🚀'}
          </button>
        </form>

        <p className="text-center mt-6 text-sm" style={{ color: 'var(--color-text-muted)' }}>
          Sudah punya akun?{' '}
          <Link to="/masuk" className="font-700" style={{ color: 'var(--color-primary)' }}>
            Masuk di sini
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
