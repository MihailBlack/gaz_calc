import type { ChartPoint, InfraResult, Inputs, Scenario, ScenarioResults } from './types';

export const DEFAULT_INPUTS: Inputs = {
  gasPrice: 8.45,
  capex: 187.7,
  priceToClient: 14,
  carsPerDay: 400,
  kwhPerCar: 50,
  electricityLoss: 15,
  priceToBusiness: 7,
  dailyKwhPerBusiness: 160,
  businessesCount: 100,
  gasConsumptionPerKwh: 0.264,
  servicePercent: 18,
  amortizationKwh: 0.2,
};

const SAFE_PAYBACK_MONTHS_FOR_CHART = 60;

export function sanitizeNonNegative(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Math.max(0, value);
}

export function getFullCostPerKwh(inputs: Inputs): number {
  const gasCost = inputs.gasPrice * inputs.gasConsumptionPerKwh;
  return gasCost * (1 + inputs.servicePercent / 100) + inputs.amortizationKwh;
}

function getDailyKwh(inputs: Inputs, scenario: Scenario): number {
  if (scenario === 'taxi') {
    return inputs.carsPerDay * inputs.kwhPerCar;
  }
  return inputs.businessesCount * inputs.dailyKwhPerBusiness;
}

function getPricePerKwh(inputs: Inputs, scenario: Scenario): number {
  return scenario === 'taxi' ? inputs.priceToClient : inputs.priceToBusiness;
}

export function calculateScenario(inputs: Inputs, scenario: Scenario): ScenarioResults {
  const fullCost = getFullCostPerKwh(inputs);
  const pricePerKwh = getPricePerKwh(inputs, scenario);
  const grossDailyKwh = getDailyKwh(inputs, scenario);
  const netDailyKwh = grossDailyKwh * (1 - inputs.electricityLoss / 100);
  const dailyRevenue = netDailyKwh * pricePerKwh;
  const monthlyRevenue = dailyRevenue * 30;
  const marginPerKwh = pricePerKwh - fullCost;
  const monthlyProfit = marginPerKwh * netDailyKwh * 30;
  const marginPercent = pricePerKwh > 0 ? (marginPerKwh / pricePerKwh) * 100 : 0;
  const paybackMonths = monthlyProfit > 0 ? inputs.capex / (monthlyProfit / 1e6) : Number.POSITIVE_INFINITY;

  return {
    dailyKwh: netDailyKwh,
    dailyRevenue,
    monthlyRevenue,
    monthlyProfit,
    marginPerKwh,
    marginPercent,
    paybackMonths,
    paybackYears: Number.isFinite(paybackMonths) ? paybackMonths / 12 : Number.POSITIVE_INFINITY,
    fullCost,
  };
}

export function calcInfraForTaxi(carsPerDay: number): InfraResult {
  const stationsNeeded = Math.ceil(carsPerDay / 43);
  const batteriesNeeded = Math.ceil(carsPerDay * 1.25);
  let generatorsNeeded = 2;
  if (carsPerDay > 200) generatorsNeeded = 3;
  if (carsPerDay > 500) generatorsNeeded = Math.ceil(carsPerDay / 200);

  const capexBatteries = batteriesNeeded * 60 * 6000;
  const capexStations = stationsNeeded * 1_000_000;
  const capexGenerators = generatorsNeeded * 8_500_000;
  const capexLogistics = 7_000_000;
  const capexTotal = capexBatteries + capexStations + capexGenerators + capexLogistics;

  return {
    stationsCount: stationsNeeded,
    batteriesCount: batteriesNeeded,
    generatorsCount: generatorsNeeded,
    capex: {
      total: capexTotal,
      batteries: capexBatteries,
      stations: capexStations,
      generators: capexGenerators,
      logistics: capexLogistics,
    },
  };
}

export function calcInfraForBusiness(businessesCount: number): InfraResult {
  const stationsNeeded = businessesCount;
  const batteriesNeeded = businessesCount * 4;
  let generatorsNeeded = 1;
  if (businessesCount > 20) generatorsNeeded = 2;
  if (businessesCount > 50) generatorsNeeded = 3;
  if (businessesCount > 100) generatorsNeeded = Math.ceil(businessesCount / 30);

  const capexBatteries = batteriesNeeded * 60 * 6000;
  const capexStations = businessesCount * 500_000;
  const capexGenerators = generatorsNeeded * 8_500_000;
  const capexLogistics = 5_000_000 * Math.ceil(businessesCount / 50);
  const capexTotal = capexBatteries + capexStations + capexGenerators + capexLogistics;

  return {
    stationsCount: stationsNeeded,
    batteriesCount: batteriesNeeded,
    generatorsCount: generatorsNeeded,
    capex: {
      total: capexTotal,
      batteries: capexBatteries,
      stations: capexStations,
      generators: capexGenerators,
      logistics: capexLogistics,
    },
  };
}

export function calcInfraForScenario(scenario: Scenario, quantity: number): InfraResult {
  return scenario === 'taxi' ? calcInfraForTaxi(quantity) : calcInfraForBusiness(quantity);
}

export function buildInputsForScenario(baseInputs: Inputs, scenario: Scenario, quantity: number): Inputs {
  const infra = calcInfraForScenario(scenario, quantity);
  return {
    ...baseInputs,
    capex: infra.capex.total / 1e6,
    carsPerDay: scenario === 'taxi' ? quantity : baseInputs.carsPerDay,
    businessesCount: scenario === 'business' ? quantity : baseInputs.businessesCount,
  };
}

export function buildPaybackSeries(monthlyProfit: number, paybackMonths: number): ChartPoint[] {
  const monthsLimit = Number.isFinite(paybackMonths)
    ? Math.ceil(paybackMonths) + 6
    : SAFE_PAYBACK_MONTHS_FOR_CHART;
  const safeMonthsLimit = Math.min(Math.max(monthsLimit, 6), 240);
  const monthlyProfitMln = monthlyProfit / 1e6;

  return Array.from({ length: safeMonthsLimit + 1 }, (_, month) => ({
    month,
    accumulatedProfitMln: monthlyProfitMln * month,
  }));
}

export function generateInvestorSummary(
  inputs: Inputs,
  scenario: Scenario,
  results: ScenarioResults,
  infra?: InfraResult,
): string {
  const scenarioLabel = scenario === 'taxi' ? 'зарядки такси' : 'электропитания бизнеса';
  const paybackText = Number.isFinite(results.paybackMonths)
    ? `${results.paybackMonths.toFixed(1)} мес (${results.paybackYears.toFixed(1)} года)`
    : 'не достигается при текущих параметрах';

  const infraText = infra
    ? ` Для выбранного масштаба нужно ${infra.stationsCount} станций, ${infra.batteriesCount} кассет и ${infra.generatorsCount} ГПУ.`
    : '';

  return `Сценарий ${scenarioLabel}: при цене газа ${inputs.gasPrice.toFixed(2)} руб/м³ и CAPEX ${inputs.capex.toFixed(
    1,
  )} млн руб проект окупается за ${paybackText}.${infraText} Ежемесячная чистая прибыль составляет ${(results.monthlyProfit / 1e6).toFixed(
    2,
  )} млн руб, маржа - ${results.marginPerKwh.toFixed(2)} руб/кВт·ч (${results.marginPercent.toFixed(1)}%).`;
}
