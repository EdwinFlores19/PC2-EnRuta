import React from 'react';

// 1. Badge de Estado del Semáforo (Rojo / Amarillo / Verde)
interface BadgeProps {
  status: 'ROJO' | 'AMARILLO' | 'VERDE' | string;
  size?: 'sm' | 'md';
}

export const SemaforoBadge: React.FC<BadgeProps> = ({ status, size = 'md' }) => {
  const normStatus = status.toUpperCase();
  
  let styleClass = 'bg-red-500/10 text-red-400 border-red-500/30 shadow-[0_0_10px_rgba(239,68,68,0.15)]';
  let label = '🔴 Pendiente / Riesgo';

  if (normStatus === 'AMARILLO' || normStatus === 'YELLOW') {
    styleClass = 'bg-amber-500/10 text-amber-400 border-amber-500/30 shadow-[0_0_10px_rgba(245,158,11,0.15)]';
    label = '🟡 En Proceso';
  } else if (normStatus === 'VERDE' || normStatus === 'GREEN') {
    styleClass = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.15)]';
    label = '🟢 Verificado / Formalizado';
  }

  return (
    <span className={`inline-flex items-center gap-1.5 font-bold font-mono border rounded-full ${
      size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-3 py-1 text-xs'
    } ${styleClass}`}>
      {label}
    </span>
  );
};

// 2. Barra de Progreso de Capacitación / Superación
interface ProgressBarProps {
  score: number;
  maxScore: number;
}

export const SemaforoProgressBar: React.FC<ProgressBarProps> = ({ score, maxScore }) => {
  const percentage = Math.min(Math.round((score / maxScore) * 100), 100);
  
  let barColor = 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.4)]';
  if (percentage >= 75) barColor = 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.4)]';
  else if (percentage >= 40) barColor = 'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.4)]';

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-1.5 text-xs text-slate-400 font-bold font-mono">
        <span>PROGRESO DE FORMALIZACIÓN</span>
        <span>{percentage}%</span>
      </div>
      <div className="w-full bg-slate-800 h-3.5 rounded-full overflow-hidden border border-white/5">
        <div className={`h-full rounded-full transition-all duration-500 ease-out ${barColor}`} style={{ width: `${percentage}%` }}></div>
      </div>
    </div>
  );
};

// 3. Card del Trabajador Vial para el Mapa / Lista
interface WorkerCardProps {
  name: string;
  specialty: string;
  rating: number;
  distance: string;
  avatarUrl?: string;
  status: 'ROJO' | 'AMARILLO' | 'VERDE' | string;
  price: number;
}

export const WorkerCard: React.FC<WorkerCardProps> = ({ name, specialty, rating, distance, avatarUrl, status, price }) => {
  return (
    <div className="bg-[#161D30] border border-slate-800 rounded-2xl p-5 hover:border-slate-700 hover:scale-[1.02] transition-all duration-200 shadow-xl flex items-center gap-4">
      <div className="relative">
        <img 
          src={avatarUrl || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80"} 
          alt={name} 
          className="w-14 h-14 rounded-full object-cover border-2 border-brand-blue" 
        />
        <span className="absolute bottom-0 right-0 h-4 w-4 rounded-full border-2 border-[#161D30] bg-emerald-500"></span>
      </div>
      <div className="flex-grow">
        <div className="flex justify-between items-start">
          <h4 className="font-extrabold text-white text-base leading-tight">{name}</h4>
          <span className="text-amber-400 font-bold text-xs flex items-center gap-1">★ {rating}</span>
        </div>
        <p className="text-xs text-[#06b6d4] font-semibold mt-0.5">{specialty}</p>
        <div className="flex justify-between items-center mt-3">
          <span className="text-[10px] text-slate-400 font-medium">📍 {distance}</span>
          <SemaforoBadge status={status} size="sm" />
        </div>
      </div>
      <div className="text-right pl-4 border-l border-slate-800 shrink-0">
        <span className="text-[9px] text-slate-400 block font-bold font-mono">TARIFA</span>
        <span className="text-lg font-black text-white font-mono">S/. {price}</span>
      </div>
    </div>
  );
};
