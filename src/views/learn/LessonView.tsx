import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { X, BookOpen, ChevronRight, GripVertical, AlertCircle } from 'lucide-react';
import { coursesApi } from '../../api/courses';
import { progressApi } from '../../api/progress';
import { useAuthStore } from '../../store/authStore';
import { useGameStore } from '../../store/gameStore';
import type { Level, Question, MatchPair } from '../../types';

// ─── Auto-save key helper ─────────────────────────────────────────────────────
const SAVE_KEY = (levelId: string) => `cl_quiz_${levelId}`;

interface SavedProgress {
  questionIndex: number;
  correctCount: number;
  heartsUsed: number;
}

function saveProgress(levelId: string, data: SavedProgress) {
  try { localStorage.setItem(SAVE_KEY(levelId), JSON.stringify(data)); } catch { /* ignore */ }
}

function loadProgress(levelId: string): SavedProgress | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY(levelId));
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function clearProgress(levelId: string) {
  try { localStorage.removeItem(SAVE_KEY(levelId)); } catch { /* ignore */ }
}

// ─── Markdown renderer ────────────────────────────────────────────────────────
function renderInline(text: string): React.ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*)/g);
  return parts.map((p, i) => {
    if (p.startsWith('**') && p.endsWith('**')) return <strong key={i}>{p.slice(2, -2)}</strong>;
    if (p.startsWith('*') && p.endsWith('*')) return <em key={i}>{p.slice(1, -1)}</em>;
    if (p.startsWith('`') && p.endsWith('`')) return <code key={i} style={{ background: 'rgba(195,243,119,0.15)', color: 'var(--color-primary)', padding: '1px 6px', borderRadius: 6, fontFamily: 'var(--font-mono)', fontSize: '0.9em' }}>{p.slice(1, -1)}</code>;
    return p;
  });
}

function SimpleMarkdown({ text }: { text: string }) {
  const lines = text.split('\n');
  return (
    <div style={{ color: 'var(--color-text)', lineHeight: 1.8 }}>
      {lines.map((line, i) => {
        if (line.startsWith('## ')) return <h2 key={i} style={{ color: 'var(--color-text)', fontSize: '1.25rem', fontWeight: 800, marginBottom: 12, marginTop: 20, fontFamily: 'var(--font-display)' }}>{line.slice(3)}</h2>;
        if (line.startsWith('### ')) return <h3 key={i} style={{ color: 'var(--color-cyan)', fontSize: '1.05rem', fontWeight: 700, marginBottom: 8, marginTop: 16 }}>{line.slice(4)}</h3>;
        if (line.startsWith('> ')) return <blockquote key={i} style={{ borderLeft: '3px solid var(--color-primary)', paddingLeft: 14, margin: '12px 0', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>{renderInline(line.slice(2))}</blockquote>;
        if (line.startsWith('- ')) return <li key={i} style={{ marginLeft: 20, marginBottom: 4, color: 'var(--color-text-muted)' }}>{renderInline(line.slice(2))}</li>;
        if (line.startsWith('---')) return <hr key={i} style={{ border: 'none', borderTop: '1px solid var(--color-border)', margin: '20px 0' }} />;
        if (line.trim() === '') return <br key={i} />;
        return <p key={i} style={{ marginBottom: 8 }}>{renderInline(line)}</p>;
      })}
    </div>
  );
}

// ─── Question Types ───────────────────────────────────────────────────────────

/** 1. Multiple Choice */
function MultipleChoice({ question, selected, disabled, onSelect }: {
  question: Question; selected: string | null; disabled: boolean; onSelect: (a: string) => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      {question.options?.map(opt => {
        let style: React.CSSProperties = { background: 'var(--color-surface-2)', border: '2px solid var(--color-border)', color: 'var(--color-text)' };
        if (disabled) {
          if (opt === question.correctAnswer) style = { background: 'rgba(195,243,119,0.12)', border: '2px solid var(--color-primary)', color: 'var(--color-primary)' };
          else if (opt === selected) style = { background: 'rgba(255,107,107,0.12)', border: '2px solid var(--color-coral)', color: 'var(--color-coral)' };
        } else if (opt === selected) {
          style = { background: 'rgba(195,243,119,0.1)', border: '2px solid var(--color-primary)', color: 'var(--color-primary)' };
        }
        return (
          <button key={opt} onClick={() => !disabled && onSelect(opt)} disabled={disabled}
            className="w-full text-left px-5 py-4 rounded-2xl font-500 text-sm transition-all"
            style={{ ...style, cursor: disabled ? 'default' : 'pointer' }}>
            {opt}
          </button>
        );
      })}
    </div>
  );
}

/** 2. True or False */
function TrueFalse({ question, selected, disabled, onSelect }: {
  question: Question; selected: string | null; disabled: boolean; onSelect: (a: string) => void;
}) {
  const opts = [
    { value: 'true', label: 'BENAR', emoji: '✅' },
    { value: 'false', label: 'SALAH', emoji: '❌' },
  ];
  return (
    <div className="grid grid-cols-2 gap-4">
      {opts.map(opt => {
        let style: React.CSSProperties = { background: 'var(--color-surface-2)', border: '2.5px solid var(--color-border)', color: 'var(--color-text)' };
        if (disabled) {
          if (opt.value === question.correctAnswer) style = { background: 'rgba(195,243,119,0.12)', border: '2.5px solid var(--color-primary)', color: 'var(--color-primary)' };
          else if (opt.value === selected) style = { background: 'rgba(255,107,107,0.12)', border: '2.5px solid var(--color-coral)', color: 'var(--color-coral)' };
        } else if (opt.value === selected) {
          style = { background: 'rgba(195,243,119,0.1)', border: '2.5px solid var(--color-primary)', color: 'var(--color-primary)' };
        }
        return (
          <button key={opt.value} onClick={() => !disabled && onSelect(opt.value)} disabled={disabled}
            className="flex flex-col items-center justify-center gap-2 py-7 rounded-2xl font-800 text-lg transition-all"
            style={{ ...style, cursor: disabled ? 'default' : 'pointer', fontFamily: 'var(--font-display)' }}>
            <span className="text-4xl">{opt.emoji}</span>
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

/** 3. Fill in the Blank */
function FillBlank({ question, selected, disabled, onSelect }: {
  question: Question; selected: string | null; disabled: boolean; onSelect: (a: string) => void;
}) {
  const parts = question.prompt.split('___');
  const isRight = disabled && selected === question.correctAnswer;
  const isWrong = disabled && selected !== question.correctAnswer;
  return (
    <div className="flex flex-col gap-5">
      <div className="rounded-2xl p-4 font-mono text-sm flex flex-wrap items-center gap-1" style={{ background: '#0A0E16', border: '1.5px solid var(--color-border)' }}>
        {parts.map((part, i) => (
          <span key={i} style={{ color: 'var(--color-cyan)' }}>
            {part}
            {i < parts.length - 1 && (
              <span className="inline-flex items-center justify-center min-w-[80px] px-3 py-0.5 rounded-lg mx-1 font-700 transition-all"
                style={{
                  border: `2px dashed ${selected ? (isRight ? 'var(--color-primary)' : isWrong ? 'var(--color-coral)' : 'var(--color-primary)') : 'var(--color-border)'}`,
                  background: selected ? (isRight ? 'rgba(195,243,119,0.1)' : isWrong ? 'rgba(255,107,107,0.1)' : 'rgba(195,243,119,0.08)') : 'rgba(0,0,0,0.3)',
                  color: isRight ? 'var(--color-primary)' : isWrong ? 'var(--color-coral)' : 'var(--color-primary)',
                  minHeight: 32,
                }}>
                {selected || <span style={{ color: 'var(--color-text-dim)' }}>?</span>}
              </span>
            )}
          </span>
        ))}
      </div>
      <div>
        <p className="text-xs font-600 mb-3" style={{ color: 'var(--color-text-dim)' }}>Pilih jawaban yang tepat:</p>
        <div className="flex flex-wrap gap-2">
          {question.tokens?.map(token => {
            const isPicked = selected === token;
            return (
              <button key={token} onClick={() => !disabled && onSelect(isPicked ? '' : token)} disabled={disabled}
                className="px-4 py-2 rounded-xl font-mono font-600 text-sm transition-all"
                style={{
                  background: isPicked ? 'rgba(195,243,119,0.15)' : 'var(--color-surface-2)',
                  border: `2px solid ${isPicked ? 'var(--color-primary)' : 'var(--color-border)'}`,
                  color: isPicked ? 'var(--color-primary)' : 'var(--color-text)',
                  boxShadow: isPicked ? 'none' : '0 3px 0 var(--color-border)',
                  transform: isPicked ? 'translateY(2px)' : 'none',
                  opacity: isPicked && disabled ? 0.6 : 1,
                  cursor: disabled ? 'default' : 'pointer',
                }}>
                {token}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/** 4. Code Arrange — drag & drop, periksa lewat tombol "Cek Jawaban" parent */
function CodeArrange({ question, disabled, onSelect }: {
  question: Question; disabled: boolean; onSelect: (answer: string) => void;
}) {
  const [blocks, setBlocks] = useState<string[]>(() => {
    // Acak hanya di awal
    const arr = [...(question.codeBlocks || [])];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  });
  const dragIndex = useRef<number | null>(null);

  let correctOrder: string[] = [];
  try { correctOrder = JSON.parse(question.correctAnswer); } catch { correctOrder = question.codeBlocks || []; }

  // Set initial selected value
  useEffect(() => {
    onSelect(JSON.stringify(blocks));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDragStart = (i: number) => { dragIndex.current = i; };
  const handleDragOver = (e: React.DragEvent, i: number) => {
    e.preventDefault();
    if (dragIndex.current === null || dragIndex.current === i) return;
    const updated = [...blocks];
    const [moved] = updated.splice(dragIndex.current, 1);
    updated.splice(i, 0, moved);
    dragIndex.current = i;
    setBlocks(updated);
    onSelect(JSON.stringify(updated));
  };
  const handleDragEnd = () => { dragIndex.current = null; };

  // Touch drag support
  const touchStartIndex = useRef<number | null>(null);
  const handleTouchStart = (i: number) => { touchStartIndex.current = i; };
  const handleTouchMove = (e: React.TouchEvent, targetEl: HTMLElement) => {
    e.preventDefault();
    const touch = e.touches[0];
    const element = document.elementFromPoint(touch.clientX, touch.clientY);
    const blockEl = element?.closest('[data-block-index]') as HTMLElement | null;
    if (!blockEl || touchStartIndex.current === null) return;
    const toIndex = parseInt(blockEl.dataset.blockIndex || '-1', 10);
    if (toIndex < 0 || toIndex === touchStartIndex.current) return;
    const updated = [...blocks];
    const [moved] = updated.splice(touchStartIndex.current, 1);
    updated.splice(toIndex, 0, moved);
    touchStartIndex.current = toIndex;
    setBlocks(updated);
    onSelect(JSON.stringify(updated));
  };

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs font-600" style={{ color: 'var(--color-text-dim)' }}>
        {disabled ? '📋 Hasil urutan kamu:' : '↕️ Seret blok kode ke urutan yang benar, lalu klik Cek Jawaban'}
      </p>
      <div className="flex flex-col gap-2">
        {blocks.map((block, i) => {
          let blockStyle: React.CSSProperties = {
            background: '#0A0E16',
            border: '1.5px solid var(--color-border)',
            color: 'var(--color-cyan)',
          };
          // Show result coloring after parent check (disabled = phase is 'feedback')
          if (disabled) {
            blockStyle = correctOrder[i] === block
              ? { background: 'rgba(195,243,119,0.08)', border: '1.5px solid var(--color-primary)', color: 'var(--color-primary)' }
              : { background: 'rgba(255,107,107,0.08)', border: '1.5px solid var(--color-coral)', color: 'var(--color-coral)' };
          }
          return (
            <div key={i}
              data-block-index={i}
              draggable={!disabled}
              onDragStart={() => handleDragStart(i)}
              onDragOver={(e) => handleDragOver(e, i)}
              onDragEnd={handleDragEnd}
              onTouchStart={() => handleTouchStart(i)}
              onTouchMove={(e) => handleTouchMove(e, e.currentTarget)}
              className="flex items-center gap-3 px-4 py-3 rounded-xl font-mono text-sm"
              style={{
                ...blockStyle,
                userSelect: 'none',
                transition: 'all 0.15s',
                cursor: disabled ? 'default' : 'grab',
                touchAction: 'none',
              }}>
              {!disabled && <GripVertical size={16} style={{ color: 'var(--color-text-dim)', flexShrink: 0 }} />}
              {disabled && (
                <span className="text-base shrink-0">
                  {correctOrder[i] === block ? '✅' : '❌'}
                </span>
              )}
              <pre className="text-sm" style={{ margin: 0, fontFamily: 'var(--font-mono)', whiteSpace: 'pre' }}>{block}</pre>
            </div>
          );
        })}
      </div>
      {!disabled && (
        <p className="text-center text-xs py-2" style={{ color: 'var(--color-text-dim)' }}>
          Setelah tersusun, klik <strong style={{ color: 'var(--color-primary)' }}>Cek Jawaban ✓</strong> di bawah
        </p>
      )}
    </div>
  );
}

/** 5. Match — pasangkan, periksa lewat tombol "Cek Jawaban" parent */
function Match({ question, disabled, onSelect }: {
  question: Question; disabled: boolean; onSelect: (answer: string) => void;
}) {
  const pairs = question.matchPairs || [];
  const [matches, setMatches] = useState<Record<string, string>>({});
  const [selectedLeft, setSelectedLeft] = useState<string | null>(null);

  let correctMap: Record<string, string> = {};
  try { correctMap = JSON.parse(question.correctAnswer); } catch {
    pairs.forEach(p => { correctMap[p.left] = p.right; });
  }

  const [shuffledRights] = useState(() =>
    [...pairs.map(p => p.right)].sort(() => Math.random() - 0.5)
  );

  const handleLeftClick = (left: string) => {
    if (disabled) return;
    setSelectedLeft(prev => prev === left ? null : left);
  };

  const handleRightClick = (right: string) => {
    if (disabled || !selectedLeft) return;
    // If right already used by another left, un-map it first
    const existingLeft = Object.keys(matches).find(k => matches[k] === right);
    const updated = { ...matches };
    if (existingLeft) delete updated[existingLeft];
    updated[selectedLeft] = right;
    setMatches(updated);
    setSelectedLeft(null);
    onSelect(JSON.stringify(updated));
  };

  const handleUnmap = (left: string) => {
    if (disabled) return;
    const updated = { ...matches };
    delete updated[left];
    setMatches(updated);
    onSelect(JSON.stringify(updated));
  };

  const isComplete = Object.keys(matches).length === pairs.length;

  return (
    <div className="flex flex-col gap-4">
      <p className="text-xs font-600" style={{ color: 'var(--color-text-dim)' }}>
        {disabled
          ? '📋 Hasil pasangan kamu:'
          : selectedLeft
            ? `✨ Sekarang pilih pasangan untuk "${selectedLeft}" di kolom kanan`
            : '👆 Klik item di kiri, lalu klik pasangannya di kanan'}
      </p>

      <div className="grid grid-cols-2 gap-3">
        {/* Left column */}
        <div className="flex flex-col gap-2">
          <p className="text-center text-xs font-700 mb-1" style={{ color: 'var(--color-cyan)' }}>Kiri</p>
          {pairs.map(p => {
            const hasMatch = matches[p.left];
            const isSelected = selectedLeft === p.left;
            let style: React.CSSProperties = { background: 'var(--color-surface-2)', border: '1.5px solid var(--color-border)', color: 'var(--color-text)' };
            if (isSelected) style = { background: 'rgba(94,234,212,0.12)', border: '2px solid var(--color-cyan)', color: 'var(--color-cyan)' };
            else if (hasMatch && !disabled) style = { background: 'rgba(195,243,119,0.08)', border: '1.5px solid var(--color-primary)', color: 'var(--color-primary)' };
            if (disabled) {
              style = correctMap[p.left] === matches[p.left]
                ? { background: 'rgba(195,243,119,0.1)', border: '1.5px solid var(--color-primary)', color: 'var(--color-primary)' }
                : { background: 'rgba(255,107,107,0.1)', border: '1.5px solid var(--color-coral)', color: 'var(--color-coral)' };
            }
            return (
              <button key={p.left}
                onClick={() => hasMatch && !disabled ? handleUnmap(p.left) : handleLeftClick(p.left)}
                className="px-3 py-3 rounded-xl font-mono text-xs text-center font-700 transition-all"
                style={{ ...style, cursor: disabled ? 'default' : 'pointer' }}>
                {p.left}
                {hasMatch && !disabled && (
                  <span className="block text-[10px] mt-0.5 font-400 opacity-70">→ {matches[p.left]} ✕</span>
                )}
                {disabled && (
                  <span className="block text-[10px] mt-0.5 font-400">
                    {correctMap[p.left] === matches[p.left] ? '✅' : `❌ (${correctMap[p.left]})`}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-2">
          <p className="text-center text-xs font-700 mb-1" style={{ color: 'var(--color-cyan)' }}>Kanan</p>
          {shuffledRights.map(right => {
            const isMatched = Object.values(matches).includes(right);
            const isTarget = selectedLeft !== null && !disabled;
            let style: React.CSSProperties = {
              background: isMatched ? 'rgba(195,243,119,0.05)' : 'var(--color-surface-2)',
              border: `1.5px solid ${isMatched ? 'var(--color-primary)' : isTarget ? 'var(--color-cyan)' : 'var(--color-border)'}`,
              color: isMatched ? 'var(--color-text-muted)' : 'var(--color-text)',
              opacity: isMatched ? 0.5 : 1,
            };
            return (
              <button key={right} onClick={() => handleRightClick(right)}
                className="px-3 py-3 rounded-xl text-xs text-center transition-all"
                style={{ ...style, cursor: disabled || isMatched ? 'default' : isTarget ? 'pointer' : 'not-allowed' }}>
                {right}
              </button>
            );
          })}
        </div>
      </div>

      {!disabled && (
        <p className="text-center text-xs py-1" style={{ color: isComplete ? 'var(--color-primary)' : 'var(--color-text-dim)' }}>
          {isComplete
            ? '✅ Semua terpasang! Klik Cek Jawaban ✓'
            : `${Object.keys(matches).length}/${pairs.length} terpasang — tunjuk kiri dulu, lalu klik kanan`}
        </p>
      )}
    </div>
  );
}

// ─── Type badge ───────────────────────────────────────────────────────────────
const TYPE_LABELS: Record<string, string> = {
  multiple_choice: '🔘 Pilihan Ganda',
  true_false: '✅ Benar / Salah',
  fill_blank: '✏️ Isi Bagian Kosong',
  code_arrange: '🔀 Susun Kode',
  match: '🔗 Pasangkan',
};

// ─── Main Lesson View ─────────────────────────────────────────────────────────
type Phase = 'loading' | 'theory' | 'question' | 'feedback' | 'complete';

export default function LessonView() {
  const { levelId } = useParams<{ levelId: string }>();
  const navigate = useNavigate();
  const { user, updateUser } = useAuthStore();
  const { hearts, loseHeart, setHearts } = useGameStore();

  const [level, setLevel] = useState<Level | null>(null);
  const [phase, setPhase] = useState<Phase>('loading');
  const [error, setError] = useState<string | null>(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [heartsUsed, setHeartsUsed] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [resumedFrom, setResumedFrom] = useState(0); // for resume toast

  // ── Load level + restore progress ──────────────────────────────────────────
  useEffect(() => {
    if (!levelId) return;
    setHearts(user?.hearts ?? 5);
    setError(null);
    coursesApi.level(levelId)
      .then(l => {
        setLevel(l);

        if (l.type === 'theory') {
          setPhase('theory');
          return;
        }

        if (!l.questions || l.questions.length === 0) {
          setError("Level ini belum memiliki soal. Silakan hubungi admin.");
          setPhase('loading');
          return;
        }

        // Check for saved progress
        const saved = loadProgress(levelId);
        if (saved && saved.questionIndex > 0 && l.questions && saved.questionIndex < l.questions.length) {
          setQuestionIndex(saved.questionIndex);
          setCorrectCount(saved.correctCount);
          setHeartsUsed(saved.heartsUsed);
          setResumedFrom(saved.questionIndex);
        }
        setPhase('question');
      })
      .catch((err: unknown) => {
        console.error("Gagal memuat level:", err);
        setError("Gagal memuat level. Pastikan level ini ada atau coba lagi.");
        setPhase('loading');
      });
  }, [levelId]);

  const currentQuestion: Question | undefined = level?.questions?.[questionIndex];
  const totalQuestions = level?.questions?.length ?? 0;
  const progress = Math.min(1, questionIndex / Math.max(1, totalQuestions));

  // ── Save progress to localStorage whenever state changes ───────────────────
  useEffect(() => {
    if (!levelId || phase !== 'question' && phase !== 'feedback') return;
    saveProgress(levelId, { questionIndex, correctCount, heartsUsed });
  }, [questionIndex, correctCount, heartsUsed, phase, levelId]);

  // ── Check answer ───────────────────────────────────────────────────────────
  const checkAnswer = useCallback((q: Question, sel: string | null): boolean => {
    if (!sel) return false;
    if (q.type === 'code_arrange') {
      try { return JSON.stringify(JSON.parse(sel)) === JSON.stringify(JSON.parse(q.correctAnswer)); }
      catch { return false; }
    }
    if (q.type === 'match') {
      try {
        const given = JSON.parse(sel) as Record<string, string>;
        const correct = JSON.parse(q.correctAnswer) as Record<string, string>;
        return Object.keys(correct).every(k => given[k] === correct[k]);
      } catch { return false; }
    }
    return sel === q.correctAnswer;
  }, []);

  const handleCheck = useCallback(() => {
    if (!currentQuestion || !selected) return;
    const correct = checkAnswer(currentQuestion, selected);
    setIsCorrect(correct);
    setPhase('feedback');
    if (correct) setCorrectCount(c => c + 1);
    else {
      loseHeart();
      setHeartsUsed(h => h + 1);
    }
    // Update save with latest
    if (levelId) saveProgress(levelId, { questionIndex, correctCount: correct ? correctCount + 1 : correctCount, heartsUsed: correct ? heartsUsed : heartsUsed + 1 });
  }, [currentQuestion, selected, checkAnswer, questionIndex, correctCount, heartsUsed, levelId]);

  const handleNext = useCallback(() => {
    if (!level) return;
    const nextIndex = questionIndex + 1;
    if (nextIndex >= totalQuestions) {
      // Done — clear save and submit
      if (levelId) clearProgress(levelId);
      const corrTotal = correctCount + (isCorrect ? 1 : 0);
      const score = Math.round((corrTotal / totalQuestions) * 100);
      progressApi.complete({ levelId: level._id, score, heartsUsed })
        .then(({ xpGained, user: updatedUser }) => {
          updateUser(updatedUser);
          navigate(`/hasil/${level._id}`, {
            state: { xpGained, score, correctCount: corrTotal, totalQuestions },
            replace: true,
          });
        });
    } else {
      setQuestionIndex(nextIndex);
      setSelected(null);
      setIsCorrect(null);
      setPhase('question');
    }
  }, [questionIndex, totalQuestions, correctCount, isCorrect, heartsUsed, level, levelId]);

  const handleTheoryComplete = () => {
    progressApi.complete({ levelId: level!._id, score: 100, heartsUsed: 0 })
      .then(({ xpGained, user: updatedUser }) => {
        updateUser(updatedUser);
        navigate(`/hasil/${level!._id}`, {
          state: { xpGained, score: 100, correctCount: 0, totalQuestions: 0, isTheory: true },
          replace: true,
        });
      });
  };

  // ── Exit with save ─────────────────────────────────────────────────────────
  const handleExit = () => {
    // Progress already saved via useEffect, just navigate
    navigate('/belajar');
  };

  // ── Check if "Cek Jawaban" should be enabled ────────────────────────────────
  const canCheck = useCallback((): boolean => {
    if (!selected || !currentQuestion) return false;
    // For match: need all pairs filled
    if (currentQuestion.type === 'match') {
      try {
        const pairs = currentQuestion.matchPairs || [];
        const given = JSON.parse(selected) as Record<string, string>;
        return Object.keys(given).length === pairs.length;
      } catch { return false; }
    }
    return selected.trim() !== '' && selected !== '{}' && selected !== '[]';
  }, [selected, currentQuestion]);

  if (phase === 'loading') {
    if (error) {
      return (
        <div className="min-h-dvh flex flex-col items-center justify-center gap-6 px-6 text-center" style={{ background: 'var(--color-bg)' }}>
          <div className="w-20 h-20 rounded-full flex items-center justify-center text-4xl" style={{ background: 'var(--color-surface-2)' }}>
            ⚠️
          </div>
          <div>
            <h2 className="font-display font-800 text-2xl mb-2" style={{ color: 'var(--color-red)' }}>Oops!</h2>
            <p className="text-lg" style={{ color: 'var(--color-text-muted)' }}>{error}</p>
          </div>
          <button className="btn-primary mt-4 px-8" onClick={() => navigate('/belajar')}>
            Kembali ke Peta
          </button>
        </div>
      );
    }
    return (
      <div className="min-h-dvh flex items-center justify-center" style={{ background: 'var(--color-bg)' }}>
        <div className="flex flex-col items-center gap-4">
          <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }} className="text-5xl">
            ⚙️
          </motion.div>
          <p className="text-sm font-600" style={{ color: 'var(--color-text-muted)' }}>Menyiapkan pelajaran...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh flex flex-col" style={{ background: 'var(--color-bg)' }}>
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="w-full sticky top-0 z-50 px-4 pt-5 pb-3 flex items-center gap-3"
        style={{ background: 'rgba(14,19,24,0.97)', backdropFilter: 'blur(16px)', borderBottom: '1px solid var(--color-border)' }}>
        <button id="btn-exit" onClick={handleExit}
          className="shrink-0 w-9 h-9 rounded-xl flex items-center justify-center transition-colors hover:bg-[var(--color-surface-3)] focus:ring-2 focus:ring-[var(--color-primary)] outline-none"
          title="Keluar (progress tersimpan)"
          aria-label="Keluar dari pelajaran"
          style={{ color: 'var(--color-text-muted)', background: 'var(--color-surface-2)' }}>
          <X size={20} />
        </button>

        {phase !== 'theory' && (
          <div className="flex-1 h-2.5 rounded-full overflow-hidden" style={{ background: 'var(--color-surface-3)' }}>
            <motion.div className="h-full rounded-full" animate={{ width: `${progress * 100}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              style={{ background: 'linear-gradient(90deg, var(--color-primary), var(--color-cyan))' }} />
          </div>
        )}
        {phase === 'theory' && (
          <div className="flex-1 flex items-center gap-2">
            <BookOpen size={16} style={{ color: 'var(--color-cyan)' }} />
            <span className="text-sm font-700" style={{ color: 'var(--color-cyan)' }}>Materi</span>
          </div>
        )}

        <div className="flex items-center gap-0.5 shrink-0">
          {[...Array(5)].map((_, i) => (
            <motion.span key={i} initial={false}
              animate={{ scale: i === hearts ? [1, 1.5, 1] : 1 }}
              style={{ fontSize: 18, opacity: i < hearts ? 1 : 0.2 }}>
              ❤️
            </motion.span>
          ))}
        </div>
      </header>

      {/* ── Content ────────────────────────────────────────────────────────── */}
      <main className="flex-1 px-4 pt-6 pb-4 max-w-xl mx-auto w-full overflow-y-auto">
        <AnimatePresence mode="wait">
          {/* Theory */}
          {phase === 'theory' && level?.theory && (
            <motion.div key="theory" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <div className="flex items-start gap-3 mb-6">
                <div className="text-3xl shrink-0 mt-1">🤖</div>
                <div className="flex-1 px-4 py-3 rounded-2xl rounded-tl-none text-sm"
                  style={{ background: 'var(--color-surface-2)', border: '1.5px solid var(--color-border)' }}>
                  Hei! Sebelum kuis, yuk baca materi ini dulu. Gaskeunnn! 🔥
                </div>
              </div>
              <SimpleMarkdown text={level.theory.contentMarkdown} />
              {level.theory.codeExample && (
                <div className="mt-6">
                  <p className="text-xs font-700 uppercase tracking-wider mb-2" style={{ color: 'var(--color-text-dim)' }}>📝 Contoh Kode</p>
                  <div className="rounded-2xl overflow-hidden" style={{ border: '1.5px solid var(--color-border)' }}>
                    <div className="px-4 py-2 flex items-center gap-2" style={{ background: 'var(--color-surface-3)', borderBottom: '1px solid var(--color-border)' }}>
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#FF5F56' }} />
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#FFBD2E' }} />
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#27C93F' }} />
                      <span className="text-xs ml-2" style={{ color: 'var(--color-text-dim)' }}>index.html</span>
                    </div>
                    <pre className="p-4 text-sm overflow-x-auto" style={{ color: 'var(--color-primary)', fontFamily: 'var(--font-mono)', lineHeight: 1.7, background: '#0A0E16' }}>
                      {level.theory.codeExample}
                    </pre>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* Question */}
          {(phase === 'question' || phase === 'feedback') && currentQuestion && (
            <motion.div key={`q-${questionIndex}`}
              initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}>

              {/* Resume notice */}
              {resumedFrom > 0 && questionIndex === resumedFrom && (
                <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl mb-4"
                  style={{ background: 'rgba(195,243,119,0.06)', border: '1px solid var(--color-primary)' }}>
                  <AlertCircle size={14} style={{ color: 'var(--color-primary)' }} />
                  <span className="text-xs font-600" style={{ color: 'var(--color-primary)' }}>
                    ✅ Progress tersimpan! Lanjut dari soal {resumedFrom + 1} dari {totalQuestions}
                  </span>
                </motion.div>
              )}

              {/* Progress + type label */}
              <div className="flex items-center justify-between mb-5">
                <span className="text-xs font-700 uppercase tracking-wider" style={{ color: 'var(--color-text-dim)' }}>
                  Soal {questionIndex + 1} / {totalQuestions}
                </span>
                <span className="text-xs px-2.5 py-1 rounded-lg font-600"
                  style={{ background: 'var(--color-surface-2)', color: 'var(--color-cyan)', border: '1px solid var(--color-border)' }}>
                  {TYPE_LABELS[currentQuestion.type] || currentQuestion.type}
                </span>
              </div>

              {/* Mascot + prompt */}
              <div className="flex items-start gap-3 mb-6">
                <div className="text-3xl shrink-0">🤖</div>
                <div className="flex-1 px-4 py-3 rounded-2xl rounded-tl-none"
                  style={{ background: 'var(--color-surface-2)', border: '1.5px solid var(--color-border)' }}>
                  <p className="font-500 text-base leading-relaxed">{currentQuestion.prompt}</p>
                </div>
              </div>

              {/* Answer area — shake on wrong */}
              <motion.div
                animate={phase === 'feedback' && !isCorrect ? { x: [0, -8, 8, -6, 6, 0] } : {}}
                transition={{ duration: 0.4 }}>
                {currentQuestion.type === 'multiple_choice' && (
                  <MultipleChoice question={currentQuestion} selected={selected} disabled={phase === 'feedback'} onSelect={setSelected} />
                )}
                {currentQuestion.type === 'true_false' && (
                  <TrueFalse question={currentQuestion} selected={selected} disabled={phase === 'feedback'} onSelect={setSelected} />
                )}
                {currentQuestion.type === 'fill_blank' && (
                  <FillBlank question={currentQuestion} selected={selected} disabled={phase === 'feedback'} onSelect={setSelected} />
                )}
                {currentQuestion.type === 'code_arrange' && (
                  <CodeArrange question={currentQuestion} disabled={phase === 'feedback'} onSelect={setSelected} />
                )}
                {currentQuestion.type === 'match' && (
                  <Match question={currentQuestion} disabled={phase === 'feedback'} onSelect={setSelected} />
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* ── Feedback Banner ─────────────────────────────────────────────────── */}
      <AnimatePresence>
        {phase === 'feedback' && (
          <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 20 }}
            className="mx-4 mb-4 rounded-2xl p-4"
            style={{
              background: isCorrect ? 'rgba(195,243,119,0.1)' : 'rgba(255,107,107,0.1)',
              border: `2px solid ${isCorrect ? 'var(--color-primary)' : 'var(--color-coral)'}`,
            }}>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-2xl">{isCorrect ? '🎉' : '😬'}</span>
              <p className="font-800 text-base"
                style={{ color: isCorrect ? 'var(--color-primary)' : 'var(--color-coral)', fontFamily: 'var(--font-display)' }}>
                {isCorrect ? 'Jawaban kamu benar!' : 'Ups, kurang tepat nih!'}
              </p>
            </div>
            {currentQuestion?.explanation && (
              <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
                {currentQuestion.explanation}
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Footer CTA ──────────────────────────────────────────────────────── */}
      <footer className="px-4 pb-8 pt-2 max-w-xl mx-auto w-full">
        {phase === 'theory' && (
          <button id="btn-lanjut-theory" className="btn-primary w-full" onClick={handleTheoryComplete}>
            Oke, Paham! Lanjut Kuis <ChevronRight size={18} />
          </button>
        )}
        {phase === 'question' && (
          <button id="btn-check" className="btn-primary w-full"
            disabled={!canCheck()}
            onClick={handleCheck}>
            Cek Jawaban ✓
          </button>
        )}
        {/* ↓ Tombol Lanjut selalu muncul saat feedback, baik benar MAUPUN salah */}
        {phase === 'feedback' && (
          <button id="btn-next"
            className="w-full py-4 rounded-2xl font-800 text-base flex items-center justify-center gap-2"
            style={{
              background: isCorrect ? 'var(--color-primary)' : 'var(--color-coral)',
              color: isCorrect ? '#1A2D00' : '#fff',
              fontFamily: 'var(--font-display)',
              cursor: 'pointer',
            }}
            onClick={handleNext}>
            {questionIndex + 1 >= totalQuestions ? '🏁 Selesai!' : 'Lanjut →'}
          </button>
        )}
      </footer>
    </div>
  );
}
