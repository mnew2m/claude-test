import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import type { StatsData } from '../../types'

interface CompletionChartProps {
  data: StatsData[]
  title: string
}

export function CompletionChart({ data, title }: CompletionChartProps) {
  return (
    <div
      className="p-4 rounded-xl shadow-card"
      style={{ background: 'var(--color-card)' }}
    >
      <h3 className="text-[15px] font-semibold text-primary mb-4 tracking-[-0.2px]">{title}</h3>
      <ResponsiveContainer width="100%" height={148}>
        <BarChart data={data} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
          <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--color-secondary)' }} axisLine={false} tickLine={false} />
          <YAxis width={44} tick={{ fontSize: 11, fill: 'var(--color-secondary)' }} axisLine={false} tickLine={false} domain={[0, 100]} tickFormatter={v => `${v}%`} />
          <Tooltip
            formatter={(value: number) => [`${value}%`, '완료율']}
            contentStyle={{
              background: 'var(--color-card)',
              border: '0.5px solid var(--color-separator)',
              borderRadius: '10px',
              fontSize: '13px',
              color: 'var(--color-primary)',
              boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
            }}
            cursor={{ fill: 'var(--color-fill)' }}
          />
          <Bar dataKey="rate" fill="#7c3aed" radius={[5, 5, 0, 0]} maxBarSize={28} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
