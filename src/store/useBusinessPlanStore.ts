import { create } from 'zustand';
import { DEFAULT_INPUTS, sanitizeNonNegative } from '../calculations';
import type { Inputs, Scenario } from '../types';

type InvestmentKey = 'batteries' | 'gpuHub' | 'stations' | 'logistics';

type InvestmentItem = {
  label: string;
  value: number;
  enabled: boolean;
};

interface BusinessPlanState {
  calculatorScenario: Scenario;
  calculatorInputs: Inputs;
  gasPriceBook: number;
  tariffNetwork: number;
  carsPerDayBook: number;
  priceToClientBook: number;
  showB2BInBook: boolean;
  investments: Record<InvestmentKey, InvestmentItem>;
  setCalculatorScenario: (scenario: Scenario) => void;
  setCalculatorInput: <K extends keyof Inputs>(key: K, value: number) => void;
  resetCalculatorDefaults: () => void;
  setGasPriceBook: (value: number) => void;
  setTariffNetwork: (value: number) => void;
  setCarsPerDayBook: (value: number) => void;
  setPriceToClientBook: (value: number) => void;
  toggleBookB2B: (value: boolean) => void;
  toggleInvestment: (key: InvestmentKey) => void;
}

const initialInvestments: Record<InvestmentKey, InvestmentItem> = {
  batteries: { label: 'Батареи', value: 126, enabled: true },
  gpuHub: { label: 'ГПУ + хаб', value: 32, enabled: true },
  stations: { label: '24 станции', value: 23, enabled: true },
  logistics: { label: 'Логистика и запуск', value: 7, enabled: true },
};

export const useBusinessPlanStore = create<BusinessPlanState>((set) => ({
  calculatorScenario: 'taxi',
  calculatorInputs: DEFAULT_INPUTS,
  gasPriceBook: 8.45,
  tariffNetwork: 16,
  carsPerDayBook: 400,
  priceToClientBook: 14,
  showB2BInBook: false,
  investments: initialInvestments,
  setCalculatorScenario: (scenario) => set({ calculatorScenario: scenario }),
  setCalculatorInput: (key, value) =>
    set((state) => ({
      calculatorInputs: {
        ...state.calculatorInputs,
        [key]: sanitizeNonNegative(value),
      },
    })),
  resetCalculatorDefaults: () =>
    set({
      calculatorScenario: 'taxi',
      calculatorInputs: DEFAULT_INPUTS,
    }),
  setGasPriceBook: (value) => set({ gasPriceBook: sanitizeNonNegative(value) }),
  setTariffNetwork: (value) => set({ tariffNetwork: sanitizeNonNegative(value) }),
  setCarsPerDayBook: (value) => set({ carsPerDayBook: sanitizeNonNegative(value) }),
  setPriceToClientBook: (value) => set({ priceToClientBook: sanitizeNonNegative(value) }),
  toggleBookB2B: (value) => set({ showB2BInBook: value }),
  toggleInvestment: (key) =>
    set((state) => ({
      investments: {
        ...state.investments,
        [key]: { ...state.investments[key], enabled: !state.investments[key].enabled },
      },
    })),
}));

