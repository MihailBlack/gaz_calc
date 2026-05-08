import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { ChartPoint } from '../types';

interface PaybackChartProps {
  data: ChartPoint[];
}

export function PaybackChart({ data }: PaybackChartProps) {
  return (
    <div className="h-72 w-full rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="mb-3 text-sm font-semibold text-slate-700">Накопленная чистая прибыль (млн руб)</h3>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 6, right: 12, left: 8, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="month" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip
            formatter={(value) => `${Number(value ?? 0).toFixed(2)} млн руб`}
            labelFormatter={(label) => `Месяц ${Number(label ?? 0)}`}
          />
          <Line type="monotone" dataKey="accumulatedProfitMln" stroke="#4f46e5" strokeWidth={3} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
