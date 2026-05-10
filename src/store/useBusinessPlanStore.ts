import { create } from 'zustand';
import { DEFAULT_INPUTS, sanitizeNonNegative } from '../calculations';
import type { Inputs, Scenario } from '../types';
import {
  BATTERY_PRODUCTION_COST_DEFAULT_PER_KWH,
  BATTERY_PRODUCTION_COST_MAX_PER_KWH,
  BATTERY_SELLING_PRICE_DEFAULT_PER_KWH,
  BATTERY_SELLING_PRICE_MAX_PER_KWH,
} from '../config/batteryPricing';

interface BusinessPlanState {
  calculatorScenario: Scenario;
  calculatorInputs: Inputs;
  gasPriceBook: number;
  tariffNetwork: number;
  quantity: number;
  priceToClientBook: number;
  showB2BInBook: boolean;
  batterySellingPricePerKwh: number;
  batteryProductionCostPerKwh: number;
  batterySoldImmediate: boolean;
  batteryInstallment12: boolean;
  setCalculatorScenario: (scenario: Scenario) => void;
  setCalculatorInput: <K extends keyof Inputs>(key: K, value: number) => void;
  setQuantity: (qty: number) => void;
  resetCalculatorDefaults: () => void;
  setGasPriceBook: (value: number) => void;
  setTariffNetwork: (value: number) => void;
  setPriceToClientBook: (value: number) => void;
  toggleBookB2B: (value: boolean) => void;
  setBatterySellingPricePerKwh: (value: number) => void;
  setBatteryProductionCostPerKwh: (value: number) => void;
  setBatterySoldImmediate: (value: boolean) => void;
  setBatteryInstallment12: (value: boolean) => void;
}

export const useBusinessPlanStore = create<BusinessPlanState>((set) => ({
  calculatorScenario: 'taxi',
  calculatorInputs: DEFAULT_INPUTS,
  gasPriceBook: 8.45,
  tariffNetwork: 16,
  quantity: 400,
  priceToClientBook: 14,
  showB2BInBook: false,
  batterySellingPricePerKwh: BATTERY_SELLING_PRICE_DEFAULT_PER_KWH,
  batteryProductionCostPerKwh: BATTERY_PRODUCTION_COST_DEFAULT_PER_KWH,
  batterySoldImmediate: true,
  batteryInstallment12: false,
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
      batterySellingPricePerKwh: BATTERY_SELLING_PRICE_DEFAULT_PER_KWH,
      batteryProductionCostPerKwh: BATTERY_PRODUCTION_COST_DEFAULT_PER_KWH,
      batterySoldImmediate: true,
      batteryInstallment12: false,
    }),
  setGasPriceBook: (value) => set({ gasPriceBook: sanitizeNonNegative(value) }),
  setTariffNetwork: (value) => set({ tariffNetwork: sanitizeNonNegative(value) }),
  setPriceToClientBook: (value) => set({ priceToClientBook: sanitizeNonNegative(value) }),
  toggleBookB2B: (value) => set({ showB2BInBook: value }),
  setBatterySellingPricePerKwh: (value) =>
    set({
      batterySellingPricePerKwh: Math.min(
        Math.max(0, sanitizeNonNegative(value)),
        BATTERY_SELLING_PRICE_MAX_PER_KWH,
      ),
    }),
  setBatteryProductionCostPerKwh: (value) =>
    set({
      batteryProductionCostPerKwh: Math.min(
        Math.max(0, sanitizeNonNegative(value)),
        BATTERY_PRODUCTION_COST_MAX_PER_KWH,
      ),
    }),
  setBatterySoldImmediate: (value) =>
    set({ batterySoldImmediate: value, ...(value ? { batteryInstallment12: false } : {}) }),
  setBatteryInstallment12: (value) =>
    set({ batteryInstallment12: value, ...(value ? { batterySoldImmediate: false } : {}) }),
}));

