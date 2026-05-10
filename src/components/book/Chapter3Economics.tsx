import { useMemo } from 'react';
import { buildInputsForTaxi, calculateBusinessEconomics, calculateScenario } from '../../calculations';
import { useBusinessPlanStore } from '../../store/useBusinessPlanStore';

export function Chapter3Economics() {
  const gasPriceBook = useBusinessPlanStore((s) => s.gasPriceBook);
  const setGasPriceBook = useBusinessPlanStore((s) => s.setGasPriceBook);
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

  const baseTaxi = useMemo(
    () => buildInputsForTaxi(inputs, quantity, batteryProductionCostPerKwh),
    [inputs, quantity, batteryProductionCostPerKwh],
  );
  const baseTaxiResults = useMemo(() => calculateScenario(baseTaxi, 'taxi'), [baseTaxi]);
  const bookTaxiResults = useMemo(
    () => calculateScenario({ ...baseTaxi, gasPrice: gasPriceBook }, 'taxi'),
    [baseTaxi, gasPriceBook],
  );

  const baseBusiness = useMemo(() => calculateBusinessEconomics(inputs, quantity, b2bOpts), [inputs, quantity, b2bOpts]);
  const bookBusiness = useMemo(
    () => calculateBusinessEconomics({ ...inputs, gasPrice: gasPriceBook }, quantity, b2bOpts),
    [inputs, quantity, gasPriceBook, b2bOpts],
  );

  return (
    <section className="book-chapter">
      <div className="book-grid">
        <div className="prose max-w-none">
          <h2>Глава 3: Экономика ГПУ. Себестоимость 2,83 руб/кВт·ч</h2>
          <p>
            При газе 8,45 руб/м³, расходе 84,6 м³/час и реальной мощности 320 кВт формируется базовая себестоимость с учетом сервиса и
            амортизации.
          </p>
          <p>Ключевая точка модели — чувствительность маржи и окупаемости к изменению цены газа.</p>
        </div>
        <div className="book-card">
          <label className="book-label">Цена газа, руб/м³: {gasPriceBook.toFixed(2)}</label>
          <input type="range" min={6} max={15} step={0.5} value={gasPriceBook} onChange={(e) => setGasPriceBook(Number(e.target.value))} className="w-full" />
          {scenario === 'taxi' ? (
            <table className="mt-4 w-full text-sm">
              <tbody>
                <tr>
                  <td>Себестоимость</td>
                  <td className="text-right font-semibold">{bookTaxiResults.fullCost.toFixed(2)} руб</td>
                </tr>
                <tr>
                  <td>Изменение маржи</td>
                  <td className="text-right font-semibold">{(bookTaxiResults.marginPerKwh - baseTaxiResults.marginPerKwh).toFixed(2)} руб/кВт·ч</td>
                </tr>
                <tr>
                  <td>Окупаемость</td>
                  <td className="text-right font-semibold">{Number.isFinite(bookTaxiResults.paybackMonths) ? `${bookTaxiResults.paybackMonths.toFixed(1)} мес` : 'Не окупается'}</td>
                </tr>
              </tbody>
            </table>
          ) : (
            <table className="mt-4 w-full text-sm">
              <tbody>
                <tr>
                  <td>Себестоимость энергии</td>
                  <td className="text-right font-semibold">{bookBusiness.fullCostPerKwh.toFixed(2)} руб/кВт·ч</td>
                </tr>
                <tr>
                  <td>Изменение маржи по энергии</td>
                  <td className="text-right font-semibold">
                    {(baseBusiness.fullCostPerKwh - bookBusiness.fullCostPerKwh).toFixed(2)} руб/кВт·ч
                  </td>
                </tr>
                <tr>
                  <td>Окупаемость (по замене)</td>
                  <td className="text-right font-semibold">
                    {bookBusiness.netInvestmentRub <= 0
                      ? '0 мес'
                      : Number.isFinite(bookBusiness.paybackMonths)
                        ? `${bookBusiness.paybackMonths.toFixed(1)} мес`
                        : 'Не окупается'}
                  </td>
                </tr>
              </tbody>
            </table>
          )}
        </div>
      </div>
    </section>
  );
}
