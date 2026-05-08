import { useMemo } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { calculateScenario } from '../calculations';
import { useBusinessPlanStore } from '../store/useBusinessPlanStore';

export function ComparePage() {
  const inputs = useBusinessPlanStore((s) => s.calculatorInputs);

  const scenarios = useMemo(() => {
    const gasValues = [8.45, 10, 12];
    return gasValues.map((gasPrice) => {
      const result = calculateScenario({ ...inputs, gasPrice }, 'taxi');
      const roi = inputs.capex > 0 ? (result.monthlyProfit * 12) / (inputs.capex * 1e6) : 0;
      return {
        name: `Газ ${gasPrice}`,
        gasPrice,
        fullCost: result.fullCost,
        monthlyProfitMln: result.monthlyProfit / 1e6,
        paybackMonths: result.paybackMonths,
        roiPercent: roi * 100,
      };
    });
  }, [inputs]);

  return (
    <main className="mx-auto max-w-6xl p-4 md:p-6">
      <header className="mb-6 rounded-xl bg-white p-4 shadow-sm md:p-5">
        <h1 className="m-0 text-2xl font-bold text-slate-900 md:text-3xl">Сравнение сценариев</h1>
        <p className="mt-1 text-sm text-slate-500">Такси-сценарий при газе 8.45 / 10 / 12 руб</p>
      </header>

      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left">
              <th className="py-2">Сценарий</th>
              <th className="py-2">Себестоимость</th>
              <th className="py-2">Прибыль/мес</th>
              <th className="py-2">Окупаемость</th>
              <th className="py-2">ROI (год)</th>
            </tr>
          </thead>
          <tbody>
            {scenarios.map((row) => (
              <tr key={row.name} className="border-b border-slate-100">
                <td className="py-2">{row.name}</td>
                <td className="py-2">{row.fullCost.toFixed(2)} руб/кВт·ч</td>
                <td className="py-2">{row.monthlyProfitMln.toFixed(2)} млн руб</td>
                <td className="py-2">{Number.isFinite(row.paybackMonths) ? `${row.paybackMonths.toFixed(1)} мес` : 'Не окупается'}</td>
                <td className="py-2">{row.roiPercent.toFixed(1)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="mt-6 h-80 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={scenarios}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip formatter={(value) => `${Number(value).toFixed(1)} мес`} />
            <Bar dataKey="paybackMonths" fill="#4f46e5" />
          </BarChart>
        </ResponsiveContainer>
      </section>
    </main>
  );
}
