import { useMemo } from 'react';
import {
  buildInputsForScenario,
  buildPaybackSeries,
  calcInfraForScenario,
  calculateScenario,
  generateInvestorSummary,
} from '../../calculations';
import { useBusinessPlanStore } from '../../store/useBusinessPlanStore';
import { InputField } from '../InputField';
import { MetricCard } from '../MetricCard';
import { PaybackChart } from '../PaybackChart';
import { ScenarioToggle } from '../ScenarioToggle';
import { formatMoneyMln, formatRub } from '../../lib/format';

export function CalculatorPanel() {
  const scenario = useBusinessPlanStore((s) => s.calculatorScenario);
  const inputs = useBusinessPlanStore((s) => s.calculatorInputs);
  const quantity = useBusinessPlanStore((s) => s.quantity);
  const setScenario = useBusinessPlanStore((s) => s.setCalculatorScenario);
  const setInput = useBusinessPlanStore((s) => s.setCalculatorInput);
  const setQuantity = useBusinessPlanStore((s) => s.setQuantity);
  const resetDefaults = useBusinessPlanStore((s) => s.resetCalculatorDefaults);

  const scenarioInputs = useMemo(() => buildInputsForScenario(inputs, scenario, quantity), [inputs, scenario, quantity]);
  const infra = useMemo(() => calcInfraForScenario(scenario, quantity), [scenario, quantity]);
  const results = useMemo(() => calculateScenario(scenarioInputs, scenario), [scenarioInputs, scenario]);
  const chartData = useMemo(
    () => buildPaybackSeries(results.monthlyProfit, results.paybackMonths),
    [results.monthlyProfit, results.paybackMonths],
  );

  const investorSummary = useMemo(
    () => generateInvestorSummary(scenarioInputs, scenario, results, infra),
    [scenarioInputs, scenario, results, infra],
  );

  const handleInvestorText = async () => {
    try {
      await navigator.clipboard.writeText(investorSummary);
      alert('Текст для инвестора скопирован в буфер обмена.');
    } catch {
      alert(investorSummary);
    }
  };

  return (
    <section className="grid gap-6 lg:grid-cols-[370px_1fr]">
      <aside className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:p-5">
        <h2 className="mb-4 mt-0 text-lg font-semibold text-slate-900">Блок 1: Базовые параметры</h2>
        <div className="mb-4">
          <ScenarioToggle scenario={scenario} onChange={setScenario} />
        </div>
        <div className="grid gap-3">
          <InputField
            label={scenario === 'taxi' ? 'Количество электромобилей в сутки' : 'Количество бизнесов (клиентов)'}
            value={quantity}
            unit="шт"
            min={1}
            step={scenario === 'taxi' ? 10 : 1}
            onChange={(v) => setQuantity(v)}
          />
          <InputField label="Цена газа" value={inputs.gasPrice} unit="руб/м³" step={0.01} onChange={(v) => setInput('gasPrice', v)} />
          <InputField label="Потери электроэнергии" value={inputs.electricityLoss} unit="%" step={0.1} onChange={(v) => setInput('electricityLoss', v)} />
          {scenario === 'taxi' ? (
            <InputField label="Цена клиенту" value={inputs.priceToClient} unit="руб/кВт·ч" step={0.1} onChange={(value) => setInput('priceToClient', value)} />
          ) : (
            <InputField label="Цена бизнесу" value={inputs.priceToBusiness} unit="руб/кВт·ч" step={0.1} onChange={(value) => setInput('priceToBusiness', value)} />
          )}
        </div>
        <button type="button" onClick={resetDefaults} className="mt-4 w-full rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700">
          Сбросить к дефолтам
        </button>
        <p className="mt-4 text-xs leading-relaxed text-slate-600">
          Для обслуживания {quantity} {scenario === 'taxi' ? 'такси' : 'бизнесов'} нужно {infra.stationsCount} станций,
          {` ${infra.batteriesCount}`} кассет и {infra.generatorsCount} ГПУ. Общий CAPEX - {(infra.capex.total / 1e6).toFixed(1)} млн руб.
          Детали: кассеты - {(infra.capex.batteries / 1e6).toFixed(1)} млн, станции - {(infra.capex.stations / 1e6).toFixed(1)} млн,
          генераторы - {(infra.capex.generators / 1e6).toFixed(1)} млн, логистика - {(infra.capex.logistics / 1e6).toFixed(1)} млн.
        </p>
      </aside>

      <div className="space-y-4">
        <h3 className="text-base font-semibold text-slate-900">Блок 2: Инфраструктура и CAPEX</h3>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="Станции" value={`${infra.stationsCount} шт`} />
          <MetricCard label="Кассеты" value={`${infra.batteriesCount} шт`} />
          <MetricCard label="ГПУ" value={`${infra.generatorsCount} шт`} />
          <MetricCard label="CAPEX" value={`${(infra.capex.total / 1e6).toFixed(1)} млн руб`} />
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-700 shadow-sm">
          Кассеты: {(infra.capex.batteries / 1e6).toFixed(1)} млн, станции: {(infra.capex.stations / 1e6).toFixed(1)} млн,
          генераторы: {(infra.capex.generators / 1e6).toFixed(1)} млн, логистика: {(infra.capex.logistics / 1e6).toFixed(1)} млн.
        </div>

        <h3 className="text-base font-semibold text-slate-900">Блок 3: Финансовые результаты</h3>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="Ежемесячная чистая прибыль" value={formatMoneyMln(results.monthlyProfit)} />
          <MetricCard label="Себестоимость 1 кВт·ч" value={formatRub(results.fullCost)} />
          <MetricCard label="Маржа" value={`${formatRub(results.marginPerKwh)}/кВт·ч`} />
          <MetricCard label="Окупаемость" value={Number.isFinite(results.paybackMonths) ? `${results.paybackMonths.toFixed(1)} мес / ${results.paybackYears.toFixed(1)} лет` : 'Не окупается'} />
        </div>

        <div className="rounded-xl border border-indigo-100 bg-indigo-50 p-4 text-sm leading-relaxed text-indigo-900">{investorSummary}</div>
        <button type="button" onClick={handleInvestorText} className="rounded-lg bg-indigo-700 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-600">
          Сформировать текст для инвестора
        </button>
        <PaybackChart data={chartData} />
      </div>
    </section>
  );
}
