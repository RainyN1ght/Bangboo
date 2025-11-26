import React from 'react';
import clsx from 'clsx';

// A single Retro CRT TV Component
const RetroTV: React.FC<{
  className?: string;
  variant?: 'sm' | 'md' | 'lg';
  rotation?: number;
  screenType?: 'static' | 'face' | 'missing' | 'off' | 'terminal';
  color?: string;
}> = ({ className, variant = 'md', rotation = 0, screenType = 'off', color = 'bg-gray-800' }) => {
  
  const sizeClasses = {
    sm: 'w-24 h-20',
    md: 'w-32 h-28',
    lg: 'w-48 h-40',
  };

  return (
    <div 
      className={clsx(
        "absolute rounded-lg shadow-2xl flex flex-col items-center justify-center p-2 border-b-[6px] border-r-[4px] border-black/40",
        sizeClasses[variant],
        color,
        className
      )}
      style={{ transform: `rotate(${rotation}deg)` }}
    >
      {/* Casing Highlights */}
      <div className="absolute top-0 left-0 w-full h-[1px] bg-white/10"></div>
      <div className="absolute top-1 left-1 w-[1px] h-full bg-white/10"></div>
      
      {/* Vents */}
      <div className="absolute top-2 right-[-2px] w-[2px] h-12 flex flex-col gap-1">
          <div className="w-full h-1 bg-black/30"></div>
          <div className="w-full h-1 bg-black/30"></div>
          <div className="w-full h-1 bg-black/30"></div>
      </div>

      {/* The Screen Container (Bezel) */}
      <div className="relative w-full h-[85%] bg-[#0a0a0a] rounded border-4 border-gray-900/50 shadow-[inset_0_0_10px_rgba(0,0,0,1)] overflow-hidden">
        
        {/* Screen Content */}
        <div className="absolute inset-0 opacity-80">
            {screenType === 'static' && (
               <div className="w-full h-full bg-[url('https://media.giphy.com/media/oEI9uBYSzLpBK/giphy.gif')] bg-cover opacity-10 mix-blend-screen grayscale"></div>
            )}
            
            {screenType === 'face' && (
                <div className="w-full h-full bg-[#1a1a1a] flex items-center justify-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-white/80 shadow-[0_0_5px_white]"></div>
                    <div className="w-3 h-3 rounded-full bg-white/80 shadow-[0_0_5px_white]"></div>
                </div>
            )}

            {screenType === 'missing' && (
                <div className="w-full h-full bg-gray-900 flex items-center justify-center">
                    <div className="w-full h-full flex flex-col items-center justify-center bg-white/5 animate-pulse">
                        <span className="text-[8px] font-mono text-white/50">NO SIGNAL</span>
                    </div>
                </div>
            )}
            
            {screenType === 'terminal' && (
                 <div className="w-full h-full bg-black p-1 font-mono text-[4px] text-green-500 overflow-hidden leading-tight opacity-70">
                    {Array.from({length: 10}).map((_,i) => <div key={i}>{Math.random().toString(36).substring(7)}</div>)}
                 </div>
            )}
        </div>

        {/* Screen Glare / curvature reflection */}
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-transparent to-white/10 rounded pointer-events-none"></div>
        
        {/* Scanlines */}
        <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.5)_50%)] bg-[length:100%_4px] opacity-30 pointer-events-none"></div>
      </div>

      {/* Controls Area */}
      <div className="w-full h-[15%] flex items-center justify-between px-2 mt-1">
          <div className="flex gap-1">
             <div className="w-1.5 h-1.5 rounded-full bg-red-900/50"></div>
             <div className="w-4 h-1 bg-black/30 rounded-full"></div>
          </div>
          <div className="flex gap-0.5">
              <div className="w-0.5 h-2 bg-gray-600"></div>
              <div className="w-0.5 h-2 bg-gray-600"></div>
              <div className="w-0.5 h-2 bg-gray-600"></div>
          </div>
      </div>
    </div>
  );
};

const WorkshopBackground: React.FC = () => {
  return (
    <div className="absolute inset-0 z-0 overflow-hidden bg-[#121214]">
       
       {/* 1. Base Texture & Gradients */}
       <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,#2a2a30_0%,#000000_100%)]"></div>
       
       {/* 2. Giant Typography (The "Zenless" Aesthetic) */}
       <div className="absolute top-[-10%] left-[-10%] w-[120%] h-[120%] overflow-hidden pointer-events-none z-0">
           {/* Big Orange Text Background */}
           <div className="absolute top-[10%] left-[-5%] text-[25vh] font-black text-[#ff4400] rotate-[-12deg] opacity-[0.08] tracking-tighter select-none font-tech leading-none">
               ZERO
           </div>
           <div className="absolute bottom-[0%] right-[-10%] text-[30vh] font-black text-[#ff4400] rotate-[-12deg] opacity-[0.08] tracking-tighter select-none font-tech leading-none text-right">
               HOLLOW
           </div>
           
           {/* Decorative Stripes */}
           <div className="absolute top-[40%] right-[-20%] w-[80%] h-32 bg-[#ff4400] rotate-[-12deg] opacity-[0.05]"></div>
           <div className="absolute bottom-[20%] left-[-20%] w-[80%] h-16 bg-white rotate-[-12deg] opacity-[0.03]"></div>
       </div>

       {/* 3. The TV Stacks (Props) */}
       
       {/* LEFT STACK */}
       <div className="absolute bottom-[-20px] left-[-20px] md:left-[5%] z-10 transform scale-75 md:scale-100 origin-bottom-left">
            {/* Base TV */}
            <RetroTV variant="lg" className="bottom-0 left-0 z-10" screenType="static" color="bg-[#252529]" />
            
            {/* Middle TV */}
            <RetroTV variant="md" className="bottom-[150px] left-[20px] z-20" rotation={5} screenType="face" color="bg-[#303035]" />
            
            {/* Top Small TV */}
            <RetroTV variant="sm" className="bottom-[250px] left-[10px] z-30" rotation={-5} screenType="terminal" color="bg-[#1a1a1e]" />
            
            {/* Side Leaner */}
            <RetroTV variant="md" className="bottom-[10px] left-[180px] z-0" rotation={15} screenType="off" color="bg-[#202022]" />

            {/* Sticker on the stack */}
            <div className="absolute bottom-[100px] left-[100px] z-40 bg-yellow-400 text-black text-[6px] font-bold px-2 py-0.5 rotate-[-5deg] shadow-sm">
                CAUTION
            </div>
       </div>

       {/* RIGHT STACK */}
       <div className="absolute bottom-[-40px] right-[-40px] md:right-[5%] z-10 transform scale-75 md:scale-100 origin-bottom-right">
            {/* Base Cluster */}
            <RetroTV variant="lg" className="bottom-[10px] right-[10px] z-10" rotation={-2} screenType="missing" color="bg-[#2a2a2e]" />
            
            {/* Stacked */}
            <RetroTV variant="md" className="bottom-[160px] right-[30px] z-20" rotation={-8} screenType="static" color="bg-[#35353a]" />
            
            {/* Tilted on top */}
            <RetroTV variant="sm" className="bottom-[260px] right-[60px] z-30" rotation={12} screenType="face" color="bg-[#1e1e20]" />
            
            {/* Background filler */}
            <RetroTV variant="lg" className="bottom-[0px] right-[160px] z-0 blur-[2px] opacity-60" rotation={-5} screenType="off" />

            {/* Cables hanging from this stack */}
            <svg className="absolute bottom-[100px] right-[100px] w-40 h-40 z-40 pointer-events-none overflow-visible">
                <path d="M0,0 C20,50 50,20 80,100" stroke="#111" strokeWidth="4" fill="none" />
                <path d="M10,0 C10,40 40,60 60,120" stroke="#000" strokeWidth="3" fill="none" />
            </svg>
       </div>

       {/* 4. Ceiling / Hanging Elements */}
       <div className="absolute top-0 w-full h-[30%] pointer-events-none z-0">
           {/* Overhead wires */}
           <svg className="absolute top-0 left-0 w-full h-full opacity-60">
               <path d="M-100,20 Q400,150 1200,20" stroke="#111" strokeWidth="6" fill="none" />
               <path d="M-100,40 Q500,180 1200,50" stroke="#1a1a1a" strokeWidth="4" fill="none" />
           </svg>
           
           {/* Hanging Sign */}
           <div className="absolute top-[-20px] right-[20%] w-32 h-24 bg-[#1a1a1a] border-2 border-[#ff4400]/30 transform rotate-[-5deg] flex items-end justify-center pb-2 shadow-[0_0_20px_rgba(255,68,0,0.1)]">
               <div className="text-[#ff4400] font-tech text-xs tracking-widest opacity-80">SYSTEM</div>
               {/* Wires holding it */}
               <div className="absolute top-[-50px] left-2 w-[1px] h-[60px] bg-gray-700"></div>
               <div className="absolute top-[-50px] right-2 w-[1px] h-[60px] bg-gray-700"></div>
           </div>
       </div>

       {/* 5. Atmosphere & Overlay */}
       
       {/* Heavy vignette to focus center */}
       <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.4)_50%,rgba(0,0,0,0.95)_100%)] pointer-events-none z-20"></div>

       {/* Color Grading (Teal/Orange Split) */}
       <div className="absolute inset-0 bg-gradient-to-tr from-orange-500/5 to-cyan-500/5 pointer-events-none z-20 mix-blend-overlay"></div>

       {/* Noise Grain */}
       <div className="absolute inset-0 opacity-[0.08] pointer-events-none z-30 mix-blend-overlay" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.8\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\' opacity=\'1\'/%3E%3C/svg%3E")' }}></div>

       {/* Subtle Floating Particles */}
       <div className="absolute top-1/4 left-1/4 w-1 h-1 bg-white/20 rounded-full animate-pulse"></div>
       <div className="absolute top-3/4 right-1/3 w-1.5 h-1.5 bg-orange-500/20 rounded-full animate-pulse delay-700"></div>
    </div>
  );
};

export default WorkshopBackground;