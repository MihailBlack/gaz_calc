import { useMemo } from 'react';
import { calculateScenario } from '../../calculations';
import { useBusinessPlanStore } from '../../store/useBusinessPlanStore';

export function Chapter3Economics() {
  const gasPriceBook = useBusinessPlanStore((s) => s.gasPriceBook);
  const setGasPriceBook = useBusinessPlanStore((s) => s.setGasPriceBook);
  const inputs = useBusinessPlanStore((s) => s.calculatorInputs);
  const scenario = useBusinessPlanStore((s) => s.calculatorScenario);

  const baseResults = useMemo(() => calculateScenario(inputs, scenario), [inputs, scenario]);
  const bookResults = useMemo(
    () => calculateScenario({ ...inputs, gasPrice: gasPriceBook }, scenario),
    [inputs, scenario, gasPriceBook],
  );

  return (
    <section className="book-chapter">
      <div className="book-grid">
        <div className="prose max-w-none">
          <h2>Глава 3: Экономика ГПУ. Себестоимость 2,83 руб/кВт·ч</h2>
          <p>
            При газе 8,45 руб/м³, расходе 84,6 м³/час и реальной мощности 320 кВт формируется базовая себестоимость
            с учетом сервиса и амортизации.
          </p>
          <p>Ключевая точка модели — чувствительность маржи и окупаемости к изменению цены газа.</p>
        </div>
        <div className="book-card">
          <label className="book-label">Цена газа, руб/м³: {gasPriceBook.toFixed(2)}</label>
          <input type="range" min={6} max={15} step={0.5} value={gasPriceBook} onChange={(e) => setGasPriceBook(Number(e.target.value))} className="w-full" />
          <table className="mt-4 w-full text-sm">
            <tbody>
              <tr>
                <td>Себестоимость</td>
                <td className="text-right font-semibold">{bookResults.fullCost.toFixed(2)} руб</td>
              </tr>
              <tr>
                <td>Изменение маржи</td>
                <td className="text-right font-semibold">{(bookResults.marginPerKwh - baseResults.marginPerKwh).toFixed(2)} руб/кВт·ч</td>
              </tr>
              <tr>
                <td>Окупаемость</td>
                <td className="text-right font-semibold">{Number.isFinite(bookResults.paybackMonths) ? `${bookResults.paybackMonths.toFixed(1)} мес` : 'Не окупается'}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
