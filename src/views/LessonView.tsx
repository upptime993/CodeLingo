import { X, Heart, Code2, Play } from 'lucide-react';
import { motion } from 'motion/react';
import { useState } from 'react';

export default function LessonView({ onExit }: { onExit: () => void }) {
  const [selected, setSelected] = useState<string | null>(null);
  
  const options = ['2', '*', '+', '10'];

  return (
    <div className="bg-brand-background min-h-screen flex flex-col font-body">
      {/* Header */}
      <header className="w-full pt-8 pb-4 px-5 sticky top-0 bg-brand-background/90 backdrop-blur-md z-50 flex items-center gap-4">
        <button onClick={onExit} className="text-slate-400 hover:text-white transition-colors">
          <X size={24} />
        </button>
        <div className="flex-1 bg-brand-surface-high h-3 rounded-full overflow-hidden border border-[#2E3650]">
          <div className="bg-brand-primary h-full w-[65%] rounded-full relative shadow-[0_0_8px_rgba(195,243,119,0.5)]"></div>
        </div>
        <div className="flex items-center gap-1 text-brand-secondary font-bold">
          <Heart size={20} fill="currentColor" />
          <span>4</span>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 px-5 py-6 max-w-2xl mx-auto w-full flex flex-col gap-8">
        <section className="flex flex-col gap-6">
          <h1 className="font-display font-extrabold text-2xl">Complete the program</h1>
          
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 shrink-0 bg-[#22283A] rounded-2xl overflow-hidden border-2 border-[#2E3650] shadow-lg flex items-center justify-center p-2">
              <img src="https://api.dicebear.com/7.x/bottts/svg?seed=QuestBot" alt="Bot" className="w-full h-full" />
            </div>
            <div className="relative bg-[#22283A] border-2 border-[#2E3650] rounded-2xl rounded-tl-none p-4 shadow-lg flex-1">
              <div className="absolute -left-[9px] top-0 w-4 h-4 bg-[#22283A] border-l-2 border-t-2 border-[#2E3650] transform rotate-[-45deg] origin-top-right"></div>
              <p className="text-sm font-medium leading-relaxed">
                Double the value of the <span className="text-brand-tertiary-dim font-mono bg-black/40 px-1.5 py-0.5 rounded">water</span> variable.
              </p>
            </div>
          </div>
        </section>

        {/* Editor */}
        <section className="bg-[#1C2230] rounded-2xl shadow-[0_8px_0_0_rgba(0,0,0,0.4)] border border-[#2E3650] overflow-hidden flex flex-col">
          <div className="bg-[#252a36] px-4 py-2 border-b border-[#2E3650] flex items-center gap-2">
            <Code2 size={14} className="text-brand-primary" />
            <span className="font-label text-[10px] text-slate-400 uppercase tracking-widest">main.py</span>
          </div>
          <div className="p-6 font-mono text-sm leading-8 flex flex-col">
            <div className="flex items-center gap-4">
              <span className="text-slate-600 w-4 text-right select-none">1</span>
              <div><span className="text-brand-primary">water</span> <span className="text-brand-secondary">=</span> <span className="text-brand-tertiary">5</span></div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-slate-600 w-4 text-right select-none">2</span>
              <div className="flex items-center gap-2">
                <span className="text-brand-primary">water</span> <span className="text-brand-secondary">=</span> <span className="text-brand-primary">water</span> <span className="text-brand-secondary">*</span>
                <div className={`
                  min-w-[50px] h-9 rounded-lg border-2 border-dashed flex items-center justify-center transition-all bg-[#0e131f]/50
                  ${selected ? 'border-brand-primary border-solid bg-brand-primary/10' : 'border-[#2E3650]'}
                `}>
                  {selected && <span className="text-brand-primary font-bold">{selected}</span>}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-slate-600 w-4 text-right select-none">3</span>
              <div><span className="text-brand-tertiary">print</span>(<span className="text-brand-secondary">"water:"</span>, water)</div>
            </div>
          </div>
        </section>

        {/* Tokens */}
        <section className="grid grid-cols-4 gap-3 mt-4">
          {options.map((opt) => (
            <button
              key={opt}
              onClick={() => setSelected(opt === selected ? null : opt)}
              className={`
                h-14 rounded-xl font-mono font-bold text-lg border-2 transition-all active:scale-95
                ${selected === opt ? 'bg-brand-surface-highest border-brand-primary text-brand-primary opacity-50 cursor-not-allowed' : 'bg-[#22283A] border-[#2E3650] text-white hover:border-[#3D4866]'}
                shadow-[0_4px_0_0_#151A26] active:translate-y-1 active:shadow-none
              `}
            >
              {opt}
            </button>
          ))}
        </section>
      </main>

      {/* Footer CTA */}
      <footer className="p-5 bg-brand-background border-t border-[#2E3650] pb-safe">
        <button 
          disabled={!selected}
          className={`
            w-full py-4 rounded-2xl font-bold uppercase tracking-widest text-sm transition-all
            ${selected ? 'squishy-btn-pink opacity-100' : 'bg-[#22283A] text-slate-500 cursor-not-allowed opacity-50'}
          `}
        >
          Check
        </button>
      </footer>
    </div>
  );
}
