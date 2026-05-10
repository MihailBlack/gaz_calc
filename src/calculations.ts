import type {
  BusinessEconomics,
  ChartPoint,
  InfraResult,
  Inputs,
  Scenario,
  ScenarioResults,
} from './types';
import {
  BATTERY_PRODUCTION_COST_DEFAULT_PER_KWH,
  BATTERY_PRODUCTION_COST_MAX_PER_KWH,
  BATTERY_SELLING_PRICE_DEFAULT_PER_KWH,
  BATTERY_SELLING_PRICE_MAX_PER_KWH,
} from './config/batteryPricing';

export {
  BATTERY_PRODUCTION_COST_DEFAULT_PER_KWH,
  BATTERY_PRODUCTION_COST_MAX_PER_KWH,
} from './config/batteryPricing';

export const B2B_HUB_CAPEX_RUB = 5_000_000;
export const B2B_LOGISTICS_PER_BUSINESS_MONTH = 5_000;

export interface CalculateBusinessEconomicsOptions {
  batterySellingPricePerKwh: number;
  batterySoldImmediate: boolean;
  batteryInstallment12: boolean;
  batteryProductionCostPerKwh: number;
}

export const DEFAULT_B2B_BATTERY_OPTIONS: CalculateBusinessEconomicsOptions = {
  batterySellingPricePerKwh: BATTERY_SELLING_PRICE_DEFAULT_PER_KWH,
  batterySoldImmediate: true,
  batteryInstallment12: false,
  batteryProductionCostPerKwh: BATTERY_PRODUCTION_COST_DEFAULT_PER_KWH,
};

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

export function calcInfraForTaxi(
  carsPerDay: number,
  batteryCostPerKwh: number = BATTERY_PRODUCTION_COST_DEFAULT_PER_KWH,
): InfraResult {
  const stationsNeeded = Math.ceil(carsPerDay / 43);
  const batteriesNeeded = Math.ceil(carsPerDay * 1.25);
  let generatorsNeeded = 2;
  if (carsPerDay > 200) generatorsNeeded = 3;
  if (carsPerDay > 500) generatorsNeeded = Math.ceil(carsPerDay / 200);

  const capexBatteries = batteriesNeeded * 60 * batteryCostPerKwh;
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

/** B2B: только ваш CAPEX (ГПУ + фургоны + хаб). ГПУ: 1 на каждые 30 бизнесов (округление вверх) */
export function calcInfraForBusiness(businessesCount: number): InfraResult {
  const batteryModulesSold = businessesCount * 4;
  const generatorsNeeded = Math.max(1, Math.ceil(businessesCount / 30));

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

export function calcInfraForScenario(
  scenario: Scenario,
  quantity: number,
  batteryCostPerKwh: number = BATTERY_PRODUCTION_COST_DEFAULT_PER_KWH,
): InfraResult {
  return scenario === 'taxi' ? calcInfraForTaxi(quantity, batteryCostPerKwh) : calcInfraForBusiness(quantity);
}

export function buildInputsForTaxi(baseInputs: Inputs, carsPerDay: number, batteryCostPerKwh?: number): Inputs {
  const infra = calcInfraForTaxi(carsPerDay, batteryCostPerKwh ?? BATTERY_PRODUCTION_COST_DEFAULT_PER_KWH);
  return {
    ...baseInputs,
    capex: infra.capex.total / 1e6,
    carsPerDay,
  };
}

export function buildInputsForScenario(
  baseInputs: Inputs,
  scenario: Scenario,
  quantity: number,
  batteryCostPerKwh?: number,
): Inputs {
  if (scenario === 'taxi') {
    return buildInputsForTaxi(baseInputs, quantity, batteryCostPerKwh);
  }
  return {
    ...baseInputs,
    businessesCount: quantity,
    capex: calcInfraForBusiness(quantity).capex.total / 1e6,
  };
}

function clampBatterySellingPrice(perKwh: number): number {
  return Math.min(Math.max(0, perKwh), BATTERY_SELLING_PRICE_MAX_PER_KWH);
}

function clampBatteryProductionCost(perKwh: number): number {
  return Math.min(Math.max(0, sanitizeNonNegative(perKwh)), BATTERY_PRODUCTION_COST_MAX_PER_KWH);
}

export function calculateBusinessEconomics(
  inputs: Inputs,
  businessesCount: number,
  options: CalculateBusinessEconomicsOptions = DEFAULT_B2B_BATTERY_OPTIONS,
): BusinessEconomics {
  const infra = calcInfraForBusiness(businessesCount);
  const fullCostPerKwh = getFullCostPerKwh(inputs);
  const dailyKwhPerBusiness = inputs.dailyKwhPerBusiness;

  const installment12 = options.batteryInstallment12;
  const batterySoldImmediate = installment12 ? false : options.batterySoldImmediate;

  const batterySellingPricePerKwh = clampBatterySellingPrice(options.batterySellingPricePerKwh);
  const batteryProductionCostPerKwh = clampBatteryProductionCost(options.batteryProductionCostPerKwh);

  const batteryModulesSold = businessesCount * 4;
  const totalBatteryKwh = batteryModulesSold * 60;
  const revenueFromBatterySale = totalBatteryKwh * batterySellingPricePerKwh;
  const costOfGoodsSold = totalBatteryKwh * batteryProductionCostPerKwh;
  const profitFromBatterySale = revenueFromBatterySale - costOfGoodsSold;
  const profitPerBatteryModuleRub = (batterySellingPricePerKwh - batteryProductionCostPerKwh) * 60;

  const capexYourRub = infra.capex.total;
  const monthlyRevenueFromService = businessesCount * dailyKwhPerBusiness * 30 * inputs.priceToBusiness;
  const monthlyGasServiceCost = businessesCount * dailyKwhPerBusiness * 30 * fullCostPerKwh;
  const monthlyLogisticsCost = businessesCount * B2B_LOGISTICS_PER_BUSINESS_MONTH;
  const monthlyProfitFromService = monthlyRevenueFromService - monthlyGasServiceCost - monthlyLogisticsCost;

  const netInvestmentRub = capexYourRub - profitFromBatterySale;
  const netInvestmentIfBatteryPriceZeroRub = capexYourRub + costOfGoodsSold;

  let monthlyCashFlowForPayback: number;
  let paybackMonths: number;

  if (installment12) {
    monthlyCashFlowForPayback = monthlyProfitFromService + profitFromBatterySale / 12;
    if (monthlyCashFlowForPayback > 0) {
      paybackMonths = capexYourRub / monthlyCashFlowForPayback;
    } else {
      paybackMonths = Number.POSITIVE_INFINITY;
    }
  } else if (netInvestmentRub <= 0) {
    monthlyCashFlowForPayback = monthlyProfitFromService;
    paybackMonths = 0;
  } else if (monthlyProfitFromService > 0) {
    monthlyCashFlowForPayback = monthlyProfitFromService;
    paybackMonths = netInvestmentRub / monthlyProfitFromService;
  } else {
    monthlyCashFlowForPayback = monthlyProfitFromService;
    paybackMonths = Number.POSITIVE_INFINITY;
  }

  let paybackMonthsIfBatteryPriceZero: number;
  if (monthlyProfitFromService > 0) {
    paybackMonthsIfBatteryPriceZero = netInvestmentIfBatteryPriceZeroRub / monthlyProfitFromService;
  } else {
    paybackMonthsIfBatteryPriceZero = Number.POSITIVE_INFINITY;
  }

  return {
    businessesCount,
    batteryModulesSold,
    totalBatteryKwh,
    batteryProductionCostPerKwh,
    batterySellingPricePerKwh,
    revenueFromBatterySale,
    costOfGoodsSold,
    profitFromBatterySale,
    profitPerBatteryModuleRub,
    capexYourRub,
    netInvestmentRub,
    netInvestmentIfBatteryPriceZeroRub,
    monthlyProfitFromService,
    monthlyRevenueFromService,
    monthlyGasServiceCost,
    monthlyLogisticsCost,
    batterySoldImmediate,
    installment12,
    monthlyCashFlowForPayback,
    paybackMonths,
    paybackYears: Number.isFinite(paybackMonths) ? paybackMonths / 12 : Number.POSITIVE_INFINITY,
    paybackMonthsIfBatteryPriceZero,
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

/** Накопленный денежный поток (млн руб): зависит от режима продажи кассет */
export function buildBusinessCashSeries(be: BusinessEconomics): ChartPoint[] {
  let paybackMonthsForLimit: number;
  if (be.installment12) {
    paybackMonthsForLimit =
      be.monthlyCashFlowForPayback > 0 ? be.capexYourRub / be.monthlyCashFlowForPayback : Number.POSITIVE_INFINITY;
  } else if (be.netInvestmentRub <= 0) {
    paybackMonthsForLimit = 0;
  } else {
    paybackMonthsForLimit =
      be.monthlyProfitFromService > 0 ? be.netInvestmentRub / be.monthlyProfitFromService : Number.POSITIVE_INFINITY;
  }

  const monthsLimit = Number.isFinite(paybackMonthsForLimit)
    ? Math.ceil(paybackMonthsForLimit) + 6
    : SAFE_PAYBACK_MONTHS_FOR_CHART;
  const safeMonthsLimit = Math.min(Math.max(monthsLimit, 6), 240);

  return Array.from({ length: safeMonthsLimit + 1 }, (_, month) => {
    let accumulatedRub: number;
    if (be.installment12) {
      accumulatedRub = -be.capexYourRub + be.monthlyCashFlowForPayback * month;
    } else {
      accumulatedRub = -be.netInvestmentRub + be.monthlyProfitFromService * month;
    }
    return {
      month,
      accumulatedProfitMln: accumulatedRub / 1e6,
    };
  });
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
    const mlns = (x: number) => (x / 1e6).toFixed(1);
    const mlns2 = (x: number) => (x / 1e6).toFixed(2);

    const paybackPrimary =
      be.paybackMonths <= 0 && !be.installment12
        ? 'окупается мгновенно по чистым инвестициям'
        : Number.isFinite(be.paybackMonths)
          ? `окупаемость по выбранной модели — ${be.paybackMonths.toFixed(1)} мес (${be.paybackYears.toFixed(1)} года)`
          : 'не достигается при текущих параметрах';

    const paybackZero =
      Number.isFinite(be.paybackMonthsIfBatteryPriceZero)
        ? `${be.paybackMonthsIfBatteryPriceZero.toFixed(1)} мес (${(be.paybackMonthsIfBatteryPriceZero / 12).toFixed(1)} лет)`
        : 'не достигается';

    const breakevenPrice =
      be.totalBatteryKwh > 0 ? be.batteryProductionCostPerKwh + be.capexYourRub / be.totalBatteryKwh : null;

    let modeClause = '';
    if (be.installment12) {
      modeClause = ` Режим рассрочки 12 мес: прибыль от кассет по ${mlns2(be.profitFromBatterySale / 12)} млн руб/мес добавляется к потоку замены; окупаемость инфраструктуры считается как CAPEX / комбинированный месячный поток.`;
    } else if (be.batterySoldImmediate) {
      modeClause = ' Продажа кассет — разово в первый месяц.';
    }

    const comparisonZero =
      be.batterySellingPricePerKwh > 0
        ? ` Если бы кассеты отдавались бесплатно (0 руб/кВт·ч), суммарная нагрузка была бы ${mlns(be.netInvestmentIfBatteryPriceZeroRub)} млн руб (инфраструктура + себестоимость кассет), окупаемость только за счёт замены — ${paybackZero}.`
        : ` При нулевой цене кассеты для клиента ваши совокупные затраты ${mlns(be.netInvestmentIfBatteryPriceZeroRub)} млн руб окупаются за счёт услуги замены за ${paybackZero}.`;

    let hint = '';
    if (breakevenPrice !== null && be.batterySellingPricePerKwh < breakevenPrice - 1) {
      hint = ` Чтобы полностью покрыть инфраструктуру маржой от кассет, цена продажи могла бы быть не ниже ~${Math.ceil(breakevenPrice)} руб/кВт·ч (оценка).`;
    }

    return (
      `Вы продаёте ${be.batteryModulesSold} кассет (${be.totalBatteryKwh.toLocaleString('ru-RU')} кВт·ч) по ${be.batterySellingPricePerKwh.toLocaleString('ru-RU')} руб/кВт·ч. ` +
      `Выручка от кассет ${mlns(be.revenueFromBatterySale)} млн руб, валовая прибыль ${mlns(be.profitFromBatterySale)} млн руб. ` +
      `Инвестиции в ГПУ, хаб и логистику ${mlns(be.capexYourRub)} млн руб; чистые инвестиции после учёта прибыли с кассет ${mlns(be.netInvestmentRub)} млн руб.${modeClause} ` +
      `${be.netInvestmentRub < 0 ? 'Чистые инвестиции отрицательные — инфраструктура покрывается маржой от продажи кассет; дальше вы получаете ' : 'Дальше вы получаете '}` +
      `${mlns2(be.monthlyProfitFromService)} млн руб/мес от услуги замены. ${paybackPrimary}.${comparisonZero}${hint}`
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
