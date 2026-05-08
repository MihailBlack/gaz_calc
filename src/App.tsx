import { useMemo, useReducer } from 'react';
import { DEFAULT_INPUTS, buildPaybackSeries, calculateScenario, generateInvestorSummary, sanitizeNonNegative } from './calculations';
import { InputField } from './components/InputField';
import { MetricCard } from './components/MetricCard';
import { PaybackChart } from './components/PaybackChart';
import { ScenarioToggle } from './components/ScenarioToggle';
import type { Inputs, Scenario } from './types';

type State = {
  scenario: Scenario;
  inputs: Inputs;
};

type Action =
  | { type: 'SET_SCENARIO'; payload: Scenario }
  | { type: 'SET_INPUT'; payload: { key: keyof Inputs; value: number } }
  | { type: 'RESET_DEFAULTS' };

const initialState: State = {
  scenario: 'taxi',
  inputs: DEFAULT_INPUTS,
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SET_SCENARIO':
      return { ...state, scenario: action.payload };
    case 'SET_INPUT':
      return {
        ...state,
        inputs: {
          ...state.inputs,
          [action.payload.key]: sanitizeNonNegative(action.payload.value),
        },
      };
    case 'RESET_DEFAULTS':
      return initialState;
    default:
      return state;
  }
}

function formatMoneyMln(value: number): string {
  return `${(value / 1e6).toFixed(2)} млн руб`;
}

function formatRub(value: number): string {
  return `${value.toFixed(2)} руб`;
}

function App() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const { inputs, scenario } = state;

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

  return (
    <main className="mx-auto max-w-7xl p-4 md:p-6">
      <header className="mb-6 rounded-xl bg-white p-4 shadow-sm md:p-5">
        <div className="flex flex-col items-start justify-between gap-3 md:flex-row md:items-center">
          <div>
            <h1 className="m-0 text-2xl font-bold text-slate-900 md:text-3xl">Бизнес-калькулятор энергоцентра</h1>
            <p className="mt-1 text-sm text-slate-500">Оценка прибыльности и окупаемости для B2C/B2B сценариев</p>
          </div>
          <ScenarioToggle scenario={scenario} onChange={(next) => dispatch({ type: 'SET_SCENARIO', payload: next })} />
        </div>
      </header>

      <section className="grid gap-6 lg:grid-cols-[370px_1fr]">
        <aside className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:p-5">
          <h2 className="mb-4 mt-0 text-lg font-semibold text-slate-900">Параметры модели</h2>
          <div className="grid gap-3">
            <InputField
              label="Цена газа"
              value={inputs.gasPrice}
              unit="руб/м³"
              step={0.01}
              onChange={(value) => dispatch({ type: 'SET_INPUT', payload: { key: 'gasPrice', value } })}
            />
            <InputField
              label="CAPEX"
              value={inputs.capex}
              unit="млн руб"
              step={0.1}
              onChange={(value) => dispatch({ type: 'SET_INPUT', payload: { key: 'capex', value } })}
            />
            <InputField
              label="Потери электроэнергии"
              value={inputs.electricityLoss}
              unit="%"
              step={0.1}
              onChange={(value) => dispatch({ type: 'SET_INPUT', payload: { key: 'electricityLoss', value } })}
            />
            {scenarioSpecificFields.map((field) => (
              <InputField
                key={field.key}
                label={field.label}
                unit={field.unit}
                step={field.step}
                value={inputs[field.key]}
                onChange={(value) => dispatch({ type: 'SET_INPUT', payload: { key: field.key, value } })}
              />
            ))}
            <details className="mt-1 rounded-lg border border-slate-200 p-3">
              <summary className="cursor-pointer text-sm font-semibold text-slate-700">Параметры ГПУ</summary>
              <div className="mt-3 grid gap-3">
                <InputField
                  label="Расход газа на 1 кВт·ч"
                  value={inputs.gasConsumptionPerKwh}
                  unit="м³/кВт·ч"
                  step={0.001}
                  onChange={(value) =>
                    dispatch({ type: 'SET_INPUT', payload: { key: 'gasConsumptionPerKwh', value } })
                  }
                />
                <InputField
                  label="Сервисные затраты"
                  value={inputs.servicePercent}
                  unit="%"
                  step={0.1}
                  onChange={(value) => dispatch({ type: 'SET_INPUT', payload: { key: 'servicePercent', value } })}
                />
                <InputField
                  label="Амортизация"
                  value={inputs.amortizationKwh}
                  unit="руб/кВт·ч"
                  step={0.01}
                  onChange={(value) => dispatch({ type: 'SET_INPUT', payload: { key: 'amortizationKwh', value } })}
                />
              </div>
            </details>
          </div>
          <button
            type="button"
            onClick={() => dispatch({ type: 'RESET_DEFAULTS' })}
            className="mt-4 w-full rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
          >
            Сбросить к дефолтам
          </button>
        </aside>

        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard label="Ежемесячная чистая прибыль" value={formatMoneyMln(results.monthlyProfit)} />
            <MetricCard label="Себестоимость 1 кВт·ч" value={formatRub(results.fullCost)} />
            <MetricCard label="Маржа" value={`${formatRub(results.marginPerKwh)}/кВт·ч`} />
            <MetricCard
              label="Окупаемость"
              value={
                Number.isFinite(results.paybackMonths)
                  ? `${results.paybackMonths.toFixed(1)} мес / ${results.paybackYears.toFixed(1)} лет`
                  : 'Не окупается'
              }
            />
          </div>

          <div className="rounded-xl border border-indigo-100 bg-indigo-50 p-4 text-sm leading-relaxed text-indigo-900">
            {investorSummary}
          </div>

          <PaybackChart data={chartData} />
        </div>
      </section>
    </main>
  );
}

export default App;
