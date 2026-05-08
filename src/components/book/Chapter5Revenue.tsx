import { useMemo } from 'react';
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { buildInputsForScenario, calculateScenario } from '../../calculations';
import { useBusinessPlanStore } from '../../store/useBusinessPlanStore';

export function Chapter5Revenue() {
  const scenario = useBusinessPlanStore((s) => s.calculatorScenario);
  const quantity = useBusinessPlanStore((s) => s.quantity);
  const setQuantity = useBusinessPlanStore((s) => s.setQuantity);
  const inputs = useBusinessPlanStore((s) => s.calculatorInputs);

  const scenarioInputs = useMemo(() => buildInputsForScenario(inputs, scenario, quantity), [inputs, scenario, quantity]);
  const results = useMemo(() => calculateScenario(scenarioInputs, scenario), [scenarioInputs, scenario]);

  const chartData = useMemo(
    () =>
      Array.from({ length: 7 }).map((_, i) => {
        const qty = scenario === 'taxi' ? 200 + i * 100 : 20 + i * 20;
        const built = buildInputsForScenario(inputs, scenario, qty);
        const r = calculateScenario(built, scenario);
        return { qty, profitMln: r.monthlyProfit / 1e6, payback: r.paybackMonths };
      }),
    [inputs, scenario],
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
          <label className="book-label">
            {scenario === 'taxi' ? 'Количество машин в сутки' : 'Количество бизнесов'}: {quantity.toFixed(0)}
          </label>
          <input
            type="range"
            min={scenario === 'taxi' ? 200 : 10}
            max={scenario === 'taxi' ? 800 : 200}
            step={scenario === 'taxi' ? 10 : 1}
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value))}
            className="w-full"
          />
          <p className="mt-2 text-sm">Прибыль: <strong>{(results.monthlyProfit / 1e6).toFixed(2)} млн/мес</strong></p>
          <p className="text-sm">Окупаемость: <strong>{Number.isFinite(results.paybackMonths) ? `${results.paybackMonths.toFixed(1)} мес` : 'Не окупается'}</strong></p>
          <div className="mt-3 h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <XAxis dataKey="qty" />
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
