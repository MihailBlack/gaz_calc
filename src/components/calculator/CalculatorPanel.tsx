import { useMemo } from 'react';
import {
  buildBusinessCashSeries,
  buildInputsForTaxi,
  buildPaybackSeries,
  calculateBusinessEconomics,
  calculateScenario,
  calcInfraForScenario,
  DEFAULT_B2B_BATTERY_OPTIONS,
  generateInvestorSummary,
} from '../../calculations';
import type { ScenarioResults } from '../../types';
import {
  BATTERY_PRODUCTION_COST_PER_KWH,
  BATTERY_SELLING_PRICE_MAX_PER_KWH,
} from '../../config/batteryPricing';
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
  const batterySellingPricePerKwh = useBusinessPlanStore((s) => s.batterySellingPricePerKwh);
  const batterySoldImmediate = useBusinessPlanStore((s) => s.batterySoldImmediate);
  const batteryInstallment12 = useBusinessPlanStore((s) => s.batteryInstallment12);
  const setScenario = useBusinessPlanStore((s) => s.setCalculatorScenario);
  const setInput = useBusinessPlanStore((s) => s.setCalculatorInput);
  const setQuantity = useBusinessPlanStore((s) => s.setQuantity);
  const resetDefaults = useBusinessPlanStore((s) => s.resetCalculatorDefaults);
  const setBatterySellingPricePerKwh = useBusinessPlanStore((s) => s.setBatterySellingPricePerKwh);
  const setBatterySoldImmediate = useBusinessPlanStore((s) => s.setBatterySoldImmediate);
  const setBatteryInstallment12 = useBusinessPlanStore((s) => s.setBatteryInstallment12);

  const b2bOptions = useMemo(
    () => ({
      batterySellingPricePerKwh,
      batterySoldImmediate,
      batteryInstallment12,
    }),
    [batterySellingPricePerKwh, batterySoldImmediate, batteryInstallment12],
  );

  const infra = useMemo(() => calcInfraForScenario(scenario, quantity), [scenario, quantity]);

  const taxiInputs = useMemo(() => buildInputsForTaxi(inputs, quantity), [inputs, quantity]);
  const taxiResults = useMemo(() => calculateScenario(taxiInputs, 'taxi'), [taxiInputs]);

  const businessEconomics = useMemo(
    () => (scenario === 'business' ? calculateBusinessEconomics(inputs, quantity, b2bOptions) : null),
    [scenario, inputs, quantity, b2bOptions],
  );

  const businessEconomicsPriceZero = useMemo(
    () =>
      scenario === 'business'
        ? calculateBusinessEconomics(inputs, quantity, {
            ...DEFAULT_B2B_BATTERY_OPTIONS,
            batterySellingPricePerKwh: 0,
            batterySoldImmediate: true,
            batteryInstallment12: false,
          })
        : null,
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
      return buildBusinessCashSeries(businessEconomics);
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
              <InputField label="Цена услуги замены (кВт·ч)" value={inputs.priceToBusiness} unit="руб/кВт·ч" step={0.1} onChange={(value) => setInput('priceToBusiness', value)} />
            </>
          )}
        </div>

        {scenario === 'business' && businessEconomics ? (
          <div className="mt-6 border-t border-slate-200 pt-4">
            <h3 className="mb-3 text-sm font-semibold text-slate-900">Продажа кассет</h3>
            <label className="block text-xs font-medium text-slate-600">
              Цена продажи 1 кВт·ч кассеты (руб): {batterySellingPricePerKwh.toLocaleString('ru-RU')}
            </label>
            <input
              type="range"
              min={0}
              max={BATTERY_SELLING_PRICE_MAX_PER_KWH}
              step={100}
              value={batterySellingPricePerKwh}
              onChange={(e) => setBatterySellingPricePerKwh(Number(e.target.value))}
              className="mt-1 w-full"
            />
            <InputField
              label="Точное значение цены кассеты"
              value={batterySellingPricePerKwh}
              unit="руб/кВт·ч"
              min={0}
              step={50}
              onChange={(v) => setBatterySellingPricePerKwh(v)}
            />
            <dl className="mt-3 space-y-1 rounded-lg bg-slate-50 p-3 text-xs text-slate-700">
              <div className="flex justify-between gap-2">
                <dt>Себестоимость 1 кВт·ч кассеты</dt>
                <dd className="font-medium">{BATTERY_PRODUCTION_COST_PER_KWH.toLocaleString('ru-RU')} руб</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt>Прибыль с 1 кассеты (60 кВт·ч)</dt>
                <dd className="font-medium">{Math.round(businessEconomics.profitPerBatteryModuleRub).toLocaleString('ru-RU')} руб</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt>Кассет к продаже</dt>
                <dd className="font-medium">{businessEconomics.batteryModulesSold} шт</dd>
              </div>
            </dl>
            <label className="mt-3 flex cursor-pointer items-center gap-2 text-xs">
              <input type="checkbox" checked={batterySoldImmediate} onChange={(e) => setBatterySoldImmediate(e.target.checked)} />
              Кассеты продаются все сразу (в первый месяц)
            </label>
            <label className="mt-2 flex cursor-pointer items-center gap-2 text-xs">
              <input type="checkbox" checked={batteryInstallment12} onChange={(e) => setBatteryInstallment12(e.target.checked)} />
              Продажа в рассрочку (12 месяцев)
            </label>
          </div>
        ) : null}

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
            Для {quantity} бизнесов — {businessEconomics.batteryModulesSold} кассетных модулей к продаже. Ваш CAPEX инфраструктуры —{' '}
            {(businessEconomics.capexYourRub / 1e6).toFixed(1)} млн руб (ГПУ + хаб + логистика).
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
              <MetricCard label="Кассет к продаже" value={`${businessEconomics.batteryModulesSold} шт`} />
              <MetricCard label="ГПУ (ваши)" value={`${infra.generatorsCount} шт`} />
              <MetricCard label="Ваш CAPEX (инфра)" value={`${(businessEconomics.capexYourRub / 1e6).toFixed(1)} млн руб`} />
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-700 shadow-sm">
              <p>
                Генераторы {(infra.capex.generators / 1e6).toFixed(1)} млн, логистика {(infra.capex.logistics / 1e6).toFixed(1)} млн, хаб{' '}
                {(infra.capex.hub / 1e6).toFixed(1)} млн.
              </p>
              <p className="mt-2">
                Выручка от кассет {formatMoneyMln(businessEconomics.revenueFromBatterySale)}, прибыль от продажи кассет{' '}
                {formatMoneyMln(businessEconomics.profitFromBatterySale)}.
              </p>
            </div>
          </>
        ) : null}

        <h3 className="text-base font-semibold text-slate-900">Блок 3: Финансовые результаты</h3>
        {scenario === 'taxi' ? (
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
        ) : businessEconomics && businessEconomicsPriceZero ? (
          <>
            <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="px-3 py-2 font-semibold">Показатель</th>
                    <th className="px-3 py-2 font-semibold">
                      По цене {businessEconomics.batterySellingPricePerKwh.toLocaleString('ru-RU')} руб/кВт·ч
                    </th>
                    <th className="px-3 py-2 font-semibold">При цене кассеты 0 руб/кВт·ч</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr>
                    <td className="px-3 py-2">Разовый доход от продажи кассет</td>
                    <td className="px-3 py-2">{formatMoneyMln(businessEconomics.revenueFromBatterySale)}</td>
                    <td className="px-3 py-2">{formatMoneyMln(businessEconomicsPriceZero.revenueFromBatterySale)}</td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2">Чистые инвестиции</td>
                    <td className="px-3 py-2">{formatMoneyMln(businessEconomics.netInvestmentRub)}</td>
                    <td className="px-3 py-2">{formatMoneyMln(businessEconomicsPriceZero.netInvestmentIfBatteryPriceZeroRub)}</td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2">Ежемесячная прибыль от замены</td>
                    <td className="px-3 py-2">{formatMoneyMln(businessEconomics.monthlyProfitFromService)}</td>
                    <td className="px-3 py-2">{formatMoneyMln(businessEconomicsPriceZero.monthlyProfitFromService)}</td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2">Окупаемость (мес)</td>
                    <td className="px-3 py-2">
                      {businessEconomics.installment12
                        ? `${businessEconomics.paybackMonths.toFixed(1)} (инфра ÷ комбинированный поток)`
                        : businessEconomics.netInvestmentRub <= 0
                          ? '0 (мгновенно)'
                          : Number.isFinite(businessEconomics.paybackMonths)
                            ? businessEconomics.paybackMonths.toFixed(1)
                            : '—'}
                    </td>
                    <td className="px-3 py-2">
                      {Number.isFinite(businessEconomicsPriceZero.paybackMonthsIfBatteryPriceZero)
                        ? businessEconomicsPriceZero.paybackMonthsIfBatteryPriceZero.toFixed(1)
                        : '—'}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
              <MetricCard label="Поток замены / мес" value={formatMoneyMln(businessEconomics.monthlyProfitFromService)} />
              <MetricCard
                label={businessEconomics.installment12 ? 'Комбинированный поток / мес' : 'Поток для окупаемости'}
                value={formatMoneyMln(businessEconomics.monthlyCashFlowForPayback)}
              />
              <MetricCard label="Себестоимость энергии (газ+сервис)" value={formatRub(businessEconomics.fullCostPerKwh)} />
              <MetricCard label="Маржа по энергии" value={`${formatRub(inputs.priceToBusiness - businessEconomics.fullCostPerKwh)}/кВт·ч`} />
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
