import { Droplets, Zap, ChevronDown } from 'lucide-react';

interface TopNavProps {
  language?: string;
  energy?: number;
  xp?: number;
}

export default function TopNav({ language = 'Python', energy = 5, xp = 120 }: TopNavProps) {
  return (
    <header className="flex justify-between items-center w-full fixed top-0 z-50 h-16 px-5 bg-[#151A26]/90 backdrop-blur-md border-b border-[#2E3650]">
      <div className="flex items-center gap-2 text-brand-tertiary">
        <Droplets size={20} fill="currentColor" />
        <span className="font-bold text-lg">{energy}</span>
      </div>
      
      <div className="bg-[#22283A] border border-[#2E3650] rounded-full px-4 py-1.5 flex items-center gap-1.5 active:scale-95 transition-all hover:bg-[#2E3650] cursor-pointer">
        <span className="font-display font-bold text-sm tracking-tight text-brand-primary uppercase">{language}</span>
        <ChevronDown size={14} className="text-brand-primary" />
      </div>

      <div className="flex items-center gap-2 text-brand-primary">
        <Zap size={20} fill="currentColor" />
        <span className="font-bold text-lg">{xp}</span>
      </div>
    </header>
  );
}
