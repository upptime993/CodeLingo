import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Star, Lock, BookOpen, Zap, ChevronDown, ChevronUp } from 'lucide-react';
import { coursesApi } from '../../api/courses';
import { useAuthStore } from '../../store/authStore';
import type { Course, Chapter, LevelSummary } from '../../types';

// ─── Simple Flowing Connector ─────────────────────────────────────────────────
// Menghubungkan 2 node dengan animasi "air mengalir": dash pendek bergerak
function FlowConnector({ fromLeft, fromStatus }: {
  fromLeft: boolean;    // posisi node saat ini (kiri / kanan)
  fromStatus: string;   // status node saat ini → tentukan warna flow
}) {
  const active  = fromStatus === 'completed';
  const partial = fromStatus === 'unlocked';
  const show    = active || partial;

  // ViewBox 300×60  – node kiri ≈ x=60, node kanan ≈ x=240, ctrl point x=150
  const vW = 300; const vH = 60;
  const x1 = fromLeft ? 60  : 240;   // dari sisi kiri/kanan
  const x2 = fromLeft ? 240 : 60;    // menuju sisi sebaliknya
  const path = `M ${x1} 0 Q 150 ${vH} ${x2} ${vH}`;

  return (
    <div style={{ width: '100%', height: vH }}>
      <svg width="100%" height={vH} viewBox={`0 0 ${vW} ${vH}`} preserveAspectRatio="none">
        {/* Track abu-abu */}
        <path d={path} stroke="var(--color-surface-3)" strokeWidth={4} fill="none" strokeLinecap="round" />

        {/* Isi hijau saat completed */}
        {active && (
          <motion.path
            d={path} stroke="var(--color-primary)" strokeWidth={4} fill="none" strokeLinecap="round"
            initial={{ strokeDasharray: 350, strokeDashoffset: 350 }}
            animate={{ strokeDashoffset: 0 }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
          />
        )}

        {/* Animasi "air mengalir": dashes bergerak sepanjang kurva */}
        {show && (
          <motion.path
            d={path}
            stroke={active ? 'var(--color-primary)' : 'rgba(195,243,119,0.45)'}
            strokeWidth={6}
            fill="none"
            strokeLinecap="round"
            strokeDasharray="10 30"           /* dot kecil, jarak jauh */
            animate={{ strokeDashoffset: [40, 0] }}
            transition={{ duration: 0.9, repeat: Infinity, ease: 'linear' }}
          />
        )}
      </svg>
    </div>
  );
}

// ─── Main MapView ─────────────────────────────────────────────────────────────
export default function MapView() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [expandedChapters, setExpandedChapters] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoading(true);
        setError(null);
        const list = await coursesApi.list();
        setCourses(list);
        if (list && list.length > 0) {
          await loadCourse(list[0]);
        } else {
          setLoading(false);
        }
      } catch (err: unknown) {
        console.error("Failed to load courses:", err);
        setError("Gagal memuat kelas. Pastikan server berjalan dan database terhubung.");
        setLoading(false);
      }
    };
    fetchCourses();
  }, []);

  const loadCourse = async (course: Course) => {
    setLoading(true);
    setError(null);
    setSelectedCourse(course);
    try {
      const { chapters: chs } = await coursesApi.chapters(course.slug);
      setChapters(chs || []);
      if (chs && chs.length > 0) {
        const activeChapter = chs.find(ch => ch.levels?.some(l => l.status === 'unlocked'));
        if (activeChapter) setExpandedChapters(new Set([activeChapter._id]));
        else setExpandedChapters(new Set([chs[0]?._id]));
      }
    } catch (err: unknown) {
      console.error("Failed to load chapters:", err);
      setError("Gagal memuat bab. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  const handleLevelClick = (level: LevelSummary) => {
    if (level.status === 'locked') return;
    navigate(`/belajar/${level._id}`);
  };

  const toggleChapter = (chapterId: string) => {
    setExpandedChapters(prev => {
      const next = new Set(prev);
      if (next.has(chapterId)) next.delete(chapterId);
      else next.add(chapterId);
      return next;
    });
  };

  return (
    <div className="min-h-dvh pb-28">
      {/* Top Nav */}
      <header className="sticky top-0 z-40 flex items-center justify-between px-5 h-16 backdrop-blur-md border-b"
        style={{ background: 'rgba(14,19,24,0.92)', borderColor: 'var(--color-border)' }}>
        <div className="flex items-center gap-2">
          <span className="text-xl">💻</span>
          <span className="font-display font-800 text-lg" style={{ color: 'var(--color-primary)', fontFamily: 'var(--font-display)' }}>
            CodeLingo
          </span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="text-lg">🔥</span>
            <span className="font-display font-800 text-sm" style={{ color: 'var(--color-gold)', fontFamily: 'var(--font-display)' }}>
              {user?.streakDays ?? 0}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Zap size={16} fill="currentColor" style={{ color: 'var(--color-cyan)' }} />
            <span className="font-display font-800 text-sm" style={{ color: 'var(--color-cyan)', fontFamily: 'var(--font-display)' }}>
              {user?.totalXp ?? 0}
            </span>
          </div>
          <div className="flex items-center gap-1">
            {[...Array(5)].map((_, i) => (
              <span key={i} className="text-sm" style={{ opacity: i < (user?.hearts ?? 5) ? 1 : 0.25 }}>❤️</span>
            ))}
          </div>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 pt-6">
        {/* Course Selector */}
        {courses.length > 1 && (
          <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
            {courses.map(c => (
              <button key={c._id} onClick={() => loadCourse(c)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-600 whitespace-nowrap transition-all"
                style={{
                  background: selectedCourse?._id === c._id ? 'var(--color-primary)' : 'var(--color-surface-2)',
                  color: selectedCourse?._id === c._id ? 'var(--color-on-primary)' : 'var(--color-text-muted)',
                  border: `1.5px solid ${selectedCourse?._id === c._id ? 'transparent' : 'var(--color-border)'}`,
                }}>
                <span>{c.icon}</span> {c.title}
              </button>
            ))}
          </div>
        )}

        {/* Greeting */}
        <div className="mb-6">
          <h1 className="font-display font-800 text-2xl" style={{ fontFamily: 'var(--font-display)' }}>
            Halo, <span style={{ color: 'var(--color-primary)' }}>{user?.username}</span>! 👋
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>
            Yuk lanjut belajar hari ini. Kamu pasti bisa!
          </p>
        </div>

        {error ? (
          <div className="bg-[var(--color-surface-2)] border-2 border-[var(--color-coral)] rounded-2xl p-6 text-center">
            <p className="text-[var(--color-coral)] font-600 mb-2">Oops!</p>
            <p className="text-sm text-[var(--color-text-muted)]">{error}</p>
            <button
              className="mt-4 px-4 py-2 bg-[var(--color-surface-3)] rounded-xl text-sm font-600"
              onClick={() => window.location.reload()}
            >
              Coba Lagi
            </button>
          </div>
        ) : loading ? (
          <div className="flex flex-col gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 rounded-2xl animate-pulse" style={{ background: 'var(--color-surface-2)' }} />
            ))}
          </div>
        ) : chapters.length === 0 ? (
          <div className="bg-[var(--color-surface-2)] border-2 border-[var(--color-border)] rounded-2xl p-6 text-center">
            <p className="text-[var(--color-text-dim)] font-600 mb-2">Belum ada materi</p>
            <p className="text-sm text-[var(--color-text-muted)]">Kelas ini belum memiliki bab atau level untuk dipelajari.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {chapters.map((chapter, ci) => {
              const isExpanded = expandedChapters.has(chapter._id);
              const hasActive = chapter.levels?.some(l => l.status === 'unlocked');
              const allDone = chapter.completedCount === chapter.totalCount && (chapter.totalCount ?? 0) > 0;
              const progress = chapter.totalCount ? (chapter.completedCount ?? 0) / chapter.totalCount : 0;

              return (
                <motion.div key={chapter._id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: ci * 0.06 }}>

                  {/* Chapter card */}
                  <button onClick={() => toggleChapter(chapter._id)}
                    className="w-full rounded-2xl p-4 flex items-center justify-between transition-all hover:bg-[var(--color-surface-3)] focus:ring-2 focus:ring-[var(--color-primary)] outline-none"
                    aria-expanded={isExpanded}
                    aria-label={`Toggle bab ${ci + 1}: ${chapter.title}`}
                    style={{
                      background: allDone ? 'rgba(195,243,119,0.08)' : hasActive ? 'var(--color-surface-2)' : 'var(--color-surface)',
                      border: `2px solid ${allDone ? 'var(--color-primary)' : hasActive ? 'var(--color-border)' : 'var(--color-border)'}`,
                      borderBottom: `4px solid ${allDone ? 'var(--color-primary-dim)' : 'var(--color-border)'}`,
                    }}>
                    <div className="flex items-center gap-3 text-left">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0"
                        style={{ background: allDone ? 'var(--color-primary)' : 'var(--color-surface-3)' }}>
                        {allDone ? '✅' : <BookOpen size={22} style={{ color: 'var(--color-text-muted)' }} />}
                      </div>
                      <div>
                        <p className="text-xs font-600 uppercase tracking-wider mb-0.5" style={{ color: 'var(--color-text-dim)' }}>
                          Bab {ci + 1}
                        </p>
                        <p className="font-display font-700 text-sm" style={{ fontFamily: 'var(--font-display)' }}>
                          {chapter.title}
                        </p>
                        <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                          {chapter.completedCount}/{chapter.totalCount} level selesai
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-700"
                        style={{
                          background: `conic-gradient(var(--color-primary) ${progress * 360}deg, var(--color-surface-3) 0deg)`,
                          color: 'var(--color-primary)',
                        }}>
                        <div className="w-7 h-7 rounded-full flex items-center justify-center font-800"
                          style={{ background: 'var(--color-bg)', fontSize: 11 }}>
                          {Math.round(progress * 100)}%
                        </div>
                      </div>
                      {isExpanded
                        ? <ChevronUp size={16} style={{ color: 'var(--color-text-dim)' }} />
                        : <ChevronDown size={16} style={{ color: 'var(--color-text-dim)' }} />}
                    </div>
                  </button>

                  {/* Levels */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        className="overflow-hidden">

                        {/* ── Winding path: node + connector pairs ── */}
                        <div className="flex flex-col items-center py-6 px-2">
                          {chapter.levels?.map((level, li) => {
                            const levels = chapter.levels!;
                            const isLeft     = li % 2 === 0;
                            const isCompleted = level.status === 'completed';
                            const isActive    = level.status === 'unlocked';
                            const isLocked    = level.status === 'locked';
                            const isFirstActive = isActive && li === levels.findIndex(l => l.status === 'unlocked');
                            const nextLevel   = levels[li + 1];

                            return (
                              <div key={level._id} className="flex flex-col items-stretch w-full">
                                {/* ── Node ── */}
                                <div
                                  className="flex flex-col items-center"
                                  style={{
                                    alignSelf: isLeft ? 'flex-start' : 'flex-end',
                                    marginLeft:  isLeft ? '10%' : 0,
                                    marginRight: isLeft ? 0 : '10%',
                                  }}>

                                  {/* Bounce "MULAI!" badge on first active node */}
                                  {isFirstActive && (
                                    <motion.div
                                      animate={{ y: [0, -6, 0] }}
                                      transition={{ repeat: Infinity, duration: 1.8 }}
                                      className="mb-2 px-3 py-1 rounded-xl text-xs font-800 relative"
                                      style={{
                                        background: 'var(--color-primary)',
                                        color: 'var(--color-on-primary)',
                                        fontFamily: 'var(--font-display)',
                                      }}>
                                      MULAI!
                                      <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-0 h-0"
                                        style={{
                                          borderLeft: '6px solid transparent',
                                          borderRight: '6px solid transparent',
                                          borderTop: '6px solid var(--color-primary)',
                                        }} />
                                    </motion.div>
                                  )}

                                  {/* Node button */}
                                  <div className="relative">
                                    {/* Pulse ring on active */}
                                    {isActive && (
                                      <motion.div
                                        className="absolute inset-0 rounded-full"
                                        style={{ border: '3px solid rgba(195,243,119,0.35)' }}
                                        animate={{ scale: [1, 1.3, 1], opacity: [0.8, 0, 0.8] }}
                                        transition={{ duration: 2.2, repeat: Infinity }}
                                      />
                                    )}
                                    <button
                                      id={`level-node-${level._id}`}
                                      onClick={() => handleLevelClick(level)}
                                      disabled={isLocked}
                                      aria-label={`Level: ${level.title} (${isCompleted ? 'Selesai' : isActive ? 'Terbuka' : 'Terkunci'})`}
                                      className={`w-20 h-20 rounded-full flex flex-col items-center justify-center gap-1 transition-all active:scale-95 focus:ring-4 focus:ring-[var(--color-primary)] outline-none ${isCompleted ? 'node-completed' : isActive ? 'node-active' : 'node-locked'}`}>
                                      {isCompleted && <Star size={28} fill="currentColor" style={{ color: 'var(--color-on-primary)' }} />}
                                      {isActive && (
                                        level.type === 'theory'
                                          ? <BookOpen size={28} style={{ color: 'var(--color-primary)' }} />
                                          : <Zap size={28} style={{ color: 'var(--color-primary)' }} />
                                      )}
                                      {isLocked && <Lock size={24} style={{ color: 'var(--color-text-dim)' }} />}
                                    </button>
                                  </div>

                                  {/* Label + badges */}
                                  <p className="mt-2 text-xs font-600 text-center max-w-20"
                                    style={{ color: isLocked ? 'var(--color-text-dim)' : 'var(--color-text-muted)' }}>
                                    {level.title}
                                  </p>
                                  <div className="flex items-center gap-1 mt-0.5 flex-wrap justify-center">
                                    <span className="badge" style={{
                                      background: level.type === 'theory' ? 'rgba(94,234,212,0.1)' : 'rgba(195,243,119,0.1)',
                                      color: level.type === 'theory' ? 'var(--color-cyan)' : 'var(--color-primary)',
                                    }}>
                                      {level.type === 'theory' ? '📖 Materi' : '⚡ Latihan'}
                                    </span>
                                    <span className="badge" style={{ background: 'rgba(251,191,36,0.1)', color: 'var(--color-gold)' }}>
                                      +{level.xpReward} XP
                                    </span>
                                  </div>
                                </div>

                                {/* ── Flowing connector ke node berikutnya ── */}
                                {nextLevel && (
                                  <FlowConnector
                                    fromLeft={isLeft}
                                    fromStatus={level.status || 'locked'}
                                  />
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
