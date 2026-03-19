import type { ReactNode } from 'react';

type ColorVariant = 'orange' | 'green' | 'blue' | 'purple';

interface StatsCardProps {
  label: string;
  value: string | number;
  icon: ReactNode;
  color?: ColorVariant;
  trend?: string;
}

const COLOR_MAP: Record<ColorVariant, { bg: string; iconBg: string; iconColor: string; badge: string; glow: string }> = {
  orange: {
    bg: 'bg-gradient-to-br from-[#FFF8F2] via-[#FFF0E3] to-[#FFE4CF]',
    iconBg: 'bg-gradient-to-br from-[#E07A2F] to-[#C96820]',
    iconColor: 'text-white',
    badge: 'text-[#E07A2F]',
    glow: 'shadow-[#E07A2F]/10',
  },
  green: {
    bg: 'bg-gradient-to-br from-[#F2FCF6] via-[#E8F9EF] to-[#D0F2E0]',
    iconBg: 'bg-gradient-to-br from-[#1B5E3A] to-[#15482D]',
    iconColor: 'text-white',
    badge: 'text-[#1B5E3A]',
    glow: 'shadow-[#1B5E3A]/10',
  },
  blue: {
    bg: 'bg-gradient-to-br from-[#F3F7FF] via-[#EAF1FF] to-[#D8E8FF]',
    iconBg: 'bg-gradient-to-br from-[#3B82F6] to-[#2563EB]',
    iconColor: 'text-white',
    badge: 'text-[#3B82F6]',
    glow: 'shadow-[#3B82F6]/10',
  },
  purple: {
    bg: 'bg-gradient-to-br from-[#F8F4FF] via-[#F0EAFF] to-[#E5DBFF]',
    iconBg: 'bg-gradient-to-br from-[#7C3AED] to-[#6D28D9]',
    iconColor: 'text-white',
    badge: 'text-[#7C3AED]',
    glow: 'shadow-[#7C3AED]/10',
  },
};

export function StatsCard({ label, value, icon, color = 'green', trend }: StatsCardProps) {
  const c = COLOR_MAP[color];
  return (
    <div
      className={`${c.bg} rounded-2xl p-6 border border-white/80 backdrop-blur-sm shadow-md ${c.glow} hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 group`}
    >
      <div className="flex items-start justify-between mb-5">
        <div className={`w-12 h-12 rounded-xl ${c.iconBg} flex items-center justify-center ${c.iconColor} shadow-md ${c.glow} group-hover:scale-105 transition-transform duration-300`}>
          {icon}
        </div>
        {trend && (
          <span className={`text-[11px] font-body font-semibold ${c.badge} bg-white/70 backdrop-blur-sm px-2.5 py-1 rounded-full border border-white/50`}>
            {trend}
          </span>
        )}
      </div>
      <div className="text-[2rem] font-bold font-body text-[#1A1A1A] mb-1 leading-none tracking-tight">
        {value}
      </div>
      <div className="text-xs text-[#8A857F] font-body mt-2 leading-snug tracking-wide">{label}</div>
    </div>
  );
}
