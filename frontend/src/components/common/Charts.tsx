/**
 * Analytics Chart Components
 * Enterprise Design System V2
 * Recharts-based charts for Dashboard Analytics
 */

import React, { useMemo } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend
} from 'recharts';

// Color palette
const COLORS = {
  blue: '#3b82f6',
  green: '#10b981',
  red: '#ef4444',
  amber: '#f59e0b',
  purple: '#8b5cf6',
  slate: '#64748b',
  cyan: '#06b6d4',
  pink: '#ec4899',
};

const CHART_COLORS = Object.values(COLORS);

// Props interfaces
interface DonutChartDataItem {
  name: string;
  value: number;
  color?: string;
}

interface BarChartDataItem {
  name: string;
  value: number;
  color?: string;
}

interface PieChartDataItem {
  name: string;
  value: number;
  color?: string;
}

interface LineChartDataItem {
  name?: string;
  [key: string]: string | number | undefined;
}

interface DonutChartProps {
  data: DonutChartDataItem[];
  title?: string;
  height?: number;
}

interface BarChartProps {
  data: BarChartDataItem[];
  title?: string;
  height?: number;
}

interface PieChartProps {
  data: PieChartDataItem[];
  title?: string;
  height?: number;
}

interface LineChartProps {
  data: LineChartDataItem[];
  lines: { dataKey: string; name: string; color: string }[];
  title?: string;
  height?: number;
}

// Common tooltip style
const tooltipStyle = {
  backgroundColor: 'white',
  border: '1px solid #e2e8f0',
  borderRadius: '8px',
  padding: '8px 12px',
  fontSize: '12px',
  color: '#334155',
  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
};

// Empty state component
const EmptyState = ({ message = 'No data available' }: { message?: string }) => (
  <div className="flex items-center justify-center h-full min-h-[200px]">
    <div className="text-center">
      <div className="w-16 h-16 mx-auto rounded-2xl bg-slate-100 flex items-center justify-center mb-3">
        <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      </div>
      <p className="text-sm font-medium text-slate-500">{message}</p>
    </div>
  </div>
);

// Custom label for donut chart
const renderCustomizedLabel = ({
  cx,
  cy,
  midAngle,
  innerRadius,
  outerRadius,
  percent,
}: any) => {
  if (!percent || percent < 0.05) return null;
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={12} fontWeight={600}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

/**
 * Service Request Status Donut Chart
 */
export function ServiceRequestDonutChart({ data, height = 240 }: DonutChartProps) {
  const hasData = data && data.length > 0 && data.some(d => d.value > 0);
  
  if (!hasData) {
    return <EmptyState message="No service request data available" />;
  }
  
  const total = data.reduce((sum, item) => sum + item.value, 0);
  
  return (
    <div className="relative">
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={90}
            paddingAngle={2}
            dataKey="value"
            labelLine={false}
            label={renderCustomizedLabel}
          >
            {data.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={entry.color || CHART_COLORS[index % CHART_COLORS.length]} 
              />
            ))}
          </Pie>
          <Tooltip 
            contentStyle={tooltipStyle}
          />
        </PieChart>
      </ResponsiveContainer>
      {/* Center label */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="text-center -mt-6">
          <p className="text-2xl font-bold text-slate-800">{total}</p>
          <p className="text-xs text-slate-500">Total</p>
        </div>
      </div>
      {/* Legend */}
      <div className="flex flex-wrap justify-center gap-3 mt-2">
        {data.map((entry, index) => (
          <div key={index} className="flex items-center gap-1.5">
            <div 
              className="w-2.5 h-2.5 rounded-full" 
              style={{ backgroundColor: entry.color || CHART_COLORS[index % CHART_COLORS.length] }} 
            />
            <span className="text-xs text-slate-600">{entry.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Incident Severity Bar Chart
 */
export function IncidentBarChart({ data, height = 240 }: BarChartProps) {
  const hasData = data && data.length > 0 && data.some(d => d.value > 0);
  
  if (!hasData) {
    return <EmptyState message="No incident data available" />;
  }
  
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <XAxis 
          dataKey="name" 
          tick={{ fontSize: 11, fill: '#64748b' }}
          axisLine={{ stroke: '#e2e8f0' }}
          tickLine={false}
        />
        <YAxis 
          tick={{ fontSize: 11, fill: '#64748b' }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip 
          contentStyle={tooltipStyle}
          cursor={{ fill: '#f1f5f9' }}
        />
        <Bar 
          dataKey="value" 
          radius={[4, 4, 0, 0]}
          maxBarSize={50}
        >
          {data.map((entry, index) => (
            <Cell 
              key={`cell-${index}`} 
              fill={entry.color || CHART_COLORS[index % CHART_COLORS.length]} 
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

/**
 * Asset Distribution Pie Chart
 */
export function AssetPieChart({ data, height = 240 }: PieChartProps) {
  const hasData = data && data.length > 0 && data.some(d => d.value > 0);
  
  if (!hasData) {
    return <EmptyState message="No asset data available" />;
  }
  
  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          outerRadius={90}
          dataKey="value"
          label={({ name, percent }: any) => 
            `${name || ''}: ${((percent || 0) * 100).toFixed(0)}%`
          }
          labelLine={{ stroke: '#94a3b8', strokeWidth: 1 }}
        >
          {data.map((entry, index) => (
            <Cell 
              key={`cell-${index}`} 
              fill={entry.color || CHART_COLORS[index % CHART_COLORS.length]} 
            />
          ))}
        </Pie>
        <Tooltip 
          contentStyle={tooltipStyle}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

/**
 * Monthly Activity Trend Line Chart
 */
export function MonthlyTrendChart({ data, lines, height = 240 }: LineChartProps) {
  const hasData = data && data.length > 0;
  
  if (!hasData) {
    return <EmptyState message="No trend data available" />;
  }
  
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <XAxis 
          dataKey="name" 
          tick={{ fontSize: 11, fill: '#64748b' }}
          axisLine={{ stroke: '#e2e8f0' }}
          tickLine={false}
        />
        <YAxis 
          tick={{ fontSize: 11, fill: '#64748b' }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip 
          contentStyle={tooltipStyle}
        />
        <Legend 
          wrapperStyle={{ fontSize: 12, paddingTop: 10 }}
        />
        {lines.map((line, index) => (
          <Line
            key={index}
            type="monotone"
            dataKey={line.dataKey}
            name={line.name}
            stroke={line.color}
            strokeWidth={2}
            dot={{ r: 4, fill: line.color }}
            activeDot={{ r: 6 }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}

// Export chart data generators (for demo/mock data)
export const ChartData = {
  // Service Request Status - mock data
  serviceRequestStatus: [
    { name: 'Open', value: 45, color: COLORS.blue },
    { name: 'In Progress', value: 28, color: COLORS.amber },
    { name: 'Completed', value: 89, color: COLORS.green },
    { name: 'Closed', value: 156, color: COLORS.slate },
  ],
  
  // Incident Severity - mock data
  incidentSeverity: [
    { name: 'Critical', value: 5, color: COLORS.red },
    { name: 'High', value: 12, color: COLORS.amber },
    { name: 'Medium', value: 28, color: COLORS.blue },
    { name: 'Low', value: 43, color: COLORS.green },
  ],
  
  // Asset Distribution - mock data
  assetDistribution: [
    { name: 'Available', value: 245, color: COLORS.green },
    { name: 'Assigned', value: 389, color: COLORS.blue },
    { name: 'Maintenance', value: 67, color: COLORS.amber },
    { name: 'Retired', value: 23, color: COLORS.slate },
  ],
  
  // Monthly Activity Trend - mock data
  monthlyActivity: [
    { name: 'Jan', requests: 65, incidents: 12 },
    { name: 'Feb', requests: 78, incidents: 18 },
    { name: 'Mar', requests: 92, incidents: 15 },
    { name: 'Apr', requests: 85, incidents: 22 },
    { name: 'May', requests: 98, incidents: 19 },
    { name: 'Jun', requests: 112, incidents: 25 },
  ],
  
  // Line chart config
  monthlyLines: [
    { dataKey: 'requests', name: 'Service Requests', color: COLORS.blue },
    { dataKey: 'incidents', name: 'Incidents', color: COLORS.red },
  ],
};

export default {
  ServiceRequestDonutChart,
  IncidentBarChart,
  AssetPieChart,
  MonthlyTrendChart,
  ChartData,
};
