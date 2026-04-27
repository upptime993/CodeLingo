import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown, ChevronUp, Lock, CheckCircle2, Circle, BookOpen, Zap, X, Star } from 'lucide-react';
import toast from 'react-hot-toast';
import { coursesApi } from '../../api/courses';
import { useAuthStore } from '../../store/authStore';
import type { Course, Chapter, LevelSummary } from '../../types';

// ─── Zigzag positions (% dari kiri) ──────────────────────────────────────────
const ZIG = [22, 50, 78, 50, 22];
function getZig(li: number) { return ZIG[li % ZIG.length]; }

// ─── SVG Connector ────────────────────────────────────────────────────────────
function NodeConnector({ fromLi, toLi, fromStatus }: { fromLi: number; toLi: number; fromStatus: string }) {
  const x1 = getZig(fromLi);
  const x2 = getZig(toLi);
  const active = fromStatus === 'completed';
  const show   = active || fromStatus === 'unlocked';
  const H = 72;
  const path = `M ${x1} 0 Q ${(x1 + x2) / 2} ${H / 2} ${x2} ${H}`;

  return (
    <svg width="100%" height={H} viewBox={`0 0 100 ${H}`} preserveAspectRatio="none" style={{ display: 'block' }}>
      <path d={path} stroke="var(--color-surface-3)" strokeWidth={3} fill="none" strokeLinecap="round" />
      {active && (
        <motion.path
          d={path} stroke="var(--color-primary)" strokeWidth={3} fill="none" strokeLinecap="round"
          initial={{ strokeDasharray: 200, strokeDashoffset: 200 }}
          animate={{ strokeDashoffset: 0 }}
          transition={{ duration: 0.6 }}
        />
      )}
      {show && (
        <motion.path
          d={path}
          stroke={active ? 'var(--color-primary)' : 'rgba(195,243,119,0.5)'}
          strokeWidth={5} fill="none" strokeLinecap="round" strokeDasharray="8 25"
          animate={{ strokeDashoffset: [33, 0] }}
          transition={{ duration: 0.75, repeat: Infinity, ease: 'linear' }}
        />
      )}
    </svg>
  );
}

// ─── Info Popup ───────────────────────────────────────────────────────────────
function InfoPopup({ level, li, onClose, onStart }: {
  level: LevelSummary; li: number; onClose: () => void; onStart: () => void;
}) {
  const left = getZig(li);
  const isLocked = level.status === 'locked';
  // posisi popup: kiri, tengah, atau kanan tergantung node
  const popupStyle: React.CSSProperties =
    left <= 30
      ? { left: 0 }
      : left >= 70
      ? { right: 0 }
      : { left: '50%', transform: 'translateX(-50%)' };

  // posisi arrow
  const arrowLeft =
    left <= 30 ? `${left}%` : left >= 70 ? `${100 - left}%` : '50%';

  return (
    <motion.div
      data-popup="true"
      initial={{ opacity: 0, y: 6, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 6, scale: 0.96 }}
      transition={{ duration: 0.14 }}
      className="absolute z-30 rounded-2xl p-4 shadow-2xl"
      style={{
        ...popupStyle,
        bottom: 72,
        width: 210,
        background: 'var(--color-surface-2)',
        border: '1.5px solid var(--color-border)',
      }}
    >
      {/* Arrow */}
      <div className="absolute -bottom-[9px] w-4 h-4 rotate-45"
        style={{
          background: 'var(--color-surface-2)',
          border: '1.5px solid var(--color-border)',
          borderTop: 'none', borderLeft: 'none',
          left: left <= 30 ? arrowLeft : left >= 70 ? 'auto' : '50%',
          right: left >= 70 ? arrowLeft : 'auto',
          transform: left >= 40 && left <= 60 ? 'translateX(-50%) rotate(45deg)' : 'rotate(45deg)',
        }}
      />
      <div className="flex items-start justify-between gap-2 mb-2">
        <div>
          <p className="text-xs font-semibold mb-0.5" style={{ color: 'var(--color-text-muted)' }}>
            {level.type === 'theory' ? '📖 Materi' : '⚡ Latihan'}
          </p>
          <p className="text-sm font-bold leading-snug" style={{ color: 'var(--color-text)' }}>
            {level.title}
          </p>
        </div>
        <button onClick={onClose} className="shrink-0 pt-0.5">
          <X size={13} style={{ color: 'var(--color-text-dim)' }} />
        </button>
      </div>
      <div className="flex items-center gap-1.5 mb-3">
        <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
          style={{ background: 'rgba(251,191,36,0.15)', color: 'var(--color-gold)' }}>
          +{level.xpReward} XP
        </span>
        {level.status === 'completed' && (
          <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
            style={{ background: 'rgba(195,243,119,0.1)', color: 'var(--color-primary)' }}>
            ✅ Selesai
          </span>
        )}
      </div>
      <button
        onClick={onStart} disabled={isLocked}
        className="w-full py-2 rounded-xl text-sm font-bold transition-all active:scale-95"
        style={{
          background: isLocked ? 'var(--color-surface-3)' : 'var(--color-primary)',
          color: isLocked ? 'var(--color-text-dim)' : 'var(--color-on-primary)',
          cursor: isLocked ? 'not-allowed' : 'pointer',
        }}
      >
        {isLocked ? '🔒 Terkunci' : level.status === 'completed' ? 'Ulangi' : 'Mulai'}
      </button>
    </motion.div>
  );
}

// ─── Chapter Map ──────────────────────────────────────────────────────────────
function ChapterMap({ chapter, ci, isExpanded, onToggle, onNavigate }: {
  key?: React.Key;
  chapter: Chapter; ci: number; isExpanded: boolean;
  onToggle: () => void; onNavigate: (l: LevelSummary) => void;
}) {
  const [activePopup, setActivePopup] = useState<string | null>(null);
  const allDone  = chapter.completedCount === chapter.totalCount && (chapter.totalCount ?? 0) > 0;
  const progress = chapter.totalCount ? (chapter.completedCount ?? 0) / chapter.totalCount : 0;

  const NODE_H = 64;
  const CONN_H = 72;
  const levels  = chapter.levels ?? [];
  const mapH    = levels.length * NODE_H + Math.max(0, levels.length - 1) * CONN_H + 48;

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: ci * 0.05 }}>
      {/* Header */}
      <button onClick={onToggle}
        className="w-full rounded-2xl p-4 flex items-center justify-between"
        style={{
          background: allDone ? 'rgba(195,243,119,0.08)' : 'var(--color-surface-2)',
          border: `2px solid ${allDone ? 'var(--color-primary)' : 'var(--color-border)'}`,
          borderBottom: `4px solid ${allDone ? '#4a6e00' : 'var(--color-border)'}`,
        }}>
        <div className="flex items-center gap-3 text-left">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0"
            style={{ background: allDone ? 'var(--color-primary)' : 'var(--color-surface-3)' }}>
            {allDone ? '✅' : <BookOpen size={20} style={{ color: 'var(--color-text-muted)' }} />}
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider mb-0.5" style={{ color: 'var(--color-text-dim)' }}>
              Bab {ci + 1}
            </p>
            <p className="font-bold text-sm" style={{ fontFamily: 'var(--font-display)' }}>{chapter.title}</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
              {chapter.completedCount}/{chapter.totalCount} level selesai
            </p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1.5 shrink-0">
          <div className="w-9 h-9 rounded-full flex items-center justify-center"
            style={{ background: `conic-gradient(var(--color-primary) ${progress * 360}deg, var(--color-surface-3) 0deg)` }}>
            <div className="w-6 h-6 rounded-full flex items-center justify-center"
              style={{ background: 'var(--color-bg, #0e1318)', fontSize: 9, color: 'var(--color-primary)', fontWeight: 700 }}>
              {Math.round(progress * 100)}%
            </div>
          </div>
          {isExpanded ? <ChevronUp size={14} style={{ color: 'var(--color-text-dim)' }} />
                      : <ChevronDown size={14} style={{ color: 'var(--color-text-dim)' }} />}
        </div>
      </button>

      {/* Levels */}
      <AnimatePresence>
        {isExpanded && levels.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{ paddingTop: 40, paddingBottom: 24, position: 'relative' }}
          >
            {/* Connectors layer */}
            <div style={{ position: 'absolute', top: 40, left: 0, right: 0, pointerEvents: 'none' }}>
              {levels.slice(0, -1).map((level, li) => (
                <div key={`conn-${li}`}
                  style={{ position: 'absolute', top: li * (NODE_H + CONN_H) + NODE_H, left: 0, right: 0, height: CONN_H }}>
                  <NodeConnector fromLi={li} toLi={li + 1} fromStatus={level.status || 'locked'} />
                </div>
              ))}
            </div>

            {/* Nodes layer */}
            <div style={{ position: 'relative', height: mapH }}>
              {levels.map((level, li) => {
                const isCompleted   = level.status === 'completed';
                const isActive      = level.status === 'unlocked';
                const isLocked      = level.status === 'locked';
                const isFirstActive = isActive && li === levels.findIndex(l => l.status === 'unlocked');
                const topOffset     = li * (NODE_H + CONN_H);
                const leftPct       = getZig(li);

                return (
                  <div key={level._id} style={{ position: 'absolute', top: topOffset, left: 0, right: 0, height: NODE_H }}>
                    {/* Node wrapper */}
                    <div style={{ position: 'absolute', left: `${leftPct}%`, transform: 'translateX(-50%)' }}>
                      {/* MULAI badge */}
                      {isFirstActive && (
                        <motion.div
                          animate={{ y: [0, -5, 0] }}
                          transition={{ repeat: Infinity, duration: 1.6 }}
                          className="absolute px-3 py-1 rounded-lg font-bold whitespace-nowrap"
                          style={{
                            bottom: '100%', left: '50%', transform: 'translateX(-50%)',
                            marginBottom: 6,
                            background: 'var(--color-primary)', color: 'var(--color-on-primary)',
                            fontFamily: 'var(--font-display)', fontSize: 11, zIndex: 10,
                          }}>
                          MULAI!
                          <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-0 h-0"
                            style={{ borderLeft: '5px solid transparent', borderRight: '5px solid transparent', borderTop: '5px solid var(--color-primary)' }} />
                        </motion.div>
                      )}

                      {/* Pulse */}
                      {isActive && (
                        <motion.div className="absolute inset-0 rounded-full pointer-events-none"
                          style={{ border: '3px solid rgba(195,243,119,0.4)' }}
                          animate={{ scale: [1, 1.45, 1], opacity: [0.6, 0, 0.6] }}
                          transition={{ duration: 2, repeat: Infinity }} />
                      )}

                      {/* Button */}
                      <button
                        onClick={() => setActivePopup(activePopup === level._id ? null : level._id)}
                        className={`w-16 h-16 rounded-full flex items-center justify-center transition-all active:scale-90 ${
                          isCompleted ? 'node-completed' : isActive ? 'node-active' : 'node-locked'
                        }`}
                        style={{
                          boxShadow: isCompleted ? '0 5px 0 #86ab4b' : isActive ? '0 5px 0 #3d5c00' : '0 4px 0 #1a2030',
                        }}
                      >
                        {isCompleted && <Star size={24} fill="currentColor" style={{ color: 'var(--color-on-primary)' }} />}
                        {isActive && (level.type === 'theory'
                          ? <BookOpen size={24} style={{ color: 'var(--color-primary)' }} />
                          : <Zap size={24} style={{ color: 'var(--color-primary)' }} />)}
                        {isLocked && <Lock size={20} style={{ color: 'var(--color-text-dim)' }} />}
                      </button>
                    </div>

                    {/* Popup */}
                    <AnimatePresence>
                      {activePopup === level._id && (
                        <div style={{ position: 'absolute', left: 0, right: 0, top: 0 }}>
                          <InfoPopup
                            level={level} li={li}
                            onClose={() => setActivePopup(null)}
                            onStart={() => { setActivePopup(null); onNavigate(level); }}
                          />
                        </div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Main MapView ─────────────────────────────────────────────────────────────
export default function MapView() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [courses, setCourses]       = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [chapters, setChapters]     = useState<Chapter[]>([]);
  const [expandedChapters, setExpandedChapters] = useState<Set<string>>(new Set());
  const [loading, setLoading]       = useState(true);

  useEffect(() => {
    coursesApi.list().then(list => {
      setCourses(list);
      if (list.length > 0) loadCourse(list[0]);
    });
  }, []);

  const loadCourse = async (course: Course) => {
    setLoading(true);
    setSelectedCourse(course);
    try {
      const { chapters: chs } = await coursesApi.chapters(course.slug);
      setChapters(chs);
      const active = chs.find(ch => ch.levels?.some(l => l.status === 'unlocked'));
      setExpandedChapters(new Set([active?._id ?? chs[0]?._id]));
    } catch {
      // BUG-05: Tangani error agar tidak silent fail
      toast.error('Gagal memuat data kelas. Coba refresh halaman.');
    } finally {
      setLoading(false);
    }
  };

  const handleNavigate = (level: LevelSummary) => {
    if (level.status === 'locked') return;
    navigate(`/belajar/${level._id}`);
  };

  const toggleChapter = (id: string) => {
    setExpandedChapters(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
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
          <span className="font-bold text-lg" style={{ color: 'var(--color-primary)', fontFamily: 'var(--font-display)' }}>
            CodeLingo
          </span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="text-lg">🔥</span>
            <span className="font-bold text-sm" style={{ color: 'var(--color-gold)' }}>{user?.streakDays ?? 0}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Zap size={16} fill="currentColor" style={{ color: 'var(--color-cyan)' }} />
            <span className="font-bold text-sm" style={{ color: 'var(--color-cyan)' }}>{user?.totalXp ?? 0}</span>
          </div>
          <div className="flex items-center gap-0.5">
            {[...Array(5)].map((_, i) => (
              <span key={i} className="text-sm" style={{ opacity: i < (user?.hearts ?? 5) ? 1 : 0.2 }}>❤️</span>
            ))}
          </div>
        </div>
      </header>

      {/* ITEM 2: max-w-md menjaga agar zigzag map tetap proporsional di Desktop seperti Grasshopper */}
      <div className="max-w-md mx-auto px-4 pt-6">
        {courses.length > 1 && (
          <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
            {courses.map(c => (
              <button key={c._id} onClick={() => loadCourse(c)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all"
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

        <div className="mb-6">
          <h1 className="font-bold text-2xl" style={{ fontFamily: 'var(--font-display)' }}>
            Halo, <span style={{ color: 'var(--color-primary)' }}>{user?.username}</span>! 👋
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>
            Yuk lanjut belajar hari ini. Kamu pasti bisa!
          </p>
        </div>

        {loading ? (
          <div className="flex flex-col gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="animate-pulse rounded-2xl border p-4 space-y-4" style={{ background: 'var(--color-surface-2)', borderColor: 'var(--color-border)' }}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full" style={{ background: 'var(--color-surface-3)' }} />
                  <div className="h-4 rounded w-1/2" style={{ background: 'var(--color-surface-3)' }} />
                </div>
                <div className="h-3 rounded w-3/4" style={{ background: 'var(--color-surface-3)' }} />
                <div className="h-3 rounded w-1/3" style={{ background: 'var(--color-surface-3)' }} />
              </div>
            ))}
          </div>
        ) : chapters.length === 0 ? (
          // UX-03: Empty state jika tidak ada kursus/chapter yang tersedia
          <div className="text-center py-16">
            <p className="text-5xl mb-3">🚧</p>
            <p className="font-600 text-lg">Konten sedang disiapkan.</p>
            <p className="text-sm mt-2" style={{ color: 'var(--color-text-muted)' }}>
              Pantau terus ya! Materi baru segera hadir.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {chapters.map((chapter, ci) => (
              <ChapterMap
                key={chapter._id} chapter={chapter} ci={ci}
                isExpanded={expandedChapters.has(chapter._id)}
                onToggle={() => toggleChapter(chapter._id)}
                onNavigate={handleNavigate}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
