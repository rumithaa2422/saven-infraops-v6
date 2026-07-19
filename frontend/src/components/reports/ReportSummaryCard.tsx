import React, { ReactNode } from 'react';

interface ReportSummaryCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: ReactNode;
  color?: string;
}

export function ReportSummaryCard({ title, value, subtitle, icon, color = 'var(--brand)' }: ReportSummaryCardProps) {
  return (
    <div className="summary-card">
      <div className="summary-icon" style={{ backgroundColor: `${color}15`, color }}>
        {icon}
      </div>
      <div className="summary-content">
        <span className="summary-value">{typeof value === 'number' ? value.toLocaleString() : value}</span>
        <span className="summary-title">{title}</span>
        {subtitle && <span className="summary-subtitle">{subtitle}</span>}
      </div>
    </div>
  );
}
