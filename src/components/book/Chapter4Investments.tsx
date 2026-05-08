import { useMemo } from 'react';
import { buildInputsForScenario, calcInfraForScenario, calculateScenario } from '../../calculations';
import { useBusinessPlanStore } from '../../store/useBusinessPlanStore';

export function Chapter4Investments() {
  const inputs = useBusinessPlanStore((s) => s.calculatorInputs);
  const scenario = useBusinessPlanStore((s) => s.calculatorScenario);
  const quantity = useBusinessPlanStore((s) => s.quantity);

  const infra = useMemo(() => calcInfraForScenario(scenario, quantity), [scenario, quantity]);
  const scenarioInputs = useMemo(() => buildInputsForScenario(inputs, scenario, quantity), [inputs, scenario, quantity]);
  const adjusted = useMemo(() => calculateScenario(scenarioInputs, scenario), [scenarioInputs, scenario]);

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
          <p className="book-label mb-3">Живой CAPEX для {quantity} {scenario === 'taxi' ? 'машин/сутки' : 'бизнесов'}</p>
          <div className="space-y-2 text-sm">
            <p>Станции: <strong>{infra.stationsCount} шт</strong></p>
            <p>Кассеты: <strong>{infra.batteriesCount} шт</strong></p>
            <p>ГПУ: <strong>{infra.generatorsCount} шт</strong></p>
            <p>Кассеты: <strong>{(infra.capex.batteries / 1e6).toFixed(1)} млн руб</strong></p>
            <p>Станции: <strong>{(infra.capex.stations / 1e6).toFixed(1)} млн руб</strong></p>
            <p>Генераторы: <strong>{(infra.capex.generators / 1e6).toFixed(1)} млн руб</strong></p>
            <p>Логистика: <strong>{(infra.capex.logistics / 1e6).toFixed(1)} млн руб</strong></p>
          </div>
          <p className="mt-3 text-sm">Итоговый CAPEX: <strong>{(infra.capex.total / 1e6).toFixed(1)} млн руб</strong></p>
          <p className="text-sm">Окупаемость: <strong>{Number.isFinite(adjusted.paybackMonths) ? `${adjusted.paybackMonths.toFixed(1)} мес` : 'Не окупается'}</strong></p>
        </div>
      </div>
    </section>
  );
}
