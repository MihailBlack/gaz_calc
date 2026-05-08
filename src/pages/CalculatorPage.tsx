import { CalculatorPanel } from '../components/calculator/CalculatorPanel';

export function CalculatorPage() {
  return (
    <main className="mx-auto max-w-7xl p-4 md:p-6">
      <header className="mb-6 rounded-xl bg-white p-4 shadow-sm md:p-5">
        <h1 className="m-0 text-2xl font-bold text-slate-900 md:text-3xl">Калькулятор</h1>
        <p className="mt-1 text-sm text-slate-500">Быстрые расчеты по сценариям Такси / Бизнес</p>
      </header>
      <CalculatorPanel />
    </main>
  );
}
