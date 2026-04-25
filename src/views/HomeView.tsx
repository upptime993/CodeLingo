import { Star, Gift, Lock } from 'lucide-react';
import { motion } from 'motion/react';

export default function HomeView() {
  const nodes = [
    { type: 'star', completed: true, offset: '-ml-[60px]' },
    { type: 'star', completed: true, offset: 'ml-[40px]' },
    { type: 'gift', completed: false, active: true, offset: 'ml-[-20px]' },
    { type: 'lock', completed: false, offset: 'ml-[50px]' },
    { type: 'lock', completed: false, offset: 'ml-[-40px]' },
  ];

  return (
    <div className="mt-20 px-5 max-w-lg mx-auto flex flex-col gap-10 pb-32">
      {/* Chapter Card */}
      <section className="bg-brand-primary rounded-[24px] p-6 shadow-[0_8px_0_0_#86ab4b] flex flex-col gap-2 relative overflow-hidden">
        <div>
          <h2 className="font-display font-bold text-xs text-brand-on-primary opacity-60 uppercase tracking-widest">CHAPTER 1, UNIT 1</h2>
          <p className="font-display font-extrabold text-xl text-brand-on-primary">Introduction to Python</p>
        </div>
        <div className="w-full bg-brand-on-primary/10 rounded-full h-3 mt-4">
          <div className="bg-brand-on-primary h-3 rounded-full w-1/4"></div>
        </div>
      </section>

      {/* Progression Path */}
      <section className="relative flex flex-col items-center gap-16 py-8 w-full">
        {/* Path SVG */}
        <svg className="absolute top-0 w-12 h-full z-0 text-[#2E3650] left-1/2 -ml-6" fill="none" stroke="currentColor" strokeWidth="4" strokeDasharray="8 8" viewBox="0 0 48 800" preserveAspectRatio="none">
          <path d="M 24 0 Q 48 100 24 200 T 24 400 T 24 600 T 24 800" />
        </svg>

        {nodes.map((node, i) => (
          <div key={i} className={`relative z-10 ${node.offset}`}>
            {node.active && (
              <motion.div 
                animate={{ y: [0, -10, 0] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="absolute -top-12 left-1/2 -translate-x-1/2 bg-white text-black font-label text-[10px] px-4 py-2 rounded-xl shadow-lg after:content-[''] after:absolute after:bottom-[-8px] after:left-1/2 after:-translate-x-1/2 after:border-t-8 after:border-t-white after:border-l-8 after:border-l-transparent after:border-r-8 after:border-r-transparent"
              >
                START
              </motion.div>
            )}
            
            <button className={`
              w-20 h-20 rounded-full flex items-center justify-center transition-all active:scale-95
              ${node.completed ? 'bg-brand-primary shadow-[0_6px_0_0_#86ab4b] active:translate-y-[6px] active:shadow-none' : 
                node.active ? 'bg-brand-surface-highest ring-4 ring-brand-primary ring-offset-4 ring-offset-brand-background shadow-[0_6px_0_0_#22283A] active:translate-y-[6px] active:shadow-none' : 
                'bg-brand-surface-highest opacity-70 cursor-not-allowed shadow-[0_6px_0_0_#22283A]'}
            `}>
              {node.type === 'star' && <Star size={32} fill={node.completed ? 'currentColor' : 'none'} className={node.completed ? 'text-brand-on-primary' : 'text-slate-400'} />}
              {node.type === 'gift' && <Gift size={32} fill="currentColor" className="text-brand-primary" />}
              {node.type === 'lock' && <Lock size={32} fill="currentColor" className="text-slate-500" />}
            </button>
          </div>
        ))}
      </section>
    </div>
  );
}
