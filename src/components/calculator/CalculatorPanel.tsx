import { useMemo } from 'react';
import { buildPaybackSeries, calculateScenario, generateInvestorSummary } from '../../calculations';
import { useBusinessPlanStore } from '../../store/useBusinessPlanStore';
import { InputField } from '../InputField';
import { MetricCard } from '../MetricCard';
import { PaybackChart } from '../PaybackChart';
import { ScenarioToggle } from '../ScenarioToggle';
import { formatMoneyMln, formatRub } from '../../lib/format';

export function CalculatorPanel() {
  const scenario = useBusinessPlanStore((s) => s.calculatorScenario);
  const inputs = useBusinessPlanStore((s) => s.calculatorInputs);
  const setScenario = useBusinessPlanStore((s) => s.setCalculatorScenario);
  const setInput = useBusinessPlanStore((s) => s.setCalculatorInput);
  const resetDefaults = useBusinessPlanStore((s) => s.resetCalculatorDefaults);

  const results = useMemo(() => calculateScenario(inputs, scenario), [inputs, scenario]);
  const chartData = useMemo(
    () => buildPaybackSeries(results.monthlyProfit, results.paybackMonths),
    [results.monthlyProfit, results.paybackMonths],
  );

  const investorSummary = useMemo(
    () => generateInvestorSummary(inputs, scenario, results),
    [inputs, scenario, results],
  );

  const scenarioSpecificFields =
    scenario === 'taxi'
      ? [
          { key: 'priceToClient' as const, label: 'Цена клиенту', unit: 'руб/кВт·ч', step: 0.1 },
          { key: 'carsPerDay' as const, label: 'Машин в сутки', unit: 'шт', step: 1 },
          { key: 'kwhPerCar' as const, label: 'кВт·ч на машину', unit: 'кВт·ч', step: 1 },
        ]
      : [
          { key: 'priceToBusiness' as const, label: 'Цена бизнесу', unit: 'руб/кВт·ч', step: 0.1 },
          { key: 'dailyKwhPerBusiness' as const, label: 'кВт·ч/сутки на бизнес', unit: 'кВт·ч', step: 1 },
          { key: 'businessesCount' as const, label: 'Количество клиентов', unit: 'шт', step: 1 },
        ];

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
        <h2 className="mb-4 mt-0 text-lg font-semibold text-slate-900">Параметры модели</h2>
        <div className="mb-4">
          <ScenarioToggle scenario={scenario} onChange={setScenario} />
        </div>
        <div className="grid gap-3">
          <InputField label="Цена газа" value={inputs.gasPrice} unit="руб/м³" step={0.01} onChange={(v) => setInput('gasPrice', v)} />
          <InputField label="CAPEX" value={inputs.capex} unit="млн руб" step={0.1} onChange={(v) => setInput('capex', v)} />
          <InputField label="Потери электроэнергии" value={inputs.electricityLoss} unit="%" step={0.1} onChange={(v) => setInput('electricityLoss', v)} />
          {scenarioSpecificFields.map((field) => (
            <InputField
              key={field.key}
              label={field.label}
              unit={field.unit}
              step={field.step}
              value={inputs[field.key]}
              onChange={(value) => setInput(field.key, value)}
            />
          ))}
        </div>
        <button type="button" onClick={resetDefaults} className="mt-4 w-full rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700">
          Сбросить к дефолтам
        </button>
      </aside>

      <div className="space-y-4">
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
