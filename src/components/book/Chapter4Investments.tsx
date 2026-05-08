import { useMemo } from 'react';
import { calculateScenario } from '../../calculations';
import { useBusinessPlanStore } from '../../store/useBusinessPlanStore';

export function Chapter4Investments() {
  const investments = useBusinessPlanStore((s) => s.investments);
  const toggleInvestment = useBusinessPlanStore((s) => s.toggleInvestment);
  const inputs = useBusinessPlanStore((s) => s.calculatorInputs);
  const scenario = useBusinessPlanStore((s) => s.calculatorScenario);

  const adjustedCapex = useMemo(
    () => Object.values(investments).reduce((sum, item) => (item.enabled ? sum + item.value : sum), 0),
    [investments],
  );
  const adjusted = useMemo(
    () => calculateScenario({ ...inputs, capex: adjustedCapex }, scenario),
    [inputs, scenario, adjustedCapex],
  );

  return (
    <section className="book-chapter">
      <div className="book-grid">
        <div className="prose max-w-none">
          <h2>Глава 4: Инвестиции. 188 млн руб</h2>
          <p>
            База CAPEX включает четыре крупных блока: батареи, ГПУ + хаб, станции и логистику. Инвестор видит
            прозрачную структуру капитальных затрат и влияние каждого блока на срок окупаемости.
          </p>
        </div>
        <div className="book-card">
          <p className="book-label mb-3">Структура CAPEX</p>
          <div className="space-y-2 text-sm">
            {Object.entries(investments).map(([key, item]) => (
              <label key={key} className="flex items-center justify-between gap-2">
                <span>
                  <input type="checkbox" checked={item.enabled} onChange={() => toggleInvestment(key as keyof typeof investments)} className="mr-2" />
                  {item.label}
                </span>
                <span>{item.value} млн</span>
              </label>
            ))}
          </div>
          <p className="mt-3 text-sm">Итоговый CAPEX: <strong>{adjustedCapex.toFixed(1)} млн руб</strong></p>
          <p className="text-sm">Окупаемость: <strong>{Number.isFinite(adjusted.paybackMonths) ? `${adjusted.paybackMonths.toFixed(1)} мес` : 'Не окупается'}</strong></p>
        </div>
      </div>
    </section>
  );
}
