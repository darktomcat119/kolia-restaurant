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
      className={`${c.bg} group rounded-2xl border border-white/80 p-5 shadow-md backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg ${c.glow} sm:p-6`}
    >
      <div className="mb-4 flex items-start justify-between sm:mb-5">
        <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${c.iconBg} ${c.iconColor} shadow-md transition-transform duration-300 group-hover:scale-105 ${c.glow} sm:h-12 sm:w-12`}>
          {icon}
        </div>
        {trend && (
          <span className={`text-[11px] font-body font-semibold ${c.badge} bg-white/70 backdrop-blur-sm px-2.5 py-1 rounded-full border border-white/50`}>
            {trend}
          </span>
        )}
      </div>
      <div className="mb-1 break-words font-body text-2xl font-bold leading-none tracking-tight text-[#1A1A1A] sm:text-[2rem] lg:text-[2.125rem]">
        {value}
      </div>
      <div className="mt-1.5 font-body text-xs leading-snug tracking-wide text-[#8A857F] sm:mt-2">{label}</div>
    </div>
  );
}
