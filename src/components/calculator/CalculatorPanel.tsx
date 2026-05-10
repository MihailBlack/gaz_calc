import { useMemo } from 'react';
import {
  buildBusinessCashSeries,
  buildInputsForTaxi,
  buildPaybackSeries,
  calculateBusinessEconomics,
  calculateScenario,
  calcInfraForScenario,
  generateInvestorSummary,
} from '../../calculations';
import type { ScenarioResults } from '../../types';
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

  const infra = useMemo(() => calcInfraForScenario(scenario, quantity), [scenario, quantity]);

  const taxiInputs = useMemo(() => buildInputsForTaxi(inputs, quantity), [inputs, quantity]);
  const taxiResults = useMemo(() => calculateScenario(taxiInputs, 'taxi'), [taxiInputs]);

  const businessEconomics = useMemo(
    () => (scenario === 'business' ? calculateBusinessEconomics(inputs, quantity) : null),
    [scenario, inputs, quantity],
  );

  const investorSummary = useMemo(() => {
    if (scenario === 'business' && businessEconomics) {
      const stubResults: ScenarioResults = {
        dailyKwh: inputs.dailyKwhPerBusiness * quantity,
        dailyRevenue: 0,
        monthlyRevenue: businessEconomics.monthlyRevenueFromService,
        monthlyProfit: businessEconomics.monthlyProfitFromService,
        marginPerKwh: inputs.priceToBusiness - businessEconomics.fullCostPerKwh,
        marginPercent:
          inputs.priceToBusiness > 0
            ? ((inputs.priceToBusiness - businessEconomics.fullCostPerKwh) / inputs.priceToBusiness) * 100
            : 0,
        paybackMonths: businessEconomics.paybackMonths,
        paybackYears: businessEconomics.paybackYears,
        fullCost: businessEconomics.fullCostPerKwh,
      };
      return generateInvestorSummary(inputs, 'business', stubResults, infra, businessEconomics);
    }
    return generateInvestorSummary(taxiInputs, 'taxi', taxiResults, infra);
  }, [scenario, businessEconomics, inputs, infra, quantity, taxiInputs, taxiResults]);

  const chartData = useMemo(() => {
    if (scenario === 'business' && businessEconomics) {
      return buildBusinessCashSeries(businessEconomics.monthlyProfitFromService, businessEconomics.netInvestmentRub);
    }
    return buildPaybackSeries(taxiResults.monthlyProfit, taxiResults.paybackMonths);
  }, [scenario, businessEconomics, taxiResults.monthlyProfit, taxiResults.paybackMonths]);

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
          {scenario === 'taxi' ? (
            <>
              <InputField label="Потери электроэнергии" value={inputs.electricityLoss} unit="%" step={0.1} onChange={(v) => setInput('electricityLoss', v)} />
              <InputField label="Цена клиенту" value={inputs.priceToClient} unit="руб/кВт·ч" step={0.1} onChange={(value) => setInput('priceToClient', value)} />
            </>
          ) : (
            <>
              <InputField
                label="Потребление одного бизнеса в сутки"
                value={inputs.dailyKwhPerBusiness}
                unit="кВт·ч"
                step={1}
                min={1}
                onChange={(value) => setInput('dailyKwhPerBusiness', value)}
              />
              <InputField label="Цена бизнесу за кВт·ч" value={inputs.priceToBusiness} unit="руб/кВт·ч" step={0.1} onChange={(value) => setInput('priceToBusiness', value)} />
            </>
          )}
        </div>
        <button
          type="button"
          onClick={resetDefaults}
          className="mt-4 w-full rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
        >
          Сбросить к дефолтам
        </button>
        {scenario === 'taxi' ? (
          <p className="mt-4 text-xs leading-relaxed text-slate-600">
            Для обслуживания {quantity} такси нужно {infra.stationsCount} станций, {infra.batteriesCount} кассет и{' '}
            {infra.generatorsCount} ГПУ. Общий CAPEX — {(infra.capex.total / 1e6).toFixed(1)} млн руб. Детали: кассеты —{' '}
            {(infra.capex.batteries / 1e6).toFixed(1)} млн, станции — {(infra.capex.stations / 1e6).toFixed(1)} млн, генераторы —{' '}
            {(infra.capex.generators / 1e6).toFixed(1)} млн, логистика — {(infra.capex.logistics / 1e6).toFixed(1)} млн.
          </p>
        ) : businessEconomics ? (
          <p className="mt-4 text-xs leading-relaxed text-slate-600">
            Для {quantity} бизнесов продано {businessEconomics.batteryModulesSold} кассетных модулей (парк у клиента). У клиента нет
            ваших зарядных станций. Ваш CAPEX только хаб, ГПУ и логистика — {(businessEconomics.capexYourRub / 1e6).toFixed(1)} млн руб.
          </p>
        ) : null}
      </aside>

      <div className="space-y-4">
        <h3 className="text-base font-semibold text-slate-900">Блок 2: Инфраструктура и CAPEX</h3>
        {scenario === 'taxi' ? (
          <>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <MetricCard label="Станции" value={`${infra.stationsCount} шт`} />
              <MetricCard label="Кассеты (парк)" value={`${infra.batteriesCount} шт`} />
              <MetricCard label="ГПУ" value={`${infra.generatorsCount} шт`} />
              <MetricCard label="CAPEX" value={`${(infra.capex.total / 1e6).toFixed(1)} млн руб`} />
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-700 shadow-sm">
              Кассеты: {(infra.capex.batteries / 1e6).toFixed(1)} млн, станции: {(infra.capex.stations / 1e6).toFixed(1)} млн,
              генераторы: {(infra.capex.generators / 1e6).toFixed(1)} млн, логистика: {(infra.capex.logistics / 1e6).toFixed(1)} млн.
            </div>
          </>
        ) : businessEconomics ? (
          <>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <MetricCard label="Станции у клиента" value="0" />
              <MetricCard label="Продано кассет (модулей)" value={`${businessEconomics.batteryModulesSold} шт`} />
              <MetricCard label="ГПУ (ваши)" value={`${infra.generatorsCount} шт`} />
              <MetricCard label="Ваш CAPEX" value={`${(businessEconomics.capexYourRub / 1e6).toFixed(1)} млн руб`} />
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-700 shadow-sm">
              <p>
                CAPEX без кассет клиента: генераторы {(infra.capex.generators / 1e6).toFixed(1)} млн, логистика (фургоны){' '}
                {(infra.capex.logistics / 1e6).toFixed(1)} млн, хаб {(infra.capex.hub / 1e6).toFixed(1)} млн.
              </p>
              <p className="mt-2">
                Разовая выручка от продажи кассет: {(businessEconomics.revenueFromBatterySale / 1e6).toFixed(1)} млн руб. Чистая прибыль с
                продажи: {(businessEconomics.profitFromBatterySale / 1e6).toFixed(1)} млн руб.
              </p>
            </div>
          </>
        ) : null}

        <h3 className="text-base font-semibold text-slate-900">Блок 3: Финансовые результаты</h3>
        {scenario === 'taxi' ? (
          <>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <MetricCard label="Ежемесячная чистая прибыль" value={formatMoneyMln(taxiResults.monthlyProfit)} />
              <MetricCard label="Себестоимость 1 кВт·ч" value={formatRub(taxiResults.fullCost)} />
              <MetricCard label="Маржа" value={`${formatRub(taxiResults.marginPerKwh)}/кВт·ч`} />
              <MetricCard
                label="Окупаемость"
                value={
                  Number.isFinite(taxiResults.paybackMonths)
                    ? `${taxiResults.paybackMonths.toFixed(1)} мес / ${taxiResults.paybackYears.toFixed(1)} лет`
                    : 'Не окупается'
                }
              />
            </div>
          </>
        ) : businessEconomics ? (
          <>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <MetricCard label="Прибыль от замены / мес" value={formatMoneyMln(businessEconomics.monthlyProfitFromService)} />
              <MetricCard label="Разовая прибыль (продажа кассет)" value={formatMoneyMln(businessEconomics.profitFromBatterySale)} />
              <MetricCard
                label="Чистые инвестиции"
                value={`${(businessEconomics.netInvestmentRub / 1e6).toFixed(2)} млн руб`}
              />
              <MetricCard
                label="Окупаемость (по замене)"
                value={
                  businessEconomics.netInvestmentRub <= 0
                    ? '0 мес'
                    : Number.isFinite(businessEconomics.paybackMonths)
                      ? `${businessEconomics.paybackMonths.toFixed(1)} мес`
                      : 'Не окупается'
                }
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <MetricCard label="Себестоимость 1 кВт·ч (газ+сервис)" value={formatRub(businessEconomics.fullCostPerKwh)} />
              <MetricCard
                label="Маржа по энергии"
                value={`${formatRub(inputs.priceToBusiness - businessEconomics.fullCostPerKwh)}/кВт·ч`}
              />
            </div>
          </>
        ) : null}

        <div className="rounded-xl border border-indigo-100 bg-indigo-50 p-4 text-sm leading-relaxed text-indigo-900">{investorSummary}</div>
        <button type="button" onClick={handleInvestorText} className="rounded-lg bg-indigo-700 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-600">
          Сформировать текст для инвестора
        </button>
        <PaybackChart data={chartData} />
      </div>
    </section>
  );
}
