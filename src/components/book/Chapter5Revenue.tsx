import { useMemo } from 'react';
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { buildInputsForTaxi, calculateBusinessEconomics, calculateScenario } from '../../calculations';
import { useBusinessPlanStore } from '../../store/useBusinessPlanStore';

export function Chapter5Revenue() {
  const scenario = useBusinessPlanStore((s) => s.calculatorScenario);
  const quantity = useBusinessPlanStore((s) => s.quantity);
  const setQuantity = useBusinessPlanStore((s) => s.setQuantity);
  const inputs = useBusinessPlanStore((s) => s.calculatorInputs);
  const batterySellingPricePerKwh = useBusinessPlanStore((s) => s.batterySellingPricePerKwh);
  const batteryProductionCostPerKwh = useBusinessPlanStore((s) => s.batteryProductionCostPerKwh);
  const batterySoldImmediate = useBusinessPlanStore((s) => s.batterySoldImmediate);
  const batteryInstallment12 = useBusinessPlanStore((s) => s.batteryInstallment12);

  const b2bOpts = useMemo(
    () => ({
      batterySellingPricePerKwh,
      batteryProductionCostPerKwh,
      batterySoldImmediate,
      batteryInstallment12,
    }),
    [batterySellingPricePerKwh, batteryProductionCostPerKwh, batterySoldImmediate, batteryInstallment12],
  );

  const taxiInputs = useMemo(
    () => buildInputsForTaxi(inputs, quantity, batteryProductionCostPerKwh),
    [inputs, quantity, batteryProductionCostPerKwh],
  );
  const taxiResults = useMemo(() => calculateScenario(taxiInputs, 'taxi'), [taxiInputs]);

  const businessEconomics = useMemo(() => calculateBusinessEconomics(inputs, quantity, b2bOpts), [inputs, quantity, b2bOpts]);

  const chartData = useMemo(
    () =>
      Array.from({ length: 7 }).map((_, i) => {
        const qty = scenario === 'taxi' ? 200 + i * 100 : 20 + i * 20;
        if (scenario === 'taxi') {
          const built = buildInputsForTaxi(inputs, qty, batteryProductionCostPerKwh);
          const r = calculateScenario(built, 'taxi');
          return { qty, profitMln: r.monthlyProfit / 1e6 };
        }
        const be = calculateBusinessEconomics(inputs, qty, b2bOpts);
        return { qty, profitMln: be.monthlyProfitFromService / 1e6 };
      }),
    [inputs, scenario, b2bOpts, batteryProductionCostPerKwh],
  );

  return (
    <section className="book-chapter">
      <div className="book-grid">
        <div className="prose max-w-none">
          <h2>Глава 5: Доходы и прибыль</h2>
          <p>Формула базового дня для такси: 400 машин × 50 кВт·ч × 14 руб = 280 000 руб выручки в сутки.</p>
          <p>
            Для B2B ключевая прибыль — разовая продажа кассет и ежемесячная услуга замены по тарифу за кВт·ч и фиксированной логистике на бизнес.
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
          {scenario === 'taxi' ? (
            <>
              <p className="mt-2 text-sm">
                Прибыль от замены: <strong>{(taxiResults.monthlyProfit / 1e6).toFixed(2)} млн/мес</strong>
              </p>
              <p className="text-sm">
                Окупаемость:{' '}
                <strong>{Number.isFinite(taxiResults.paybackMonths) ? `${taxiResults.paybackMonths.toFixed(1)} мес` : 'Не окупается'}</strong>
              </p>
            </>
          ) : (
            <>
              <p className="mt-2 text-sm">
                Прибыль от услуги замены: <strong>{(businessEconomics.monthlyProfitFromService / 1e6).toFixed(2)} млн/мес</strong>
              </p>
              <p className="text-sm">
                Разовая прибыль от продажи кассет: <strong>{(businessEconomics.profitFromBatterySale / 1e6).toFixed(2)} млн</strong>
              </p>
            </>
          )}
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
