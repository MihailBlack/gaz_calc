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

/** B2B: своё «железо» без станций у клиента; кассеты проданы — не в CAPEX */
export interface BusinessEconomics {
  businessesCount: number;
  batteryModulesSold: number;
  totalBatteryKwh: number;
  revenueFromBatterySale: number;
  profitFromBatterySale: number;
  capexYourRub: number;
  netInvestmentRub: number;
  monthlyProfitFromService: number;
  monthlyRevenueFromService: number;
  monthlyGasServiceCost: number;
  monthlyLogisticsCost: number;
  paybackMonths: number;
  paybackYears: number;
  fullCostPerKwh: number;
}
