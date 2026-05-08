import { create } from 'zustand';
import { DEFAULT_INPUTS, sanitizeNonNegative } from '../calculations';
import type { Inputs, Scenario } from '../types';

interface BusinessPlanState {
  calculatorScenario: Scenario;
  calculatorInputs: Inputs;
  gasPriceBook: number;
  tariffNetwork: number;
  quantity: number;
  priceToClientBook: number;
  showB2BInBook: boolean;
  setCalculatorScenario: (scenario: Scenario) => void;
  setCalculatorInput: <K extends keyof Inputs>(key: K, value: number) => void;
  setQuantity: (qty: number) => void;
  resetCalculatorDefaults: () => void;
  setGasPriceBook: (value: number) => void;
  setTariffNetwork: (value: number) => void;
  setPriceToClientBook: (value: number) => void;
  toggleBookB2B: (value: boolean) => void;
}

export const useBusinessPlanStore = create<BusinessPlanState>((set) => ({
  calculatorScenario: 'taxi',
  calculatorInputs: DEFAULT_INPUTS,
  gasPriceBook: 8.45,
  tariffNetwork: 16,
  quantity: 400,
  priceToClientBook: 14,
  showB2BInBook: false,
  setCalculatorScenario: (scenario) => set({ calculatorScenario: scenario, quantity: scenario === 'taxi' ? 400 : 100 }),
  setCalculatorInput: (key, value) =>
    set((state) => ({
      calculatorInputs: {
        ...state.calculatorInputs,
        [key]: sanitizeNonNegative(value),
      },
    })),
  setQuantity: (qty) => set({ quantity: Math.max(1, sanitizeNonNegative(qty)) }),
  resetCalculatorDefaults: () =>
    set({
      calculatorScenario: 'taxi',
      calculatorInputs: DEFAULT_INPUTS,
      quantity: 400,
    }),
  setGasPriceBook: (value) => set({ gasPriceBook: sanitizeNonNegative(value) }),
  setTariffNetwork: (value) => set({ tariffNetwork: sanitizeNonNegative(value) }),
  setPriceToClientBook: (value) => set({ priceToClientBook: sanitizeNonNegative(value) }),
  toggleBookB2B: (value) => set({ showB2BInBook: value }),
}));

