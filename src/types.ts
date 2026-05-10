export type Scenario = 'taxi' | 'business';

export interface Inputs {
  gasPrice: number;
  capex: number;
  priceToClient: number;
  carsPerDay: number;
  kwhPerCar: number;
  electricityLoss: number;
  priceToBusiness: number;
  dailyKwhPerBusiness: number;
  businessesCount: number;
  gasConsumptionPerKwh: number;
  servicePercent: number;
  amortizationKwh: number;
}

export interface ScenarioResults {
  dailyKwh: number;
  dailyRevenue: number;
  monthlyRevenue: number;
  monthlyProfit: number;
  marginPerKwh: number;
  marginPercent: number;
  paybackMonths: number;
  paybackYears: number;
  fullCost: number;
}

export interface ChartPoint {
  month: number;
  accumulatedProfitMln: number;
}

export type InfraMode = 'taxi' | 'business';

export interface CapexBreakdownRub {
  total: number;
  batteries: number;
  stations: number;
  generators: number;
  logistics: number;
  hub: number;
}

export interface InfraResult {
  mode: InfraMode;
  stationsCount: number;
  batteriesCount: number;
  generatorsCount: number;
  capex: CapexBreakdownRub;
}

/** B2B: своё «железо» без станций у клиента; кассеты — отдельная цена продажи */
export interface BusinessEconomics {
  businessesCount: number;
  batteryModulesSold: number;
  totalBatteryKwh: number;
  batterySellingPricePerKwh: number;
  revenueFromBatterySale: number;
  costOfGoodsSold: number;
  profitFromBatterySale: number;
  profitPerBatteryModuleRub: number;
  capexYourRub: number;
  /** Чистые инвестиции при выбранной цене кассеты и режиме (разово / рассрочка учтены в payback) */
  netInvestmentRub: number;
  /** CAPEX инфраструктуры + себестоимость всех кассет (цена продажи кассеты = 0) */
  netInvestmentIfBatteryPriceZeroRub: number;
  monthlyProfitFromService: number;
  monthlyRevenueFromService: number;
  monthlyGasServiceCost: number;
  monthlyLogisticsCost: number;
  batterySoldImmediate: boolean;
  installment12: boolean;
  /** Поток для окупаемости: только услуга или услуга + доля прибыли от кассет при рассрочке */
  monthlyCashFlowForPayback: number;
  paybackMonths: number;
  paybackYears: number;
  paybackMonthsIfBatteryPriceZero: number;
  fullCostPerKwh: number;
}
