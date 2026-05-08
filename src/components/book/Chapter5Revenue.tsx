import { useMemo } from 'react';
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { calculateScenario } from '../../calculations';
import { useBusinessPlanStore } from '../../store/useBusinessPlanStore';

export function Chapter5Revenue() {
  const carsPerDayBook = useBusinessPlanStore((s) => s.carsPerDayBook);
  const setCarsPerDayBook = useBusinessPlanStore((s) => s.setCarsPerDayBook);
  const inputs = useBusinessPlanStore((s) => s.calculatorInputs);

  const results = useMemo(
    () => calculateScenario({ ...inputs, carsPerDay: carsPerDayBook }, 'taxi'),
    [inputs, carsPerDayBook],
  );

  const chartData = useMemo(
    () =>
      Array.from({ length: 7 }).map((_, i) => {
        const cars = 200 + i * 100;
        const r = calculateScenario({ ...inputs, carsPerDay: cars }, 'taxi');
        return { cars, profitMln: r.monthlyProfit / 1e6, payback: r.paybackMonths };
      }),
    [inputs],
  );

  return (
    <section className="book-chapter">
      <div className="book-grid">
        <div className="prose max-w-none">
          <h2>Глава 5: Доходы и прибыль</h2>
          <p>Формула базового дня: 400 машин × 50 кВт·ч × 14 руб = 280 000 руб выручки в сутки.</p>
          <p>
            После учета стоимости газа и постоянных расходов проект формирует около 5,2 млн руб чистой прибыли в месяц
            при базовом объеме.
          </p>
        </div>
        <div className="book-card">
          <label className="book-label">Количество машин в сутки: {carsPerDayBook.toFixed(0)}</label>
          <input type="range" min={200} max={800} step={10} value={carsPerDayBook} onChange={(e) => setCarsPerDayBook(Number(e.target.value))} className="w-full" />
          <p className="mt-2 text-sm">Прибыль: <strong>{(results.monthlyProfit / 1e6).toFixed(2)} млн/мес</strong></p>
          <p className="text-sm">Окупаемость: <strong>{Number.isFinite(results.paybackMonths) ? `${results.paybackMonths.toFixed(1)} мес` : 'Не окупается'}</strong></p>
          <div className="mt-3 h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <XAxis dataKey="cars" />
                <YAxis />
                <Tooltip formatter={(v) => Number(v).toFixed(2)} />
                <Line dataKey="profitMln" stroke="#2563eb" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </section>
  );
}
