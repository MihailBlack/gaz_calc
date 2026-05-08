import { useMemo } from 'react';
import { buildInputsForScenario, calculateScenario } from '../../calculations';
import { useBusinessPlanStore } from '../../store/useBusinessPlanStore';

export function Chapter6Payback() {
  const gasPriceBook = useBusinessPlanStore((s) => s.gasPriceBook);
  const setGasPriceBook = useBusinessPlanStore((s) => s.setGasPriceBook);
  const priceToClientBook = useBusinessPlanStore((s) => s.priceToClientBook);
  const setPriceToClientBook = useBusinessPlanStore((s) => s.setPriceToClientBook);
  const quantity = useBusinessPlanStore((s) => s.quantity);
  const inputs = useBusinessPlanStore((s) => s.calculatorInputs);

  const taxiInputs = useMemo(() => buildInputsForScenario(inputs, 'taxi', quantity), [inputs, quantity]);
  const results = useMemo(
    () => calculateScenario({ ...taxiInputs, gasPrice: gasPriceBook, priceToClient: priceToClientBook }, 'taxi'),
    [taxiInputs, gasPriceBook, priceToClientBook],
  );

  return (
    <section className="book-chapter">
      <div className="book-grid">
        <div className="prose max-w-none">
          <h2>Глава 6: Окупаемость и устойчивость</h2>
          <p>
            Базовый сценарий держится около 3 лет. При росте газа проект можно балансировать ценой продажи и
            сохранять инвестиционную привлекательность.
          </p>
          <p>
            Если газ растет до 11 руб/м³, цена для такси может быть снижена вплоть до 12,5 руб/кВт·ч при
            окупаемости около 3,5 лет.
          </p>
        </div>
        <div className="book-card space-y-3">
          <div>
            <label className="book-label">Цена газа: {gasPriceBook.toFixed(1)} руб/м³</label>
            <input type="range" min={6} max={15} step={0.5} value={gasPriceBook} onChange={(e) => setGasPriceBook(Number(e.target.value))} className="w-full" />
          </div>
          <div>
            <label className="book-label">Цена продажи: {priceToClientBook.toFixed(1)} руб/кВт·ч</label>
            <input type="range" min={10} max={18} step={0.5} value={priceToClientBook} onChange={(e) => setPriceToClientBook(Number(e.target.value))} className="w-full" />
          </div>
          <p className="text-sm">Расчетная окупаемость: <strong>{Number.isFinite(results.paybackMonths) ? `${results.paybackMonths.toFixed(1)} мес (${results.paybackYears.toFixed(1)} года)` : 'Не окупается'}</strong></p>
        </div>
      </div>
    </section>
  );
}
