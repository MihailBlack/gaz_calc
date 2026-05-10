import { useMemo } from 'react';
import { buildInputsForTaxi, calculateBusinessEconomics, calculateScenario, calcInfraForTaxi } from '../../calculations';
import { useBusinessPlanStore } from '../../store/useBusinessPlanStore';

const REF_TAXI_CARS = 400;
const REF_BUSINESS_COUNT = 100;

export function Chapter7Conclusion() {
  const showB2B = useBusinessPlanStore((s) => s.showB2BInBook);
  const toggleB2B = useBusinessPlanStore((s) => s.toggleBookB2B);
  const inputs = useBusinessPlanStore((s) => s.calculatorInputs);
  const batterySellingPricePerKwh = useBusinessPlanStore((s) => s.batterySellingPricePerKwh);
  const batterySoldImmediate = useBusinessPlanStore((s) => s.batterySoldImmediate);
  const batteryInstallment12 = useBusinessPlanStore((s) => s.batteryInstallment12);

  const b2bOpts = useMemo(
    () => ({ batterySellingPricePerKwh, batterySoldImmediate, batteryInstallment12 }),
    [batterySellingPricePerKwh, batterySoldImmediate, batteryInstallment12],
  );

  const taxiInfra = useMemo(() => calcInfraForTaxi(REF_TAXI_CARS), []);
  const taxiInputs = useMemo(() => buildInputsForTaxi(inputs, REF_TAXI_CARS), [inputs]);
  const taxi = useMemo(() => calculateScenario(taxiInputs, 'taxi'), [taxiInputs]);

  const businessEconomics = useMemo(
    () => calculateBusinessEconomics(inputs, REF_BUSINESS_COUNT, b2bOpts),
    [inputs, b2bOpts],
  );

  const netInvestBiz = businessEconomics.netInvestmentRub;

  return (
    <section className="book-chapter">
      <div className="book-grid">
        <div className="prose max-w-none">
          <h2>Глава 7: Сравнение сценариев</h2>
          <p>
            Такси (B2C) — сеть станций и парк кассет для быстрой замены. Бизнесы (B2B) — кассеты продаются клиенту, станций на его стороне нет;
            ваш CAPEX только хаб, ГПУ и логистика сети.
          </p>
          <p className="text-sm text-amber-900/90">
            Таблица ориентировочно: {REF_TAXI_CARS} машин/сутки против {REF_BUSINESS_COUNT} бизнесов при текущей цене газа и тарифах из калькулятора.
          </p>
        </div>
        <div className="book-card">
          <label className="inline-flex items-center gap-2 text-sm">
            <input type="checkbox" checked={showB2B} onChange={(e) => toggleB2B(e.target.checked)} />
            Показать сравнительную таблицу B2B
          </label>
          {showB2B ? (
            <div className="mt-4 overflow-x-auto text-sm">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-amber-300">
                    <th className="py-2 pr-2">Показатель</th>
                    <th className="py-2 pr-2">Такси (B2C)</th>
                    <th className="py-2">Бизнесы (B2B)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-amber-200/80">
                    <td className="py-2">Ваш CAPEX</td>
                    <td>{(taxiInfra.capex.total / 1e6).toFixed(1)} млн руб</td>
                    <td>{(businessEconomics.capexYourRub / 1e6).toFixed(1)} млн руб</td>
                  </tr>
                  <tr className="border-b border-amber-200/80">
                    <td className="py-2">Станции</td>
                    <td>{taxiInfra.stationsCount}</td>
                    <td>0</td>
                  </tr>
                  <tr className="border-b border-amber-200/80">
                    <td className="py-2">Кассеты</td>
                    <td>{taxiInfra.batteriesCount} (ваш парк)</td>
                    <td>{businessEconomics.batteryModulesSold} (продано бизнесам)</td>
                  </tr>
                  <tr className="border-b border-amber-200/80">
                    <td className="py-2">Разовая выручка от продажи кассет</td>
                    <td>—</td>
                    <td>{(businessEconomics.revenueFromBatterySale / 1e6).toFixed(0)} млн руб</td>
                  </tr>
                  <tr className="border-b border-amber-200/80">
                    <td className="py-2">Ежемесячная прибыль (замена / услуга)</td>
                    <td>{(taxi.monthlyProfit / 1e6).toFixed(2)} млн руб</td>
                    <td>{(businessEconomics.monthlyProfitFromService / 1e6).toFixed(2)} млн руб</td>
                  </tr>
                  <tr className="border-b border-amber-200/80">
                    <td className="py-2">Чистые инвестиции (CAPEX − прибыль от продажи кассет)</td>
                    <td>{(taxiInfra.capex.total / 1e6).toFixed(1)} млн руб</td>
                    <td className={netInvestBiz <= 0 ? 'font-semibold text-green-800' : ''}>
                      {(netInvestBiz / 1e6).toFixed(1)} млн руб
                    </td>
                  </tr>
                </tbody>
              </table>
              <p className="mt-3 text-xs leading-relaxed text-amber-950/90">
                В B2B разовая прибыль от продажи кассет снижает чистые инвестиции; при отрицательном значении проект по капитальному циклу
                окупается сразу, далее остаётся ежемесячный поток от услуги замены.
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
