import type {
  BusinessEconomics,
  ChartPoint,
  InfraResult,
  Inputs,
  Scenario,
  ScenarioResults,
} from './types';

/** B2B: цена кассеты бизнесу 10k/кВт·ч, себес производства 6k/кВт·ч */
export const BATTERY_SELLING_PRICE_PER_KWH = 10_000;
export const BATTERY_PRODUCTION_COST_PER_KWH = 6_000;
export const B2B_HUB_CAPEX_RUB = 5_000_000;
export const B2B_LOGISTICS_PER_BUSINESS_MONTH = 5_000;

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
    mode: 'taxi',
    stationsCount: stationsNeeded,
    batteriesCount: batteriesNeeded,
    generatorsCount: generatorsNeeded,
    capex: {
      total: capexTotal,
      batteries: capexBatteries,
      stations: capexStations,
      generators: capexGenerators,
      logistics: capexLogistics,
      hub: 0,
    },
  };
}

/** B2B: только ваш CAPEX (ГПУ + фургоны + хаб). Станций у клиента нет; кассеты не в CAPEX */
export function calcInfraForBusiness(businessesCount: number): InfraResult {
  const batteryModulesSold = businessesCount * 4;
  let generatorsNeeded = 1;
  if (businessesCount > 20) generatorsNeeded = 2;
  if (businessesCount > 50) generatorsNeeded = 3;

  const capexGenerators = generatorsNeeded * 8_500_000;
  const capexLogistics = 5_000_000 * Math.ceil(businessesCount / 50);
  const capexHub = B2B_HUB_CAPEX_RUB;
  const capexTotal = capexGenerators + capexLogistics + capexHub;

  return {
    mode: 'business',
    stationsCount: 0,
    batteriesCount: batteryModulesSold,
    generatorsCount: generatorsNeeded,
    capex: {
      total: capexTotal,
      batteries: 0,
      stations: 0,
      generators: capexGenerators,
      logistics: capexLogistics,
      hub: capexHub,
    },
  };
}

export function calcInfraForScenario(scenario: Scenario, quantity: number): InfraResult {
  return scenario === 'taxi' ? calcInfraForTaxi(quantity) : calcInfraForBusiness(quantity);
}

export function buildInputsForTaxi(baseInputs: Inputs, carsPerDay: number): Inputs {
  const infra = calcInfraForTaxi(carsPerDay);
  return {
    ...baseInputs,
    capex: infra.capex.total / 1e6,
    carsPerDay,
  };
}

export function buildInputsForScenario(baseInputs: Inputs, scenario: Scenario, quantity: number): Inputs {
  if (scenario === 'taxi') {
    return buildInputsForTaxi(baseInputs, quantity);
  }
  return {
    ...baseInputs,
    businessesCount: quantity,
    capex: calcInfraForBusiness(quantity).capex.total / 1e6,
  };
}

export function calculateBusinessEconomics(inputs: Inputs, businessesCount: number): BusinessEconomics {
  const infra = calcInfraForBusiness(businessesCount);
  const fullCostPerKwh = getFullCostPerKwh(inputs);
  const dailyKwhPerBusiness = inputs.dailyKwhPerBusiness;

  const batteryModulesSold = businessesCount * 4;
  const totalBatteryKwh = batteryModulesSold * 60;
  const revenueFromBatterySale = totalBatteryKwh * BATTERY_SELLING_PRICE_PER_KWH;
  const profitFromBatterySale = totalBatteryKwh * (BATTERY_SELLING_PRICE_PER_KWH - BATTERY_PRODUCTION_COST_PER_KWH);

  const capexYourRub = infra.capex.total;
  const monthlyRevenueFromService = businessesCount * dailyKwhPerBusiness * 30 * inputs.priceToBusiness;
  const monthlyGasServiceCost = businessesCount * dailyKwhPerBusiness * 30 * fullCostPerKwh;
  const monthlyLogisticsCost = businessesCount * B2B_LOGISTICS_PER_BUSINESS_MONTH;
  const monthlyProfitFromService = monthlyRevenueFromService - monthlyGasServiceCost - monthlyLogisticsCost;

  const netInvestmentRub = capexYourRub - profitFromBatterySale;
  let paybackMonths: number;
  if (netInvestmentRub <= 0) {
    paybackMonths = 0;
  } else if (monthlyProfitFromService > 0) {
    paybackMonths = netInvestmentRub / monthlyProfitFromService;
  } else {
    paybackMonths = Number.POSITIVE_INFINITY;
  }

  return {
    businessesCount,
    batteryModulesSold,
    totalBatteryKwh,
    revenueFromBatterySale,
    profitFromBatterySale,
    capexYourRub,
    netInvestmentRub,
    monthlyProfitFromService,
    monthlyRevenueFromService,
    monthlyGasServiceCost,
    monthlyLogisticsCost,
    paybackMonths,
    paybackYears: Number.isFinite(paybackMonths) ? paybackMonths / 12 : Number.POSITIVE_INFINITY,
    fullCostPerKwh,
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

/** Накопленный денежный поток после старта: −чистые инвестиции + ежемесячная прибыль от замены × месяц */
export function buildBusinessCashSeries(monthlyProfitFromService: number, netInvestmentRub: number): ChartPoint[] {
  const paybackMonths =
    netInvestmentRub <= 0
      ? 0
      : monthlyProfitFromService > 0
        ? netInvestmentRub / monthlyProfitFromService
        : Number.POSITIVE_INFINITY;
  const monthsLimit = Number.isFinite(paybackMonths)
    ? Math.ceil(paybackMonths) + 6
    : SAFE_PAYBACK_MONTHS_FOR_CHART;
  const safeMonthsLimit = Math.min(Math.max(monthsLimit, 6), 240);

  return Array.from({ length: safeMonthsLimit + 1 }, (_, month) => ({
    month,
    accumulatedProfitMln: (-netInvestmentRub + monthlyProfitFromService * month) / 1e6,
  }));
}

export function generateInvestorSummary(
  inputs: Inputs,
  scenario: Scenario,
  results: ScenarioResults,
  infra?: InfraResult,
  businessEconomics?: BusinessEconomics,
): string {
  if (scenario === 'business' && businessEconomics) {
    const be = businessEconomics;
    const paybackText =
      be.netInvestmentRub <= 0
        ? '0 мес (чистые инвестиции неположительные: продажа кассет покрывает ваш CAPEX)'
        : Number.isFinite(be.paybackMonths)
          ? `${be.paybackMonths.toFixed(1)} мес (${be.paybackYears.toFixed(1)} года)`
          : 'не достигается при текущих параметрах';

    return (
      `Сценарий поставки кассет и услуги замены для бизнеса (B2B): вы получаете деньги за кассеты в момент продажи, ` +
      `покрывая инвестиции в ГПУ, хаб и логистику; далее — ежемесячная прибыль от услуги замены. ` +
      `Ваш CAPEX ${(be.capexYourRub / 1e6).toFixed(1)} млн руб не включает кассеты у клиента — они проданы. ` +
      `Разовая выручка от продажи кассет ${(be.revenueFromBatterySale / 1e6).toFixed(1)} млн руб, разовая прибыль ${(be.profitFromBatterySale / 1e6).toFixed(1)} млн руб. ` +
      `Чистые инвестиции (CAPEX − прибыль от продажи кассет): ${(be.netInvestmentRub / 1e6).toFixed(1)} млн руб. ` +
      `Ежемесячная прибыль от замены: ${(be.monthlyProfitFromService / 1e6).toFixed(2)} млн руб. ` +
      `Окупаемость по потоку замены: ${paybackText}.`
    );
  }

  const scenarioLabel = scenario === 'taxi' ? 'зарядки такси' : 'электропитания бизнеса';
  const paybackText = Number.isFinite(results.paybackMonths)
    ? `${results.paybackMonths.toFixed(1)} мес (${results.paybackYears.toFixed(1)} года)`
    : 'не достигается при текущих параметрах';

  const infraText =
    infra && infra.mode === 'taxi'
      ? ` Для выбранного масштаба нужно ${infra.stationsCount} станций, ${infra.batteriesCount} кассет и ${infra.generatorsCount} ГПУ.`
      : '';

  return `Сценарий ${scenarioLabel}: при цене газа ${inputs.gasPrice.toFixed(2)} руб/м³ и CAPEX ${inputs.capex.toFixed(
    1,
  )} млн руб проект окупается за ${paybackText}.${infraText} Ежемесячная чистая прибыль составляет ${(results.monthlyProfit / 1e6).toFixed(
    2,
  )} млн руб, маржа - ${results.marginPerKwh.toFixed(2)} руб/кВт·ч (${results.marginPercent.toFixed(1)}%).`;
}
