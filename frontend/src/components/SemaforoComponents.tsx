import React from 'react';
import { StarIcon, MapPinIcon } from './SemaforoIcons.js';

// ==========================================
// 1. Card Component
// ==========================================
interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({ children, className = '', ...props }) => {
  return (
    <div
      className={`glass-panel rounded-2xl p-6 shadow-2xl transition-all duration-300 hover:-translate-y-1 hover:border-[#3B82F6]/50 hover:shadow-[0_10px_30px_rgba(59,130,246,0.08)] ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

// ==========================================
// 2. Button Component
// ==========================================
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({ variant = 'primary', children, className = '', ...props }) => {
  let styleClass = '';
  if (variant === 'primary') {
    styleClass = 'bg-[#3B82F6] hover:bg-[#2563EB] text-[#F7FAFC] shadow-[0_4px_20px_rgba(59,130,246,0.25)] hover:shadow-[0_6px_25px_rgba(59,130,246,0.35)] font-bold';
  } else if (variant === 'secondary') {
    styleClass = 'bg-[#1A202C]/60 border border-[#2D3748] text-[#F7FAFC] hover:bg-[#1A202C]/90 hover:border-[#3B82F6]/30 font-semibold';
  } else if (variant === 'ghost') {
    styleClass = 'bg-transparent text-[#3B82F6] hover:text-[#2563EB] hover:underline px-0 py-0 flex items-center gap-1 font-bold';
  }

  return (
    <button
      className={`min-h-[44px] px-6 py-2.5 rounded-xl text-[14px] transition-all duration-300 flex items-center justify-center gap-2 active:scale-[0.98] cursor-pointer ${styleClass} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

// ==========================================
// 3. Badge Component
// ==========================================
interface BadgeProps {
  status: 'ROJO' | 'AMARILLO' | 'VERDE' | string;
  text?: string;
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({ status, text, size = 'md' }) => {
  const normStatus = status.toUpperCase();
  
  let dotColor = 'bg-[#E53E3E]';
  let textColor = 'text-[#E53E3E]';
  let bgColor = 'bg-[#E53E3E]/10';
  let borderClass = 'border-[#E53E3E]/20';
  let label = '🔴 Pendiente / Riesgo';

  if (normStatus === 'AMARILLO' || normStatus === 'YELLOW') {
    dotColor = 'bg-[#F6AD55]';
    textColor = 'text-[#F6AD55]';
    bgColor = 'bg-[#F6AD55]/10';
    borderClass = 'border-[#F6AD55]/20';
    label = '🟡 En Proceso';
  } else if (normStatus === 'VERDE' || normStatus === 'GREEN') {
    dotColor = 'bg-[#48BB78]';
    textColor = 'text-[#48BB78]';
    bgColor = 'bg-[#48BB78]/10';
    borderClass = 'border-[#48BB78]/20';
    label = '🟢 Verificado / Completo';
  }

  const displayText = text || label;

  return (
    <span
      className={`inline-flex items-center gap-2 font-mono font-bold border rounded-full ${
        size === 'sm' ? 'px-2.5 py-0.5 text-[11px]' : 'px-3.5 py-1 text-[13px]'
      } ${bgColor} ${textColor} ${borderClass}`}
    >
      <span className={`h-2 w-2 rounded-full ${dotColor}`} />
      <span>{displayText}</span>
    </span>
  );
};

export const SemaforoBadge = Badge;

// ==========================================
// 4. Progress Component
// ==========================================
interface SemaforoProgressProps {
  score: number;
  maxScore?: number;
  milestones?: Array<{ label: string; value: number }>;
}

export const SemaforoProgress: React.FC<SemaforoProgressProps> = ({ score, maxScore = 100, milestones }) => {
  const percentage = Math.min(Math.round((score / maxScore) * 100), 100);
  
  let barColor = 'bg-[#E53E3E] shadow-[0_0_10px_rgba(229,62,62,0.4)]';
  if (percentage >= 75) barColor = 'bg-[#48BB78] shadow-[0_0_10px_rgba(72,187,120,0.4)]';
  else if (percentage >= 40) barColor = 'bg-[#F6AD55] shadow-[0_0_10px_rgba(246,173,85,0.4)]';

  const defaultMilestones = milestones || [
    { label: 'Básico', value: 0 },
    { label: 'Verificado', value: 40 },
    { label: 'Formalizado', value: 75 },
  ];

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-2.5 text-xs text-[#A0AEC0] font-bold font-mono">
        <span className="uppercase tracking-wider font-mono">PROGRESO DE FORMALIZACIÓN</span>
        <span className="text-[14px] text-[#F7FAFC] font-black">{percentage}%</span>
      </div>
      <div className="relative w-full bg-[#1A202C] h-4 rounded-full border border-white/5 shadow-inner">
        <div
          className={`h-full rounded-full transition-all duration-500 ease-out ${barColor}`}
          style={{ width: `${percentage}%` }}
        />
        
        {defaultMilestones.map((m, idx) => {
          const pos = (m.value / maxScore) * 100;
          const isActive = score >= m.value;
          return (
            <div
              key={idx}
              className="absolute top-1/2 -translate-y-1/2 flex flex-col items-center z-10"
              style={{ left: `${pos}%` }}
            >
              <div
                className={`w-3 h-3 rounded-full border border-[#171923] transition-colors duration-300 ${
                  isActive ? 'bg-[#3B82F6]' : 'bg-[#2D3748]'
                }`}
              />
              <span className="text-[10px] font-mono mt-5 absolute whitespace-nowrap text-[#A0AEC0]">
                {m.label} ({m.value})
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const SemaforoProgressBar = ({ score, maxScore = 100 }: { score: number; maxScore: number }) => (
  <SemaforoProgress score={score} maxScore={maxScore} />
);

// ==========================================
// 5. MetricCard Component
// ==========================================
interface MetricCardProps {
  icon: React.ReactNode;
  value: string;
  label: string;
  className?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({ icon, value, label, className = '' }) => {
  return (
    <Card className={`flex flex-col items-center justify-center text-center p-6 bg-[#171923]/60 hover:border-[#3B82F6]/30 transition-all duration-300 ${className}`}>
      <div className="mb-4 bg-[#1A202C] h-12 w-12 rounded-2xl flex items-center justify-center shadow-inner border border-[#2D3748]/30">
        {icon}
      </div>
      <span className="text-[34px] font-black text-[#F7FAFC] font-mono leading-none tracking-tight drop-shadow-[0_0_10px_rgba(247,250,252,0.1)]">{value}</span>
      <span className="text-[12px] font-bold text-[#A0AEC0] uppercase tracking-[0.08em] font-mono mt-3 text-center">
        {label}
      </span>
    </Card>
  );
};

// ==========================================
// 6. RoleCard Component
// ==========================================
interface RoleCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick: () => void;
  ctaText: string;
  accentColor?: string;
}

export const RoleCard: React.FC<RoleCardProps> = ({ icon, title, description, onClick, ctaText, accentColor = '#3B82F6' }) => {
  const [hovered, setHovered] = React.useState(false);

  return (
    <Card
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="flex flex-col justify-between h-full min-h-[280px] cursor-pointer transition-all duration-300 relative overflow-hidden"
      style={{
        borderColor: hovered ? accentColor : 'rgba(45, 55, 72, 0.6)',
        boxShadow: hovered ? `0 15px 35px ${accentColor}10, 0 0 20px ${accentColor}05` : 'none'
      }}
    >
      {/* Subtle backglow gradient on hover */}
      <div 
        className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl pointer-events-none transition-opacity duration-500" 
        style={{ 
          background: `${accentColor}15`,
          opacity: hovered ? 1 : 0 
        }} 
      />

      <div>
        <div 
          className="h-12 w-12 rounded-2xl flex items-center justify-center text-2xl mb-5 border transition-all duration-300"
          style={{
            backgroundColor: hovered ? `${accentColor}15` : '#1A202C',
            borderColor: hovered ? `${accentColor}40` : 'rgba(45, 55, 72, 0.3)',
            color: hovered ? accentColor : '#F7FAFC'
          }}
        >
          {icon}
        </div>
        <h2 className="text-[22px] font-black text-[#F7FAFC] leading-[1.3] mb-2 tracking-tight">
          {title}
        </h2>
        <p className="text-[14px] text-[#A0AEC0] leading-[1.6]">
          {description}
        </p>
      </div>
      <Button 
        variant="ghost" 
        onClick={(e) => { e.stopPropagation(); onClick(); }} 
        className="mt-4 shrink-0 self-start transition-all duration-300 hover:translate-x-1"
        style={{ color: hovered ? accentColor : '#3B82F6' }}
      >
        {ctaText} &rarr;
      </Button>
    </Card>
  );
};

// ==========================================
// 7. WorkerCard Component
// ==========================================
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
    <Card className="flex items-center gap-4 hover:-translate-y-0.5 hover:shadow-md transition-all duration-150">
      <div className="relative">
        <img 
          src={avatarUrl || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80"} 
          alt={name} 
          className="w-14 h-14 rounded-full object-cover border-2 border-[#3B82F6]" 
        />
        <span className="absolute bottom-0 right-0 h-4 w-4 rounded-full border border-[#171923] bg-[#48BB78]" />
      </div>
      <div className="flex-grow">
        <div className="flex justify-between items-start">
          <h4 className="font-bold text-[#F7FAFC] text-[16px] leading-tight">{name}</h4>
          <span className="text-[#F6AD55] font-bold text-xs flex items-center gap-1">
            <StarIcon size="sm" className="text-[#F6AD55]" /> {rating}
          </span>
        </div>
        <p className="text-xs text-[#3B82F6] font-semibold mt-0.5">{specialty}</p>
        <div className="flex justify-between items-center mt-3">
          <span className="text-[11px] text-[#A0AEC0] font-medium flex items-center gap-1">
            <MapPinIcon size="xs" className="text-[#A0AEC0]" /> {distance}
          </span>
          <Badge status={status} size="sm" />
        </div>
      </div>
      <div className="text-right pl-4 border-l border-[#2D3748] shrink-0">
        <span className="text-[11px] text-[#A0AEC0] block font-bold font-mono">TARIFA</span>
        <span className="text-[18px] font-bold text-[#F7FAFC] font-mono">S/. {price}</span>
      </div>
    </Card>
  );
};
