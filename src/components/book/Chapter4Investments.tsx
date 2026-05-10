import { useMemo } from 'react';
import {
  buildInputsForTaxi,
  calculateBusinessEconomics,
  calculateScenario,
  calcInfraForScenario,
} from '../../calculations';
import { useBusinessPlanStore } from '../../store/useBusinessPlanStore';

export function Chapter4Investments() {
  const inputs = useBusinessPlanStore((s) => s.calculatorInputs);
  const scenario = useBusinessPlanStore((s) => s.calculatorScenario);
  const quantity = useBusinessPlanStore((s) => s.quantity);
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

  const infra = useMemo(
    () => calcInfraForScenario(scenario, quantity, batteryProductionCostPerKwh),
    [scenario, quantity, batteryProductionCostPerKwh],
  );
  const taxiInputs = useMemo(
    () => buildInputsForTaxi(inputs, quantity, batteryProductionCostPerKwh),
    [inputs, quantity, batteryProductionCostPerKwh],
  );
  const taxiAdjusted = useMemo(() => calculateScenario(taxiInputs, 'taxi'), [taxiInputs]);
  const businessEconomics = useMemo(
    () => (scenario === 'business' ? calculateBusinessEconomics(inputs, quantity, b2bOpts) : null),
    [scenario, inputs, quantity, b2bOpts],
  );

  return (
    <section className="book-chapter">
      <div className="book-grid">
        <div className="prose max-w-none">
          <h2>Глава 4: Инвестиции</h2>
          <p>
            В сценарии такси CAPEX включает ваш парк кассет, сеть станций, ГПУ и логистику. В сценарии B2B клиент покупает кассеты — ваш CAPEX
            только хаб, генераторы и логистика сети замены.
          </p>
        </div>
        <div className="book-card">
          {scenario === 'taxi' ? (
            <>
              <p className="book-label mb-3">Живой CAPEX для {quantity} машин/сутки</p>
              <div className="space-y-2 text-sm">
                <p>
                  Станции: <strong>{infra.stationsCount} шт</strong>
                </p>
                <p>
                  Кассеты (ваш парк): <strong>{infra.batteriesCount} шт</strong>
                </p>
                <p>
                  ГПУ: <strong>{infra.generatorsCount} шт</strong>
                </p>
                <p>
                  Кассеты: <strong>{(infra.capex.batteries / 1e6).toFixed(1)} млн руб</strong>
                </p>
                <p>
                  Станции: <strong>{(infra.capex.stations / 1e6).toFixed(1)} млн руб</strong>
                </p>
                <p>
                  Генераторы: <strong>{(infra.capex.generators / 1e6).toFixed(1)} млн руб</strong>
                </p>
                <p>
                  Логистика: <strong>{(infra.capex.logistics / 1e6).toFixed(1)} млн руб</strong>
                </p>
              </div>
              <p className="mt-3 text-sm">
                Итоговый CAPEX: <strong>{(infra.capex.total / 1e6).toFixed(1)} млн руб</strong>
              </p>
              <p className="text-sm">
                Окупаемость:{' '}
                <strong>{Number.isFinite(taxiAdjusted.paybackMonths) ? `${taxiAdjusted.paybackMonths.toFixed(1)} мес` : 'Не окупается'}</strong>
              </p>
            </>
          ) : businessEconomics ? (
            <>
              <p className="book-label mb-3">Ваш CAPEX для {quantity} бизнесов (без кассет клиента)</p>
              <div className="space-y-2 text-sm">
                <p>
                  Станции у клиента: <strong>0</strong>
                </p>
                <p>
                  Продано кассетных модулей: <strong>{businessEconomics.batteryModulesSold} шт</strong>
                </p>
                <p>
                  ГПУ: <strong>{infra.generatorsCount} шт</strong>
                </p>
                <p>
                  Генераторы: <strong>{(infra.capex.generators / 1e6).toFixed(1)} млн руб</strong>
                </p>
                <p>
                  Логистика (фургоны): <strong>{(infra.capex.logistics / 1e6).toFixed(1)} млн руб</strong>
                </p>
                <p>
                  Хаб: <strong>{(infra.capex.hub / 1e6).toFixed(1)} млн руб</strong>
                </p>
              </div>
              <p className="mt-3 text-sm">
                Итоговый ваш CAPEX: <strong>{(businessEconomics.capexYourRub / 1e6).toFixed(1)} млн руб</strong>
              </p>
              <p className="text-sm">
                Чистые инвестиции (CAPEX − прибыль от продажи кассет):{' '}
                <strong>{(businessEconomics.netInvestmentRub / 1e6).toFixed(1)} млн руб</strong>
              </p>
            </>
          ) : null}
        </div>
      </div>
    </section>
  );
}
