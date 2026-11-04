import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts';

interface ChartProps {
  data: any[];
  xKey: string;
  series: {
    key: string;
    name: string;
    color: string;
    type?: 'area' | 'line' | 'bar';
  }[];
  height?: number;
  grid?: boolean;
}

// Custom Premium Tooltip
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/95 dark:bg-[#1E293B]/95 border border-[#E5EEFF] dark:border-[#334155] p-4 rounded-xl shadow-xl backdrop-blur-md text-left">
        <p className="text-[13px] font-bold text-[#0B1C30] dark:text-[#F8FAFC] mb-2.5">{label}</p>
        <div className="space-y-2">
          {payload.map((item: any, index: number) => (
            <div key={index} className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: item.color }} />
              <span className="text-[13px] text-[#6D7A79] dark:text-[#94A3B8] font-medium">{item.name}:</span>
              <span className="text-[13px] font-extrabold text-[#0B1C30] dark:text-white">
                {typeof item.value === 'number' ? item.value.toLocaleString() : item.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

// 1. Interactive Area / Line / Bar Chart
export const OperationsChart: React.FC<ChartProps & { type?: 'area' | 'line' | 'bar' }> = ({
  data,
  xKey,
  series,
  height = 300,
  grid = true,
  type = 'area'
}) => {
  return (
    <div style={{ width: '100%', height }} className="animate-fade-in">
      <ResponsiveContainer>
        {type === 'area' ? (
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              {series.map((s, idx) => (
                <linearGradient key={idx} id={`colorUv-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={s.color} stopOpacity={0.25} />
                  <stop offset="95%" stopColor={s.color} stopOpacity={0.0} />
                </linearGradient>
              ))}
            </defs>
            {grid && <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="rgba(11,28,48,0.06)" />}
            <XAxis
              dataKey={xKey}
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 12, fill: '#667085', fontWeight: 600 }}
              dy={10}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 12, fill: '#667085', fontWeight: 600 }}
              dx={-10}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(11,28,48,0.06)', strokeWidth: 1 }} />
            <Legend 
              iconType="circle" 
              iconSize={8}
              wrapperStyle={{ fontSize: 13, paddingTop: 20, fontWeight: 600, color: '#344054' }} 
            />
            {series.map((s, idx) => (
              <Area
                key={idx}
                type="monotone"
                dataKey={s.key}
                name={s.name}
                stroke={s.color}
                strokeWidth={2.5}
                fillOpacity={1}
                fill={`url(#colorUv-${s.key})`}
                activeDot={{ r: 6, strokeWidth: 0, fill: s.color }}
              />
            ))}
          </AreaChart>
        ) : type === 'bar' ? (
          <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            {grid && <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="rgba(11,28,48,0.06)" />}
            <XAxis
              dataKey={xKey}
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 12, fill: '#667085', fontWeight: 600 }}
              dy={10}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 12, fill: '#667085', fontWeight: 600 }}
              dx={-10}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(11,28,48,0.02)' }} />
            <Legend 
              iconType="circle" 
              iconSize={8}
              wrapperStyle={{ fontSize: 13, paddingTop: 20, fontWeight: 600, color: '#344054' }} 
            />
            {series.map((s, idx) => (
              <Bar
                key={idx}
                dataKey={s.key}
                name={s.name}
                fill={s.color}
                radius={[8, 8, 0, 0]}
                maxBarSize={28}
              />
            ))}
          </BarChart>
        ) : (
          <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            {grid && <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="rgba(11,28,48,0.06)" />}
            <XAxis
              dataKey={xKey}
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 12, fill: '#667085', fontWeight: 600 }}
              dy={10}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 12, fill: '#667085', fontWeight: 600 }}
              dx={-10}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(11,28,48,0.06)', strokeWidth: 1 }} />
            <Legend 
              iconType="circle" 
              iconSize={8}
              wrapperStyle={{ fontSize: 13, paddingTop: 20, fontWeight: 600, color: '#344054' }} 
            />
            {series.map((s, idx) => (
              <Line
                key={idx}
                type="monotone"
                dataKey={s.key}
                name={s.name}
                stroke={s.color}
                strokeWidth={3}
                dot={{ r: 4, strokeWidth: 0, fill: s.color }}
                activeDot={{ r: 6, strokeWidth: 0, fill: s.color }}
              />
            ))}
          </LineChart>
        )}
      </ResponsiveContainer>
    </div>
  );
};

// 2. Donut / Pie Chart for Inventory or Trips distribution
interface DonutProps {
  data: { name: string; value: number; color: string }[];
  height?: number;
}

export const OperationsDonut: React.FC<DonutProps> = ({ data, height = 240 }) => {
  return (
    <div style={{ width: '100%', height }} className="animate-fade-in">
      <ResponsiveContainer>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={65}
            outerRadius={85}
            paddingAngle={4}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} stroke="var(--color-card)" strokeWidth={2} />
            ))}
          </Pie>
          <Tooltip
            formatter={((value: any) => [`${value?.toLocaleString()}`, 'Count']) as any}
            contentStyle={{ 
              borderRadius: 12, 
              border: '1px solid rgba(11,28,48,0.08)', 
              backgroundColor: 'var(--color-card)', 
              color: 'var(--color-text-primary)', 
              fontSize: 13,
              fontWeight: 600,
              boxShadow: '0 10px 25px -5px rgba(11, 28, 48, 0.05)'
            }}
          />
          <Legend 
            iconType="circle" 
            iconSize={8}
            wrapperStyle={{ fontSize: 13, bottom: 0, fontWeight: 600, color: '#344054' }} 
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

