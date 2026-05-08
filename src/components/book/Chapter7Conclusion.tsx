import { useMemo } from 'react';
import { calculateScenario } from '../../calculations';
import { useBusinessPlanStore } from '../../store/useBusinessPlanStore';

export function Chapter7Conclusion() {
  const showB2B = useBusinessPlanStore((s) => s.showB2BInBook);
  const toggleB2B = useBusinessPlanStore((s) => s.toggleBookB2B);
  const inputs = useBusinessPlanStore((s) => s.calculatorInputs);

  const taxi = useMemo(() => calculateScenario(inputs, 'taxi'), [inputs]);
  const business = useMemo(() => calculateScenario(inputs, 'business'), [inputs]);

  return (
    <section className="book-chapter">
      <div className="book-grid">
        <div className="prose max-w-none">
          <h2>Глава 7: Сравнение с B2B и вывод</h2>
          <p>
            B2B-сценарий стабильнее по контрактной модели, но обычно имеет более узкую маржу и более длинный период
            окупаемости. Рекомендуем запуск с такси и расширение в B2B вторым этапом.
          </p>
        </div>
        <div className="book-card">
          <label className="inline-flex items-center gap-2 text-sm">
            <input type="checkbox" checked={showB2B} onChange={(e) => toggleB2B(e.target.checked)} />
            Показать B2B сценарий
          </label>
          <div className="mt-4 text-sm">
            <p>Такси: <strong>{(taxi.monthlyProfit / 1e6).toFixed(2)} млн/мес</strong>, окупаемость <strong>{taxi.paybackMonths.toFixed(1)} мес</strong></p>
            {showB2B ? (
              <p className="mt-2">B2B: <strong>{(business.monthlyProfit / 1e6).toFixed(2)} млн/мес</strong>, окупаемость <strong>{business.paybackMonths.toFixed(1)} мес</strong></p>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
