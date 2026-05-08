import type { Scenario } from '../types';

interface ScenarioToggleProps {
  scenario: Scenario;
  onChange: (scenario: Scenario) => void;
}

export function ScenarioToggle({ scenario, onChange }: ScenarioToggleProps) {
  return (
    <div className="inline-flex rounded-lg bg-slate-200 p-1">
      <button
        type="button"
        onClick={() => onChange('taxi')}
        className={`rounded-md px-4 py-2 text-sm font-semibold transition ${
          scenario === 'taxi' ? 'bg-white text-indigo-700 shadow' : 'text-slate-700'
        }`}
      >
        Такси
      </button>
      <button
        type="button"
        onClick={() => onChange('business')}
        className={`rounded-md px-4 py-2 text-sm font-semibold transition ${
          scenario === 'business' ? 'bg-white text-indigo-700 shadow' : 'text-slate-700'
        }`}
      >
        Бизнес
      </button>
    </div>
  );
}
