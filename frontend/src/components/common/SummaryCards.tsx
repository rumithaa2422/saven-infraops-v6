import React from 'react';
import { LucideIcon } from 'lucide-react';

// Reusable Summary Card Component
export interface SummaryCardProps {
  icon: LucideIcon;
  iconBgColor: string;
  iconColor: string;
  value: number | string;
  label: string;
  valueColor?: string;
  onClick?: () => void;
}

export function SummaryCard({
  icon: Icon,
  iconBgColor,
  iconColor,
  value,
  label,
  valueColor = 'text-slate-900',
  onClick
}: SummaryCardProps) {
  return (
    <div
      className={`
        bg-white rounded-xl border border-slate-200/60 p-3 shadow-sm
        hover:shadow-lg transition-all duration-300 cursor-pointer group
        ${onClick ? 'hover:border-indigo-300' : ''}
      `}
      onClick={onClick}
    >
      <div className="flex items-center gap-3">
        <div className={`
          w-9 h-9 rounded-lg flex items-center justify-center
          group-hover:scale-110 transition-transform
          ${iconBgColor}
        `}>
          <Icon className={`w-4 h-4 ${iconColor}`} />
        </div>
        <div>
          <p className={`text-xl font-bold ${valueColor}`}>{value}</p>
          <p className="text-xs font-medium text-slate-500">{label}</p>
        </div>
      </div>
    </div>
  );
}

// Reusable Summary Cards Container
export interface SummaryCardData {
  icon: LucideIcon;
  iconBgColor: string;
  iconColor: string;
  value: number | string;
  label: string;
  valueColor?: string;
  onClick?: () => void;
}

export interface SummaryCardsProps {
  cards: SummaryCardData[];
  className?: string;
}

export function SummaryCards({ cards, className = '' }: SummaryCardsProps) {
  return (
    <div className={`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 ${className}`}>
      {cards.map((card, index) => (
        <SummaryCard
          key={index}
          icon={card.icon}
          iconBgColor={card.iconBgColor}
          iconColor={card.iconColor}
          value={card.value}
          label={card.label}
          valueColor={card.valueColor}
          onClick={card.onClick}
        />
      ))}
    </div>
  );
}
